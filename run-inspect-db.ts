import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { db } from "./src/db";
import { transactions, months, dailyBudgets, savingsTransactions, salaryPockets, weeklyEnvelopes, userSettings } from "./src/db/schema";
import { count } from "drizzle-orm";

async function main() {
  try {
    const txCount = await db.select({ value: count() }).from(transactions);
    const mCount = await db.select({ value: count() }).from(months);
    const dbCount = await db.select({ value: count() }).from(dailyBudgets);
    const stCount = await db.select({ value: count() }).from(savingsTransactions);
    const spCount = await db.select({ value: count() }).from(salaryPockets);
    const weCount = await db.select({ value: count() }).from(weeklyEnvelopes);
    const usCount = await db.select({ value: count() }).from(userSettings);

    console.log("DB Stats:", {
      transactions: txCount[0].value,
      months: mCount[0].value,
      dailyBudgets: dbCount[0].value,
      savingsTransactions: stCount[0].value,
      salaryPockets: spCount[0].value,
      weeklyEnvelopes: weCount[0].value,
      userSettings: usCount[0].value,
    });
  } catch (err) {
    console.error("Inspect error:", err);
  } finally {
    process.exit(0);
  }
}

main();
