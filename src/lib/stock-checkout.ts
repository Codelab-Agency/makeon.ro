import 'server-only';
import Stripe from 'stripe';
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';
import type { Order } from '@/payload-types';
import { transaction, transactionDB, lockOrder } from './commerce';
import { CommerceError, parseLines, priceBani, validGrind, type CheckoutLine } from './commerce-validation';
import { packageLabel } from './product-format';

type Snapshot = Pick<Order, 'reference' | 'items' | 'totalBani' | 'shippingBani' | 'currency' | 'legalVersion' | 'legalAcceptedAt'>;
type Reservation = { reference: string; snapshot: Snapshot; status: 'pending' | 'paid' | 'expired' | 'failed'; sessionId: string | null; createdAt: string; expiresAt: string };
const select = sql`SELECT reference, snapshot, status, stripe_session_id AS "sessionId", created_at AS "createdAt", expires_at AS "expiresAt" FROM checkout_reservations`;
const fingerprint = (items: CheckoutLine[]) => JSON.stringify(items.map(({ slug, grind, quantity }) => ({ slug, grind, quantity })).sort((a, b) => `${a.slug}:${a.grind}`.localeCompare(`${b.slug}:${b.grind}`)));

async function reservation(cms: Payload, reference: string, id?: string | number) {
  const db = id == null ? (cms.db as unknown as PostgresAdapter).drizzle : transactionDB(cms, id);
  const result = await db.execute(sql`${select} WHERE reference = ${reference}`);
  return result.rows[0] as unknown as Reservation | undefined;
}

async function settleInventory(cms: Payload, id: string | number, snapshot: Snapshot, paid: boolean) {
  const quantities = new Map<number, number>();
  for (const line of snapshot.items) {
    const product = typeof line.product === 'number' ? line.product : line.product.id;
    quantities.set(product, (quantities.get(product) ?? 0) + line.quantity);
  }
  for (const [product, quantity] of [...quantities].sort((a, b) => a[0] - b[0])) {
    const result = await transactionDB(cms, id).execute(sql`UPDATE products SET reserved = reserved - ${quantity}, stock = stock - ${paid ? quantity : 0} WHERE id = ${product} AND reserved >= ${quantity} AND stock >= ${quantity} RETURNING id`);
    if (result.rows.length !== 1) throw new Error('Stock reservation is inconsistent.');
  }
}

/** The reservation and product updates commit with the new paid order, exactly once. */
export async function applyStockSession(session: Stripe.Checkout.Session, cms: Payload): Promise<{ handled: boolean; order?: Order }> {
  const reference = session.client_reference_id;
  if (!reference) return { handled: false };
  const target = session.status === 'complete' && session.payment_status === 'paid' ? 'paid' : session.status === 'expired' ? 'expired' : null;
  if (!target) return { handled: false };
  return transaction(cms, async id => {
    await lockOrder(cms, id, reference);
    const draft = await reservation(cms, reference, id);
    if (!draft) return { handled: false };
    if (draft.sessionId !== session.id) throw new Error('Unknown checkout session.');
    if (target === 'paid' && (session.currency !== draft.snapshot.currency || session.amount_total !== draft.snapshot.totalBani)) throw new Error('Payment amount does not match the checkout snapshot.');
    if (draft.status !== 'pending') {
      if (draft.status !== target) throw new Error('Conflicting checkout state.');
      const order = target === 'paid' ? (await cms.find({ collection: 'orders', where: { reference: { equals: reference } }, depth: 0, limit: 1, req: { transactionID: id } })).docs[0] : undefined;
      return { handled: true, order };
    }
    await settleInventory(cms, id, draft.snapshot, target === 'paid');
    let order: Order | undefined;
    if (target === 'paid') {
      order = await cms.create({ collection: 'orders', req: { transactionID: id }, data: {
        ...draft.snapshot, orderType: 'stock', status: 'paid', fulfillmentStatus: 'new', stripeSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
        customerEmail: session.customer_details?.email, customerName: session.customer_details?.name, customerPhone: session.customer_details?.phone,
        shippingAddress: session.collected_information?.shipping_details ? { ...session.collected_information.shipping_details } : null,
      } });
    }
    await transactionDB(cms, id).execute(sql`UPDATE checkout_reservations SET status = ${target} WHERE reference = ${reference}`);
    return { handled: true, order };
  });
}

async function failedReservation(cms: Payload, reference: string) {
  await transaction(cms, async id => {
    await lockOrder(cms, id, reference);
    const draft = await reservation(cms, reference, id);
    if (!draft || draft.status !== 'pending' || draft.sessionId) return;
    await settleInventory(cms, id, draft.snapshot, false);
    await transactionDB(cms, id).execute(sql`UPDATE checkout_reservations SET status = 'failed' WHERE reference = ${reference}`);
  });
}

/** A timeout can hide a successful Stripe create. Retry its stable key before releasing anything. */
async function openSession(cms: Payload, stripe: Stripe, reference: string) {
  try {
    return await transaction(cms, async id => {
      await lockOrder(cms, id, reference);
      const draft = await reservation(cms, reference, id);
      if (!draft || draft.status !== 'pending') throw new CommerceError('Sesiunea de plată nu mai este disponibilă. Reîncearcă din coș.', 409);
      if (draft.sessionId) return stripe.checkout.sessions.retrieve(draft.sessionId);
      const snapshot = draft.snapshot;
      const session = await stripe.checkout.sessions.create({
        mode: 'payment', allowed_payment_method_types: ['card'], client_reference_id: reference, metadata: { orderReference: reference },
        line_items: snapshot.items.map(line => ({ quantity: line.quantity, price_data: { currency: 'ron', unit_amount: line.unitPriceBani, product_data: { name: line.name, description: line.grind } } })),
        shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: snapshot.shippingBani, currency: 'ron' }, display_name: 'Livrare în România' } }],
        shipping_address_collection: { allowed_countries: ['RO'] }, phone_number_collection: { enabled: true },
        success_url: `${process.env.APP_URL}/comanda?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/comanda?anulata=1`, expires_at: Math.floor(new Date(draft.expiresAt).getTime() / 1000),
      }, { idempotencyKey: reference });
      await transactionDB(cms, id).execute(sql`UPDATE checkout_reservations SET stripe_session_id = ${session.id}, expires_at = ${new Date(session.expires_at * 1000).toISOString()} WHERE reference = ${reference}`);
      return session;
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code !== 'idempotency_key_in_use') await failedReservation(cms, reference);
    throw error;
  }
}

