import { sql, type MigrateUpArgs, type MigrateDownArgs } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE checkout_reservations (
      reference varchar PRIMARY KEY,
      snapshot jsonb NOT NULL,
      status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','expired','failed')),
      stripe_session_id varchar UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    );
    CREATE INDEX checkout_reservations_expiry_idx ON checkout_reservations(expires_at) WHERE status = 'pending';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM checkout_reservations WHERE status = 'pending') THEN
        RAISE EXCEPTION 'Cannot remove active checkout reservations';
      END IF;
    END $$;
    DROP TABLE checkout_reservations;
  `);
}
