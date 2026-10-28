/**
 * Checkout and inventory lifecycle. Product prices use RON; orders and Stripe use
 * integer bani. Stock is physical inventory, reserved is held for pending payments,
 * and sellable inventory is stock - reserved. Inventory transitions are atomic.
 */
import "server-only";
import Stripe from "stripe";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import type { Order } from "@/payload-types";
import { getCMS } from "./cms";
import { checkoutConfigured } from "./commerce-env";
import { applyStockSession, cancelStockCheckout, createStockCheckout, reconcileStockReservations } from "./stock-checkout";
import {
  CommerceError,
  parseLines,
  type CheckoutLine,
} from "./commerce-validation";

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new CommerceError("Plata online nu este încă disponibilă.", 503);
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
}

/** Share Payload's transaction connection so raw SQL and Local API writes commit together. */
export function transactionDB(cms: Payload, id: number | string) {
  return (cms.db as unknown as PostgresAdapter).sessions[String(id)].db;
}

export async function transaction<T>(
  cms: Payload,
  operation: (id: number | string) => Promise<T>,
): Promise<T> {
  const id = await cms.db.beginTransaction();
  if (id == null) throw new Error("PostgreSQL transactions are required.");
  try {
    const value = await operation(id);
    await cms.db.commitTransaction(id);
    return value;
  } catch (error) {
    await cms.db.rollbackTransaction(id);
    throw error;
  }
}

