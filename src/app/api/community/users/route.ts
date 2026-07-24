import { sql, ne } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    // 1. Fetch all registered users from Supabase Auth (auth.users table)
    let authUsersResult: any[] = [];
    try {
      const res = await db.execute(
        sql`SELECT id, email, raw_user_meta_data FROM auth.users WHERE id::text != ${userId}`
      );
      authUsersResult = Array.isArray(res) ? res : (res as any).rows || [];
    } catch (authErr) {
      console.warn("Could not query auth.users directly", authErr);
    }

    // 2. Fetch custom user profiles from public.user_profiles
    const customProfiles = await db
      .select()
      .from(userProfiles)
      .where(ne(userProfiles.userId, userId));

    const profileMap = new Map(customProfiles.map((p) => [p.userId, p]));

    // 3. Combine: If user exists in auth.users, use custom profile or build from metadata
    const userMap = new Map<string, any>();

    // Process custom profiles first
    for (const p of customProfiles) {
      userMap.set(p.userId, {
        userId: p.userId,
        displayName: p.displayName || "สมาชิกระบบ",
        avatarUrl: p.avatarUrl || "",
        bio: p.bio || "สมาชิกสังคมการเงิน 🎯",
        isOnline: true,
      });
    }

    // Process auth users to include any newly registered user who hasn't opened profile page yet
    for (const au of authUsersResult) {
      const auId = String(au.id);
      if (auId === userId) continue;

      const existing = userMap.get(auId);
      const meta = (au.raw_user_meta_data as any) || {};
      const email = String(au.email || "");
      const fallbackName = meta.full_name || meta.name || (email ? email.split("@")[0] : "สมาชิก ExpenseTracker");
      const fallbackAvatar = meta.avatar_url || meta.picture || "";

      if (!existing) {
        userMap.set(auId, {
          userId: auId,
          displayName: fallbackName,
          avatarUrl: fallbackAvatar,
          bio: "สมาชิกสังคมการเงิน 🎯",
          isOnline: true,
        });
      } else {
        // Enhance existing profile if name or avatar was blank
        if (!existing.displayName || existing.displayName === "ผู้ใช้งาน Expense Tracker") {
          existing.displayName = fallbackName;
        }
        if (!existing.avatarUrl && fallbackAvatar) {
          existing.avatarUrl = fallbackAvatar;
        }
      }
    }

    const users = Array.from(userMap.values());

    return Response.json({ users });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการดึงรายชื่อสมาชิกคอมมูนิตี้" },
      { status: 500 },
    );
  }
}
