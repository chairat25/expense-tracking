import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config();


const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "daily_budgets" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "date" date NOT NULL,
      "amount" numeric(12, 2) NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "daily_budgets_user_date_uq" ON "daily_budgets" USING btree ("user_id","date");
  `);
  
  // also add RLS!
  try {
    await db.execute(sql`
      ALTER TABLE public.daily_budgets
      ADD CONSTRAINT daily_budgets_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
    `);
  } catch(e) { console.log(e); }

  await db.execute(sql`
    ALTER TABLE public.daily_budgets ENABLE ROW LEVEL SECURITY;
  `);

  try {
    await db.execute(sql`
      CREATE POLICY "own daily budgets"
      ON public.daily_budgets FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `);
  } catch(e) { console.log(e); }

  // 0004 Migration for default_salary & salaries
  await db.execute(sql`
    ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "default_salary" numeric(12, 2) DEFAULT '0' NOT NULL;
  `);

  await db.execute(sql`
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
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "salaries_user_ym_uq" ON "salaries" USING btree ("user_id", "ym");
  `);

  try {
    await db.execute(sql`
      ALTER TABLE public.salaries
      ADD CONSTRAINT salaries_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
    `);
  } catch(e) { console.log(e); }

  await db.execute(sql`
    ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
  `);

  try {
    await db.execute(sql`
      CREATE POLICY "own salaries"
      ON public.salaries FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `);
  } catch(e) { console.log(e); }

  // 0005 Migration for app_categories and app_menus
  await db.execute(sql`
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
  `);

  await db.execute(sql`
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
  `);

  // Seed default categories if empty
  await db.execute(sql`
    INSERT INTO "app_categories" ("slug", "name", "icon", "type", "sort_order")
    VALUES 
      ('food', 'อาหาร', '🍚', 'expense', 1),
      ('drink', 'เครื่องดื่ม', '🥤', 'expense', 2),
      ('transport', 'เดินทาง', '🚕', 'expense', 3),
      ('bill', 'บิล/ค่างวด', '🧾', 'expense', 4),
      ('shopping', 'ของใช้', '🛍️', 'expense', 5),
      ('fun', 'บันเทิง', '🎬', 'expense', 6),
      ('other', 'อื่นๆ', '📦', 'expense', 7)
    ON CONFLICT ("slug") DO NOTHING;
  `);

  // Seed default menus if empty
  await db.execute(sql`
    INSERT INTO "app_menus" ("key", "label", "icon", "target_view", "sort_order")
    VALUES 
      ('day', 'รายวัน', 'ListTodo', 'day', 1),
      ('salary', 'เงินเดือน', 'Banknote', 'salary', 2),
      ('month', 'สรุปเดือน', 'CalendarDays', 'month', 3),
      ('admin', 'หลังบ้าน', 'Settings', 'admin', 4)
    ON CONFLICT ("key") DO NOTHING;
  `);

  // 0006 Migration for user_menu_preferences
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user_menu_preferences" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "menu_key" text NOT NULL,
      "is_visible" boolean DEFAULT true NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "user_menu_prefs_user_key_uq" ON "user_menu_preferences" USING btree ("user_id", "menu_key");
  `);

  try {
    await db.execute(sql`
      ALTER TABLE public.user_menu_preferences
      DROP CONSTRAINT IF EXISTS user_menu_prefs_user_id_fkey;
    `);
  } catch(e) { console.log(e); }

  await db.execute(sql`
    ALTER TABLE public.user_menu_preferences ENABLE ROW LEVEL SECURITY;
  `);

  try {
    await db.execute(sql`
      CREATE POLICY "own user_menu_preferences"
      ON public.user_menu_preferences FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `);
  } catch(e) { console.log(e); }

  try {
    await db.execute(sql`
      ALTER PUBLICATION supabase_realtime ADD TABLE user_menu_preferences;
    `);
  } catch(e) { console.log(e); }

  try {
    await db.execute(sql`
      ALTER PUBLICATION supabase_realtime ADD TABLE app_menus;
    `);
  } catch(e) { console.log(e); }

  // 0007 Migration for memo_topics and memo_entries
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "memo_topics" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "title" text NOT NULL,
      "icon" text DEFAULT '📌' NOT NULL,
      "color" text DEFAULT '#3b82f6' NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "memo_entries" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "topic_id" integer NOT NULL,
      "date" date NOT NULL,
      "title" text DEFAULT '' NOT NULL,
      "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "mileage" integer,
      "cost" numeric(12, 2),
      "note" text DEFAULT '' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "memo_entries_user_topic_date_idx" ON "memo_entries" USING btree ("user_id", "topic_id", "date");
  `);

  // Enable RLS for memo tables
  await db.execute(sql`
    ALTER TABLE public.memo_topics ENABLE ROW LEVEL SECURITY;
  `);
  await db.execute(sql`
    ALTER TABLE public.memo_entries ENABLE ROW LEVEL SECURITY;
  `);

  try {
    await db.execute(sql`
      CREATE POLICY "own memo_topics"
      ON public.memo_topics FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `);
  } catch(e) { console.log(e); }

  try {
    await db.execute(sql`
      CREATE POLICY "own memo_entries"
      ON public.memo_entries FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `);
  } catch(e) { console.log(e); }

  // Create salary_pockets & weekly_envelopes tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS public.salary_pockets (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      ym TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📦',
      color TEXT NOT NULL DEFAULT '#6366f1',
      allocated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      is_weekly_pool BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS salary_pockets_user_ym_idx
    ON public.salary_pockets (user_id, ym);
  `);

  await db.execute(sql`
    ALTER TABLE public.salary_pockets ENABLE ROW LEVEL SECURITY;
  `);

  try {
    await db.execute(sql`
      CREATE POLICY "own salary_pockets"
      ON public.salary_pockets FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `);
  } catch(e) { console.log(e); }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS public.weekly_envelopes (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      ym TEXT NOT NULL,
      week_index INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      budget_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS weekly_envelopes_user_ym_week_uq
    ON public.weekly_envelopes (user_id, ym, week_index);
  `);

  await db.execute(sql`
    ALTER TABLE public.weekly_envelopes ENABLE ROW LEVEL SECURITY;
  `);

  try {
    await db.execute(sql`
      CREATE POLICY "own weekly_envelopes"
      ON public.weekly_envelopes FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `);
  } catch(e) { console.log(e); }

  // Seed default 'home' & 'memo' menus
  await db.execute(sql`
    INSERT INTO "app_menus" ("key", "label", "icon", "target_view", "sort_order")
    VALUES 
      ('home', 'หน้าหลัก', 'Home', 'home', 0),
      ('memo', 'ความจำ', 'BookmarkCheck', 'memo', 4)
    ON CONFLICT ("key") DO NOTHING;
  `);

  console.log("Migration completed.");
}



main()
  .catch(console.error)
  .finally(async () => {
    try {
      await client.end();
    } catch {}
    process.exit(0);
  });

