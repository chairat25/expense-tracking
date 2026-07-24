import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const subscription = await req.json();
    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys || {},
    });

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการลงทะเบียนรับแจ้งเตือน" },
      { status: 500 },
    );
  }
}
