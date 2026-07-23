import { asc } from "drizzle-orm";
import { db } from "@/db";
import { appMenus } from "@/db/schema";
import { badRequest, requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const rows = await db
    .select()
    .from(appMenus)
    .orderBy(asc(appMenus.sortOrder), asc(appMenus.id));

  return Response.json({ menus: rows });
}
