import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));

  if (!profile) {
    // Return default initial profile
    return Response.json({
      profile: {
        userId,
        displayName: "ผู้ใช้งาน Expense Tracker",
        avatarUrl: "",
        bio: "กำลังวางแผนจัดการเงินอย่างมีประสิทธิภาพ 🎯",
        updatedAt: new Date().toISOString(),
      },
    });
  }

  return Response.json({ profile });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
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
        bio: bio || "กำลังวางแผนจัดการเงินอย่างมีประสิทธิภาพ 🎯",
      });
    }

    const [updated] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));

    return Response.json({ success: true, profile: updated });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการบันทึกโปรไฟล์" },
      { status: 500 },
    );
  }
}
