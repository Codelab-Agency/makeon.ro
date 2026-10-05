import {
  sql,
  type MigrateUpArgs,
  type MigrateDownArgs,
} from "@payloadcms/db-postgres";

/** Restore protections that development schema push may have removed.
 * Existing invalid rows fail validation and roll back; no data is repaired or
 * deleted automatically. Previously applied migration files stay unchanged.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.products'::regclass
        AND conname = 'products_inventory_valid'
    ) THEN
      ALTER TABLE public.products ADD CONSTRAINT products_inventory_valid
        CHECK (stock >= 0 AND reserved >= 0 AND stock >= reserved
          AND stock = trunc(stock) AND reserved = trunc(reserved)) NOT VALID;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.products'::regclass
        AND conname = 'products_price_valid'
    ) THEN
      ALTER TABLE public.products ADD CONSTRAINT products_price_valid
        CHECK (price IS NULL OR (price > 0 AND price * 100 = trunc(price * 100))) NOT VALID;
    END IF;
  END $$;
  ALTER TABLE public.products VALIDATE CONSTRAINT products_inventory_valid;
  ALTER TABLE public.products VALIDATE CONSTRAINT products_price_valid;`);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // These protections belong to the original inventory migration. Keep them
  // when rolling back this repair; that original migration owns their removal.
}
