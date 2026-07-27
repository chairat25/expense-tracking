import { db } from "@/db";
import { friendships, userNotifications, userProfiles } from "@/db/schema";
import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { and, eq, or } from "drizzle-orm";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    // 1. Get all friendship rows where I am requester or receiver
    const friendshipRows = await db
      .select()
      .from(friendships)
      .where(
        or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)),
      );

    // 2. Get all user profiles
    const profiles = await db.select().from(userProfiles);

    const usersWithStatus = profiles
      .filter((p) => p.userId !== userId)
      .map((p) => {
        const relation = friendshipRows.find(
          (f) =>
            (f.requesterId === userId && f.receiverId === p.userId) ||
            (f.receiverId === userId && f.requesterId === p.userId),
        );

        let status: "none" | "pending_sent" | "pending_received" | "friends" = "none";
        if (relation) {
          if (relation.status === "accepted") {
            status = "friends";
          } else if (relation.status === "pending") {
            status = relation.requesterId === userId ? "pending_sent" : "pending_received";
          }
        }

        return {
          userId: p.userId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          bio: p.bio,
          status,
          friendshipId: relation?.id ?? null,
        };
      });

    return Response.json({ users: usersWithStatus });
  } catch (err: any) {
    return Response.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const { action, targetUserId, friendshipId } = body;

    if (action === "request") {
      if (!targetUserId || targetUserId === userId) {
        return badRequest("ผู้ใช้ไม่ถูกต้อง");
      }

      const [row] = await db
        .insert(friendships)
        .values({
          requesterId: userId,
          receiverId: targetUserId,
          status: "pending",
        })
        .onConflictDoNothing()
        .returning();

      // Create notification for target user
      const myProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId),
      });
      const senderName = myProfile?.displayName || "เพื่อนคนหนึ่ง";

      await db.insert(userNotifications).values({
        userId: targetUserId,
        title: "👋 มีคำขอเป็นเพื่อนใหม่",
        message: `${senderName} ได้ส่งคำขอเป็นเพื่อนถึงคุณ`,
        type: "chat",
      });

      return Response.json({ success: true, friendship: row });
    }

    if (action === "accept") {
      if (!targetUserId) return badRequest("ไม่พบผู้ใช้");

      await db
        .update(friendships)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(
          and(
            eq(friendships.requesterId, targetUserId),
            eq(friendships.receiverId, userId),
          ),
        );

      return Response.json({ success: true });
    }

    if (action === "reject" || action === "unfriend") {
      if (!targetUserId) return badRequest("ไม่พบผู้ใช้");

      await db
        .delete(friendships)
        .where(
          or(
            and(eq(friendships.requesterId, userId), eq(friendships.receiverId, targetUserId)),
            and(eq(friendships.requesterId, targetUserId), eq(friendships.receiverId, userId)),
          ),
        );

      return Response.json({ success: true });
    }

    return badRequest("คำสั่งไม่ถูกต้อง");
  } catch (err: any) {
    return Response.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
