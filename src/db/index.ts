import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = ReturnType<typeof create>;

const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof postgres> | undefined;
  db: DB | undefined;
};

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL ยังไม่ได้ตั้ง — เอา connection string ของ Supabase (Transaction pooler) มาใส่ .env.development",
    );
  }
  // prepare: false จำเป็นสำหรับ Supabase transaction pooler (pgbouncer ไม่รองรับ prepared statement)
  // max: 2 เพื่อไม่ให้เกินโควต้า pool_size: 15 ของ Supabase session pooler เมื่อรัน dev server หลายแอป
  const client =
    globalForDb.conn ?? postgres(url, { prepare: false, max: 2, idle_timeout: 20 });
  if (process.env.NODE_ENV !== "production") globalForDb.conn = client;
  return drizzle(client, { schema });
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    globalForDb.db ??= create();
    return Reflect.get(globalForDb.db, prop, globalForDb.db);
  },
});

export { schema };
