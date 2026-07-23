import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { months, salaries, transactions, userSettings } from "@/db/schema";
import {
  badRequest,
  requireUserId,
  salaryInput,
  unauthorized,
} from "@/lib/api";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const url = new URL(req.url);
  const ym = url.searchParams.get("ym");

  // ดึง settings ของ user เพื่อดู defaultSalary
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  const defaultSalary = Number(settings?.defaultSalary ?? 0);

  // ดึงประวัติการรับเงินเดือนทั้งหมด
  const historyRows = await db
    .select()
    .from(salaries)
    .where(eq(salaries.userId, userId))
    .orderBy(desc(salaries.ym));

  const history = historyRows.map((s) => ({
    ...s,
    amount: Number(s.amount),
  }));

  const currentSalary = ym
    ? history.find((s) => s.ym === ym) ?? null
    : null;

  return Response.json({
    defaultSalary,
    salary: currentSalary,
    history,
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = salaryInput.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const { ym, amount, receivedAt, applyMode, note } = parsed.data;
  const strAmount = String(amount);

  let incomeTxId: number | null = null;

  // หากเป็นโหมดบันทึกรายรับ ให้สร้าง/อัปเดต transaction
  if (applyMode === "income_tx") {
    const txNote = note.trim() || `เงินเดือนประจำเดือน ${ym}`;
    const [tx] = await db
      .insert(transactions)
      .values({
        userId,
        date: receivedAt,
        type: "income",
        amount: strAmount,
        category: "other",
        note: txNote,
      })
      .returning();
    incomeTxId = tx.id;
  } else if (applyMode === "opening_balance") {
    // โหมดปรับเงินตั้งต้น: อัปเดต months.openingBalance ในเดือนนั้น
    await db
      .insert(months)
      .values({
        userId,
        ym,
        openingBalance: strAmount,
      })
      .onConflictDoUpdate({
        target: [months.userId, months.ym],
        set: { openingBalance: strAmount },
      });
  }

  // บันทึก/อัปเดตลงตาราง salaries
  const [salaryRow] = await db
    .insert(salaries)
    .values({
      userId,
      ym,
      amount: strAmount,
      receivedAt,
      applyMode,
      incomeTxId,
      note,
    })
    .onConflictDoUpdate({
      target: [salaries.userId, salaries.ym],
      set: {
        amount: strAmount,
        receivedAt,
        applyMode,
        incomeTxId,
        note,
      },
    })
    .returning();

  return Response.json({
    salary: {
      ...salaryRow,
      amount: Number(salaryRow.amount),
    },
  });
}
