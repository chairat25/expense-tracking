import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { memoEntries } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) {
    return Response.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const body = await req.json();
  const { topicId, date, title, items, mileage, cost, note } = body;

  const cleanItems = Array.isArray(items)
    ? items.map((i: unknown) => String(i).trim()).filter(Boolean)
    : undefined;

  const updateData: Record<string, unknown> = {};
  if (topicId) updateData.topicId = Number(topicId);
  if (date) updateData.date = date;
  if (title !== undefined) updateData.title = String(title).trim();
  if (cleanItems !== undefined) updateData.items = cleanItems;
  if (mileage !== undefined)
    updateData.mileage = mileage ? parseInt(String(mileage), 10) : null;
  if (cost !== undefined)
    updateData.cost =
      cost !== null && cost !== "" ? String(cost) : null;
  if (note !== undefined) updateData.note = String(note).trim();

  const [updated] = await db
    .update(memoEntries)
    .set(updateData)
    .where(and(eq(memoEntries.id, entryId), eq(memoEntries.userId, userId)))
    .returning();

  if (!updated) {
    return Response.json({ error: "ไม่พบบันทึกที่ต้องการแก้ไข" }, { status: 404 });
  }

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) {
    return Response.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(memoEntries)
    .where(and(eq(memoEntries.id, entryId), eq(memoEntries.userId, userId)))
    .returning();

  if (!deleted) {
    return Response.json({ error: "ไม่พบบันทึกที่ต้องการลบ" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
