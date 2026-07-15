# Savings + Carry-Over Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user split a closed month's remaining balance between "carry to next month" and "savings" via a two-sided slider, and show a running total of savings in the header — replacing today's all-or-nothing carry-over button.

**Architecture:** New `savings_transactions` ledger table (mirrors the existing `transactions` table pattern) plus two new nullable columns on `months` (`savings_amount`, `savings_tx_id`). A new `POST /api/months/[ym]/carry-over` endpoint computes the split server-side and writes both the ledger row and next month's opening balance. A new `CarryOverCard` component replaces the current single carry-over button in `MonthView`, and `MonthStrip` gains a 4th header stat for the running savings total.

**Tech Stack:** Next.js 16 App Router route handlers, Drizzle ORM (`postgres-js` driver), Zod validation, Supabase Postgres + RLS, React 19 client components, Tailwind 4.

**Reference spec:** `docs/superpowers/specs/2026-07-15-savings-carryover-split-design.md`

## Global Constraints

- No test framework exists in this repo (no jest/vitest/playwright). Each task's automated check is `npm run build` (typecheck + prerender) — this matches the project's existing verification convention (see spec section 7). Manual browser verification happens in the final task.
- Money fields are Postgres `numeric(12,2)`, which Drizzle returns as `string` from the driver — always wrap reads in `Number(...)` and writes in `.toFixed(2)`, matching every existing column in `src/db/schema.ts`.
- Never trust a client-supplied `remaining`/balance figure in an API route — always recompute server-side from `months`/`transactions` rows, matching `requireUserId()` + recompute pattern already used in `src/app/api/months/[ym]/route.ts`.
- Thai user-facing strings throughout (labels, errors) — match existing tone (short, plain, no formal register).
- Comments only where they explain non-obvious WHY, matching the restrained style already in this codebase (e.g. `src/db/schema.ts`, `src/db/index.ts`).

---

### Task 1: Wording change — "ยอดยกมา" → "เงินใช้เดือนนี้ทั้งหมด"

**Files:**
- Modify: `src/components/MonthStrip.tsx:117`
- Modify: `src/components/MonthView.tsx:80`, `src/components/MonthView.tsx:135`

**Interfaces:** None — pure copy change, no signature changes.

- [ ] **Step 1: Update the header stat label**

In `src/components/MonthStrip.tsx`, change line 117:

```tsx
          <Stat label="ยอดยกมา" value={opening} />
```

to:

```tsx
          <Stat label="เงินใช้เดือนนี้ทั้งหมด" value={opening} />
```

- [ ] **Step 2: Update the opening-balance card header and summary line**

In `src/components/MonthView.tsx`, change line 80:

```tsx
          <p className="text-[13px] text-muted">ยอดยกมาต้นเดือน</p>
```

to:

```tsx
          <p className="text-[13px] text-muted">เงินใช้เดือนนี้ทั้งหมด</p>
```

And change line 135:

```tsx
          <Line label="ยอดยกมา" value={openingBalance} />
```

to:

```tsx
          <Line label="เงินใช้เดือนนี้ทั้งหมด" value={openingBalance} />
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/MonthStrip.tsx src/components/MonthView.tsx
git commit -m "copy: rename ยอดยกมา to เงินใช้เดือนนี้ทั้งหมด for readability"
```

---

### Task 2: Schema — `savings_transactions` table + `months` columns

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/rls_savings.sql`

**Interfaces:**
- Produces: `savingsTransactions` table export (columns: `id`, `userId`, `amount`, `note`, `createdAt`), `SavingsTransaction` type, and two new columns on `months`: `savingsAmount` (`numeric(12,2)`, nullable), `savingsTxId` (`integer`, nullable). Later tasks import `savingsTransactions` from `@/db/schema` and read/write `months.savingsAmount` / `months.savingsTxId`.

- [ ] **Step 1: Add the new columns and table to the schema**

In `src/db/schema.ts`, change the import list (line 1-12) from:

```ts
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
```

to:

```ts
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
} from "drizzle-orm/pg-core";
```

Then change the `months` table definition (currently lines 23-39) from:

```ts
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
```

to:

```ts
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
```

Finally, add the new table right after the `transactions` table definition, before the final type exports (currently lines 67-68):

```ts
export type Transaction = typeof transactions.$inferSelect;
export type Month = typeof months.$inferSelect;
```

replace with:

```ts
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

