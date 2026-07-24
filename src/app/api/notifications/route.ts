import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { userNotifications } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const notifications = await db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt))
      .limit(30);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return Response.json({ notifications, unreadCount });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการดึงการแจ้งเตือน" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const { notificationId, markAllRead } = await req.json();

    if (markAllRead) {
      await db
        .update(userNotifications)
        .set({ isRead: true })
        .where(eq(userNotifications.userId, userId));
    } else if (notificationId) {
      await db
        .update(userNotifications)
        .set({ isRead: true })
        .where(eq(userNotifications.id, Number(notificationId)));
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "อัปเดตการแจ้งเตือนไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
