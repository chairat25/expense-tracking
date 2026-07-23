CREATE TABLE IF NOT EXISTS "user_menu_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "menu_key" text NOT NULL,
  "is_visible" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_menu_prefs_user_key_uq" ON "user_menu_preferences" USING btree ("user_id", "menu_key");