export type Transaction = typeof transactions.$inferSelect;
export type Month = typeof months.$inferSelect;
export type SavingsTransaction = typeof savingsTransactions.$inferSelect;
```

- [ ] **Step 2: Push the schema change to Supabase**

Run: `npm run db:push`
Expected: prompts/output ending in `[✓] Changes applied` (drizzle-kit will detect the 2 new `months` columns and the new `savings_transactions` table).

- [ ] **Step 3: Write the RLS file for the new table**

Create `drizzle/rls_savings.sql` (a separate file, not appended to `drizzle/rls.sql` — the original file's `alter table` / `create policy` statements are not re-runnable since those constraints/policies already exist in production):

```sql
-- ==========================================================================
-- รันไฟล์นี้ใน Supabase SQL Editor ครั้งเดียว หลังจาก npm run db:push
-- (แยกจาก drizzle/rls.sql เพราะไฟล์นั้นรันไปแล้ว รันซ้ำจะ error เพราะ
--  constraint/policy เดิมมีอยู่แล้ว)
-- ==========================================================================

alter table public.savings_transactions
  add constraint savings_transactions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.savings_transactions enable row level security;

create policy "own savings_transactions"
  on public.savings_transactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 4: Run the RLS file against Supabase**

Run:
```bash
set -a; source .env.development; set +a; psql "$DATABASE_URL" -f drizzle/rls_savings.sql
```
Expected output: `ALTER TABLE`, `ALTER TABLE`, `CREATE POLICY` (3 lines, no errors).

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts drizzle/rls_savings.sql
git commit -m "feat: add savings_transactions table and months.savings_amount columns"
```

---

### Task 3: Shared types + validation schema

**Files:**
- Modify: `src/lib/shared.ts:169-174`
- Modify: `src/lib/api.ts:15-19`

**Interfaces:**
- Consumes: nothing new.
- Produces: `MonthData.savingsAmount: number | null` (used by `MonthView.tsx`, `page.tsx`, and the `GET /api/months/[ym]` response in Task 5). `carryOverPatch` Zod schema exporting `{ savingsAmount: number }` (used by the `POST /api/months/[ym]/carry-over` route in Task 6).

- [ ] **Step 1: Extend `MonthData`**

In `src/lib/shared.ts`, change (lines 169-174):

```ts
export type MonthData = {
  ym: string;
  openingBalance: number;
  closedAt: string | null;
  transactions: Tx[];
};
```

to:

```ts
export type MonthData = {
  ym: string;
  openingBalance: number;
  closedAt: string | null;
  savingsAmount: number | null;
  transactions: Tx[];
};
```

- [ ] **Step 2: Add the carry-over validation schema**

In `src/lib/api.ts`, change (lines 15-19):

```ts
export const monthPatch = z.object({
  openingBalance: z.coerce.number().min(0).max(99_999_999).optional(),
  note: z.string().max(300).optional(),
  closed: z.boolean().optional(),
});
```

to:

```ts
export const monthPatch = z.object({
  openingBalance: z.coerce.number().min(0).max(99_999_999).optional(),
  note: z.string().max(300).optional(),
  closed: z.boolean().optional(),
});

export const carryOverPatch = z.object({
  savingsAmount: z.coerce.number().min(0).max(99_999_999),
});
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: fails with a TypeScript error in `src/app/api/months/[ym]/route.ts` (missing `savingsAmount` in the returned `MonthData` object literal) — this is expected and confirms the type change took effect; it's fixed in Task 5.

- [ ] **Step 4: Commit**

```bash
git add src/lib/shared.ts src/lib/api.ts
git commit -m "feat: add savingsAmount to MonthData and carryOverPatch schema"
```

---

### Task 4: `GET /api/savings` endpoint

**Files:**
- Create: `src/app/api/savings/route.ts`

