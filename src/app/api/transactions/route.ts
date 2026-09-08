import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { transactions, dailyBudgets } from "@/db/schema";
import { badRequest, requireUserId, txInput, unauthorized } from "@/lib/api";
import { todayKey } from "@/lib/shared";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayKey();

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
