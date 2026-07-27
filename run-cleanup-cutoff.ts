import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { db } from "./src/db";
import { transactions } from "./src/db/schema";
import { like } from "drizzle-orm";

async function main() {
  try {
    const deleted = await db
      .delete(transactions)
      .where(like(transactions.note, "%ตัดยอดงบสัปดาห์%"))
      .returning();
    console.log(`Successfully cleaned up ${deleted.length} auto-cutoff expense transactions!`);
  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    process.exit(0);
  }
}

main();
