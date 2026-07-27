import { db } from "@/db";
import { savingsTransactions, transactions, userSettings } from "@/db/schema";
import { badRequest, requireUserId, unauthorized } from "@/lib/api";

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const { date, amount, weekFrom, weekTo, resetZero } = body;

    if (!date) {
      return badRequest("กรุณาระบุวันที่สำหรับตัดยอด");
    }

    const numAmount = Number(amount) || 0;
    const strAmount = numAmount.toFixed(2);
    const rangeLabel = weekFrom && weekTo ? `(${weekFrom} - ${weekTo})` : "";

    // 1. Set weeklyResetDate in user_settings if resetZero is true (or when settling week)
    await db
      .insert(userSettings)
      .values({
        userId,
        weeklyResetDate: date,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { weeklyResetDate: date },
      });

    let savingsTx = null;
    let expenseTx = null;

    // 2. If amount > 0, record in savings_transactions
    if (numAmount > 0) {
      [savingsTx] = await db
        .insert(savingsTransactions)
        .values({
          userId,
          amount: strAmount,
          note: `ตัดยอดงบสัปดาห์ ${rangeLabel}`.trim(),
        })
        .returning();
    }

    return Response.json({
      success: true,
      resetDate: date,
      savingsTx,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการตัดยอดสัปดาห์" },
      { status: 500 },
    );
  }
}
