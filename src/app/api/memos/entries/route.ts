import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { memoEntries } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";
import { daysInMonth } from "@/lib/shared";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const topicIdParam = searchParams.get("topicId");
  const ym = searchParams.get("ym"); // YYYY-MM

  const conditions = [eq(memoEntries.userId, userId)];

  if (topicIdParam && topicIdParam !== "all") {
    const topicId = parseInt(topicIdParam, 10);
    if (!isNaN(topicId)) {
      conditions.push(eq(memoEntries.topicId, topicId));
    }
  }

  if (ym && /^\d{4}-\d{2}$/.test(ym)) {
    const fromDate = `${ym}-01`;
    const toDate = `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;
    conditions.push(gte(memoEntries.date, fromDate));
    conditions.push(lte(memoEntries.date, toDate));
  }

  const rows = await db
    .select()
    .from(memoEntries)
    .where(and(...conditions))
    .orderBy(desc(memoEntries.date), desc(memoEntries.id));

  return Response.json({ entries: rows });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { topicId, date, title, items, mileage, cost, note } = body;

  if (!topicId || !date) {
    return Response.json(
      { error: "กรุณาระบุหัวข้อเรื่องและวันที่" },
      { status: 400 },
    );
  }

  const cleanItems = Array.isArray(items)
    ? items.map((i: unknown) => String(i).trim()).filter(Boolean)
    : [];

  const [created] = await db
    .insert(memoEntries)
    .values({
      userId,
      topicId: Number(topicId),
      date,
      title: (title || "").trim(),
      items: cleanItems,
      mileage: mileage ? parseInt(String(mileage), 10) : null,
      cost: cost !== undefined && cost !== null && cost !== "" ? String(cost) : null,
      note: (note || "").trim(),
    })
    .returning();

  return Response.json(created);
}
