import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { appMenus, userMenuPreferences } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const [menus, userPrefs] = await Promise.all([
    db
      .select()
      .from(appMenus)
      .where(eq(appMenus.isActive, true))
      .orderBy(asc(appMenus.sortOrder), asc(appMenus.id)),
    db
      .select()
      .from(userMenuPreferences)
      .where(eq(userMenuPreferences.userId, userId)),
  ]);

  const disabledKeys = new Set(
    userPrefs.filter((p) => !p.isVisible).map((p) => p.menuKey),
  );

  const activeMenus = menus.filter((m) => !disabledKeys.has(m.key));

  return Response.json({ menus: activeMenus });
}
