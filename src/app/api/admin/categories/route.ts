import { asc } from "drizzle-orm";
import { db } from "@/db";
import { appCategories } from "@/db/schema";
import { badRequest, categoryInput, requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const rows = await db
    .select()
    .from(appCategories)
    .orderBy(asc(appCategories.sortOrder), asc(appCategories.id));

  return Response.json({ categories: rows });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = categoryInput.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const { name, icon, parentId, type, sortOrder } = parsed.data;
  const slug = parsed.data.slug || name.toLowerCase().trim().replace(/\s+/g, "_") + "_" + Date.now();

  const [row] = await db
    .insert(appCategories)
    .values({
      slug,
      name,
      icon,
      parentId: parentId ?? null,
      type,
      sortOrder,
    })
    .returning();

  return Response.json({ category: row });
}
