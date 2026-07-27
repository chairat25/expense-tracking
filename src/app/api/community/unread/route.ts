import { db } from "@/db";
import { chatMessages, userNotifications } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";
import { and, count, eq } from "drizzle-orm";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    // 1. Try counting unread chat notifications from userNotifications
    const unreadNotis = await db
      .select({ count: count() })
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.type, "chat"),
          eq(userNotifications.isRead, false),
        ),
      );

    let unreadCount = unreadNotis[0]?.count ?? 0;

    // 2. Fallback check on chatMessages if unreadNotis is 0
    if (unreadCount === 0) {
      try {
        const unreadMsgs = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.receiverId, userId),
              eq(chatMessages.isRead, false),
            ),
          );
        unreadCount = unreadMsgs[0]?.count ?? 0;
      } catch {
        // Safe fallback if is_read column is not present in PostgreSQL table yet
      }
    }

    return Response.json({ unreadCount });
  } catch (err: any) {
    return Response.json({ unreadCount: 0 });
  }
}
