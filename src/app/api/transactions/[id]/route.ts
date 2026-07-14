import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { badRequest, requireUserId, txPatch, unauthorized } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function idOf(params: Ctx["params"]) {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const id = await idOf(params);
  if (!id) return badRequest("id ไม่ถูกต้อง");

  const parsed = txPatch.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { amount, note, ...rest } = parsed.data;

  // เงื่อนไข userId ในนี้คือตัวกันไม่ให้แก้ของคนอื่น ต่อให้เดา id ถูกก็ไม่โดน
  const [row] = await db
    .update(transactions)
    .set({
      ...rest,
      ...(amount !== undefined && { amount: amount.toFixed(2) }),
      ...(note !== undefined && { note: note.trim() }),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();

  if (!row) return Response.json({ error: "ไม่พบรายการนี้" }, { status: 404 });

  return Response.json({
    id: row.id,
    date: row.date,
    spentAt: row.spentAt.toISOString(),
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    note: row.note,
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const id = await idOf(params);
  if (!id) return badRequest("id ไม่ถูกต้อง");

  const [row] = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });

  if (!row) return Response.json({ error: "ไม่พบรายการนี้" }, { status: 404 });
  return new Response(null, { status: 204 });
}
