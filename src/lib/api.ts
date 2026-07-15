import { z } from "zod";
import { getUser } from "./supabase/server";
import { CATEGORIES } from "./shared";

export const txInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ต้องเป็น YYYY-MM-DD"),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0").max(99_999_999),
  category: z.enum(CATEGORIES).default("other"),
  note: z.string().max(300).default(""),
});

export const txPatch = txInput.partial();

export const monthPatch = z.object({
  openingBalance: z.coerce.number().min(0).max(99_999_999).optional(),
  note: z.string().max(300).optional(),
  closed: z.boolean().optional(),
});

export const carryOverPatch = z.object({
  savingsAmount: z.coerce.number().min(0).max(99_999_999),
});

export const ymSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "เดือนต้องเป็น YYYY-MM");

export function badRequest(message: unknown) {
  return Response.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
}

/**
 * id ของ user เจ้าของ request — มาจาก session cookie ที่ Supabase ยืนยันแล้วเท่านั้น
 * ไม่เคยรับ user id จาก body/query ของ client เพราะปลอมได้
 */
export async function requireUserId(): Promise<string | null> {
  const user = await getUser();
  return user?.id ?? null;
}
