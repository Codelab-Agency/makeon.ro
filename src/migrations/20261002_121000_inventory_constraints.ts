import {
  sql,
  type MigrateUpArgs,
  type MigrateDownArgs,
} from "@payloadcms/db-postgres";

/** Enforce inventory and monetary invariants even for writes outside Payload hooks. */
export async function up({ db }: MigrateUpArgs) {
  await db.execute(sql`ALTER TABLE products ADD CONSTRAINT products_inventory_valid
    CHECK (stock >= 0 AND reserved >= 0 AND stock >= reserved AND stock = trunc(stock) AND reserved = trunc(reserved));
    ALTER TABLE products ADD CONSTRAINT products_price_valid CHECK (price IS NULL OR (price > 0 AND price * 100 = trunc(price * 100)));`);
}
export async function down({ db }: MigrateDownArgs) {
  await db.execute(sql`ALTER TABLE products DROP CONSTRAINT products_inventory_valid;
    ALTER TABLE products DROP CONSTRAINT products_price_valid;`);
}
