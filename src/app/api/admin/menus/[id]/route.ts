import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appMenus } from "@/db/schema";
import { badRequest, menuPatch, requireUserId, unauthorized } from "@/lib/api";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return badRequest("ID ไม่ถูกต้อง");

  const body = await req.json();
  const parsed = menuPatch.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.label !== undefined) updates.label = parsed.data.label;
  if (parsed.data.icon !== undefined) updates.icon = parsed.data.icon;
  if (parsed.data.parentId !== undefined) updates.parentId = parsed.data.parentId;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder !== undefined) updates.sortOrder = parsed.data.sortOrder;

  if (Object.keys(updates).length === 0) {
    return badRequest("ไม่มีข้อมูลที่ต้องการอัปเดต");
  }

  const [row] = await db
    .update(appMenus)
    .set(updates)
    .where(eq(appMenus.id, numId))
    .returning();

  return Response.json({ menu: row });
}
