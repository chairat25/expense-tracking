import { ne } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    // Fetch only REAL registered profiles from DB excluding current user
    const realProfiles = await db
      .select()
      .from(userProfiles)
      .where(ne(userProfiles.userId, userId));

    const users = realProfiles.map((p) => ({
      userId: p.userId,
      displayName: p.displayName || "สมาชิก Expense Tracker",
      avatarUrl: p.avatarUrl || "",
      bio: p.bio || "วางแผนการเงินอย่างมีประสิทธิภาพ 🎯",
      isOnline: true,
    }));

    return Response.json({ users });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการดึงรายชื่อสมาชิกคอมมูนิตี้" },
      { status: 500 },
    );
  }
}
