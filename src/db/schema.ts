import {
  pgTable,
  serial,
  text,
  date,
  uuid,
  numeric,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const txTypeEnum = pgEnum("tx_type", ["income", "expense"]);

/**
 * user_id = auth.users.id ของ Supabase
 * ไม่ได้ประกาศ FK ไว้ในนี้เพราะ auth.users อยู่คนละ schema ที่ drizzle-kit ไม่ควรไปแตะ
 * ตัว FK (ON DELETE CASCADE) + RLS อยู่ใน drizzle/rls.sql เอาไปรันใน Supabase SQL Editor
 */

/** ยอดตั้งต้นของแต่ละเดือน แยกจาก transactions เพื่อไม่ให้นับซ้ำตอนรวมยอดสิ้นเดือน */
export const months = pgTable(
  "months",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    ym: text("ym").notNull(), // 'YYYY-MM'
    openingBalance: numeric("opening_balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    note: text("note").notNull().default(""),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("months_user_ym_uq").on(t.userId, t.ym)],
);

/**
 * ทั้งรายรับและรายจ่ายอยู่ตารางเดียว
 * - date    = วันของรายการ ใช้รวมยอดรายวัน
 * - spentAt = เวลาจริงที่กด ใช้เรียงลำดับ + โชว์ว่ากี่โมง
 *   (ไม่ล็อกเป็นช่วงเช้า/บ่าย/เย็น — กรอกตอนไหนก็ได้ ระบบจับเวลาให้เอง)
 */
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    spentAt: timestamp("spent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    type: txTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    category: text("category").notNull().default("other"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("tx_user_date_idx").on(t.userId, t.date)],
);

export type Transaction = typeof transactions.$inferSelect;
export type Month = typeof months.$inferSelect;