// Serializes retries for the same order, including separate serverless instances.
export async function lockOrder(
  cms: Payload,
  id: number | string,
  reference: string,
) {
  await transactionDB(cms, id).execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${reference}))`,
  );
}

/**
 * Reconcile a session fetched from Stripe or verified by its webhook.
 * Paid sessions deduct stock; expiration releases reservations. The order lock
 * and pending-state guard make retries harmless. Reject conflicting terminal
 * states and payment amounts that differ from the persisted order snapshot.
 */
export async function applySession(
  session: Stripe.Checkout.Session,
  cmsArg?: Payload,
) {
  const cms = cmsArg ?? (await getCMS());
  const reference = session.client_reference_id;
  if (!reference) throw new Error("Checkout session has no order reference.");
  const target =
    session.status === "complete" && session.payment_status === "paid"
      ? "paid"
      : session.status === "expired"
        ? "expired"
        : null;
  if (!target) return;
  const reservation = await applyStockSession(session, cms);
  if (reservation.handled) return reservation.order;
  return transaction(cms, async (id) => {
    const req = { transactionID: id };
    await lockOrder(cms, id, reference);
    const found = await cms.find({
      collection: "orders",
      where: { reference: { equals: reference } },
      depth: 0,
      limit: 1,
      req,
    });
    const order = found.docs[0];
    // Legacy abandoned orders are removed after verified expiration. Stripe can
    // redeliver that expiration; absent state must not turn it into a retry loop.
    if (!order && target === "expired") return;
    // Expiration retries from an older production link may arrive after regeneration.
    if (
      order?.orderType === "production" &&
      order.stripeSessionId !== session.id &&
      target === "expired"
    )
      return;
    if (!order || order.stripeSessionId !== session.id)
      throw new Error("Unknown checkout session.");
    if (
      target === "paid" &&
      (session.currency !== order.currency ||
        session.amount_total !== order.totalBani)
    )
      throw new Error("Payment amount does not match the order snapshot.");
    if (order.status === target) return order;
    if (order.status !== "pending") throw new Error("Conflicting order state.");
    const db = transactionDB(cms, id);
    const quantities = new Map<number, number>();
    // Production orders represent goods made after payment, not existing inventory.
    // Never reserve or deduct physical stock for this explicitly separate flow.
    for (const line of order.orderType === "production" ? [] : order.items) {
      const productID =
        typeof line.product === "number" ? line.product : line.product.id;
      quantities.set(
        productID,
        (quantities.get(productID) ?? 0) + line.quantity,
      );
    }
    // Acquire product locks in ID order across flows to reduce deadlock risk.
    for (const [productID, quantity] of [...quantities].sort(
      (a, b) => a[0] - b[0],
    )) {
      // Row locks and a conditional update prevent overselling and duplicate stock deductions.
      const updated =
        await db.execute(sql`UPDATE products SET reserved = reserved - ${quantity},
        stock = stock - ${target === "paid" ? quantity : 0}
        WHERE id = ${productID} AND reserved >= ${quantity} AND stock >= ${quantity} RETURNING id`);
      if (!("rows" in updated) || updated.rows.length !== 1)
        throw new Error("Stock reservation is inconsistent.");
    }
    if (target === "expired" && order.orderType !== "production") {
      await cms.delete({ collection: "orders", id: order.id, req });
      return;
    }
    return cms.update({
      collection: "orders",
      id: order.id,
      req,
      data: {
        status: target,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
        customerEmail: session.customer_details?.email || order.customerEmail,
        customerName: session.customer_details?.name || order.customerName,
        customerPhone: session.customer_details?.phone || order.customerPhone,
        shippingAddress: session.collected_information?.shipping_details
          ? { ...session.collected_information.shipping_details }
          : (order.shippingAddress ?? null),
      },
    });
  });
}

/** Release a draft only when Stripe definitively rejected creating its session. */
async function failDraft(cms: Payload, reference: string) {
  await transaction(cms, async (id) => {
    const req = { transactionID: id };
    await lockOrder(cms, id, reference);
    const { docs } = await cms.find({
      collection: "orders",
      where: { reference: { equals: reference } },
      depth: 0,
      limit: 1,
      req,
    });
    const order = docs[0];
    if (!order || order.status !== "pending" || order.stripeSessionId) return;
    const quantities = new Map<number, number>();
    for (const line of order.orderType === "production" ? [] : order.items) {
      const productID =
        typeof line.product === "number" ? line.product : line.product.id;
      quantities.set(
        productID,
        (quantities.get(productID) ?? 0) + line.quantity,
      );
    }
    for (const [productID, quantity] of [...quantities].sort(
      (a, b) => a[0] - b[0],
    )) {
      const updated = await transactionDB(cms, id).execute(
        sql`UPDATE products SET reserved = reserved - ${quantity} WHERE id = ${productID} AND reserved >= ${quantity} RETURNING id`,
      );
      if (!("rows" in updated) || updated.rows.length !== 1)
        throw new Error("Stock reservation is inconsistent.");
    }
    await cms.update({
      collection: "orders",
      id: order.id,
      req,
      data: { status: "failed" },
    });
  });
}

/**
 * Recover up to 25 overdue pending orders per call, including missed webhooks.
 * A local timestamp alone never releases stock: Stripe is the authority.
 * Catalog/checkout requests invoke this recovery; it is not a scheduled job.
 */
export async function reconcileExpired(cms: Payload, stripe: Stripe) {
  await reconcileStockReservations(cms, stripe);
  const { docs } = await cms.find({
    collection: "orders",
    depth: 0,
    limit: 25,
    where: {
      and: [
        { status: { equals: "pending" } },
        { expiresAt: { less_than: new Date().toISOString() } },
      ],
    },
  });
  for (const order of docs) {
    if (order.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId,
      );
      if (session.status !== "open") await applySession(session, cms);
    } else {
      // Recover an interrupted session-create using the persisted idempotency key.
      await sessionForOrder(order, stripe, cms);
    }
  }
}

/**
 * Create/recover a session with the order reference as Stripe's retry key.
 * A network timeout may hide a successful request, so its reservation stays
 * retryable. The order lock covers both creation and persistence of the session ID.
 */
export async function sessionForOrder(
  order: Order,
  stripe: Stripe,
  cms: Payload,
) {
  try {
    return await transaction(cms, async (id) => {
      await lockOrder(cms, id, order.reference);
      const req = { transactionID: id };
      // Re-read under the same lock used by payment/expiration handlers. Stripe
      // creation and recording its ID cannot race another retry or a webhook.
      order = await cms.findByID({
        collection: "orders",
        id: order.id,
        depth: 0,
        req,
      });
      if (order.status !== "pending")
        throw new CommerceError(
          "Sesiunea de plată nu mai este disponibilă.",
          409,
        );
      if (order.stripeSessionId)
        return stripe.checkout.sessions.retrieve(order.stripeSessionId);
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          allowed_payment_method_types: ["card"],
          client_reference_id: order.reference,
          metadata: { orderReference: order.reference },
          ...(order.orderType === "production"
            ? { customer_email: order.customerEmail || undefined }
            : {}),
          line_items: order.items.map((line) => ({
            quantity: line.quantity,
            price_data: {
              currency: "ron",
              unit_amount: line.unitPriceBani,
              product_data: { name: line.name, description: line.grind },
            },
          })),
          shipping_options: [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: order.shippingBani, currency: "ron" },
                display_name: "Livrare în România",
              },
            },
          ],
          shipping_address_collection: { allowed_countries: ["RO"] },
          phone_number_collection: { enabled: true },
          success_url: `${process.env.APP_URL}/comanda?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.APP_URL}/comanda?anulata=1${order.orderType === "production" ? "&la_cerere=1" : ""}`,
          expires_at:
            order.orderType === "production"
              ? Math.floor(new Date(order.expiresAt!).getTime() / 1000)
              : Math.floor(new Date(order.createdAt).getTime() / 1000) +
                35 * 60,
        },
        {
          idempotencyKey:
            order.orderType === "production"
              ? `${order.reference}:production:${order.paymentAttempt}`
              : order.reference,
        },
      );
      await cms.update({
        collection: "orders",
        id: order.id,
        req,
        data: {
          stripeSessionId: session.id,
          ...(order.orderType === "production"
            ? { paymentUrl: session.url }
            : {}),
          expiresAt: new Date(session.expires_at * 1000).toISOString(),
        },
      });
      return session;
    });
  } catch (error) {
    // Definitive Stripe rejection: release stock. Network failures remain retryable.
    if (
      error instanceof Stripe.errors.StripeInvalidRequestError &&
      error.code !== "idempotency_key_in_use"
    )
      await failDraft(cms, order.reference);
    throw error;
  }
}

/** Reserve a cart separately; only confirmed payment creates an order. */
export async function createCheckout(
  lines: CheckoutLine[], key: string, stripe = stripeClient(), cmsArg?: Payload, legalVersion?: string,
) {
  const cms = cmsArg ?? (await getCMS());
  if (!checkoutConfigured()) throw new CommerceError("Plata online nu este disponibil\u0103.", 503);
  await reconcileExpired(cms, stripe);
  return createStockCheckout(lines, key, stripe, cms, legalVersion);
}

/** Expire an open Stripe session, then reconcile its actual state to handle payment races. */
export async function cancelCheckout(
  key: string,
  stripe = stripeClient(),
  cmsArg?: Payload,
) {
  const cms = cmsArg ?? (await getCMS());
  const reservation = await cancelStockCheckout(key, stripe, cms);
  if (reservation.handled) return { cancelled: !reservation.paid, paid: reservation.paid, reference: reservation.reference };
  const { docs } = await cms.find({
    collection: "orders",
    where: { reference: { equals: `MK-${key}` } },
    limit: 1,
    depth: 0,
  });
  const order = docs[0];
  if (!order || order.status !== "pending" || !order.stripeSessionId) return;
  const session = await stripe.checkout.sessions.retrieve(
    order.stripeSessionId,
  );
  let settled = session;
  if (session.status === "open") {
    try { settled = await stripe.checkout.sessions.expire(session.id); }
    catch (error) {
      if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) throw error;
      settled = await stripe.checkout.sessions.retrieve(session.id);
      if (settled.status === "open") throw error;
    }
  }
  const paid = await applySession(settled, cms);
  return { cancelled: paid?.status !== "paid", paid: paid?.status === "paid", reference: paid?.reference };
}

export { parseLines, CommerceError };
