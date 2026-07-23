import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { memoTopics } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const rows = await db
    .select()
    .from(memoTopics)
    .where(eq(memoTopics.userId, userId))
    .orderBy(asc(memoTopics.sortOrder), asc(memoTopics.id));

  return Response.json({ topics: rows });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { title, icon, color } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "กรุณาระบุชื่อเรื่อง" }, { status: 400 });
  }

  const [created] = await db
    .insert(memoTopics)
    .values({
      userId,
      title: title.trim(),
      icon: icon || "📌",
      color: color || "#3b82f6",
    })
    .returning();

  return Response.json(created);
}
