import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { db } from "./src/db";
import {
  transactions,
  months,
  dailyBudgets,
  savingsTransactions,
  salaryPockets,
  weeklyEnvelopes,
  userNotifications,
  userSettings,
} from "./src/db/schema";
import { eq } from "drizzle-orm";

const TARGET_USER_ID = "95ec1a71-84bc-4dcd-9f98-b6814f3d4e31";

async function main() {
  try {
    console.log(`Starting clean data reset for user: ${TARGET_USER_ID}...`);

    const deletedTxs = await db.delete(transactions).where(eq(transactions.userId, TARGET_USER_ID)).returning();
    const deletedDaily = await db.delete(dailyBudgets).where(eq(dailyBudgets.userId, TARGET_USER_ID)).returning();
    const deletedSavings = await db.delete(savingsTransactions).where(eq(savingsTransactions.userId, TARGET_USER_ID)).returning();
    const deletedPockets = await db.delete(salaryPockets).where(eq(salaryPockets.userId, TARGET_USER_ID)).returning();
    const deletedEnvelopes = await db.delete(weeklyEnvelopes).where(eq(weeklyEnvelopes.userId, TARGET_USER_ID)).returning();
    const deletedNotifs = await db.delete(userNotifications).where(eq(userNotifications.userId, TARGET_USER_ID)).returning();
    const deletedMonths = await db.delete(months).where(eq(months.userId, TARGET_USER_ID)).returning();

    await db
      .update(userSettings)
      .set({ weeklyResetDate: null })
      .where(eq(userSettings.userId, TARGET_USER_ID));

    console.log("Successfully reset all user data!", {
      transactions: deletedTxs.length,
      dailyBudgets: deletedDaily.length,
      savingsTransactions: deletedSavings.length,
      salaryPockets: deletedPockets.length,
      weeklyEnvelopes: deletedEnvelopes.length,
      userNotifications: deletedNotifs.length,
      months: deletedMonths.length,
    });
  } catch (err) {
    console.error("Reset error:", err);
  } finally {
    process.exit(0);
  }
}

main();
