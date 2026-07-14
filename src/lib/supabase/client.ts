import { createBrowserClient } from "@supabase/ssr";

/** Supabase client ฝั่ง browser — ใช้ในหน้า login/สมัคร/ออกจากระบบ */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
