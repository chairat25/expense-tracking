CREATE TYPE "public"."budget_mode" AS ENUM('month', 'week');--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"budget_mode" "budget_mode" DEFAULT 'month' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
