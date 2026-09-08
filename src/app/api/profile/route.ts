import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles, userSettings, dailyBudgets, salaries, weeklyEnvelopes } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";
import { getUser } from "@/lib/supabase/server";
import { todayKey, thisMonthKey, getMonthWeeks } from "@/lib/shared";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const authUser = await getUser();
  const email = authUser?.email || "";
  const meta = authUser?.user_metadata || {};

  const googleName = meta.full_name || meta.name || "";
  const googleAvatar = meta.avatar_url || meta.picture || "";
  const defaultDisplayName = googleName || (email ? email.split("@")[0] : "ผู้ใช้งาน Expense Tracker");

  let [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));

  const [settingsRow] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  if (!profile) {
    try {
      const [inserted] = await db
        .insert(userProfiles)
        .values({
          userId,
          displayName: defaultDisplayName,
          avatarUrl: googleAvatar,
          bio: "บันทึกรายรับ-รายจ่ายประจำวัน 🎯",
        })
        .returning();
      profile = inserted;
    } catch {
      profile = {
        userId,
        displayName: defaultDisplayName,
        avatarUrl: googleAvatar,
        bio: "บันทึกรายรับ-รายจ่ายประจำวัน 🎯",
        updatedAt: new Date(),
      };
    }
  }

  const today = todayKey();
  const currentYm = thisMonthKey();

  // 1. Fetch Daily Budget for today
  const [dailyRow] = await db
    .select()
    .from(dailyBudgets)
    .where(and(eq(dailyBudgets.userId, userId), eq(dailyBudgets.date, today)));

  // 2. Fetch Monthly Salary / Budget for current month
  const [salaryRow] = await db
    .select()
    .from(salaries)
    .where(and(eq(salaries.userId, userId), eq(salaries.ym, currentYm)));

  // 3. Fetch Weekly Envelope for the current week
  const weeks = getMonthWeeks(currentYm);
  const currentWeek = weeks.find((w) => w.startDate <= today && today <= w.endDate) || weeks[0];

  let weeklyEnvelopeBudget = 0;
  if (currentWeek) {
    const [envRow] = await db
      .select()
      .from(weeklyEnvelopes)
      .where(
        and(
          eq(weeklyEnvelopes.userId, userId),
          eq(weeklyEnvelopes.ym, currentYm),
          eq(weeklyEnvelopes.weekIndex, currentWeek.weekIndex)
        )
      );
    if (envRow) {
      weeklyEnvelopeBudget = Number(envRow.budgetAmount);
    }
  }

  const monthlyBudget = salaryRow ? Number(salaryRow.amount) : Number(settingsRow?.defaultSalary ?? 0);
  const dailyBudget = dailyRow ? Number(dailyRow.amount) : (weeklyEnvelopeBudget > 0 && currentWeek ? weeklyEnvelopeBudget / currentWeek.days : (monthlyBudget > 0 ? monthlyBudget / 30 : 0));

  return Response.json({
    profile: {
      ...profile,
      email,
    },
    email,
    budgets: {
      daily: dailyBudget,
      weekly: weeklyEnvelopeBudget,
      monthly: monthlyBudget,
      currentYm,
      today,
    },
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const authUser = await getUser();
    const email = authUser?.email || "";

    const body = await req.json();
    const displayName = String(body.displayName || "").trim();
    const avatarUrl = String(body.avatarUrl || "").trim();
    const bio = String(body.bio || "").trim();

    const [existing] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));

    if (existing) {
      await db
        .update(userProfiles)
        .set({
          displayName: displayName || existing.displayName,
          avatarUrl: avatarUrl || existing.avatarUrl,
          bio: bio || existing.bio,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));
    } else {
      await db.insert(userProfiles).values({
        userId,
        displayName: displayName || "ผู้ใช้งาน Expense Tracker",
        avatarUrl,
        bio: bio || "บันทึกรายรับ-รายจ่ายประจำวัน 🎯",
      });
    }

    const [updated] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));

    return Response.json({
      success: true,
      profile: {
        ...updated,
        email,
      },
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการบันทึกโปรไฟล์" },
      { status: 500 },
    );
  }
}
