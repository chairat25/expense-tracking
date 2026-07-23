import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appCategories } from "@/db/schema";
import { badRequest, categoryPatch, requireUserId, unauthorized } from "@/lib/api";

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
  const parsed = categoryPatch.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.icon !== undefined) updates.icon = parsed.data.icon;
  if (parsed.data.parentId !== undefined) updates.parentId = parsed.data.parentId;
  if (parsed.data.type !== undefined) updates.type = parsed.data.type;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder !== undefined) updates.sortOrder = parsed.data.sortOrder;

  if (Object.keys(updates).length === 0) {
    return badRequest("ไม่มีข้อมูลที่ต้องการอัปเดต");
  }

  const [row] = await db
    .update(appCategories)
    .set(updates)
    .where(eq(appCategories.id, numId))
    .returning();

  return Response.json({ category: row });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return badRequest("ID ไม่ถูกต้อง");

  await db.delete(appCategories).where(eq(appCategories.id, numId));
  return Response.json({ success: true });
}
