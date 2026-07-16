import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { dailyBudgets } from "@/db/schema";
import {
  badRequest,
  dailyBudgetPatch,
  requireUserId,
  unauthorized,
  ymSchema,
} from "@/lib/api";
import { daysInMonth, type DailyBudget } from "@/lib/shared";

type Ctx = { params: Promise<{ ym: string }> };

function toDailyBudget(r: {
  id: number;
  userId: string;
  date: string;
  amount: string;
}): DailyBudget {
  // numeric ของ drizzle มาเป็น string เสมอ ต้องแปลงก่อนส่งออก
  // (ของเดิมส่ง string ดิบๆ ทำให้ page.tsx เก็บ string ไว้ใน state แล้ว .toFixed() พังตอนกดแก้ซ้ำ)
  return { id: r.id, userId: r.userId, date: r.date, amount: Number(r.amount) };
}

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = ymSchema.safeParse((await params).ym);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const ym = parsed.data;

  const rows = await db
    .select()
    .from(dailyBudgets)
    .where(
      and(
        eq(dailyBudgets.userId, userId),
        gte(dailyBudgets.date, `${ym}-01`),
        lte(
          dailyBudgets.date,
          `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`,
        ),
      ),
    );

  return Response.json(rows.map(toDailyBudget));
}

/**
 * ตั้งงบให้หลายวันพร้อมกันด้วยค่าเดียวกัน
 * โหมดเดือนส่ง dates ยาว 1 โหมดสัปดาห์ส่งวันที่เหลือในสัปดาห์ (สูงสุด 7) — ยิงครั้งเดียวจบทั้งคู่
 */
export async function PUT(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const ymParsed = ymSchema.safeParse((await params).ym);
  if (!ymParsed.success) return badRequest(ymParsed.error.issues[0].message);
  const ym = ymParsed.data;

  const parsed = dailyBudgetPatch.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { dates, amount } = parsed.data;

  // กันเขียนข้ามเดือน — client คำนวณ dates เอง จึงต้องตรวจซ้ำที่นี่
  if (dates.some((d) => !d.startsWith(ym))) {
    return badRequest("มีวันที่ไม่ตรงกับเดือนที่ระบุ");
  }

  const rows = await db
    .insert(dailyBudgets)
    .values(dates.map((date) => ({ userId, date, amount: amount.toFixed(2) })))
    .onConflictDoUpdate({
      target: [dailyBudgets.userId, dailyBudgets.date],
      set: { amount: amount.toFixed(2) },
    })
    .returning();

  return Response.json(rows.map(toDailyBudget));
}
