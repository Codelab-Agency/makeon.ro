import { sql, type MigrateUpArgs, type MigrateDownArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs) {
  await db.execute(sql`
    CREATE TABLE order_status_emails (
      id bigserial PRIMARY KEY,
      event_id uuid NOT NULL UNIQUE,
      order_id integer NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
      target_status varchar NOT NULL CHECK (target_status IN ('new','processing','shipped','delivered')),
      body jsonb NOT NULL,
      state varchar NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','sending','sent','failed','blocked','skipped')),
      error varchar,
      attempt_token uuid,
      first_attempt_at timestamptz,
      lease_until timestamptz,
      sent_at timestamptz,
      provider_id varchar,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX order_status_emails_order_idx ON order_status_emails(order_id, id);
  `);
}

export async function down({ db }: MigrateDownArgs) {
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM order_status_emails) THEN
      RAISE EXCEPTION 'Cannot remove existing order notification history';
    END IF;
  END $$;
  DROP TABLE order_status_emails;`);
}
