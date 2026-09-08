import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { transactions, dailyBudgets } from "@/db/schema";
import { badRequest, requireUserId, txInput, unauthorized } from "@/lib/api";
import { todayKey, shiftDate } from "@/lib/shared";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const isHistory = searchParams.get("history") === "true";
  const date = searchParams.get("date") || todayKey();

  if (isHistory) {
    const days = Math.min(30, Math.max(7, parseInt(searchParams.get("days") || "14", 10)));
    const today = todayKey();
    const fromDate = shiftDate(today, -(days - 1));

    const rows = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, fromDate),
          lte(transactions.date, today)
        )
      )
      .orderBy(desc(transactions.date), desc(transactions.spentAt));

    const dailySummaryMap: Record<string, { date: string; expense: number; income: number; count: number }> = {};

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const d = shiftDate(today, -i);
      dailySummaryMap[d] = { date: d, expense: 0, income: 0, count: 0 };
    }

    for (const r of rows) {
      const amt = Number(r.amount);
      if (dailySummaryMap[r.date]) {
        dailySummaryMap[r.date].count += 1;
        if (r.type === "expense") dailySummaryMap[r.date].expense += amt;
        else dailySummaryMap[r.date].income += amt;
      }
    }

    const history = Object.values(dailySummaryMap).sort((a, b) => b.date.localeCompare(a.date));

    return Response.json({
      history,
      fromDate,
      toDate: today,
    });
  }

  // Single Date Query
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.date, date)))
    .orderBy(desc(transactions.spentAt), desc(transactions.id));

  const [dailyBudgetRow] = await db
    .select()
    .from(dailyBudgets)
    .where(and(eq(dailyBudgets.userId, userId), eq(dailyBudgets.date, date)));

  let todaySpent = 0;
  let todayIncome = 0;

  const items = rows.map((r) => {
    const amt = Number(r.amount);
    if (r.type === "expense") todaySpent += amt;
    else todayIncome += amt;
    return {
      id: r.id,
      date: r.date,
      spentAt: r.spentAt.toISOString(),
      type: r.type,
      amount: amt,
      category: r.category,
      note: r.note,
    };
  });

  return Response.json({
    date,
    transactions: items,
    todaySpent,
    todayIncome,
    dailyBudget: dailyBudgetRow ? Number(dailyBudgetRow.amount) : null,
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = txInput.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { date, type, amount, category, note } = parsed.data;

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      date,
      spentAt: new Date(),
      type,
      amount: amount.toFixed(2),
      category,
      note: note.trim(),
    })
    .returning();

  return Response.json(
    {
      id: row.id,
      date: row.date,
      spentAt: row.spentAt.toISOString(),
      type: row.type,
      amount: Number(row.amount),
      category: row.category,
      note: row.note,
    },
    { status: 201 },
  );
}