**Interfaces:**
- Consumes: `requireUserId()`, `unauthorized()` from `@/lib/api`; `db` from `@/db`; `savingsTransactions` from `@/db/schema`.
- Produces: `GET /api/savings` → `{ total: number }`. Consumed by `page.tsx` in Task 10.

- [ ] **Step 1: Write the route**

Create `src/app/api/savings/route.ts`:

```ts
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, and the route table in the build output lists `ƒ /api/savings`.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, log in at `http://localhost:3000/login`, then in the same browser open `http://localhost:3000/api/savings`.
Expected: JSON body `{"total":0}` (no savings recorded yet).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/savings/route.ts
git commit -m "feat: add GET /api/savings endpoint"
```

---

### Task 5: Extend `GET /api/months/[ym]` to return `savingsAmount`

**Files:**
- Modify: `src/app/api/months/[ym]/route.ts:44-57`

**Interfaces:**
- Consumes: `months.savingsAmount` column from Task 2.
- Produces: `MonthData.savingsAmount` now populated in the GET response — resolves the build error introduced in Task 3, consumed by `MonthView.tsx` (Task 8) and `page.tsx` (Task 10).

- [ ] **Step 1: Add the field to the response body**

In `src/app/api/months/[ym]/route.ts`, change (lines 44-57):

```ts
  const body: MonthData = {
    ym,
    openingBalance: Number(monthRow?.openingBalance ?? 0),
    closedAt: monthRow?.closedAt?.toISOString() ?? null,
    transactions: rows.map((r) => ({
      id: r.id,
      date: r.date,
      spentAt: r.spentAt.toISOString(),
      type: r.type,
      amount: Number(r.amount),
      category: r.category as Category,
      note: r.note,
    })),
  };
```

to:

```ts
  const body: MonthData = {
    ym,
    openingBalance: Number(monthRow?.openingBalance ?? 0),
    closedAt: monthRow?.closedAt?.toISOString() ?? null,
    savingsAmount:
      monthRow?.savingsAmount != null ? Number(monthRow.savingsAmount) : null,
    transactions: rows.map((r) => ({
      id: r.id,
      date: r.date,
      spentAt: r.spentAt.toISOString(),
      type: r.type,
      amount: Number(r.amount),
      category: r.category as Category,
      note: r.note,
    })),
  };
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully` — the error from Task 3 Step 3 is now resolved.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/months/\[ym\]/route.ts
git commit -m "feat: return savingsAmount from GET /api/months/[ym]"
```

---

### Task 6: `POST /api/months/[ym]/carry-over` endpoint

**Files:**
- Create: `src/app/api/months/[ym]/carry-over/route.ts`

**Interfaces:**
- Consumes: `requireUserId`, `badRequest`, `unauthorized`, `ymSchema`, `carryOverPatch` from `@/lib/api`; `db`, `months`, `savingsTransactions`, `transactions` from `@/db`/`@/db/schema`; `daysInMonth`, `shiftMonth` from `@/lib/shared`.
- Produces: `POST /api/months/{ym}/carry-over` with body `{ savingsAmount: number }` → `{ savingsAmount: number, carryOverAmount: number, nextYm: string }` on success, or `{ error: string }` with status 400 on validation failure. Consumed by `page.tsx`'s `confirmCarryOver` in Task 10.

- [ ] **Step 1: Write the route**

Create `src/app/api/months/[ym]/carry-over/route.ts`:

