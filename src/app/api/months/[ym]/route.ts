import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { months, transactions, dailyBudgets, userSettings } from "@/db/schema";
import {
  badRequest,
  monthPatch,
  requireUserId,
  unauthorized,
  ymSchema,
} from "@/lib/api";
import { daysInMonth, type Category, type MonthData } from "@/lib/shared";

type Ctx = { params: Promise<{ ym: string }> };

/** ดึงยอดตั้งต้น + รายการทั้งเดือนในครั้งเดียว แล้วให้หน้าเว็บรวมยอดต่อเอง */
export async function GET(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = ymSchema.safeParse((await params).ym);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const ym = parsed.data;

  const from = `${ym}-01`;
  const to = `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;

  const [monthRow, rows, budgets, settings] = await Promise.all([
    db.query.months.findFirst({
      where: and(eq(months.userId, userId), eq(months.ym, ym)),
    }),
    db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      )
      .orderBy(asc(transactions.date), asc(transactions.spentAt)),
    db.query.dailyBudgets.findMany({
      where: and(
        eq(dailyBudgets.userId, userId),
        gte(dailyBudgets.date, from),
        lte(dailyBudgets.date, to)
      )
    }),
    db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    }),
  ]);

  const body: MonthData = {
    ym,
    openingBalance: Number(monthRow?.openingBalance ?? 0),
    closedAt: monthRow?.closedAt?.toISOString() ?? null,
    savingsAmount:
      monthRow?.savingsAmount != null ? Number(monthRow.savingsAmount) : null,
    // ไม่ใช่ข้อมูลของเดือนจริงๆ แต่แถมมากับ response นี้เพื่อไม่ต้อง fetch เพิ่ม
    // และกันไม่ให้โหมดกระพริบผิดตอนโหลด — skeleton คลุมช่วงนี้อยู่แล้ว
    budgetMode: settings?.budgetMode ?? "month",
    transactions: rows.map((r) => ({
      id: r.id,
      date: r.date,
      spentAt: r.spentAt.toISOString(),
      type: r.type,
      amount: Number(r.amount),
      category: r.category as Category,
      note: r.note,
    })),
    dailyBudgets: budgets.map((b) => ({
      id: b.id,
      userId: b.userId,
      date: b.date,
      amount: Number(b.amount),
    })),
  };

  return Response.json(body);
}

/** ตั้งยอดยกมา / ปิดยอดสิ้นเดือน */
export async function PUT(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const ymParsed = ymSchema.safeParse((await params).ym);
  if (!ymParsed.success) return badRequest(ymParsed.error.issues[0].message);
  const ym = ymParsed.data;

  const parsed = monthPatch.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { openingBalance, note, closed } = parsed.data;

  const closedAt = closed === undefined ? undefined : closed ? new Date() : null;

  const [row] = await db
    .insert(months)
    .values({
      userId,
      ym,
      openingBalance: openingBalance?.toFixed(2) ?? "0",
      note: note ?? "",
      closedAt: closedAt ?? null,
    })
    .onConflictDoUpdate({
      target: [months.userId, months.ym],
      set: {
        ...(openingBalance !== undefined && {
          openingBalance: openingBalance.toFixed(2),
        }),
        ...(note !== undefined && { note }),
        ...(closedAt !== undefined && { closedAt }),
      },
    })
    .returning();

  return Response.json({
    ym: row.ym,
    openingBalance: Number(row.openingBalance),
    closedAt: row.closedAt?.toISOString() ?? null,
  });
}