export async function createStockCheckout(lines: CheckoutLine[], key: string, stripe: Stripe, cms: Payload, legalVersion?: string) {
  const reference = `MK-${key}`;
  lines = parseLines({ items: lines });
  await transaction(cms, async id => {
    await lockOrder(cms, id, reference);
    const previous = await reservation(cms, reference, id);
    if (previous) {
      if (previous.status !== 'pending' || fingerprint(previous.snapshot.items) !== fingerprint(lines)) throw new CommerceError('Coșul s-a modificat. Reîncearcă plata.', 409);
      if (legalVersion && previous.snapshot.legalVersion !== legalVersion) throw new CommerceError('Termenii s-au actualizat. Reîncepe comanda.', 409);
      return;
    }
    // Do not reuse references belonging to the old checkout or a made-to-order request.
    const existing = await cms.find({ collection: 'orders', where: { reference: { equals: reference } }, limit: 1, depth: 0, req: { transactionID: id } });
    if (existing.docs.length) throw new CommerceError('Reîncearcă plata din coș.', 409);
    const products = await cms.find({ collection: 'products', where: { slug: { in: lines.map(line => line.slug) } }, limit: 100, depth: 0, req: { transactionID: id } });
    const bySlug = new Map(products.docs.map(product => [product.slug, product]));
    const quantities = new Map<number, number>();
    const items = lines.map(line => {
      const product = bySlug.get(line.slug);
      if (!product || !product.active) throw new CommerceError('Un produs nu mai este disponibil.', 409);
      if (!validGrind(product.category, line.grind, product.decaffFormat)) throw new CommerceError('Formatul cafelei este invalid.');
      quantities.set(product.id, (quantities.get(product.id) ?? 0) + line.quantity);
      return { ...line, product: product.id, name: `${product.name} · ${packageLabel(product)}`, unitPriceBani: priceBani(product.price) };
    });
    for (const [product, quantity] of [...quantities].sort((a, b) => a[0] - b[0])) {
      const result = await transactionDB(cms, id).execute(sql`UPDATE products SET reserved = reserved + ${quantity} WHERE id = ${product} AND active = true AND stock - reserved >= ${quantity} RETURNING id`);
      if (result.rows.length !== 1) throw new CommerceError('Stoc insuficient pentru unul dintre produse. Actualizează coșul.', 409);
    }
    const shippingBani = Number(process.env.SHIPPING_PRICE_BANI);
    const totalBani = items.reduce((sum, item) => sum + item.unitPriceBani * item.quantity, shippingBani);
    if (!Number.isSafeInteger(totalBani)) throw new CommerceError('Valoare comandă invalidă.');
    const snapshot: Snapshot = { reference, items, totalBani, shippingBani, currency: 'ron', ...(legalVersion ? { legalVersion, legalAcceptedAt: new Date().toISOString() } : {}) };
    await transactionDB(cms, id).execute(sql`INSERT INTO checkout_reservations (reference, snapshot, expires_at) VALUES (${reference}, ${JSON.stringify(snapshot)}::jsonb, ${new Date(Date.now() + 35 * 60 * 1000).toISOString()})`);
  });
  const session = await openSession(cms, stripe, reference);
  if (!session.url || session.status !== 'open') throw new CommerceError('Sesiunea de plată nu mai este disponibilă. Reîncearcă din coș.', 409);
  return { url: session.url };
}

export async function reconcileStockReservations(cms: Payload, stripe: Stripe) {
  const db = (cms.db as unknown as PostgresAdapter).drizzle;
  const drafts = await db.execute(sql`${select} WHERE status = 'pending' AND expires_at < now() ORDER BY expires_at LIMIT 25`);
  for (const draft of drafts.rows as unknown as Reservation[]) {
    const session = draft.sessionId ? await stripe.checkout.sessions.retrieve(draft.sessionId) : await openSession(cms, stripe, draft.reference);
    if (session.status !== 'open') await applyStockSession(session, cms);
  }
}

export async function cancelStockCheckout(key: string, stripe: Stripe, cms: Payload): Promise<{ handled: boolean; paid?: boolean; reference?: string }> {
  const draft = await reservation(cms, `MK-${key}`);
  if (!draft) return { handled: false };
  if (draft.status !== 'pending') return { handled: true, paid: draft.status === 'paid', reference: draft.reference };
  let session = await openSession(cms, stripe, draft.reference);
  if (session.status === 'open') {
    try { session = await stripe.checkout.sessions.expire(session.id); }
    catch (error) {
      // Payment may win the race. Never release stock based on a browser action alone.
      if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) throw error;
      session = await stripe.checkout.sessions.retrieve(session.id);
      if (session.status === 'open') throw error;
    }
  }
  const result = await applyStockSession(session, cms);
  if (session.status !== 'expired' && !result.order) throw new CommerceError('Plata este în curs de verificare. Reîncearcă în câteva momente.', 409);
  return { handled: true, paid: result.order?.status === 'paid', reference: result.order?.reference };
}
