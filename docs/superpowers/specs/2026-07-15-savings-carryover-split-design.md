# Savings + Carry-Over Split — Design Spec

**Date:** 2026-07-15
**Status:** Approved

## 1. Background

Today, closing a month (`ปิดยอดสิ้นเดือน`) exposes a single button — `ยกยอด {remaining} ฿ ไปเป็นยอดตั้งต้นของเดือนถัดไป` — that carries 100% of the month's remaining balance into next month's `opening_balance`. There is no way to set aside part of that remaining balance as savings.

This spec adds:
1. A wording change: `ยอดยกมา` → `เงินใช้เดือนนี้ทั้งหมด` in all 3 places it appears, for readability.
2. A savings feature: at month-close, the user splits the remaining balance between "carry to next month" and "savings" using a two-sided slider (with paired numeric inputs), and a running total of savings is shown in the header.

## 2. Wording change

Replace the label `ยอดยกมา` with `เงินใช้เดือนนี้ทั้งหมด` in:
- `src/components/MonthStrip.tsx` — the header stat tile
- `src/components/MonthView.tsx` — the opening-balance edit card header (`ยอดยกมาต้นเดือน` → `เงินใช้เดือนนี้ทั้งหมด`) and the `Line` in the month-close summary card

No behavior change, copy only.

## 3. Data model

### New table: `savings_transactions`

Ledger table, same shape/pattern as `transactions` — every deposit into savings is an immutable row; total savings is `SUM(amount)`.

