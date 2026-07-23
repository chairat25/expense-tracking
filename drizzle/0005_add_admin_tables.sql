CREATE TABLE IF NOT EXISTS "app_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "name" text NOT NULL,
  "icon" text DEFAULT '📦' NOT NULL,
  "parent_id" integer,
  "type" text DEFAULT 'expense' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "app_menus" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text UNIQUE NOT NULL,
  "label" text NOT NULL,
  "icon" text DEFAULT 'ListTodo' NOT NULL,
  "parent_id" integer,
  "target_view" text DEFAULT 'day' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