```ts
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { months, savingsTransactions, transactions } from "@/db/schema";
import {
  badRequest,
  carryOverPatch,
  requireUserId,
  unauthorized,
  ymSchema,
} from "@/lib/api";
import { daysInMonth, shiftMonth } from "@/lib/shared";

type Ctx = { params: Promise<{ ym: string }> };

/**
 * แบ่งยอดคงเหลือตอนปิดเดือน: savingsAmount ส่วนหนึ่งเข้าเงินเก็บ
 * ที่เหลือ (remaining - savingsAmount) ยกไปเป็นยอดตั้งต้นเดือนถัดไป
 * เรียกซ้ำได้ (แก้ไขทีหลัง) — จะ update แถว ledger เดิมแทนสร้างใหม่ซ้ำ
 */
export async function POST(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const ymParsed = ymSchema.safeParse((await params).ym);
  if (!ymParsed.success) return badRequest(ymParsed.error.issues[0].message);
  const ym = ymParsed.data;

  const bodyParsed = carryOverPatch.safeParse(await req.json());
  if (!bodyParsed.success) {
    return badRequest(bodyParsed.error.issues[0].message);
  }
  const { savingsAmount } = bodyParsed.data;

  const month = await db.query.months.findFirst({
    where: and(eq(months.userId, userId), eq(months.ym, ym)),
  });
  if (!month || !month.closedAt) {
    return badRequest("ต้องปิดยอดเดือนนี้ก่อนถึงจะแบ่งเงินได้");
  }

  const from = `${ym}-01`;
  const to = `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    );

  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "income") income += Number(r.amount);
    else expense += Number(r.amount);
  }
  const remaining = Number(month.openingBalance) + income - expense;

  if (remaining <= 0) return badRequest("ไม่มีเงินเหลือให้แบ่ง");
  if (savingsAmount < 0 || savingsAmount > remaining) {
    return badRequest("จำนวนเงินเก็บต้องอยู่ระหว่าง 0 ถึงยอดคงเหลือ");
  }

  const carryOverAmount = remaining - savingsAmount;

  if (savingsAmount === 0) {
    if (month.savingsTxId) {
      await db
        .delete(savingsTransactions)
        .where(eq(savingsTransactions.id, month.savingsTxId));
    }
    await db
      .update(months)
      .set({ savingsAmount: "0", savingsTxId: null })
      .where(eq(months.id, month.id));
  } else if (month.savingsTxId) {
    await db
      .update(savingsTransactions)
      .set({ amount: savingsAmount.toFixed(2) })
      .where(eq(savingsTransactions.id, month.savingsTxId));
    await db
      .update(months)
      .set({ savingsAmount: savingsAmount.toFixed(2) })
      .where(eq(months.id, month.id));
  } else {
    const [tx] = await db
      .insert(savingsTransactions)
      .values({
        userId,
        amount: savingsAmount.toFixed(2),
        note: `ปิดยอด ${ym}`,
      })
      .returning();
    await db
      .update(months)
      .set({ savingsAmount: savingsAmount.toFixed(2), savingsTxId: tx.id })
      .where(eq(months.id, month.id));
  }

  const nextYm = shiftMonth(ym, 1);
  await db
    .insert(months)
    .values({
      userId,
      ym: nextYm,
      openingBalance: carryOverAmount.toFixed(2),
    })
    .onConflictDoUpdate({
      target: [months.userId, months.ym],
      set: { openingBalance: carryOverAmount.toFixed(2) },
    });

  return Response.json({ savingsAmount, carryOverAmount, nextYm });
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, and the route table lists `ƒ /api/months/[ym]/carry-over`.

- [ ] **Step 3: Manual smoke check for the guard clause**

Run: `npm run dev`, log in, pick a month that is NOT closed yet, then from the browser devtools console run:
```js
fetch(`/api/months/${new Date().toISOString().slice(0,7)}/carry-over`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ savingsAmount: 0 }),
}).then((r) => r.json()).then(console.log)
```
Expected: `{ error: "ต้องปิดยอดเดือนนี้ก่อนถึงจะแบ่งเงินได้" }` (since that month isn't closed). Full happy-path verification happens in Task 11 once the UI is wired up.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/months/\[ym\]/carry-over/route.ts
git commit -m "feat: add POST /api/months/[ym]/carry-over endpoint"
```

---

### Task 7: `CarryOverCard` component

**Files:**
- Create: `src/components/CarryOverCard.tsx`

**Interfaces:**
- Consumes: `formatBaht`, `formatMonthTH` from `@/lib/shared`; `ArrowRight`, `PiggyBank`, `Pencil` icons from `lucide-react`.
- Produces: `export default function CarryOverCard(props: { remaining: number; nextYm: string; savingsAmount: number | null; onConfirm: (savingsAmount: number) => Promise<void> })`. Consumed by `MonthView.tsx` in Task 8.

- [ ] **Step 1: Write the component**

Create `src/components/CarryOverCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ArrowRight, Pencil, PiggyBank } from "lucide-react";
import { formatBaht, formatMonthTH } from "@/lib/shared";

