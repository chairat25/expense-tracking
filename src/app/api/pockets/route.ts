import { NextResponse } from "next/server";
import { db } from "@/db";
import { salaryPockets } from "@/db/schema";
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
      .from(salaryPockets)
      .where(and(eq(salaryPockets.userId, user.id), eq(salaryPockets.ym, ym)))
      .orderBy(asc(salaryPockets.sortOrder), asc(salaryPockets.id));

    return NextResponse.json({ pockets: rows });
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
    const { action, id, ym, name, icon, color, allocatedAmount, isWeeklyPool } = body;

    if (action === "delete" && id) {
      await db
        .delete(salaryPockets)
        .where(and(eq(salaryPockets.id, id), eq(salaryPockets.userId, user.id)));
      return NextResponse.json({ success: true });
    }

    if (id) {
      // Edit existing pocket
      const [updated] = await db
        .update(salaryPockets)
        .set({
          name: name || "กระปุกใหม่",
          icon: icon || "📦",
          color: color || "#6366f1",
          allocatedAmount: String(allocatedAmount ?? 0),
          isWeeklyPool: isWeeklyPool ?? false,
        })
        .where(and(eq(salaryPockets.id, id), eq(salaryPockets.userId, user.id)))
        .returning();

      return NextResponse.json({ pocket: updated });
    } else {
      // Create new pocket
      if (!ym || !name) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const [inserted] = await db
        .insert(salaryPockets)
        .values({
          userId: user.id,
          ym,
          name,
          icon: icon || "📦",
          color: color || "#6366f1",
          allocatedAmount: String(allocatedAmount ?? 0),
          isWeeklyPool: isWeeklyPool ?? false,
        })
        .returning();

      return NextResponse.json({ pocket: inserted });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}
