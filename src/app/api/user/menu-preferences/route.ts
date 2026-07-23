import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userMenuPreferences } from "@/db/schema";
import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { z } from "zod";

const preferenceInput = z.object({
  menuKey: z.string().min(1),
  isVisible: z.boolean(),
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const rows = await db
    .select()
    .from(userMenuPreferences)
    .where(eq(userMenuPreferences.userId, userId));

  return Response.json({ preferences: rows });
}

export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = preferenceInput.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const { menuKey, isVisible } = parsed.data;

  const [row] = await db
    .insert(userMenuPreferences)
    .values({
      userId,
      menuKey,
      isVisible,
    })
    .onConflictDoUpdate({
      target: [userMenuPreferences.userId, userMenuPreferences.menuKey],
      set: { isVisible },
    })
    .returning();

  return Response.json({ preference: row });
}
