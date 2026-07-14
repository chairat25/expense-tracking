CREATE TYPE "public"."tx_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TABLE "months" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"ym" text NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"spent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "tx_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "months_user_ym_uq" ON "months" USING btree ("user_id","ym");--> statement-breakpoint
CREATE INDEX "tx_user_date_idx" ON "transactions" USING btree ("user_id","date");