import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_decaff_format" AS ENUM('macinata', 'boabe');
  ALTER TYPE "public"."enum_products_category" ADD VALUE 'decaff';
  ALTER TYPE "public"."enum_products_category" ADD VALUE 'complementare';
  ALTER TABLE "products_notes" ALTER COLUMN "note" DROP NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "collection" DROP NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "grams" DROP NOT NULL;
  ALTER TABLE "products" ADD COLUMN "decaff_format" "enum_products_decaff_format" DEFAULT 'macinata';
  ALTER TABLE "products" ADD COLUMN "unit_label" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Refuse destructive rollback once the new product model is in use.
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM products WHERE category::text IN ('decaff', 'complementare')
      OR unit_label IS NOT NULL OR collection IS NULL OR grams IS NULL)
      OR EXISTS (SELECT 1 FROM products_notes WHERE note IS NULL) THEN
      RAISE EXCEPTION 'Cannot roll back while new categories or package fields are in use';
    END IF;
  END $$;`);
  await db.execute(sql`
   ALTER TABLE "products" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_products_category";
  CREATE TYPE "public"."enum_products_category" AS ENUM('boabe', 'macinata', 'solubila', 'alternative');
  ALTER TABLE "products" ALTER COLUMN "category" SET DATA TYPE "public"."enum_products_category" USING "category"::"public"."enum_products_category";
  ALTER TABLE "products_notes" ALTER COLUMN "note" SET NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "collection" SET NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "grams" SET NOT NULL;
  ALTER TABLE "products" DROP COLUMN "decaff_format";
  ALTER TABLE "products" DROP COLUMN "unit_label";
  DROP TYPE "public"."enum_products_decaff_format";`)
}