type Props = {
  remaining: number;
  nextYm: string;
  savingsAmount: number | null;
  onConfirm: (savingsAmount: number) => Promise<void>;
};

export default function CarryOverCard({
  remaining,
  nextYm,
  savingsAmount,
  onConfirm,
}: Props) {
  const [editing, setEditing] = useState(savingsAmount === null);
  const [draft, setDraft] = useState(savingsAmount ?? 0);
  const [busy, setBusy] = useState(false);

  if (remaining <= 0) {
    return (
      <p className="border-t border-border px-4 py-3 text-center text-[13px] text-muted">
        ติดลบ {formatBaht(remaining)} ฿ — ไม่มีเงินเหลือให้แบ่ง
      </p>
    );
  }

  if (!editing && savingsAmount !== null) {
    const carryOverAmount = remaining - savingsAmount;
    return (
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
        <p className="text-muted">
          ยกยอด{" "}
          <span className="font-semibold text-income">
            {formatBaht(carryOverAmount)} ฿
          </span>{" "}
          ไปเดือน{formatMonthTH(nextYm, true)} · เก็บ{" "}
          <span className="font-semibold text-accent">
            {formatBaht(savingsAmount)} ฿
          </span>
        </p>
        <button
          onClick={() => {
            setDraft(savingsAmount);
            setEditing(true);
          }}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-accent hover:bg-accent/10"
        >
          <Pencil size={12} /> แก้ไข
        </button>
      </div>
    );
  }

  function setSavings(v: number) {
    setDraft(Math.min(Math.max(v, 0), remaining));
  }

  const carryOverDraft = remaining - draft;

  return (
    <div className="space-y-3 border-t border-border p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-accent">
          <PiggyBank size={15} /> เงินเก็บ
        </span>
        <span className="flex items-center gap-1.5 text-income">
          ใช้เดือนหน้า <ArrowRight size={14} />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={remaining}
        step={1}
        value={draft}
        onChange={(e) => setSavings(Number(e.target.value))}
        className="w-full accent-accent"
      />

      <div className="flex items-center gap-2">
        <AmountInput value={draft} onChange={setSavings} />
        <span className="text-muted">/</span>
        <AmountInput
          value={carryOverDraft}
          onChange={(v) => setSavings(remaining - v)}
        />
      </div>

      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onConfirm(draft);
          setBusy(false);
          setEditing(false);
        }}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
      >
        {busy ? "กำลังบันทึก…" : "ยืนยันการแบ่ง"}
      </button>
    </div>
  );
}

function AmountInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      inputMode="decimal"
      value={String(value)}
      onChange={(e) => {
        const n = Number(e.target.value.replace(/[^\d.]/g, ""));
        if (Number.isFinite(n)) onChange(n);
      }}
      className="tnum min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-right text-sm outline-none focus:border-accent"
    />
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully` (component isn't wired into any page yet, so an unused-export warning is fine — no error).

- [ ] **Step 3: Commit**

```bash
git add src/components/CarryOverCard.tsx
git commit -m "feat: add CarryOverCard component for savings/carry-over split"
```

---

### Task 8: Wire `CarryOverCard` into `MonthView`

**Files:**
- Modify: `src/components/MonthView.tsx:1-25` (imports + props), `src/components/MonthView.tsx:171-180` (render)

**Interfaces:**
- Consumes: `CarryOverCard` from Task 7 (`@/components/CarryOverCard`).
- Produces: `MonthView`'s `onCarryOver` prop signature changes from `(remaining: number) => Promise<void>` to `(savingsAmount: number) => Promise<void>` — Task 10 (`page.tsx`) must supply a matching function.

- [ ] **Step 1: Update imports and remove the now-unused `ArrowRight`/`shiftMonth` duplication**

In `src/components/MonthView.tsx`, change the import block (lines 1-17) from:

```tsx
"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Lock, LockOpen, Pencil } from "lucide-react";
import {
  CATEGORY_LABEL,
  daysInMonth,
  formatBaht,
  formatMonthTH,
  shiftMonth,
  TH_DAYS,
  todayKey,
  totals,
  type Category,
  type MonthData,
} from "@/lib/shared";
```

to:

```tsx
"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Lock, LockOpen, Pencil } from "lucide-react";
import CarryOverCard from "@/components/CarryOverCard";
import {
  CATEGORY_LABEL,
  daysInMonth,
  formatBaht,
  formatMonthTH,
  shiftMonth,
  TH_DAYS,
  todayKey,
  totals,
  type Category,
  type MonthData,
} from "@/lib/shared";
```

(`ArrowRight` is no longer used directly in this file — it now lives inside `CarryOverCard`. `shiftMonth` is still used to compute `nextYm`.)

- [ ] **Step 2: Update the `Props` type**

Change (lines 19-25):

```tsx
type Props = {
  month: MonthData;
  onOpeningChange: (v: number) => Promise<void>;
  onToggleClose: (closed: boolean) => Promise<void>;
  onCarryOver: (remaining: number) => Promise<void>;
  onPickDay: (date: string) => void;
};
```

to:

```tsx
type Props = {
  month: MonthData;
  onOpeningChange: (v: number) => Promise<void>;
  onToggleClose: (closed: boolean) => Promise<void>;
  onCarryOver: (savingsAmount: number) => Promise<void>;
  onPickDay: (date: string) => void;
};
```

- [ ] **Step 3: Destructure `savingsAmount` from `month`**

Change (line 34):

```tsx
  const { ym, openingBalance, closedAt, transactions } = month;
```

to:

```tsx
  const { ym, openingBalance, closedAt, savingsAmount, transactions } = month;
```

- [ ] **Step 4: Replace the carry-over button with `CarryOverCard`**

Change (lines 171-180):

```tsx
        {closed && (
          <button
            onClick={() => void onCarryOver(remaining)}
            className="flex w-full items-center justify-center gap-2 border-t border-border py-3 text-sm font-semibold text-income transition hover:bg-income-soft"
          >
            ยกยอด {formatBaht(remaining)} ฿ ไปเป็นยอดตั้งต้นของ{" "}
            {formatMonthTH(shiftMonth(ym, 1), true)}
            <ArrowRight size={15} />
          </button>
        )}
