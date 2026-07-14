import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = ReturnType<typeof create>;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL ยังไม่ได้ตั้ง — เอา connection string ของ Supabase (Transaction pooler) มาใส่ .env.local",
    );
  }
  // prepare: false จำเป็นสำหรับ Supabase transaction pooler (pgbouncer ไม่รองรับ prepared statement)
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

let cached: DB | undefined;

/**
 * ต่อ DB ตอนเรียกใช้จริง ไม่ใช่ตอน import
 * (ถ้าต่อตอน import ตัว `next build` จะพังทันทีเมื่อยังไม่มี DATABASE_URL)
 */
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    cached ??= create();
    return Reflect.get(cached, prop, cached);
  },
});

export { schema };
