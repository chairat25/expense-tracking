import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { months, savingsTransactions, transactions } from "@/db/schema";
import {
  badRequest,
  carryOverPatch,
  requireUserId,
  unauthorized,
  ymSchema,
} from "@/lib/api";
import { daysInMonth, shiftMonth } from "@/lib/shared";

type Ctx = { params: Promise<{ ym: string }> };

/**
 * แบ่งยอดคงเหลือตอนปิดเดือน: savingsAmount ส่วนหนึ่งเข้าเงินเก็บ
 * ที่เหลือ (remaining - savingsAmount) ยกไปเป็นยอดตั้งต้นเดือนถัดไป
 * เรียกซ้ำได้ (แก้ไขทีหลัง) — จะ update แถว ledger เดิมแทนสร้างใหม่ซ้ำ
 */
export async function POST(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const ymParsed = ymSchema.safeParse((await params).ym);
  if (!ymParsed.success) return badRequest(ymParsed.error.issues[0].message);
  const ym = ymParsed.data;

  const bodyParsed = carryOverPatch.safeParse(await req.json());
  if (!bodyParsed.success) {
    return badRequest(bodyParsed.error.issues[0].message);
  }
  const { savingsAmount } = bodyParsed.data;

  const month = await db.query.months.findFirst({
    where: and(eq(months.userId, userId), eq(months.ym, ym)),
  });
  if (!month || !month.closedAt) {
    return badRequest("ต้องปิดยอดเดือนนี้ก่อนถึงจะแบ่งเงินได้");
  }

  const from = `${ym}-01`;
  const to = `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    );

  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "income") income += Number(r.amount);
    else expense += Number(r.amount);
  }
  const remaining = Number(month.openingBalance) + income - expense;

  if (remaining <= 0) return badRequest("ไม่มีเงินเหลือให้แบ่ง");
  if (savingsAmount < 0 || savingsAmount > remaining) {
    return badRequest("จำนวนเงินเก็บต้องอยู่ระหว่าง 0 ถึงยอดคงเหลือ");
  }

  const carryOverAmount = remaining - savingsAmount;

  if (savingsAmount === 0) {
    if (month.savingsTxId) {
      await db
        .delete(savingsTransactions)
        .where(eq(savingsTransactions.id, month.savingsTxId));
    }
    await db
      .update(months)
      .set({ savingsAmount: "0", savingsTxId: null })
      .where(eq(months.id, month.id));
  } else if (month.savingsTxId) {
    await db
      .update(savingsTransactions)
      .set({ amount: savingsAmount.toFixed(2) })
      .where(eq(savingsTransactions.id, month.savingsTxId));
    await db
      .update(months)
      .set({ savingsAmount: savingsAmount.toFixed(2) })
      .where(eq(months.id, month.id));
  } else {
    const [tx] = await db
      .insert(savingsTransactions)
      .values({
        userId,
        amount: savingsAmount.toFixed(2),
        note: `ปิดยอด ${ym}`,
      })
      .returning();
    await db
      .update(months)
      .set({ savingsAmount: savingsAmount.toFixed(2), savingsTxId: tx.id })
      .where(eq(months.id, month.id));
  }

  const nextYm = shiftMonth(ym, 1);
  await db
    .insert(months)
    .values({
      userId,
      ym: nextYm,
      openingBalance: carryOverAmount.toFixed(2),
    })
    .onConflictDoUpdate({
      target: [months.userId, months.ym],
      set: { openingBalance: carryOverAmount.toFixed(2) },
    });

  return Response.json({ savingsAmount, carryOverAmount, nextYm });
}
