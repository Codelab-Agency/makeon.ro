import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "legal_version" varchar;
  ALTER TABLE "orders" ADD COLUMN "legal_accepted_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // A rollback must not silently erase evidence from existing customer orders.
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM orders WHERE legal_version IS NOT NULL OR legal_accepted_at IS NOT NULL) THEN
      RAISE EXCEPTION 'Cannot roll back while legal acknowledgements exist';
    END IF;
  END $$;`);
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "legal_version";
  ALTER TABLE "orders" DROP COLUMN "legal_accepted_at";`)
}
