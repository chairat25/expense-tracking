import { NextResponse } from "next/server";
import { db } from "@/db";
import { weeklyEnvelopes } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, asc } from "drizzle-orm";

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
    const ym = searchParams.get("ym");

    if (!ym) {
      return NextResponse.json({ error: "Missing ym parameter" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(weeklyEnvelopes)
      .where(and(eq(weeklyEnvelopes.userId, user.id), eq(weeklyEnvelopes.ym, ym)))
      .orderBy(asc(weeklyEnvelopes.weekIndex));

    return NextResponse.json({ envelopes: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ym, envelopes } = body as {
      ym: string;
      envelopes: {
        weekIndex: number;
        startDate: string;
        endDate: string;
        budgetAmount: number;
      }[];
    };

    if (!ym || !Array.isArray(envelopes)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const results = [];
    for (const env of envelopes) {
      const [inserted] = await db
        .insert(weeklyEnvelopes)
        .values({
          userId: user.id,
          ym,
          weekIndex: env.weekIndex,
          startDate: env.startDate,
          endDate: env.endDate,
          budgetAmount: String(env.budgetAmount ?? 0),
        })
        .onConflictDoUpdate({
          target: [weeklyEnvelopes.userId, weeklyEnvelopes.ym, weeklyEnvelopes.weekIndex],
          set: {
            budgetAmount: String(env.budgetAmount ?? 0),
            startDate: env.startDate,
            endDate: env.endDate,
          },
        })
        .returning();

      results.push(inserted);
    }

    return NextResponse.json({ envelopes: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}
