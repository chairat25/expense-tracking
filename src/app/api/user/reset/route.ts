import { db } from "@/db";
import {
  dailyBudgets,
  months,
  salaryPockets,
  savingsTransactions,
  transactions,
  userNotifications,
  userSettings,
  weeklyEnvelopes,
} from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";
import { eq } from "drizzle-orm";

/** API ล้างข้อมูลทั้งหมดของผู้ใช้ เพื่อเริ่ม Set Zero ใหม่ตั้งแต่ต้น */
export async function POST() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(dailyBudgets).where(eq(dailyBudgets.userId, userId));
    await db.delete(savingsTransactions).where(eq(savingsTransactions.userId, userId));
    await db.delete(salaryPockets).where(eq(salaryPockets.userId, userId));
    await db.delete(weeklyEnvelopes).where(eq(weeklyEnvelopes.userId, userId));
    await db.delete(userNotifications).where(eq(userNotifications.userId, userId));
    await db.delete(months).where(eq(months.userId, userId));

    await db
      .update(userSettings)
      .set({ weeklyResetDate: null })
      .where(eq(userSettings.userId, userId));

    return Response.json({ success: true, message: "ล้างข้อมูลเริ่มต้นใหม่สำเร็จ" });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการล้างข้อมูล" },
      { status: 500 },
    );
  }
}
