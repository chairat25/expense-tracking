import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

// Standard VAPID keys for Web Push Protocol (RFC 8292)
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLq8KJ36KWbhTMIgZ0s1jvLe_jpzR3GVm1POCu0tbmCve02bjQTj0c5LnivST5zkcvy98y87jMMwahl2pcNEhvg";

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "Qedr22LhfT67eM9fSP_FMm4C7Fl95goSMZE73xfdewg";

const VAPID_SUBJECT = "mailto:support@expensetracking.app";

let initialized = false;
function initWebPush() {
  if (initialized) return;
  try {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    initialized = true;
  } catch (err) {
    console.error("Failed to initialize VAPID details", err);
  }
}

export async function sendWebPushNotification(
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
  }
) {
  initWebPush();

  try {
    // 1. Fetch user's registered Push Subscriptions
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (!subs || subs.length === 0) {
      return { success: false, reason: "No push subscriptions found" };
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192.png",
      url: payload.url || "/",
    });

    const sendPromises = subs.map(async (subRecord) => {
      try {
        const keysObj = (subRecord.keys as { p256dh?: string; auth?: string }) || {};
        const pushSubscription = {
          endpoint: subRecord.endpoint,
          keys: {
            p256dh: keysObj.p256dh || "",
            auth: keysObj.auth || "",
          },
        };

        await webpush.sendNotification(pushSubscription, pushPayload);
      } catch (err: any) {
        // Remove expired subscriptions (410 Gone or 404 Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, subRecord.id));
          } catch {
            // ignore
          }
        }
      }
    });

    await Promise.all(sendPromises);
    return { success: true };
  } catch (err: any) {
    console.error("Error sending Web Push notification", err);
    return { success: false, error: err.message };
  }
}
