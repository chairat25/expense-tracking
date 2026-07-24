import { sql, or, eq, desc, inArray, and } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, userProfiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    // 1. Fetch all messages involving the current user
    const allUserMessages = await db
      .select()
      .from(chatMessages)
      .where(
        or(
          eq(chatMessages.senderId, userId),
          eq(chatMessages.receiverId, userId),
        ),
      )
      .orderBy(desc(chatMessages.createdAt));

    // 2. Extract distinct partner IDs and their latest message
    const partnerMap = new Map<
      string,
      {
        lastMessage: string;
        lastMessageTime: string;
        unread: boolean;
      }
    >();

    for (const msg of allUserMessages) {
      const partnerId =
        msg.senderId === userId ? msg.receiverId : msg.senderId;

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString(),
          unread: msg.receiverId === userId,
        });
      }
    }

    const partnerIds = Array.from(partnerMap.keys());

    if (partnerIds.length === 0) {
      return Response.json({ conversations: [] });
    }

    // 3. Fetch profiles of partners
    const profiles = await db
      .select()
      .from(userProfiles)
      .where(inArray(userProfiles.userId, partnerIds));

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    // 4. Combine partner profiles with their latest message
    const conversations = partnerIds.map((partnerId) => {
      const prof = profileMap.get(partnerId);
      const meta = partnerMap.get(partnerId)!;

      return {
        userId: partnerId,
        displayName: prof?.displayName || "เพื่อนในคอมมูนิตี้",
        avatarUrl: prof?.avatarUrl || "",
        bio: prof?.bio || "สมาชิกระบบ Expense Tracker",
        isOnline: true,
        lastMessage: meta.lastMessage,
        lastMessageTime: meta.lastMessageTime,
        unread: meta.unread,
      };
    });

    return Response.json({ conversations });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการดึงรายการแชท" },
      { status: 500 },
    );
  }
}
