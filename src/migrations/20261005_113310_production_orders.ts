import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_order_type" AS ENUM('stock', 'production');
  ALTER TYPE "public"."enum_orders_status" ADD VALUE 'requested' BEFORE 'pending';
  ALTER TABLE "orders" ADD COLUMN "order_type" "enum_orders_order_type" DEFAULT 'stock';
  ALTER TABLE "orders" ADD COLUMN "request_fingerprint" varchar;
  ALTER TABLE "orders" ADD COLUMN "customer_note" varchar;
  ALTER TABLE "orders" ADD COLUMN "payment_attempt" numeric DEFAULT 0;
  ALTER TABLE "orders" ADD COLUMN "payment_url" varchar;`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  // Refuse a rollback that would erase a production order or its payment history.
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM orders WHERE order_type = 'production') THEN
      RAISE EXCEPTION 'Cannot roll back while made-to-order orders exist';
    END IF;
  END $$;`);
  await db.execute(sql`
   ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_orders_status";
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'paid', 'expired', 'failed');
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_orders_status";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."enum_orders_status" USING "status"::"public"."enum_orders_status";
  ALTER TABLE "orders" DROP COLUMN "order_type";
  ALTER TABLE "orders" DROP COLUMN "request_fingerprint";
  ALTER TABLE "orders" DROP COLUMN "customer_note";
  ALTER TABLE "orders" DROP COLUMN "payment_attempt";
  ALTER TABLE "orders" DROP COLUMN "payment_url";
  DROP TYPE "public"."enum_orders_order_type";`);
}
