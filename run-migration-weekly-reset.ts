import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { sql } from "drizzle-orm";
import { db } from "./src/db";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS weekly_reset_date text;`);
    console.log("Successfully added weekly_reset_date column to user_settings table!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit(0);
  }
}

main();