```

to:

```tsx
        {closed && (
          <CarryOverCard
            remaining={remaining}
            nextYm={shiftMonth(ym, 1)}
            savingsAmount={savingsAmount}
            onConfirm={onCarryOver}
          />
        )}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. `page.tsx` still passes its old `carryOver` function (Task 10 hasn't renamed it yet), but its signature `(remaining: number) => Promise<void>` is structurally identical to the new `onCarryOver: (savingsAmount: number) => Promise<void>` prop type (TypeScript only checks parameter/return types, not names) — so this compiles even before Task 10 rewires it.

- [ ] **Step 6: Commit**

```bash
git add src/components/MonthView.tsx
git commit -m "feat: replace carry-over button with CarryOverCard in MonthView"
```

---

### Task 9: `MonthStrip` — 4th header stat for total savings

**Files:**
- Modify: `src/components/MonthStrip.tsx:8-30` (props), `src/components/MonthStrip.tsx:116-120` (render)

**Interfaces:**
- Consumes: nothing new (plain `number` prop).
- Produces: `MonthStrip` gains a required `savings: number` prop — Task 10 (`page.tsx`) must pass it.

- [ ] **Step 1: Add the `savings` prop**

Change (lines 8-15):

```tsx
type Props = {
  ym: string;
  onChange: (ym: string) => void;
  opening: number;
  income: number;
  expense: number;
  closed: boolean;
};
```

to:

```tsx
type Props = {
  ym: string;
  onChange: (ym: string) => void;
  opening: number;
  income: number;
  expense: number;
  savings: number;
  closed: boolean;
};
```

Change the destructured params (lines 23-30):

```tsx
export default function MonthStrip({
  ym,
  onChange,
  opening,
  income,
  expense,
  closed,
}: Props) {
```

to:

```tsx
export default function MonthStrip({
  ym,
  onChange,
  opening,
  income,
  expense,
  savings,
  closed,
}: Props) {
```

- [ ] **Step 2: Add the 4th stat tile**

Change (lines 116-120):

```tsx
        <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Stat label="เงินใช้เดือนนี้ทั้งหมด" value={opening} />
          <Stat label="ใช้ไป" value={expense} tone="expense" />
          <Stat label="คงเหลือ" value={remaining} strong />
        </dl>
```

to:

```tsx
        <dl className="mt-2 grid grid-cols-4 gap-2 text-center">
          <Stat label="เงินใช้เดือนนี้ทั้งหมด" value={opening} />
          <Stat label="ใช้ไป" value={expense} tone="expense" />
          <Stat label="คงเหลือ" value={remaining} strong />
          <Stat label="เงินเก็บ" value={savings} />
        </dl>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: fails in `src/app/page.tsx` — `<MonthStrip>` is missing the now-required `savings` prop. This is expected and fixed in Task 10.

- [ ] **Step 4: Commit**

```bash
git add src/components/MonthStrip.tsx
git commit -m "feat: add 4th header stat for total savings in MonthStrip"
```

---

### Task 10: Wire everything together in `page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `GET /api/savings` (Task 4), `POST /api/months/[ym]/carry-over` (Task 6), `MonthStrip`'s new `savings` prop (Task 9), `MonthView`'s `onCarryOver: (savingsAmount: number) => Promise<void>` (Task 8).
- Produces: nothing consumed by later tasks — this is the final wiring task.

- [ ] **Step 1: Add `totalSavings` state and fetch it on mount**

In `src/app/page.tsx`, change (lines 27-28):

```tsx
  const [month, setMonth] = useState<MonthData | null>(null);
  const [error, setError] = useState<string | null>(null);
```

to:

```tsx
  const [month, setMonth] = useState<MonthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalSavings, setTotalSavings] = useState(0);
```

Then add a savings-loading function and effect right after the existing `load` effect (after line 52, which is `}, [ym, load]);`):

```tsx
  const loadSavings = useCallback(async () => {
    const res = await fetch("/api/savings", { cache: "no-store" });
    if (res.ok) setTotalSavings((await res.json()).total);
  }, []);

  useEffect(() => {
    void loadSavings();
  }, [loadSavings]);
```

- [ ] **Step 2: Replace `carryOver` with `confirmCarryOver`**

Change the existing `carryOver` function (lines 117-131):

```tsx
  /** ปิดยอดแล้วยกยอดคงเหลือไปตั้งเป็นเงินตั้งต้นของเดือนถัดไป */
  async function carryOver(remaining: number) {
    const nextYm = shiftMonth(ym, 1);
    const res = await fetch(`/api/months/${nextYm}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingBalance: Math.max(0, remaining) }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "ยกยอดไม่สำเร็จ");
      return;
    }
    // ถ้าเดือนถัดไปเปิดให้ดูได้แล้ว (ไม่ใช่เดือนอนาคต) พาไปดูเลย
    if (nextYm <= thisMonthKey()) pickMonth(nextYm);
  }
```

to:

```tsx
  /** ปิดยอดแล้วแบ่งยอดคงเหลือ: ส่วนหนึ่งเข้าเงินเก็บ ที่เหลือยกไปเป็นยอดตั้งต้นเดือนถัดไป */
  async function confirmCarryOver(savingsAmount: number) {
    const res = await fetch(`/api/months/${ym}/carry-over`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savingsAmount }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "แบ่งเงินไม่สำเร็จ");
      return;
    }
    const { nextYm }: { nextYm: string } = await res.json();
    setMonth((m) => (m ? { ...m, savingsAmount } : m));
    void loadSavings();
    // ถ้าเดือนถัดไปเปิดให้ดูได้แล้ว (ไม่ใช่เดือนอนาคต) พาไปดูเลย
    if (nextYm <= thisMonthKey()) pickMonth(nextYm);
  }
