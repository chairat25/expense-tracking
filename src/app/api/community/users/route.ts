import { sql, ne, eq } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    // 1. Fetch all existing profiles
    const profiles = await db.select().from(userProfiles);

    // 2. Map of existing profiles
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    // 3. Mock community members if database has few registered users
    const mockCommunity = [
      {
        userId: "11111111-1111-1111-1111-111111111111",
        displayName: "Pond (Admin)",
        avatarUrl: "",
        bio: "นักออมเงินระดับโปร 🏆 ออมเงิน 30% จากเงินเดือนทุกเดือน",
        isOnline: true,
      },
      {
        userId: "22222222-2222-2222-2222-222222222222",
        displayName: "Matcha Latte",
        avatarUrl: "",
        bio: "สายคาเฟ่ แต่คุมงบสัปดาห์เนี๊ยบมาก ☕️🍃",
        isOnline: true,
      },
      {
        userId: "33333333-3333-3333-3333-333333333333",
        displayName: "Alex Financial",
        avatarUrl: "",
        bio: "เป้าหมายปลดหนี้บ้านภายใน 5 ปี 🏡✨",
        isOnline: false,
      },
      {
        userId: "44444444-4444-4444-4444-444444444444",
        displayName: "Sara Saver",
        avatarUrl: "",
        bio: "ชอบการทำกระปุกเงินแบ่งงบ 🛒📦",
        isOnline: true,
      },
      {
        userId: "55555555-5555-5555-5555-555555555555",
        displayName: "Ken Tech",
        avatarUrl: "",
        bio: "จัดสรรเงินเดือนลงสัปดาห์ คุมงบกินสบาย 💻💰",
        isOnline: false,
      },
    ];

    // Combine real DB profiles with mock community profiles excluding current user
    const users = [
      ...profiles
        .filter((p) => p.userId !== userId)
        .map((p) => ({
          userId: p.userId,
          displayName: p.displayName || "ผู้ใช้ระบบ",
          avatarUrl: p.avatarUrl,
          bio: p.bio || "สมาชิกสังคมการเงิน",
          isOnline: true,
        })),
      ...mockCommunity.filter((m) => m.userId !== userId && !profileMap.has(m.userId)),
    ];

    return Response.json({ users });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการดึงรายชื่อคอมมูนิตี้" },
      { status: 500 },
    );
  }
}
