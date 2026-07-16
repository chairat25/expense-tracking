import { db } from "@/db";
import { userSettings } from "@/db/schema";
import {
  badRequest,
  requireUserId,
  settingsPatch,
  unauthorized,
} from "@/lib/api";

/** บันทึก setting ระดับผู้ใช้ — ตอนนี้มีแค่โหมดคำนวณงบ */
export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = settingsPatch.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { budgetMode } = parsed.data;

  const [row] = await db
    .insert(userSettings)
    .values({ userId, budgetMode })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { budgetMode },
    })
    .returning();

  return Response.json({ budgetMode: row.budgetMode });
}
