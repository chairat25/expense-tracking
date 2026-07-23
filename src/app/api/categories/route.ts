import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { appCategories } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const rows = await db
    .select()
    .from(appCategories)
    .where(eq(appCategories.isActive, true))
    .orderBy(asc(appCategories.sortOrder), asc(appCategories.id));

  return Response.json({ categories: rows });
}
