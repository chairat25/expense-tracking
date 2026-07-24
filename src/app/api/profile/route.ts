import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";
import { getUser } from "@/lib/supabase/server";

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

  if (!profile) {
    // Auto-create initial profile for the logged in user
    try {
      const [inserted] = await db
        .insert(userProfiles)
        .values({
          userId,
          displayName: defaultDisplayName,
          avatarUrl: googleAvatar,
          bio: "กำลังวางแผนจัดการเงินอย่างมีประสิทธิภาพ 🎯",
        })
        .returning();

      profile = inserted;
    } catch {
      // Fallback object if insert fails
      profile = {
        userId,
        displayName: defaultDisplayName,
        avatarUrl: googleAvatar,
        bio: "กำลังวางแผนจัดการเงินอย่างมีประสิทธิภาพ 🎯",
        updatedAt: new Date(),
      };
    }
  }

  return Response.json({
    profile: {
      ...profile,
      email,
    },
    email,
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
        bio: bio || "กำลังวางแผนจัดการเงินอย่างมีประสิทธิภาพ 🎯",
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
