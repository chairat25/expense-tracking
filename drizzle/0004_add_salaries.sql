ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "default_salary" numeric(12, 2) DEFAULT '0' NOT NULL;

CREATE TABLE IF NOT EXISTS "salaries" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "ym" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "received_at" date NOT NULL,
  "apply_mode" text DEFAULT 'opening_balance' NOT NULL,
  "income_tx_id" integer,
  "note" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "salaries_user_ym_uq" ON "salaries" USING btree ("user_id", "ym");
