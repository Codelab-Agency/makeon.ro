import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_fulfillment_status" AS ENUM('new', 'processing', 'shipped', 'delivered');
  ALTER TABLE "orders" ADD COLUMN "fulfillment_status" "enum_orders_fulfillment_status" DEFAULT 'new' NOT NULL;`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "fulfillment_status";
  DROP TYPE "public"."enum_orders_fulfillment_status";`);
}
