CREATE TABLE "savings_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "months" ADD COLUMN "savings_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "months" ADD COLUMN "savings_tx_id" integer;