```

- [ ] **Step 3: Pass the new props down**

Change (around line 137-144, the `<MonthStrip>` call):

```tsx
      <MonthStrip
        ym={ym}
        onChange={pickMonth}
        opening={month?.openingBalance ?? 0}
        income={monthTotals.income}
        expense={monthTotals.expense}
        closed={locked === true}
      />
```

to:

```tsx
      <MonthStrip
        ym={ym}
        onChange={pickMonth}
        opening={month?.openingBalance ?? 0}
        income={monthTotals.income}
        expense={monthTotals.expense}
        savings={totalSavings}
        closed={locked === true}
      />
```

Then change the `<MonthView>` call's `onCarryOver` prop (in the `view === "month"` branch, around line 171-180):

```tsx
            <MonthView
              month={month}
              onOpeningChange={(v) => patchMonth({ openingBalance: v })}
              onToggleClose={(closed) => patchMonth({ closed })}
              onCarryOver={carryOver}
              onPickDay={(d) => {
                setDate(d);
                setView("day");
              }}
            />
```

to:

```tsx
            <MonthView
              month={month}
              onOpeningChange={(v) => patchMonth({ openingBalance: v })}
              onToggleClose={(closed) => patchMonth({ closed })}
              onCarryOver={confirmCarryOver}
              onPickDay={(d) => {
                setDate(d);
                setView("day");
              }}
            />
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully` with no TypeScript errors — this resolves the two expected failures from Tasks 8 and 9.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire savings total and carry-over split into page.tsx"
```

---

### Task 11: Full manual verification

**Files:** None (verification only).

**Interfaces:** None.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the wording change**

Open `http://localhost:3000`, log in. On the header and on the "สรุปเดือน" tab, confirm the label reads "เงินใช้เดือนนี้ทั้งหมด" everywhere it used to say "ยอดยกมา".

- [ ] **Step 3: Verify the header shows 4 stats**

Confirm the header now shows 4 tiles: เงินใช้เดือนนี้ทั้งหมด / ใช้ไป / คงเหลือ / เงินเก็บ, and เงินเก็บ starts at ฿0.00.

- [ ] **Step 4: Close a month and split the remaining balance**

Go to "สรุปเดือน" tab, set an opening balance (e.g. 1000) if not already set, add a couple of expense transactions in "รายวัน" tab so `remaining` is a known positive number, then go back to "สรุปเดือน" and click "ปิดยอดสิ้นเดือน {month}". Confirm the `CarryOverCard` slider now appears with the range `[0, remaining]`.

- [ ] **Step 5: Drag the slider and confirm**

Drag the slider to roughly the midpoint, verify both number inputs update and stay in sync (dragging updates both fields; typing in either field moves the slider). Click "ยืนยันการแบ่ง". Confirm the card switches to the read-only summary line ("ยกยอด ฿X ไปเดือน... · เก็บ ฿Y").

- [ ] **Step 6: Verify the header total updated**

Confirm the "เงินเก็บ" header stat now shows the amount just confirmed (Y from Step 5).

- [ ] **Step 7: Verify next month's opening balance**

Switch to next month (via the month strip). Confirm its "เงินใช้เดือนนี้ทั้งหมด" equals `remaining - Y` from Step 5 (the carry-over amount).

- [ ] **Step 8: Verify editing the split**

Switch back to the month you just closed, click "แก้ไข" on the `CarryOverCard` summary, drag the slider to a different split, confirm again. Verify: (a) the header's "เงินเก็บ" total changed by the *difference*, not doubled (proves the ledger row was updated, not duplicated), and (b) next month's opening balance updated to match the new split.

- [ ] **Step 9: Verify `npm run build` one final time**

Run: `npm run build`
Expected: `✓ Compiled successfully`, no TypeScript errors, all routes listed including `/api/savings` and `/api/months/[ym]/carry-over`.

- [ ] **Step 10: Final commit (if any fixups were needed during verification)**

```bash
git status
```
If clean, no commit needed — all work was already committed per-task. If any fixups were made during manual verification, commit them:
```bash
git add -A
git commit -m "fix: address issues found during manual verification"
```
