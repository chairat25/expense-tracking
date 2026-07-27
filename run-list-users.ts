import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { db } from "./src/db";
import { transactions, userSettings } from "./src/db/schema";
import { eq, count } from "drizzle-orm";

async function main() {
  try {
    const users = await db.select().from(userSettings);
    console.log("Users:", users);

    for (const u of users) {
      const txs = await db.select({ value: count() }).from(transactions).where(eq(transactions.userId, u.userId));
      console.log(`User ${u.userId}: ${txs[0].value} transactions`);
    }
  } catch (err) {
    console.error("User inspect error:", err);
  } finally {
    process.exit(0);
  }
}

main();
