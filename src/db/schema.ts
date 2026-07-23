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
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const txTypeEnum = pgEnum("tx_type", ["income", "expense"]);

export const budgetModeEnum = pgEnum("budget_mode", ["month", "week"]);

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
    // เดือนนี้แบ่งเข้าเงินเก็บเท่าไหร่ตอนปิดยอด — null แปลว่ายังไม่ตัดสินใจแบ่ง
    // (ต่างจาก 0 ที่แปลว่าตัดสินใจแล้วว่าไม่เก็บเลย)
    savingsAmount: numeric("savings_amount", { precision: 12, scale: 2 }),
    // อ้าง savings_transactions.id ที่ผูกกับการแบ่งของเดือนนี้ ใช้ตอนแก้ไขทีหลัง
    savingsTxId: integer("savings_tx_id"),
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

/** ทุกครั้งที่เอาเงินเข้าเงินเก็บ = 1 แถว (ledger) ยอดสะสมทั้งหมด = SUM(amount) */
export const savingsTransactions = pgTable("savings_transactions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * setting ระดับผู้ใช้ ใช้ร่วมกันทุกเดือน
 * เผื่อขยายเป็น feature flag ในอนาคตด้วยการเพิ่มคอลัมน์ (ยังไม่ทำในตอนนี้)
 * ค่า enum เขียนซ้ำกับ BUDGET_MODES ใน shared.ts โดยตั้งใจ — drizzle-kit ต้องอ่าน
 * literal ตรงๆ ตอน generate ถ้า import มาจะวิเคราะห์ไม่ออก
 */
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey(),
  budgetMode: budgetModeEnum("budget_mode").notNull().default("month"),
  defaultSalary: numeric("default_salary", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dailyBudgets = pgTable(
  "daily_budgets",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("daily_budgets_user_date_uq").on(t.userId, t.date)],
);

export const salaries = pgTable(
  "salaries",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    ym: text("ym").notNull(), // 'YYYY-MM'
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    receivedAt: date("received_at").notNull(),
    applyMode: text("apply_mode").notNull().default("opening_balance"), // 'opening_balance' | 'income_tx'
    incomeTxId: integer("income_tx_id"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("salaries_user_ym_uq").on(t.userId, t.ym)],
);

export const appCategories = pgTable("app_categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("📦"),
  parentId: integer("parent_id"),
  type: text("type").notNull().default("expense"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const appMenus = pgTable("app_menus", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  icon: text("icon").notNull().default("ListTodo"),
  parentId: integer("parent_id"),
  targetView: text("target_view").notNull().default("day"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userMenuPreferences = pgTable(
  "user_menu_preferences",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    menuKey: text("menu_key").notNull(),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("user_menu_prefs_user_key_uq").on(t.userId, t.menuKey)],
);

export const memoTopics = pgTable("memo_topics", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  icon: text("icon").notNull().default("📌"),
  color: text("color").notNull().default("#3b82f6"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const memoEntries = pgTable(
  "memo_entries",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    topicId: integer("topic_id").notNull(),
    date: date("date").notNull(),
    title: text("title").notNull().default(""),
    items: jsonb("items").$type<string[]>().notNull().default([]),
    mileage: integer("mileage"),
    cost: numeric("cost", { precision: 12, scale: 2 }),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("memo_entries_user_topic_date_idx").on(t.userId, t.topicId, t.date),
  ],
);

export const salaryPockets = pgTable(
  "salary_pockets",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    ym: text("ym").notNull(), // 'YYYY-MM'
    name: text("name").notNull(),
    icon: text("icon").notNull().default("📦"),
    color: text("color").notNull().default("#6366f1"),
    allocatedAmount: numeric("allocated_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    isWeeklyPool: boolean("is_weekly_pool").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("salary_pockets_user_ym_idx").on(t.userId, t.ym)],
);

export const weeklyEnvelopes = pgTable(
  "weekly_envelopes",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    ym: text("ym").notNull(), // 'YYYY-MM'
    weekIndex: integer("week_index").notNull(), // 1..5
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    budgetAmount: numeric("budget_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("weekly_envelopes_user_ym_week_uq").on(
      t.userId,
      t.ym,
      t.weekIndex,
    ),
  ],
);

export type Transaction = typeof transactions.$inferSelect;
export type Month = typeof months.$inferSelect;
export type SavingsTransaction = typeof savingsTransactions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type DailyBudget = typeof dailyBudgets.$inferSelect;
export type Salary = typeof salaries.$inferSelect;
export type AppCategory = typeof appCategories.$inferSelect;
export type AppMenu = typeof appMenus.$inferSelect;
export type UserMenuPreference = typeof userMenuPreferences.$inferSelect;
export type MemoTopic = typeof memoTopics.$inferSelect;
export type MemoEntry = typeof memoEntries.$inferSelect;
export type SalaryPocket = typeof salaryPockets.$inferSelect;
export type WeeklyEnvelope = typeof weeklyEnvelopes.$inferSelect;



