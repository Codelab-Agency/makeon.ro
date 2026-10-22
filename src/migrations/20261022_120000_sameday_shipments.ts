import { sql, type MigrateUpArgs, type MigrateDownArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs) {
  await db.execute(sql`
    CREATE TABLE order_shipments (
      order_id integer PRIMARY KEY REFERENCES orders(id) ON DELETE RESTRICT,
      environment varchar NOT NULL CHECK (environment IN ('production', 'sandbox')),
      account_hash varchar NOT NULL,
      attempt_id uuid NOT NULL,
      state varchar NOT NULL CHECK (state IN ('sending', 'created', 'rejected', 'uncertain')),
      awb_number varchar,
      request jsonb NOT NULL,
      error varchar,
      attempted_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz,
      UNIQUE (environment, account_hash, awb_number),
      CHECK ((state = 'created') = (awb_number IS NOT NULL))
    );
  `);
}

export async function down({ db }: MigrateDownArgs) {
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM order_shipments) THEN
      RAISE EXCEPTION 'Cannot remove existing shipment history';
    END IF;
  END $$;
  DROP TABLE order_shipments;`);
}
