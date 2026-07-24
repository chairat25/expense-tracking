import { requireUserId, unauthorized } from "@/lib/api";
import { sendWebPushNotification } from "@/lib/push";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const result = await sendWebPushNotification(userId, {
      title: "🔔 ทดสอบแจ้งเตือน ExpenseTracker",
      body: "ระบบแจ้งเตือนเด้งบนหน้าจอมือถือ/Lock Screen พร้อมใช้งานแล้ว! 🎉",
      url: "/",
    });

    return Response.json({ success: true, result });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการส่งข้อความทดสอบ" },
      { status: 500 },
    );
  }
}
