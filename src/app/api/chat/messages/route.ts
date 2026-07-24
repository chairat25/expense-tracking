import { sql, or, and, eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, userNotifications, userProfiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const friendId = searchParams.get("friendId");
  if (!friendId) {
    return Response.json({ error: "Missing friendId" }, { status: 400 });
  }

  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, userId),
            eq(chatMessages.receiverId, friendId),
          ),
          and(
            eq(chatMessages.senderId, friendId),
            eq(chatMessages.receiverId, userId),
          ),
        ),
      )
      .orderBy(asc(chatMessages.createdAt));

    return Response.json({ messages });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการดึงข้อความแชท" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const { receiverId, content } = await req.json();
    if (!receiverId || !content?.trim()) {
      return Response.json({ error: "กรอกข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        senderId: userId,
        receiverId,
        content: content.trim(),
      })
      .returning();

    // Fetch sender profile name for notification
    const [senderProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));

    const senderName = senderProfile?.displayName || "เพื่อนในคอมมูนิตี้";

    // Insert Chat Notification for Receiver
    try {
      await db.insert(userNotifications).values({
        userId: receiverId,
        title: `💬 ข้อความใหม่จาก ${senderName}`,
        message: content.trim().length > 40 ? content.trim().slice(0, 40) + "..." : content.trim(),
        type: "chat",
        link: "/home",
      });
    } catch (e) {
      console.error("Failed to insert chat notification", e);
    }

    return Response.json({ success: true, message: newMessage });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "ส่งข้อความไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
