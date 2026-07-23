import { db } from "@/db";
import { userSettings } from "@/db/schema";
import {
  badRequest,
  requireUserId,
  settingsPatch,
  unauthorized,
} from "@/lib/api";

/** บันทึก setting ระดับผู้ใช้ — โหมดคำนวณงบ และ เงินเดือนประจำ */
export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = settingsPatch.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { budgetMode, defaultSalary } = parsed.data;

  const updateSet: Record<string, unknown> = {};
  if (budgetMode !== undefined) updateSet.budgetMode = budgetMode;
  if (defaultSalary !== undefined) updateSet.defaultSalary = String(defaultSalary);

  if (Object.keys(updateSet).length === 0) {
    return badRequest("ไม่มีข้อมูลที่ต้องการอัปเดต");
  }

  const [row] = await db
    .insert(userSettings)
    .values({
      userId,
      ...(budgetMode ? { budgetMode } : {}),
      ...(defaultSalary !== undefined ? { defaultSalary: String(defaultSalary) } : {}),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: updateSet,
    })
    .returning();

  return Response.json({
    budgetMode: row.budgetMode,
    defaultSalary: Number(row.defaultSalary ?? 0),
  });
}

