import { eq, and } from "drizzle-orm";
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

    const endpoint = String(subscription.endpoint);
    const keys = subscription.keys || {};
    const p256dh = String(keys.p256dh || "");
    const auth = String(keys.auth || "");

    // Check if subscription already exists for this endpoint & user
    const [existing] = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint),
        ),
      );

    if (!existing) {
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint,
        keys: { p256dh, auth },
      });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "เกิดข้อผิดพลาดในการลงทะเบียนรับแจ้งเตือน" },
      { status: 500 },
    );
  }
}