```ts
export const savingsTransactions = pgTable("savings_transactions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

RLS (added to `drizzle/rls.sql`, same pattern as existing tables):
- FK `user_id` → `auth.users(id) on delete cascade`
- `enable row level security`
- Policy `"own savings_transactions"` — `auth.uid() = user_id` for all operations

### `months` table — new nullable columns

```ts
savingsAmount: numeric("savings_amount", { precision: 12, scale: 2 }), // เดือนนี้แบ่งเข้าเงินเก็บเท่าไหร่ ตอนปิดยอด (null = ยังไม่ตัดสินใจแบ่ง)
savingsTxId: integer("savings_tx_id"), // อ้าง savings_transactions.id ที่ผูกกับการแบ่งของเดือนนี้ (ใช้ตอนแก้ไขทีหลัง)
```

`carryOverAmount` is **not** stored — it's derived as `remaining − savingsAmount` wherever needed (`remaining` is already computed from `openingBalance + income − expense`). Storing it would duplicate data that can drift out of sync.

## 4. API

### `POST /api/months/[ym]/carry-over`

Body: `{ savingsAmount: number }`

Server logic (one request, sequential DB ops — no cross-table transaction wrapper needed since Supabase pooler already serializes per-request and each write is idempotent on retry):

1. `requireUserId()`, `ymSchema` validate.
2. Load the month row + its transactions; compute `remaining` server-side (same formula as client: `openingBalance + income − expense`). **Never trust a client-supplied remaining.**
3. Validate: month must have `closedAt` set (400 if not closed yet). Validate `0 ≤ savingsAmount ≤ remaining` (400 otherwise). If `remaining ≤ 0`, reject — nothing to split.
4. `carryOverAmount = remaining − savingsAmount`.
5. Upsert the savings ledger entry:
   - If `savingsAmount === 0`: if `month.savingsTxId` exists, delete that row and clear `savingsTxId`.
   - Else if `month.savingsTxId` exists: `UPDATE savings_transactions SET amount = savingsAmount WHERE id = savingsTxId`.
   - Else: `INSERT INTO savings_transactions (amount, note) VALUES (savingsAmount, 'ปิดยอด {ym}')`, capture new id.
6. Update this month's row: `savingsAmount`, `savingsTxId`.
7. Upsert next month (`shiftMonth(ym, 1)`) `opening_balance = carryOverAmount`, using the same `onConflictDoUpdate` pattern already in `PUT /api/months/[ym]`.
8. Return `{ savingsAmount, carryOverAmount, nextYm }`.

Calling this endpoint again for the same month (editing the split) is safe — it updates the existing ledger row and re-writes next month's opening balance rather than creating duplicates.

### `GET /api/savings`

Returns `{ total: number }` — `SUM(amount)` from `savings_transactions` for the current user (0 if none). Independent of month; fetched once by the page and refreshed after a successful carry-over confirm.

### `GET /api/months/[ym]` (existing, extended)

Add `savingsAmount: number | null` to the returned `MonthData` (mirrors the new column; `null` = not yet split for this month).

## 5. Frontend

### Types (`src/lib/shared.ts`)
Add `savingsAmount: number | null` to `MonthData`.

### `src/components/CarryOverCard.tsx` (new)

Extracted rather than inlined into `MonthView.tsx` (which is already ~300 lines) — single responsibility: decide the carry-over/savings split for a closed month.

```ts
type Props = {
  remaining: number;
  nextYm: string; // for the "ไปเดือนหน้า" label
  savingsAmount: number | null; // already-confirmed split, or null
  onConfirm: (savingsAmount: number) => Promise<void>;
};
```

- `remaining <= 0`: render nothing but a short note ("ติดลบ ไม่มีเงินเหลือให้แบ่ง") — no slider.
- `savingsAmount === null` (not yet split): two-sided range slider, `min=0 max=remaining`. Left label "เงินเก็บ" bound to `savingsAmount` state, right label "ใช้เดือนหน้า" bound to `remaining - savingsAmount`. Both sides also render as editable number inputs — typing either one repositions the slider and recalculates the other side, kept in sync via local component state (not committed to the server until confirm). Default local state on mount: `savingsAmount = 0` (100% carries forward, matching today's default behavior). Button "ยืนยันการแบ่ง" calls `onConfirm(localSavingsAmount)`.
- `savingsAmount !== null` (already split): read-only summary line `ยกยอด ฿{carryOverAmount} ไปเดือนหน้า {formatMonthTH(nextYm, true)} · เก็บเงินเก็บ ฿{savingsAmount}` + a small "แก้ไข" button that switches back to the slider view, pre-filled with the existing split.

### `src/components/MonthView.tsx`
Replace the existing `onCarryOver` button block (lines ~171-180) with `<CarryOverCard remaining={remaining} nextYm={shiftMonth(ym, 1)} savingsAmount={month.savingsAmount} onConfirm={onConfirmCarryOver} />`, rendered only when `closed`.

### `src/components/MonthStrip.tsx`
- `grid-cols-3` → `grid-cols-4`, add a 4th `<Stat label="เงินเก็บ" value={savings} />`.
- New prop `savings: number`.

### `src/app/page.tsx`
- New state `totalSavings`, fetched via `GET /api/savings` on mount.
- Replace `carryOver(remaining)` with `confirmCarryOver(savingsAmount: number)`: POSTs to `/api/months/${ym}/carry-over`, updates local `month.savingsAmount` from the response, refetches `/api/savings` to refresh `totalSavings`. Keep the existing auto-navigate-to-next-month behavior when the next month isn't in the future.
- Pass `totalSavings` to `<MonthStrip savings={totalSavings} .../>`.

## 6. Error handling

- `POST /api/months/[ym]/carry-over` returns 400 with a Thai error message for: month not closed yet, `savingsAmount` out of range, `remaining <= 0`. Follows the existing `badRequest()` helper pattern.
- Client shows the returned error via the existing `setError` state in `page.tsx` (same pattern as other mutations).

## 7. Testing

- Manual verification via `npm run dev`: close a month with a positive remaining balance, drag the slider, confirm, verify next month's opening balance and the header's "เงินเก็บ" stat update correctly. Re-open "แก้ไข" and change the split, confirm the old ledger row is updated (not duplicated) by checking `GET /api/savings` total before/after.
- `npm run build` must pass (typecheck + prerender) before considering this done, matching how prior work in this project was verified.

## 8. Accepted limitations (not fixing now)

- If a month is unlocked and its transactions edited *after* its carry-over split was already confirmed, the stored `savingsAmount`/next month's `opening_balance` do **not** retroactively recalculate. This matches the existing pre-feature behavior (the old single-button carry-over had the same gap) — not a regression.
- Withdrawing money back out of savings is out of scope for this iteration.
