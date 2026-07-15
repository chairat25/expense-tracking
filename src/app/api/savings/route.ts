import { eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { savingsTransactions } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/api";

/** ยอดเงินเก็บสะสมทั้งหมดของ user (ไม่ผูกกับเดือนไหนโดยเฉพาะ) */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const [row] = await db
    .select({ total: sum(savingsTransactions.amount) })
    .from(savingsTransactions)
    .where(eq(savingsTransactions.userId, userId));

  return Response.json({ total: Number(row?.total ?? 0) });
}
