import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { dailyBudgets } from "@/db/schema";
import { z } from "zod";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ym: string }> }
) {
  const { ym } = await params;
  if (!/^\d{4}-\d{2}$/.test(ym)) {
    return NextResponse.json({ error: "Invalid ym format" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ดึง daily budgets ของเดือนนี้ทั้งหมด โดยเช็คว่า date ขึ้นต้นด้วย YYYY-MM
  const budgets = await db
    .select()
    .from(dailyBudgets)
    .where(
      and(
        eq(dailyBudgets.userId, user.id),
        sql`to_char(${dailyBudgets.date}, 'YYYY-MM') = ${ym}`
      )
    );

  return NextResponse.json(budgets);
}

const updateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ ym: string }> }
) {
  const { ym } = await params;
  if (!/^\d{4}-\d{2}$/.test(ym)) {
    return NextResponse.json({ error: "Invalid ym format" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { date, amount } = parsed.data;

  // Ensure the date matches the month
  if (!date.startsWith(ym)) {
    return NextResponse.json({ error: "Date does not match month" }, { status: 400 });
  }

  const [upserted] = await db
    .insert(dailyBudgets)
    .values({
      userId: user.id,
      date,
      amount: String(amount),
    })
    .onConflictDoUpdate({
      target: [dailyBudgets.userId, dailyBudgets.date],
      set: { amount: String(amount) },
    })
    .returning();

  return NextResponse.json(upserted);
}
