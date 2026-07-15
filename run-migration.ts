import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

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

  console.log("Migration completed.");
}

main().catch(console.error).finally(() => process.exit(0));
