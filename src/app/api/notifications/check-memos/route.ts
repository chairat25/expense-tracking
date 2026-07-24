import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { memoEntries, memoTopics, userNotifications } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";
import { todayKey, shiftDate } from "@/lib/shared";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const today = todayKey();
    const threeDaysLater = shiftDate(today, 3);

    // 1. Fetch memo entries scheduled for today or upcoming in next 3 days
    const upcomingEntries = await db
      .select({
        id: memoEntries.id,
        date: memoEntries.date,
        title: memoEntries.title,
        note: memoEntries.note,
        cost: memoEntries.cost,
        topicTitle: memoTopics.title,
        topicIcon: memoTopics.icon,
      })
      .from(memoEntries)
      .leftJoin(memoTopics, eq(memoEntries.topicId, memoTopics.id))
      .where(
        and(
          eq(memoEntries.userId, userId),
          gte(memoEntries.date, today),
          lte(memoEntries.date, threeDaysLater),
        ),
      );

    let createdCount = 0;

    for (const entry of upcomingEntries) {
      const isToday = entry.date === today;
      const title = isToday
        ? `⏰ เตือนความจำวันนี้: ${entry.topicIcon || "📌"} ${entry.topicTitle || "รายการบันทึก"}`
        : `🗓️ เตือนความจำล่วงหน้า: ${entry.topicIcon || "📌"} ${entry.topicTitle || "รายการบันทึก"}`;

      const message = `${entry.title || entry.note || "มีนัดหมายความจำ"} (กำหนด: ${entry.date}${
        entry.cost ? ` • ยอด ${entry.cost} ฿` : ""
      })`;

      // Check if notification for this entry today already exists to prevent duplicate alerts
      const existing = await db
        .select()
        .from(userNotifications)
        .where(
          and(
            eq(userNotifications.userId, userId),
            eq(userNotifications.title, title),
            eq(userNotifications.message, message),
          ),
        );

      if (existing.length === 0) {
        await db.insert(userNotifications).values({
          userId,
          title,
          message,
          type: "memo",
          link: "/memo",
        });
        createdCount++;
      }
    }

    return Response.json({ success: true, createdCount, totalUpcoming: upcomingEntries.length });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการตรวจสอบเตือนความจำ" },
      { status: 500 },
    );
  }
}
