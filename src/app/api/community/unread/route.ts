import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";
import { and, count, eq } from "drizzle-orm";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const unread = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.receiverId, userId),
          eq(chatMessages.isRead, false),
        ),
      );

    const unreadCount = unread[0]?.count ?? 0;
    return Response.json({ unreadCount });
  } catch (err: any) {
    return Response.json({ unreadCount: 0 });
  }
}
