import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

let cms: Payload;
let emails: typeof import("../src/lib/order-status-email");
const fixtures: number[] = [];
const user = { id: 1, collection: "users" as const, email: "fixture@example.test" };

before(async () => {
  const main = process.env.DATABASE_URL;
  const clone = process.env.MIGRATION_TEST_DATABASE_URL;
  assert(main && clone, "Configure the separate migration test database.");
  assert.notEqual(new URL(main).hostname, new URL(clone).hostname, "Refusing the main database.");
  process.env.DATABASE_URL = clone;
  process.env.PAYLOAD_DB_PUSH = "false";
  process.env.RESEND_API_KEY = "test-only-not-a-real-key";
  process.env.RESEND_FROM_EMAIL = "Makeon <test@example.test>";
  const { getPayload } = await import("payload");
  const { default: config } = await import("../src/payload.config");
  cms = await getPayload({ config });
  emails = await import("../src/lib/order-status-email");
});
after(async () => {
  if (!cms) return;
  const db = (cms.db as unknown as PostgresAdapter).drizzle;
  for (const id of fixtures) {
    await db.execute(sql`DELETE FROM order_status_emails WHERE order_id = ${id}`);
    await db.execute(sql`DELETE FROM orders WHERE id = ${id}`);
  }
  await cms.destroy();
});
async function order(email: string | undefined = "client@example.test") {
  const product = (await cms.find({ collection: "products", depth: 0, limit: 1 })).docs[0];
  const saved = await cms.create({ collection: "orders", data: {
    reference: `TEST-NOTIFY-${randomUUID()}`, status: "paid", fulfillmentStatus: "new",
    customerEmail: email, customerName: "Client <test>", totalBani: 100, shippingBani: 0, currency: "ron",
    items: [{ product: product.id, slug: product.slug, name: product.name, grind: "Boabe", quantity: 1, unitPriceBani: 100 }],
  } });
  fixtures.push(saved.id);
  return saved;
}
async function update(id: number, status: "processing" | "shipped" | "delivered" | "new", req?: { transactionID: number | string }) {
  return cms.update({ collection: "orders", id, user, overrideAccess: false,
    context: { skipStatusEmailDispatch: true }, req,
    data: { fulfillmentStatus: status } });
}

test("message snapshots escape customer content and include each fulfillment label", () => {
  for (const status of Object.keys(emails.fulfillmentLabels) as (keyof typeof emails.fulfillmentLabels)[]) {
    const body = emails.statusEmailBody("MK-<test>", "Client <script>", "client@example.test", status);
    assert.ok(body.subject.includes(emails.fulfillmentLabels[status]));
    assert.ok(body.html.includes("&lt;script&gt;"));
    assert.ok(!body.html.includes("<script>"));
    assert.deepEqual(body.to, ["client@example.test"]);
  }
});

test("creation, resaves and concurrent saves do not duplicate a status event", async () => {
  const doc = await order();
  assert.equal((await emails.orderStatusEmailHistory(cms, doc.id)).length, 0);
  await Promise.all([update(doc.id, "processing"), update(doc.id, "processing")]);
  await update(doc.id, "processing");
  assert.equal((await emails.orderStatusEmailHistory(cms, doc.id)).length, 1);
  let calls = 0;
  const fetcher = (async () => { calls++; await new Promise(resolve => setTimeout(resolve, 50)); return Response.json({ id: "email-test" }); }) as typeof fetch;
  await Promise.all([emails.deliverOrderStatusEmails(cms, doc.id, fetcher), emails.deliverOrderStatusEmails(cms, doc.id, fetcher)]);
  await emails.deliverOrderStatusEmails(cms, doc.id, fetcher);
  assert.equal(calls, 1);
  assert.equal((await emails.orderStatusEmailHistory(cms, doc.id))[0].state, "sent");
  await update(doc.id, "shipped");
  await update(doc.id, "delivered");
  const statuses: string[] = [];
  await emails.deliverOrderStatusEmails(cms, doc.id, (async (_url, init) => {
    statuses.push(JSON.parse(String(init?.body)).subject);
    return Response.json({ id: randomUUID() });
  }) as typeof fetch);
  assert.ok(statuses[0].includes("Expediată"));
  assert.ok(statuses[1].includes("Livrată"));
});

test("a rolled-back status change leaves no notification", async () => {
  const doc = await order();
  const transactionID = await cms.db.beginTransaction();
  assert(transactionID != null);
  try { await update(doc.id, "processing", { transactionID }); }
  finally { await cms.db.rollbackTransaction(transactionID); }
  assert.equal((await emails.orderStatusEmailHistory(cms, doc.id)).length, 0);
  assert.equal((await cms.findByID({ collection: "orders", id: doc.id })).fulfillmentStatus, "new");
});

test("uncertain retries reuse the recipient, sender, body and key; expired retries are blocked", async () => {
  const doc = await order();
  await update(doc.id, "processing");
  const requests: RequestInit[] = [];
  await emails.deliverOrderStatusEmails(cms, doc.id, (async (_url, init) => { requests.push(init!); throw new Error("timeout"); }) as typeof fetch);
  process.env.RESEND_FROM_EMAIL = "Changed <other@example.test>";
  await emails.deliverOrderStatusEmails(cms, doc.id, (async (_url, init) => { requests.push(init!); return Response.json({ id: "email-retry" }); }) as typeof fetch);
  assert.equal(requests[0].body, requests[1].body);
  assert.equal((requests[0].headers as Record<string,string>)["Idempotency-Key"], (requests[1].headers as Record<string,string>)["Idempotency-Key"]);
  await update(doc.id, "shipped");
  await emails.deliverOrderStatusEmails(cms, doc.id, (async () => { throw new Error("timeout"); }) as typeof fetch);
  await (cms.db as unknown as PostgresAdapter).drizzle.execute(sql`UPDATE order_status_emails SET first_attempt_at = now() - interval '25 hours' WHERE order_id = ${doc.id} AND state = 'failed'`);
  await emails.deliverOrderStatusEmails(cms, doc.id, (async () => { throw new Error("must not call provider"); }) as typeof fetch);
  assert.equal((await emails.orderStatusEmailHistory(cms, doc.id))[0].state, "blocked");
});

test("missing recipient is recorded; missing configuration keeps the saved status retryable", async () => {
  const missing = await order(undefined);
  // Explicitly clear the optional email because the fixture helper defaults it.
  await cms.update({ collection: "orders", id: missing.id, data: { customerEmail: null } });
  await update(missing.id, "processing");
  assert.equal((await emails.orderStatusEmailHistory(cms, missing.id))[0].state, "skipped");
  const doc = await order();
  await update(doc.id, "processing");
  delete process.env.RESEND_API_KEY;
  await emails.deliverOrderStatusEmails(cms, doc.id);
  assert.equal((await emails.orderStatusEmailHistory(cms, doc.id))[0].state, "failed");
  assert.equal((await cms.findByID({ collection: "orders", id: doc.id })).fulfillmentStatus, "processing");
  process.env.RESEND_API_KEY = "test-only-not-a-real-key";
});
