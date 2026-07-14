import { db } from "@/db";
import { transactions } from "@/db/schema";
import { badRequest, requireUserId, txInput, unauthorized } from "@/lib/api";

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = txInput.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { date, type, amount, category, note } = parsed.data;

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      date,
      // spentAt = ตอนนี้ (เก็บเป็น timestamptz คือจุดเวลาสัมบูรณ์ ตอนแสดงค่อยแปลงเป็นเวลาไทย)
      spentAt: new Date(),
      type,
      amount: amount.toFixed(2),
      category,
      note: note.trim(),
    })
    .returning();

  return Response.json(
    {
      id: row.id,
      date: row.date,
      spentAt: row.spentAt.toISOString(),
      type: row.type,
      amount: Number(row.amount),
      category: row.category,
      note: row.note,
    },
    { status: 201 },
  );
}
