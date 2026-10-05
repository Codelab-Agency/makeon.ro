import assert from "node:assert/strict";
import { createRequire } from "node:module";
import pg from "pg";

// This command only mutates the explicitly configured clone. It never falls
// back to DATABASE_URL, and does not print connection strings or customer data.
const original = process.env.DATABASE_URL;
const clone = process.env.MIGRATION_TEST_DATABASE_URL;
assert(
  original && clone,
  "Configure DATABASE_URL and MIGRATION_TEST_DATABASE_URL.",
);
const mainURL = new URL(original);
const cloneURL = new URL(clone);
assert(
  mainURL.hostname !== cloneURL.hostname ||
    mainURL.pathname !== cloneURL.pathname,
  "The test connection must target a different database/Neon endpoint.",
);
const client = new pg.Client({
  connectionString: clone,
  connectionTimeoutMillis: 10000,
});
const quote = (name) => `"${name.replaceAll('"', '""')}"`;
let cms;

async function snapshot(tables) {
  const result = {};
  for (const [table, columns] of Object.entries(tables)) {
    // Hash inside PostgreSQL, using only columns that existed before migration.
    // New columns may be added while all old business data must stay identical.
    const { rows } = await client.query(`SELECT count(*)::int AS count,
      md5(coalesce(string_agg(to_jsonb(t)::text, '' ORDER BY to_jsonb(t)::text), '')) AS digest
      FROM (SELECT ${columns.map(quote).join(",")} FROM public.${quote(table)}) t`);
    result[table] = rows[0];
  }
  return result;
}

try {
  await client.connect();
  const { rows: schema } =
    await client.query(`SELECT c.table_name, c.column_name
    FROM information_schema.columns c JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      AND c.table_name <> 'payload_migrations'
    ORDER BY c.table_name, c.ordinal_position`);
  const tables = {};
  for (const { table_name, column_name } of schema) {
    (tables[table_name] ??= []).push(column_name);
  }
  assert(
    tables.products && tables.orders,
    "Expected an existing Makeon database clone.",
  );
  const before = await snapshot(tables);
  console.log(
    "Clone row counts:",
    Object.fromEntries(Object.entries(before).map(([t, v]) => [t, v.count])),
  );

  process.env.DATABASE_URL = clone;
  process.env.PAYLOAD_DB_PUSH = "false";
  process.env.NODE_ENV = "production";
  const { getPayload } = await import("payload");
  const { default: config } = await import("../src/payload.config.ts");
  const { migrations } = await import("../src/migrations/index.ts");
  const history = (
    await client.query("SELECT name, batch FROM payload_migrations")
  ).rows;
  const applied = new Set(
    history.filter((m) => Number(m.batch) !== -1).map((m) => m.name),
  );
  // All historical migrations must already exist on this recovery clone.
  for (const migration of migrations.slice(0, 4)) {
    assert(
      applied.has(migration.name),
      `Missing historical migration: ${migration.name}. Review the schema first.`,
    );
  }
  console.log(
    "Pending migrations:",
    migrations.filter((m) => !applied.has(m.name)).map((m) => m.name),
  );
  // Payload's warning is acknowledged only for the guarded clone. Keep its dev
  // marker until migration and data verification have actually succeeded.
  const require = createRequire(import.meta.url);
  require("prompts").inject([true]);
  cms = await getPayload({ config });
  await cms.db.migrate({ migrations });
  const after = await snapshot(tables);
  assert.deepEqual(
    after,
    before,
    "Existing database rows changed during migration.",
  );
  const { rows: constraints } =
    await client.query(`SELECT conname, convalidated FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname IN ('products_inventory_valid', 'products_price_valid')`);
  assert.equal(
    constraints.length,
    2,
    "Inventory/price protections are missing.",
  );
  assert(
    constraints.every((c) => c.convalidated),
    "Constraints are not validated.",
  );
  const finalHistory = (
    await client.query("SELECT name FROM payload_migrations WHERE batch <> -1")
  ).rows;
  assert(
    migrations.every((m) => finalHistory.some((h) => h.name === m.name)),
    "Migration history is incomplete.",
  );
  await client.query(
    "DELETE FROM payload_migrations WHERE name = 'dev' AND batch = -1",
  );
  console.log(
    "PASS: all existing rows unchanged; constraints validated; clone migration history reconciled.",
  );
} catch (error) {
  console.error(
    "Clone verification failed:",
    String(error.message).replace(
      /postgres(?:ql)?:\/\/\S+/gi,
      "[redacted connection]",
    ),
  );
  process.exitCode = 1;
} finally {
  if (cms) await cms.destroy();
  await client.end();
  // Payload's task timers can otherwise keep a successful verification alive.
  process.exit(process.exitCode ?? 0);
}
