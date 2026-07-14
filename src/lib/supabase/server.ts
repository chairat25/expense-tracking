import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase client ฝั่ง server — อ่าน session จาก cookie */
export async function createClient() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) {
              store.set(name, value, options);
            }
          } catch {
            // เรียกจาก Server Component จะ set cookie ไม่ได้ — ไม่เป็นไร proxy.ts รีเฟรช session ให้อยู่แล้ว
          }
        },
      },
    },
  );
}

/**
 * คืน user ที่ผ่านการยืนยันแล้ว หรือ null
 * ใช้ getUser() ไม่ใช่ getSession() — getUser() ยิงไปเช็ค JWT กับ Supabase จริง
 * ส่วน getSession() แค่อ่าน cookie ดิบๆ ซึ่งปลอมได้ ห้ามเอามาตัดสินสิทธิ์
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
