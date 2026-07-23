import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, gte, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const years = Math.min(Math.max(Number(searchParams.get("years")) || 1, 1), 5);

    // Calculate start date: (years) ago from today
    const now = new Date();
    const startYear = now.getFullYear() - years;
    const startDate = `${startYear}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Query user transactions
    const rows = await db
      .select({
        id: transactions.id,
        date: transactions.date,
        type: transactions.type,
        amount: transactions.amount,
        category: transactions.category,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, user.id), gte(transactions.date, startDate)));

    // Group by month YYYY-MM
    const monthlyMap = new Map<string, { ym: string; income: number; expense: number }>();

    // Seed all months in the period to make continuous chart lines
    const startM = new Date(startYear, now.getMonth(), 1);
    const endM = new Date(now.getFullYear(), now.getMonth(), 1);
    const cur = new Date(startM);

    while (cur <= endM) {
      const ym = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(ym, { ym, income: 0, expense: 0 });
      cur.setMonth(cur.getMonth() + 1);
    }

    // Category breakdown map
    const categoryMap = new Map<string, number>();

    for (const r of rows) {
      const ym = r.date.slice(0, 7);
      const amt = Number(r.amount) || 0;

      if (!monthlyMap.has(ym)) {
        monthlyMap.set(ym, { ym, income: 0, expense: 0 });
      }

      const item = monthlyMap.get(ym)!;
      if (r.type === "income") {
        item.income += amt;
      } else {
        item.expense += amt;
        categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + amt);
      }
    }

    const monthlyData = Array.from(monthlyMap.values()).sort((a, b) =>
      a.ym.localeCompare(b.ym),
    );

    const categoryData = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      success: true,
      years,
      monthlyData,
      categoryData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
