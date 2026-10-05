import "server-only";
import { createHash } from "node:crypto";
import type { Payload } from "payload";
import type Stripe from "stripe";
import { getCMS } from "./cms";
import { checkoutConfigured } from "./commerce-env";
import {
  CommerceError,
  parseLines,
  priceBani,
  validGrind,
} from "./commerce-validation";
import {
  transaction,
  lockOrder,
  stripeClient,
  sessionForOrder,
  applySession,
} from "./commerce";

/** Made-to-order requests do not reserve existing inventory. Prices become immutable when a link is issued. */
export function parseProductionRequest(value: unknown) {
  if (!value || typeof value !== "object")
    throw new CommerceError("Date invalide.");
  const body = value as Record<string, unknown>;
  const field = (key: string, max: number) => {
    if (typeof body[key] !== "string")
      throw new CommerceError("Completează datele de contact.");
    const text = (body[key] as string).trim();
    if (text.length > max || /[\r\n\x00]/.test(text))
      throw new CommerceError("Date de contact invalide.");
    return text;
  };
  const key = field("key", 36),
    name = field("name", 100),
    email = field("email", 254),
    phone = field("phone", 40);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    ) ||
    name.length < 2 ||
    !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ||
    !/^[+\d\s().-]{7,40}$/.test(phone) ||
    phone.replace(/\D/g, "").length < 7
  )
    throw new CommerceError(
      "Completează un nume, un e-mail și un telefon valide.",
    );
  const note = body.note == null ? "" : body.note;
  if (typeof note !== "string" || note.length > 1500)
    throw new CommerceError("Mesajul este prea lung.");
  if (body.website) throw new CommerceError("Solicitare nepermisă.");
  return {
    key,
    name,
    email,
    phone,
    note: note.trim(),
    lines: parseLines(body),
  };
}

export async function createProductionRequest(
  input: ReturnType<typeof parseProductionRequest> & { legalVersion?: string },
  cmsArg?: Payload,
) {
  const cms = cmsArg ?? (await getCMS());
  const reference = `MK-${input.key}`;
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        ...input,
        lines: [...input.lines].sort((a, b) =>
          `${a.slug}:${a.grind}`.localeCompare(`${b.slug}:${b.grind}`),
        ),
      }),
    )
    .digest("hex");
  return transaction(cms, async (id) => {
    await lockOrder(cms, id, reference);
    const req = { transactionID: id };
    const existing = (
      await cms.find({
        collection: "orders",
        where: { reference: { equals: reference } },
        depth: 0,
        limit: 1,
        req,
      })
    ).docs[0];
    if (existing) {
      if (
        existing.orderType !== "production" ||
        existing.requestFingerprint !== fingerprint
      )
        throw new CommerceError(
          "Solicitarea s-a modificat. Reîncarcă formularul.",
          409,
        );
      return { reference: existing.reference };
    }
    const products = (
      await cms.find({
        collection: "products",
        where: { slug: { in: input.lines.map((l) => l.slug) } },
        depth: 0,
        limit: 100,
        req,
      })
    ).docs;
    const items = input.lines.map((line) => {
      const product = products.find((p) => p.slug === line.slug);
      if (!product?.active || !validGrind(product.category, line.grind))
        throw new CommerceError(
          "Un produs sau format nu mai este disponibil.",
          409,
        );
      return {
        ...line,
        product: product.id,
        name: `${product.name} · ${product.grams} g`,
        unitPriceBani: product.price == null ? 0 : priceBani(product.price),
      };
    });
    const totalBani = items.reduce(
      (sum, line) => sum + line.unitPriceBani * line.quantity,
      0,
    );
    if (!Number.isSafeInteger(totalBani))
      throw new CommerceError("Valoare comandă invalidă.");
    await cms.create({
      collection: "orders",
      req,
      data: {
        reference,
        requestFingerprint: fingerprint,
        ...(input.legalVersion
          ? {
              legalVersion: input.legalVersion,
              legalAcceptedAt: new Date().toISOString(),
            }
          : {}),
        orderType: "production",
        status: "requested",
        fulfillmentStatus: "new",
        customerName: input.name,
        customerEmail: input.email,
        customerPhone: input.phone,
        customerNote: input.note,
        items,
        totalBani,
        shippingBani: 0,
        currency: "ron",
        paymentAttempt: 0,
      },
    });
    return { reference };
  });
}

/** Persist the quote before calling Stripe so ambiguous failures cannot change its retry parameters. */
export async function generateProductionPayment(
  orderID: number,
  quote: { unitPrices: unknown; shipping: unknown },
  stripe: Stripe = stripeClient(),
  cmsArg?: Payload,
) {
  if (!checkoutConfigured())
    throw new CommerceError(
      "Configurează Stripe și transportul înainte de generarea linkului.",
      503,
    );
  const cms = cmsArg ?? (await getCMS());
  let order = await cms.findByID({
    collection: "orders",
    id: orderID,
    depth: 0,
  });
  if (order.orderType !== "production")
    throw new CommerceError("Această comandă nu este la cerere.", 409);
  // A live link is reused. Never create a second payable session alongside it.
  if (order.stripeSessionId && order.status === "pending") {
    const session = await stripe.checkout.sessions.retrieve(
      order.stripeSessionId,
    );
    if (session.status === "open" && session.url) return { url: session.url };
    await applySession(session, cms);
  }
  order = await transaction(cms, async (id) => {
    await lockOrder(cms, id, order.reference);
    const req = { transactionID: id };
    const current = await cms.findByID({
      collection: "orders",
      id: orderID,
      depth: 0,
      req,
    });
    if (current.status === "paid")
      throw new CommerceError("Comanda este deja plătită.", 409);
    if (current.status === "pending") return current; // Another administrator/retry already froze this quote.
    if (!["requested", "expired", "failed"].includes(current.status))
      throw new CommerceError("Stare comandă invalidă.", 409);
    if (
      !Array.isArray(quote.unitPrices) ||
      quote.unitPrices.length !== current.items.length ||
      typeof quote.shipping !== "number" ||
      !Number.isFinite(quote.shipping) ||
      quote.shipping < 0 ||
      Math.abs(quote.shipping * 100 - Math.round(quote.shipping * 100)) >
        0.00001
    )
      throw new CommerceError(
        "Completează prețurile produselor și transportul în RON.",
      );
    const prices = quote.unitPrices.map((value) => {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        Math.abs(value * 100 - Math.round(value * 100)) > 0.00001
      )
        throw new CommerceError(
          "Prețuri invalide. Folosește maximum două zecimale.",
        );
      return priceBani(value);
    });
    const items = current.items.map((line, index) => ({
      ...line,
      unitPriceBani: prices[index],
    }));
    const shippingBani = Math.round(quote.shipping * 100),
      totalBani = items.reduce(
        (sum, line) => sum + line.unitPriceBani * line.quantity,
        shippingBani,
      );
    if (!Number.isSafeInteger(totalBani) || totalBani > 99999999)
      throw new CommerceError("Valoare comandă invalidă.");
    return cms.update({
      collection: "orders",
      id: orderID,
      req,
      data: {
        items,
        shippingBani,
        totalBani,
        status: "pending",
        paymentAttempt: (current.paymentAttempt ?? 0) + 1,
        stripeSessionId: null,
        paymentUrl: null,
        expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      },
    });
  });
  const session = await sessionForOrder(order, stripe, cms);
  if (!session.url || session.status !== "open") {
    await applySession(session, cms);
    throw new CommerceError(
      "Linkul nu mai este disponibil. Reîncarcă pagina și generează altul.",
      409,
    );
  }
  return { url: session.url };
}
