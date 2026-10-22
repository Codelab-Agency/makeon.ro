import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Payload } from "payload";
import type { Order } from "../../src/payload-types";
import { shippingInput, shipmentBody, createOrderShipment, shipmentFor } from "../../src/lib/order-shipping";
import { samedayForm, samedayCreate, samedayPDF, SamedayError } from "../../src/lib/sameday-client";
import { up } from "../../src/migrations/20261022_120000_sameday_shipments";

const input = { name: "Client Test", phone: "0712345678", county: "Cluj", city: "Cluj-Napoca", address: "Strada Test 10", postalCode: "400001", weight: 1.25, pickupPoint: 9, service: 7 };
const order = { id: 1, reference: "MK-shipping-test", status: "paid", fulfillmentStatus: "processing", shippingAddress: { address: { country: "RO" } }, customerEmail: "client@example.com", currency: "ron", totalBani: 10000, shippingBani: 2000, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Order;
const configure = () => {
  process.env.SAMEDAY_ENV = "sandbox";
  process.env.SAMEDAY_USERNAME = `unit-${randomUUID()}`;
  process.env.SAMEDAY_PASSWORD = "unit-test-only";
};
const mock = (awb: () => Promise<Response>) => (async (url: string | URL | Request) => {
  const path = String(url);
  if (path.endsWith("/api/authenticate")) return Response.json({ token: "test-only" });
  if (path.includes("/api/client/pickup-points")) return Response.json({ pages: 1, data: [{ id: 9, alias: "Test" }] });
  if (path.includes("/api/client/services")) return Response.json({ pages: 1, data: [{ id: 7, serviceCode: "24", name: "24H" }, { id: 15, serviceCode: "LN", name: "Locker" }] });
  if (path.endsWith("/api/awb")) return awb();
  throw new Error("Unexpected provider request");
}) as typeof fetch;

test("AWB validates package, recipient, payment, destination and encodes SDK fields", () => {
  const parsed = shippingInput(input);
  const body = shipmentBody(order, parsed);
  const form = samedayForm(body);
  assert.equal(form.get("cashOnDelivery"), "0");
  assert.equal(form.get("parcels[0][weight]"), "1.25");
  assert.equal(form.get("awbRecipient[phoneNumber]"), input.phone);
  assert.equal(form.get("awbRecipient[countyString]"), input.county);
  assert.equal(form.get("clientInternalReference"), order.reference);
  for (const change of [{ weight: 0 }, { weight: Infinity }, { weight: 32 }, { weight: "1" }, { phone: "invalid" }, { address: "" }, { service: -1 }])
    assert.throws(() => shippingInput({ ...input, ...change }));
  assert.throws(() => shipmentBody({ ...order, status: "pending" }, parsed));
  assert.throws(() => shipmentBody({ ...order, fulfillmentStatus: "shipped" }, parsed));
  assert.throws(() => shipmentBody({ ...order, shippingAddress: { country: "DE" } }, parsed));
});

test("provider acceptance is ambiguous on timeout, 5xx or invalid success; PDF is validated", async () => {
  configure();
  for (const response of [() => { throw new Error("timeout"); }, () => new Response("failed", { status: 500 }), () => Response.json({})]) {
    await assert.rejects(samedayCreate({}, mock(async () => response())), error => error instanceof SamedayError && error.uncertain);
  }
  await assert.rejects(samedayCreate({}, mock(async () => new Response("bad", { status: 400 }))), error => error instanceof SamedayError && !error.uncertain);
  const fetcher = (async (url: string | URL | Request) => String(url).endsWith("/api/authenticate")
    ? Response.json({ token: "test-only" }) : new Response("<html>Login</html>")) as typeof fetch;
  await assert.rejects(samedayPDF("TEST123456", "A4", fetcher));
});

// This suite creates its own random schema and fixtures. It never modifies public tables.
test("durable claims prevent duplicate AWBs across concurrent requests and uncertain retries", { skip: !process.env.SHIPPING_TEST_DATABASE_URL }, async () => {
  const schema = `shipping_test_${randomUUID().replaceAll("-", "")}`;
  assert.match(schema, /^shipping_test_[a-f0-9]{32}$/);
  // Neon transaction pooling does not support a per-connection startup search_path.
  const testURL = new URL(process.env.SHIPPING_TEST_DATABASE_URL!);
  if (testURL.hostname.endsWith(".neon.tech")) testURL.hostname = testURL.hostname.replace("-pooler.", ".");
  const admin = new Pool({ connectionString: testURL.toString(), max: 1 });
  const pool = new Pool({ connectionString: testURL.toString(), options: `-c search_path=${schema}`, max: 8 });
  const sessions: Record<string, { db: NodePgDatabase; client: PoolClient }> = {};
  const connection = drizzle(pool);
  const cms = {
    db: {
      drizzle: connection, sessions,
      beginTransaction: async () => {
        const client = await pool.connect(); await client.query("BEGIN");
        const id = randomUUID(); sessions[id] = { db: drizzle(client), client }; return id;
      },
      commitTransaction: async (id: string) => { await sessions[id].client.query("COMMIT"); sessions[id].client.release(); delete sessions[id]; },
      rollbackTransaction: async (id: string) => { await sessions[id].client.query("ROLLBACK"); sessions[id].client.release(); delete sessions[id]; },
    },
    findByID: async ({ id, req }: { id: number; req?: { transactionID?: string } }) => {
      const query = req?.transactionID ? sessions[req.transactionID].client : pool;
      const result = await query.query("SELECT snapshot FROM orders WHERE id = $1", [id]);
      if (!result.rows[0]) throw new Error("Unknown fixture order");
      return result.rows[0].snapshot;
    },
  } as unknown as Payload;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await pool.query("CREATE TABLE orders (id integer PRIMARY KEY, reference text NOT NULL, snapshot jsonb NOT NULL)");
    await up({ db: connection } as unknown as Parameters<typeof up>[0]);
    for (let id = 1; id <= 3; id++) await pool.query("INSERT INTO orders VALUES ($1,$2,$3)", [id, `${order.reference}-${id}`, JSON.stringify({ ...order, id, reference: `${order.reference}-${id}` })]);
    configure(); let calls = 0;
    const success = mock(async () => { calls++; await new Promise(resolve => setTimeout(resolve, 80)); return Response.json({ awbNumber: "TEST123456" }); });
    const concurrent = await Promise.allSettled([createOrderShipment(cms, 1, input, success), createOrderShipment(cms, 1, input, success)]);
    assert.ok(concurrent.some(result => result.status === "fulfilled"));
    assert.equal(calls, 1);
    await createOrderShipment(cms, 1, input, success);
    assert.equal(calls, 1);
    assert.equal((await shipmentFor(cms, 1))?.number, "TEST123456");
    let unknownCalls = 0;
    const timeout = mock(async () => { unknownCalls++; throw new Error("timeout"); });
    await assert.rejects(createOrderShipment(cms, 2, input, timeout));
    assert.equal((await shipmentFor(cms, 2))?.state, "uncertain");
    await assert.rejects(createOrderShipment(cms, 2, input, timeout));
    assert.equal(unknownCalls, 1);
    await assert.rejects(createOrderShipment(cms, 3, input, mock(async () => new Response("bad", { status: 400 }))));
    assert.equal((await shipmentFor(cms, 3))?.state, "rejected");
    await createOrderShipment(cms, 3, input, mock(async () => Response.json({ awbNumber: "TEST654321" })));
    assert.equal((await shipmentFor(cms, 3))?.state, "created");
    process.env.SAMEDAY_USERNAME = "another-account";
    await assert.rejects(shipmentFor(cms, 1), /configurații/);
    assert.equal((await pool.query("SELECT snapshot->>'status' AS status FROM orders")).rows.every(row => row.status === "paid"), true);
  } finally {
    for (const session of Object.values(sessions)) { await session.client.query("ROLLBACK"); session.client.release(); }
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
