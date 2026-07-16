# Weekly Budget Mode Implementation Plan

> ## ⚠️ สถานะ ณ 2026-07-17: เขียนโค้ดครบแล้ว แต่ยังไม่ได้ verify
>
> Bash classifier ล่มระหว่างทำ ทำให้รัน `npm` / `node` / `psql` ไม่ได้เลย (git ผ่านเพราะอยู่ใน allowlist)
> โค้ดของ Task 1-7 เขียนครบและ commit แล้ว (`2a7ccbd`..`8eb86de`) แต่ **ยังไม่เคยถูก compile หรือรันเทสต์**
>
> **ต้องรันตามลำดับนี้ก่อนใช้งานได้:**
>
> ```bash
> npm i -D vitest                                   # ยังไม่ได้ติดตั้ง — package.json มี script แล้วแต่ไม่มีตัว lib
> npm test                                          # ยืนยันคณิตสัปดาห์ + สูตรงบ
> npm run db:generate -- --name add_user_settings   # ยังไม่มีไฟล์ migration
> set -a && . ./.env.development && set +a && psql "$DATABASE_URL" -f drizzle/0002_add_user_settings.sql
> set -a && . ./.env.development && set +a && psql "$DATABASE_URL" -f drizzle/rls_settings.sql
> npm run build
> npm run dev                                       # แล้วไล่เช็คตาม Task 8
> ```
>
> **จนกว่าจะรัน migration แอปจะพัง** — `GET /api/months/[ym]` query หาตาราง `user_settings` ที่ยังไม่มีใน DB
>
> จุดที่เสี่ยงผิดเพราะไม่ได้ verify:
> - วันในสัปดาห์ในเทสต์คำนวณด้วยมือ (ดู Global Constraints) — ถ้าผิด `weekStart`/`weekSliceInMonth` จะ fail
> - `z.enum(BUDGET_MODES)` กับ readonly tuple ของ zod 4
> - vitest หา `src/lib/shared.test.ts` เจอโดยไม่ต้องมี config มั้ย

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มโหมดคำนวณเงินเฉลี่ยต่อวันจากงบก้อนรายสัปดาห์ สลับกับโหมดรายเดือนเดิมได้ เพื่อไม่ให้ตัวเลขพองเมื่อประหยัด

**Architecture:** ย้ายการคำนวณงบจาก `useMemo` ใน `page.tsx` ออกมาเป็น pure function ใน `src/lib/shared.ts` แล้วทดสอบด้วย vitest เก็บโหมดที่เลือกไว้ในตาราง `user_settings` ใหม่ ส่งกลับมาพร้อม response ของ `GET /api/months/[ym]` ที่โหลดอยู่แล้ว

**Tech Stack:** Next.js 16 App Router, React 19, Drizzle ORM (postgres-js), Supabase Postgres + RLS, Zod 4, Tailwind v4, vitest (ตั้งใหม่ในงานนี้)

**Spec:** `docs/superpowers/specs/2026-07-17-weekly-budget-mode-design.md`

## Global Constraints

- **เวลาไทยทั้งหมด** — `src/lib/shared.ts` ล็อก `TZ = "Asia/Bangkok"` (Vercel รันบน UTC) ห้ามเรียก `new Date()` ดิบๆ เพื่ออ้าง "ตอนนี้" ใช้ `todayKey()` เท่านั้น
- ตัวช่วยเรื่องวันต้องเป็นการบวกลบปฏิทินล้วน ตามแพทเทิร์น `shiftDate` / `formatDayTH` เดิม (`new Date(y, m-1, d)` แล้วอ่าน `getDay()`)
- สัปดาห์เริ่ม **วันจันทร์** จบ **วันอาทิตย์** (ISO)
- **`npm run db:push` ใช้ไม่ได้ในโปรเจกต์นี้** (drizzle-kit bug ตอน introspect Supabase) ใช้ `npm run db:generate` แล้ว apply ด้วย `psql "$DATABASE_URL" -f <file>`
- `numeric` ใน DB → drizzle คืนเป็น **string** ต้อง `Number()` ตอนอ่าน และ `.toFixed(2)` ตอนเขียน **รวมถึงตอนส่งกลับใน API response ด้วย**
- ไฟล์ RLS เป็น incremental รันครั้งเดียว — ห้ามแก้ `rls.sql` / `rls_savings.sql` เดิม
- env อยู่ใน `.env.development` (ไม่ใช่ `.env.local`)
- วันในสัปดาห์ที่ใช้ในเทสต์คำนวณด้วยมือ (Doomsday rule) — **2026-07-01 = พุธ, 07-06/13/20/27 = จันทร์, 07-17 = ศุกร์, 07-31 = ศุกร์, 2026-02-01 = อาทิตย์, 2026-01-01 = พฤหัส, 2025-12-29 = จันทร์** ถ้า test แรกไม่ผ่านให้เช็คค่าพวกนี้ก่อนแก้โค้ด

---

### Task 1: ตั้ง vitest + ตัวช่วยคำนวณสัปดาห์

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Modify: `src/lib/shared.ts` (เพิ่มท้ายไฟล์ ก่อน `totals`)
- Test: `src/lib/shared.test.ts` (สร้างใหม่)

**Interfaces:**
- Consumes: `shiftDate`, `daysInMonth` ที่มีอยู่แล้วใน `shared.ts`
- Produces:
  - `weekStart(dateKey: string): string`
  - `weekEnd(dateKey: string): string`
  - `dayCount(from: string, to: string): number`
  - `weekSliceInMonth(dateKey: string, ym: string): { from: string; to: string; days: number }`
  - `datesFrom(from: string, to: string): string[]`

- [ ] **Step 1: ติดตั้ง vitest**

```bash
npm i -D vitest
```

- [ ] **Step 2: เพิ่ม scripts ใน `package.json`**

ใน `"scripts"` เพิ่มสองบรรทัดนี้ (วางต่อจาก `"lint": "eslint",`):

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

ไม่ต้องสร้าง `vitest.config.ts` — default include ของ vitest จับ `src/lib/shared.test.ts` อยู่แล้ว และเทสต์ import แบบ relative (`./shared`) จึงไม่ต้องตั้ง path alias

- [ ] **Step 3: เขียนเทสต์ที่ยังไม่ผ่าน**

สร้าง `src/lib/shared.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dayCount, datesFrom, weekEnd, weekSliceInMonth, weekStart } from "./shared";

describe("weekStart", () => {
  it("คืนตัวเองเมื่อเป็นวันจันทร์อยู่แล้ว", () => {
    expect(weekStart("2026-07-13")).toBe("2026-07-13");
  });

  it("วันอาทิตย์ถอยกลับ 6 วัน (ไม่ใช่ถอยไปอาทิตย์ถัดไป)", () => {
    expect(weekStart("2026-07-19")).toBe("2026-07-13");
  });

  it("ถอยข้ามเดือนได้", () => {
    expect(weekStart("2026-07-01")).toBe("2026-06-29");
  });

  it("ถอยข้ามปีได้", () => {
    expect(weekStart("2026-01-01")).toBe("2025-12-29");
  });
});

describe("weekEnd", () => {
  it("วันจันทร์จบที่อาทิตย์ถัดไป", () => {
    expect(weekEnd("2026-07-13")).toBe("2026-07-19");
  });

  it("เดินหน้าข้ามเดือนได้", () => {
    expect(weekEnd("2026-06-29")).toBe("2026-07-05");
  });
});

describe("dayCount", () => {
  it("วันเดียวกันนับเป็น 1", () => {
    expect(dayCount("2026-07-01", "2026-07-01")).toBe(1);
  });

  it("นับปลายทั้งสองข้าง", () => {
    expect(dayCount("2026-07-01", "2026-07-31")).toBe(31);
  });

  it("ข้ามเดือนในปีที่ไม่ใช่อธิกสุรทิน", () => {
    expect(dayCount("2026-02-28", "2026-03-01")).toBe(2);
  });

  it("ข้ามเดือนในปีอธิกสุรทิน (มี 29 ก.พ. คั่น)", () => {
    expect(dayCount("2024-02-28", "2024-03-01")).toBe(3);
  });
});

describe("weekSliceInMonth", () => {
  it("สัปดาห์ที่อยู่ในเดือนเต็มๆ ได้ 7 วัน", () => {
    expect(weekSliceInMonth("2026-07-17", "2026-07")).toEqual({
      from: "2026-07-13",
      to: "2026-07-19",
      days: 7,
    });
  });

  it("สัปดาห์แรกถูกตัดหัวที่วันที่ 1 ของเดือน", () => {
    expect(weekSliceInMonth("2026-07-01", "2026-07")).toEqual({
      from: "2026-07-01",
      to: "2026-07-05",
      days: 5,
    });
  });

  it("สัปดาห์สุดท้ายถูกตัดท้ายที่วันสิ้นเดือน", () => {
    expect(weekSliceInMonth("2026-07-31", "2026-07")).toEqual({
      from: "2026-07-27",
      to: "2026-07-31",
      days: 5,
    });
  });

  it("เดือนที่ขึ้นต้นด้วยวันอาทิตย์ เหลือ slice แรกแค่วันเดียว", () => {
    // ก.พ. 2026 วันที่ 1 เป็นวันอาทิตย์ = วันสุดท้ายของสัปดาห์ที่เริ่มตั้งแต่ ม.ค.
    expect(weekSliceInMonth("2026-02-01", "2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-01",
      days: 1,
    });
  });
});

describe("datesFrom", () => {
  it("ไล่วันแบบนับปลายทั้งสองข้าง", () => {
    expect(datesFrom("2026-07-17", "2026-07-19")).toEqual([
      "2026-07-17",
      "2026-07-18",
      "2026-07-19",
    ]);
  });

  it("วันเดียวได้ array ยาว 1", () => {
    expect(datesFrom("2026-07-17", "2026-07-17")).toEqual(["2026-07-17"]);
  });

  it("คืน array ว่างถ้า to อยู่ก่อน from (กันลูปไม่รู้จบ)", () => {
    expect(datesFrom("2026-07-19", "2026-07-17")).toEqual([]);
  });
});
```

- [ ] **Step 4: รันเทสต์ให้เห็นว่าไม่ผ่าน**

Run: `npm test`
Expected: FAIL — `No test suite found` หรือ import error เพราะยังไม่มีฟังก์ชันพวกนี้ใน `shared.ts`

- [ ] **Step 5: เขียน implementation**

ใน `src/lib/shared.ts` แทรกก่อนบรรทัด `export type TxType = "income" | "expense";`:

```ts
/**
 * วันจันทร์ต้นสัปดาห์ของ dateKey (ISO: จันทร์ต้น อาทิตย์ท้าย)
 * บวกลบปฏิทินล้วน ไม่ผูกโซนเวลา — สร้าง Date กับอ่าน getDay() อยู่โซนเดียวกันเสมอ
 */
export function weekStart(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0=อาทิตย์ … 6=เสาร์
  return shiftDate(dateKey, -(dow === 0 ? 6 : dow - 1));
}

/** วันอาทิตย์ท้ายสัปดาห์ของ dateKey */
export function weekEnd(dateKey: string): string {
  return shiftDate(weekStart(dateKey), 6);
}

/** จำนวนวันจาก from ถึง to แบบนับปลายทั้งสองข้าง ('07-01'..'07-01' = 1) */
export function dayCount(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const ms =
    new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
  // ปัดเศษกันเครื่อง dev ที่อยู่โซนมี DST ทำให้ผลต่างออกมาเป็น 6.958 วัน (ไทยไม่มี DST)
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * ช่วงสัปดาห์ของ dateKey ที่ตัดขอบให้อยู่ในเดือน ym เท่านั้น
 * สัปดาห์คาบเกี่ยวข้ามเดือนจะได้ slice สั้นกว่า 7 วัน เพราะแอปโหลดข้อมูลทีละเดือน
 */
export function weekSliceInMonth(
  dateKey: string,
  ym: string,
): { from: string; to: string; days: number } {
  const monthFrom = `${ym}-01`;
  const monthTo = `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;
  const start = weekStart(dateKey);
  const end = weekEnd(dateKey);
  // ISO date เทียบด้วย string ตรงๆ ได้ เรียงตามลำดับเวลาพอดี
  const from = start < monthFrom ? monthFrom : start;
  const to = end > monthTo ? monthTo : end;
  return { from, to, days: dayCount(from, to) };
}

/** ทุกวันตั้งแต่ from ถึง to แบบนับปลายทั้งสองข้าง */
export function datesFrom(from: string, to: string): string[] {
  if (to < from) return [];
  const out: string[] = [];
  for (let d = from; d <= to; d = shiftDate(d, 1)) out.push(d);
  return out;
}
```

- [ ] **Step 6: รันเทสต์ให้ผ่าน**

Run: `npm test`
Expected: PASS ทั้ง 15 เคส

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/shared.ts src/lib/shared.test.ts
git commit -m "test: add vitest and week-boundary date helpers"
```

---

### Task 2: ย้ายการคำนวณงบออกจาก page.tsx มาเป็น pure function

**Files:**
- Modify: `src/lib/shared.ts` (เพิ่ม `BudgetMode`, `BUDGET_MODES`, `BudgetInfo`, `computeBudget` + `budgetMode` ใน `MonthData`)
- Test: `src/lib/shared.test.ts` (เพิ่ม describe block)

**Interfaces:**
- Consumes: `weekSliceInMonth`, `dayCount`, `daysInMonth`, `totals`, `MonthData` จาก Task 1 และของเดิม
- Produces:
  - `BUDGET_MODES: readonly ["month", "week"]`
  - `type BudgetMode = "month" | "week"`
  - `type BudgetInfo = { amount: number; isManual: boolean; week: { from: string; to: string; envelope: number; daysLeft: number } | null }`
  - `computeBudget(month: MonthData, date: string, mode: BudgetMode): BudgetInfo`
  - `MonthData` มีฟิลด์ `budgetMode: BudgetMode` เพิ่ม (Task 4 จะเป็นคนเติมค่าจาก API)

- [ ] **Step 1: เขียนเทสต์ที่ยังไม่ผ่าน**

เพิ่มท้าย `src/lib/shared.test.ts` (และแก้บรรทัด import บนสุดให้เป็นตามนี้):

```ts
import { describe, expect, it } from "vitest";
import {
  computeBudget,
  dayCount,
  datesFrom,
  weekEnd,
  weekSliceInMonth,
  weekStart,
  type MonthData,
  type Tx,
} from "./shared";
```

แล้วต่อท้ายไฟล์:

```ts
function tx(date: string, type: "income" | "expense", amount: number): Tx {
  return {
    id: 1,
    date,
    spentAt: `${date}T03:00:00.000Z`,
    type,
    amount,
    category: "other",
    note: "",
  };
}

/** ก.ค. 2026 มี 31 วัน ตั้งต้น 6,200 = 200/วันพอดี ทำให้ assert อ่านง่าย */
function monthData(over: Partial<MonthData> = {}): MonthData {
  return {
    ym: "2026-07",
    openingBalance: 6200,
    closedAt: null,
    savingsAmount: null,
    budgetMode: "month",
    transactions: [],
    dailyBudgets: [],
    ...over,
  };
}

describe("computeBudget — โหมด month (กันพฤติกรรมเดิมเพี้ยน)", () => {
  it("วันแรกของเดือน = เงินตั้งต้นหารจำนวนวันทั้งเดือน", () => {
    const b = computeBudget(monthData(), "2026-07-01", "month");
    expect(b.amount).toBeCloseTo(200);
    expect(b.week).toBeNull();
  });

  it("หักที่ใช้ไปก่อนหน้า แล้วหารด้วยวันที่เหลือ", () => {
    const month = monthData({ transactions: [tx("2026-07-01", "expense", 200)] });
    // เหลือ 6000 หาร 30 วันที่เหลือ (2..31)
    expect(computeBudget(month, "2026-07-02", "month").amount).toBeCloseTo(200);
  });

  it("ตัวเลขพองเมื่อประหยัด — นี่คือปัญหาที่โหมด week มาแก้", () => {
    const spent = Array.from({ length: 21 }, (_, i) =>
      tx(`2026-07-${String(i + 1).padStart(2, "0")}`, "expense", 100),
    );
    // ใช้ไป 2,100 เหลือ 4,100 หาร 10 วัน (22..31) = 410/วัน ทั้งที่ควรได้ราว 200
    expect(computeBudget(monthData({ transactions: spent }), "2026-07-22", "month").amount).toBeCloseTo(410);
  });
});

describe("computeBudget — โหมด week", () => {
  it("สัปดาห์เต็มได้ส่วนแบ่งตามสัดส่วนวัน แล้วหารเท่าๆ กัน", () => {
    const b = computeBudget(monthData(), "2026-07-13", "week");
    // share = 6200 × 7/31 = 1400 หาร 7 วัน = 200
    expect(b.amount).toBeCloseTo(200);
    expect(b.week?.from).toBe("2026-07-13");
    expect(b.week?.to).toBe("2026-07-19");
    expect(b.week?.daysLeft).toBe(7);
    // toBeCloseTo ไม่ใช่ toBe เพราะ 6200 × (7/31) ไม่ลงตัวใน floating point
    expect(b.week?.envelope).toBeCloseTo(1400);
  });

  it("สัปดาห์ที่ถูกตัดขอบเดือนยังได้ค่าเฉลี่ยต่อวันเท่าเดิม", () => {
    const b = computeBudget(monthData(), "2026-07-01", "week");
    // share = 6200 × 5/31 = 1000 หาร 5 วัน = 200
    expect(b.amount).toBeCloseTo(200);
    expect(b.week?.from).toBe("2026-07-01");
    expect(b.week?.to).toBe("2026-07-05");
    expect(b.week?.daysLeft).toBe(5);
    expect(b.week?.envelope).toBeCloseTo(1000);
  });

  it("ไม่ทบข้ามสัปดาห์ — ใช้เกินสัปดาห์ก่อน สัปดาห์ใหม่ได้งบเต็ม", () => {
    const month = monthData({ transactions: [tx("2026-07-06", "expense", 2000)] });
    // 07-06 อยู่สัปดาห์ 07-06..07-12 ส่วน 07-13 เป็นสัปดาห์ใหม่
    expect(computeBudget(month, "2026-07-13", "week").amount).toBeCloseTo(200);
  });

  it("ไม่พองข้ามสัปดาห์เหมือนโหมด month", () => {
    const spent = Array.from({ length: 21 }, (_, i) =>
      tx(`2026-07-${String(i + 1).padStart(2, "0")}`, "expense", 100),
    );
    const month = monthData({ transactions: spent });
    // สัปดาห์ 07-20..07-26 share 1400, ใช้ไป 07-20/07-21 อย่างละ 100 → 1200 หาร 5 วัน = 240
    // (เทียบกับโหมด month ที่ให้ 410 — นี่คือหัวใจของ feature)
    expect(computeBudget(month, "2026-07-22", "week").amount).toBeCloseTo(240);
  });

  it("รายรับกลางสัปดาห์เพิ่มงบให้สัปดาห์นั้น", () => {
    const month = monthData({ transactions: [tx("2026-07-13", "income", 700)] });
    // 07-14: share 1400 + รายรับ 700 = 2100 หาร 6 วันที่เหลือ = 350
    expect(computeBudget(month, "2026-07-14", "week").amount).toBeCloseTo(350);
  });

  it("envelope รวมรายรับทั้งสัปดาห์ แม้วันที่ดูอยู่จะมาก่อนวันที่เงินเข้า", () => {
    const month = monthData({ transactions: [tx("2026-07-17", "income", 700)] });
    const b = computeBudget(month, "2026-07-13", "week");
    expect(b.week?.envelope).toBeCloseTo(2100); // 1400 + 700
    expect(b.amount).toBeCloseTo(200); // แต่ค่าเฉลี่ยยังไม่นับรายรับของวันข้างหน้า
  });

  it("ใช้เกินงบสัปดาห์แล้วค่าเฉลี่ยติดลบ", () => {
    const month = monthData({ transactions: [tx("2026-07-13", "expense", 1500)] });
    // 07-14: 1400 − 1500 = −100 หาร 6 = −16.67
    expect(computeBudget(month, "2026-07-14", "week").amount).toBeCloseTo(-16.666, 2);
  });

  it("งบที่กรอกเองชนะค่าที่คำนวณให้ แต่ยังโชว์บริบทสัปดาห์อยู่", () => {
    const month = monthData({
      dailyBudgets: [{ id: 1, userId: "u", date: "2026-07-17", amount: 99 }],
    });
    const b = computeBudget(month, "2026-07-17", "week");
    expect(b.amount).toBe(99);
    expect(b.isManual).toBe(true);
    expect(b.week).not.toBeNull();
  });
});
```

- [ ] **Step 2: รันเทสต์ให้เห็นว่าไม่ผ่าน**

Run: `npm test`
Expected: FAIL — `computeBudget is not exported` และ TS error ว่า `budgetMode` ไม่มีใน `MonthData`

- [ ] **Step 3: เพิ่ม `budgetMode` เข้า `MonthData`**

ใน `src/lib/shared.ts` แก้ type `MonthData`:

```ts
export type MonthData = {
  ym: string;
  openingBalance: number;
  closedAt: string | null;
  savingsAmount: number | null;
  budgetMode: BudgetMode;
  transactions: Tx[];
  dailyBudgets: DailyBudget[];
};
```

- [ ] **Step 4: เขียน `computeBudget`**

ต่อท้าย `src/lib/shared.ts` (หลัง `totals` เพราะเรียกใช้มัน):

```ts
export const BUDGET_MODES = ["month", "week"] as const;
export type BudgetMode = (typeof BUDGET_MODES)[number];

export type BudgetInfo = {
  /** เงินเฉลี่ยต่อวันของวันที่ดูอยู่ */
  amount: number;
  /** true = มาจาก daily_budgets ที่ผู้ใช้กรอกเอง ไม่ได้คำนวณให้ */
  isManual: boolean;
  /** null ในโหมด month — ใช้โชว์บรรทัดบริบทสัปดาห์ */
  week: { from: string; to: string; envelope: number; daysLeft: number } | null;
};

/** โหมดเดิม: เงินคงเหลือทั้งเดือน ณ ก่อนวันนี้ หารด้วยวันที่เหลือทั้งเดือน */
function monthPerDay(month: MonthData, date: string): number {
  const { income, expense } = totals(
    month.transactions.filter((t) => t.date < date),
  );
  const remainingBefore = month.openingBalance + income - expense;
  const day = Number(date.slice(8, 10));
  const daysLeft = Math.max(1, daysInMonth(month.ym) - day + 1);
  return remainingBefore / daysLeft;
}

/**
 * โหมดสัปดาห์: ขังการหารใหม่ไว้ในสัปดาห์เดียว เงินสัปดาห์ก่อนไม่ทบมา
 * สูตรขนานกับ monthPerDay ต่างแค่ใช้ส่วนแบ่งของสัปดาห์ และหน้าต่างเวลาเป็น slice
 */
function weekInfo(month: MonthData, date: string) {
  const { from, to, days } = weekSliceInMonth(date, month.ym);
  const share = month.openingBalance * (days / daysInMonth(month.ym));

  const { income, expense } = totals(
    month.transactions.filter((t) => t.date >= from && t.date < date),
  );
  const daysLeft = Math.max(1, dayCount(date, to));
  const perDay = (share + income - expense) / daysLeft;

  // envelope โชว์เงินของสัปดาห์นี้ทั้งก้อน จึงนับรายรับทั้ง slice
  // ต่างจากตัวตั้งของ perDay ที่นับแค่ก่อนวันนี้ตามธรรมเนียมของแอป — จงใจ ไม่ใช่บั๊ก
  const weekIncome = totals(
    month.transactions.filter((t) => t.date >= from && t.date <= to),
  ).income;

  return { from, to, envelope: share + weekIncome, daysLeft, perDay };
}

/** เงินเฉลี่ยต่อวันของวันที่ดูอยู่ + บริบทสัปดาห์ (ถ้าอยู่โหมด week) */
export function computeBudget(
  month: MonthData,
  date: string,
  mode: BudgetMode,
): BudgetInfo {
  const manual = month.dailyBudgets?.find((b) => b.date === date);
  // คำนวณ week เสมอเมื่ออยู่โหมด week ไม่ว่าจะกรอกเองหรือไม่ — บรรทัดบริบทต้องโชว์ทั้งสองกรณี
  const week = mode === "week" ? weekInfo(month, date) : null;
  const auto = week ? week.perDay : monthPerDay(month, date);

  return {
    amount: manual ? manual.amount : auto,
    isManual: manual != null,
    week: week && {
      from: week.from,
      to: week.to,
      envelope: week.envelope,
      daysLeft: week.daysLeft,
    },
  };
}
```

- [ ] **Step 5: รันเทสต์ให้ผ่าน**

Run: `npm test`
Expected: PASS ทั้งหมด

ถ้าเคส `"ไม่พองข้ามสัปดาห์"` ได้ 240 และเคส `"ตัวเลขพองเมื่อประหยัด"` ได้ 410 แปลว่า feature ทำงานถูกต้องตามเป้า — สองเคสนี้คือหัวใจ ห้าม "แก้เทสต์ให้ผ่าน" ถ้าค่าไม่ตรง ให้ไปแก้สูตร

- [ ] **Step 6: Commit**

```bash
git add src/lib/shared.ts src/lib/shared.test.ts
git commit -m "feat: add computeBudget with month and week modes as pure functions"
```

---

### Task 3: ตาราง user_settings + migration + RLS

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0002_*.sql` (drizzle-kit generate ตั้งชื่อให้)
- Create: `drizzle/rls_settings.sql`

**Interfaces:**
- Produces: `userSettings` table, `budgetModeEnum`, `type UserSettings` — Task 4 ใช้

- [ ] **Step 1: เพิ่ม schema**

ใน `src/db/schema.ts` ต่อจาก `export const txTypeEnum = ...` เพิ่ม:

```ts
export const budgetModeEnum = pgEnum("budget_mode", ["month", "week"]);
```

แล้วเพิ่มตารางต่อจาก `savingsTransactions`:

```ts
/**
 * setting ระดับผู้ใช้ ใช้ร่วมกันทุกเดือน
 * เผื่อขยายเป็น feature flag ในอนาคตด้วยการเพิ่มคอลัมน์ (ยังไม่ทำในตอนนี้)
 * ค่า enum เขียนซ้ำกับ BUDGET_MODES ใน shared.ts โดยตั้งใจ — drizzle-kit ต้องอ่าน
 * literal ตรงๆ ตอน generate ถ้า import มาจะวิเคราะห์ไม่ออก
 */
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey(),
  budgetMode: budgetModeEnum("budget_mode").notNull().default("month"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

และเพิ่มบรรทัด type ท้ายไฟล์:

```ts
export type UserSettings = typeof userSettings.$inferSelect;
```

- [ ] **Step 2: generate migration**

```bash
npm run db:generate -- --name add_user_settings
```

Expected: สร้างไฟล์ `drizzle/0002_add_user_settings.sql` ที่มี `CREATE TYPE "public"."budget_mode"` และ `CREATE TABLE "user_settings"`

**อย่าใช้ `npm run db:push`** — มัน crash ในโปรเจกต์นี้ (drizzle-kit bug ตอน introspect Supabase)

- [ ] **Step 3: apply migration ลง DB**

```bash
set -a && . ./.env.development && set +a && psql "$DATABASE_URL" -f drizzle/0002_add_user_settings.sql
```

Expected: `CREATE TYPE` / `CREATE TABLE` ไม่มี error

- [ ] **Step 4: เขียนไฟล์ RLS**

สร้าง `drizzle/rls_settings.sql`:

```sql
-- ==========================================================================
-- รันไฟล์นี้ครั้งเดียว หลัง apply drizzle/0002_add_user_settings.sql
-- (แยกไฟล์เพราะ rls.sql / rls_savings.sql รันไปแล้ว รันซ้ำจะ error)
-- ==========================================================================

alter table public.user_settings
  add constraint user_settings_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.user_settings enable row level security;

create policy "own user_settings"
  on public.user_settings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 5: apply RLS**

```bash
set -a && . ./.env.development && set +a && psql "$DATABASE_URL" -f drizzle/rls_settings.sql
```

Expected: `ALTER TABLE` / `CREATE POLICY` ไม่มี error

- [ ] **Step 6: ยืนยันว่า RLS เปิดจริง**

```bash
set -a && . ./.env.development && set +a && psql "$DATABASE_URL" -c "select relname, relrowsecurity from pg_class where relname = 'user_settings';"
```

Expected: `user_settings | t`

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add user_settings table with budget_mode and RLS"
```

---

### Task 4: budgetMode เข้า API — GET months + PUT settings

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/app/api/months/[ym]/route.ts`
- Create: `src/app/api/settings/route.ts`

**Interfaces:**
- Consumes: `userSettings` (Task 3), `BUDGET_MODES` (Task 2)
- Produces:
  - `GET /api/months/[ym]` → response มี `budgetMode: "month" | "week"`
  - `PUT /api/settings` body `{budgetMode}` → `{budgetMode}`
  - `settingsPatch` zod schema

- [ ] **Step 1: เพิ่ม zod schema**

ใน `src/lib/api.ts` แก้ import บนสุด:

```ts
import { BUDGET_MODES, CATEGORIES } from "./shared";
```

แล้วเพิ่มต่อจาก `carryOverPatch`:

```ts
export const settingsPatch = z.object({
  budgetMode: z.enum(BUDGET_MODES),
});
```

- [ ] **Step 2: ให้ GET months ส่ง budgetMode มาด้วย**

ใน `src/app/api/months/[ym]/route.ts`:

แก้ import ของ schema:

```ts
import { months, transactions, dailyBudgets, userSettings } from "@/db/schema";
```

เพิ่ม query ตัวที่ 4 เข้า `Promise.all` (ต่อจาก `db.query.dailyBudgets.findMany({...})` — อย่าลืมคอมมา) และแก้บรรทัด destructure:

```ts
  const [monthRow, rows, budgets, settings] = await Promise.all([
```

query ที่เพิ่ม:

```ts
    db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    }),
```

แล้วเพิ่มฟิลด์เข้า `body` (วางต่อจาก `savingsAmount`):

```ts
    // ไม่ใช่ข้อมูลของเดือนจริงๆ แต่แถมมากับ response นี้เพื่อไม่ต้อง fetch เพิ่ม
    // และกันไม่ให้โหมดกระพริบผิดตอนโหลด — skeleton คลุมช่วงนี้อยู่แล้ว
    budgetMode: settings?.budgetMode ?? "month",
```

- [ ] **Step 3: สร้าง endpoint สำหรับบันทึกโหมด**

สร้าง `src/app/api/settings/route.ts`:

```ts
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import {
  badRequest,
  requireUserId,
  settingsPatch,
  unauthorized,
} from "@/lib/api";

/** บันทึก setting ระดับผู้ใช้ — ตอนนี้มีแค่โหมดคำนวณงบ */
export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = settingsPatch.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { budgetMode } = parsed.data;

  const [row] = await db
    .insert(userSettings)
    .values({ userId, budgetMode })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { budgetMode },
    })
    .returning();

  return Response.json({ budgetMode: row.budgetMode });
}
```

- [ ] **Step 4: ตรวจว่า build ผ่าน**

Run: `npm run build`
Expected: ผ่าน และเห็น `ƒ /api/settings` ในตารางเส้นทาง

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/app/api/months/ src/app/api/settings/
git commit -m "feat: expose budgetMode via months API and add PUT /api/settings"
```

---

### Task 5: daily-budgets endpoint รับหลายวันในครั้งเดียว

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/app/api/months/[ym]/daily-budgets/route.ts`

**Interfaces:**
- Produces: `PUT /api/months/[ym]/daily-budgets` body `{dates: string[], amount: number}` → `DailyBudget[]` (amount เป็น **number**)
- Breaking: body เดิม `{date, amount}` ใช้ไม่ได้แล้ว — Task 7 แก้ฝั่ง client

**บั๊กที่ต้องแก้ไปด้วย:** route เดิมคืน `NextResponse.json(upserted)` ซึ่ง `amount` เป็น **string** (drizzle numeric) แต่ type `DailyBudget` ประกาศเป็น `number` และ `page.tsx` ยัดค่านี้เข้า state ตรงๆ ผลคือหลังกดบันทึกงบ แล้วกดปุ่มแก้ไขซ้ำ `initialBalance.toFixed(2)` จะพังเพราะ `.toFixed` ไม่มีใน string (จะหายเองตอน refresh เพราะ GET map `Number()` ให้) — route ใหม่ต้อง map เป็น number ก่อนส่งกลับ

- [ ] **Step 1: เพิ่ม zod schema**

ใน `src/lib/api.ts` ต่อจาก `settingsPatch`:

```ts
export const dailyBudgetPatch = z.object({
  // สูงสุด 7 เพราะโหมดสัปดาห์เขียนได้มากสุดคือทั้งสัปดาห์
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ต้องเป็น YYYY-MM-DD"))
    .min(1)
    .max(7),
  amount: z.coerce.number().min(0).max(99_999_999),
});
```

- [ ] **Step 2: เขียน route ใหม่ทั้งไฟล์**

แทนที่ `src/app/api/months/[ym]/daily-budgets/route.ts` ทั้งไฟล์ด้วย (ปรับมาใช้ `requireUserId` ให้ตรงกับ route อื่นๆ ในโปรเจกต์ แทน `createClient` ตรงๆ):

```ts
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { dailyBudgets } from "@/db/schema";
import {
  badRequest,
  dailyBudgetPatch,
  requireUserId,
  unauthorized,
  ymSchema,
} from "@/lib/api";
import { daysInMonth, type DailyBudget } from "@/lib/shared";

type Ctx = { params: Promise<{ ym: string }> };

function toDailyBudget(r: {
  id: number;
  userId: string;
  date: string;
  amount: string;
}): DailyBudget {
  // numeric ของ drizzle มาเป็น string เสมอ ต้องแปลงก่อนส่งออก
  return { id: r.id, userId: r.userId, date: r.date, amount: Number(r.amount) };
}

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = ymSchema.safeParse((await params).ym);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const ym = parsed.data;

  const rows = await db
    .select()
    .from(dailyBudgets)
    .where(
      and(
        eq(dailyBudgets.userId, userId),
        gte(dailyBudgets.date, `${ym}-01`),
        lte(dailyBudgets.date, `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`),
      ),
    );

  return Response.json(rows.map(toDailyBudget));
}

/**
 * ตั้งงบให้หลายวันพร้อมกันด้วยค่าเดียวกัน
 * โหมดเดือนส่ง dates ยาว 1 โหมดสัปดาห์ส่งวันที่เหลือในสัปดาห์ (สูงสุด 7) — ยิงครั้งเดียวจบทั้งคู่
 */
export async function PUT(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const ymParsed = ymSchema.safeParse((await params).ym);
  if (!ymParsed.success) return badRequest(ymParsed.error.issues[0].message);
  const ym = ymParsed.data;

  const parsed = dailyBudgetPatch.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { dates, amount } = parsed.data;

  // กันเขียนข้ามเดือน — client คำนวณ dates เอง จึงต้องตรวจซ้ำที่นี่
  if (dates.some((d) => !d.startsWith(ym))) {
    return badRequest("มีวันที่ไม่ตรงกับเดือนที่ระบุ");
  }

  const rows = await db
    .insert(dailyBudgets)
    .values(dates.map((date) => ({ userId, date, amount: amount.toFixed(2) })))
    .onConflictDoUpdate({
      target: [dailyBudgets.userId, dailyBudgets.date],
      set: { amount: amount.toFixed(2) },
    })
    .returning();

  return Response.json(rows.map(toDailyBudget));
}
```

- [ ] **Step 3: ตรวจว่า build ผ่าน**

Run: `npm run build`
Expected: ผ่าน (page.tsx ยังส่ง `{date, amount}` อยู่ แต่เป็น runtime shape ไม่ใช่ type error — Task 7 จะแก้)

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.ts "src/app/api/months/[ym]/daily-budgets/route.ts"
git commit -m "feat: accept multiple dates per daily-budget write and return numeric amounts"
```

---

### Task 6: UI สลับโหมด + บริบทสัปดาห์ใน DayView

**Files:**
- Modify: `src/components/DayView.tsx`

**Interfaces:**
- Consumes: `BudgetMode`, `BudgetInfo` (Task 2)
- Produces: `DayView` รับ props เพิ่ม
  - `budgetMode: BudgetMode`
  - `onBudgetModeChange: (mode: BudgetMode) => void`
  - `week: BudgetInfo["week"]`
  - เปลี่ยนชื่อ prop `initialBalance` → `dailyBudget` (ชื่อเดิมชวนเข้าใจผิดว่าเป็นยอดตั้งต้น ทั้งที่เป็นเงินเฉลี่ยต่อวัน)

- [ ] **Step 1: แก้ import และ Props**

แก้ import block:

```ts
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  formatBaht,
  formatDayTH,
  formatTimeTH,
  shiftDate,
  todayKey,
  totals,
  type BudgetInfo,
  type BudgetMode,
  type Tx,
} from "@/lib/shared";
```

แก้ `type Props`:

```ts
type Props = {
  date: string;
  onDateChange: (d: string) => void;
  canPrev: boolean;
  canNext: boolean;
  txs: Tx[];
  onAdd: (tx: NewTx) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  locked: boolean;
  dailyBudget: number;
  onBudgetChange: (amount: number) => Promise<void>;
  budgetMode: BudgetMode;
  onBudgetModeChange: (mode: BudgetMode) => void;
  week: BudgetInfo["week"];
};
```

- [ ] **Step 2: แก้ signature และตัวแปรใน component**

แก้ destructure ของ `DayView`:

```ts
export default function DayView({
  date,
  onDateChange,
  canPrev,
  canNext,
  txs,
  onAdd,
  onDelete,
  locked,
  dailyBudget,
  onBudgetChange,
  budgetMode,
  onBudgetModeChange,
  week,
}: Props) {
```

แก้สองบรรทัดที่อ้าง `initialBalance`:

```ts
  const [draftBudget, setDraftBudget] = useState(String(dailyBudget));
  const remaining = dailyBudget + income - expense;
```

- [ ] **Step 3: แทนที่หัวการ์ดงบด้วยตัวสลับโหมด**

แทนที่ block `<div className="mb-2 flex items-center justify-between text-[10px] text-muted">…</div>` ทั้งก้อน (ตัวที่อยู่ใน `) : (` ของ `editingBudget` ternary) ด้วย:

```tsx
          <div className="mb-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted">เงินเฉลี่ยต่อวัน</span>
              {!locked && (
                <ModeToggle mode={budgetMode} onChange={onBudgetModeChange} />
              )}
            </div>
            {!locked && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setDraftBudget(dailyBudget.toFixed(2));
                    setEditingBudget(true);
                  }}
                  className="flex items-center gap-1 text-[10px] text-accent hover:underline"
                >
                  <Pencil size={12} />
                  {budgetMode === "week"
                    ? "แก้ไขงบสัปดาห์นี้"
                    : "แก้ไขเงินเฉลี่ยต่อวัน"}
                </button>
              </div>
            )}
          </div>
```

- [ ] **Step 4: แก้ placeholder ของช่องกรอกให้ตรงโหมด**

ใน `<input>` ของฟอร์มแก้งบ เปลี่ยน `placeholder`:

```tsx
              placeholder={
                budgetMode === "week"
                  ? "เงินต่อวัน (ใช้กับทุกวันที่เหลือในสัปดาห์)"
                  : "กรอกเงินเฉลี่ยต่อวัน"
              }
```

- [ ] **Step 5: แก้ Cell แรกให้ใช้ชื่อ prop ใหม่ + เพิ่มบรรทัดบริบทสัปดาห์**

แก้ `<Cell label="เงินเฉลี่ยต่อวัน" value={initialBalance} tone="income" />` เป็น:

```tsx
          <Cell label="เฉลี่ย/วัน" value={dailyBudget} tone="income" />
```

แล้วเพิ่มต่อจาก `</div>` ที่ปิด grid (ก่อน block `{remaining < 0 && …}`):

```tsx
        {week && (
          <p className="tnum mt-2 text-center text-[11px] text-muted">
            งบสัปดาห์นี้ {formatBaht(week.envelope)} ฿ · เหลืออีก {week.daysLeft}{" "}
            วัน
          </p>
        )}
```

- [ ] **Step 6: เพิ่ม component ModeToggle ท้ายไฟล์**

ต่อท้าย `src/components/DayView.tsx` (หลัง `NavBtn`):

```tsx
const MODE_LABEL: Record<BudgetMode, string> = {
  month: "เดือน",
  week: "สัปดาห์",
};

/** สลับว่าจะหารเงินเฉลี่ยต่อวันจากก้อนรายเดือนหรือรายสัปดาห์ */
function ModeToggle({
  mode,
  onChange,
}: {
  mode: BudgetMode;
  onChange: (mode: BudgetMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="โหมดคำนวณงบ"
      className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5"
    >
      {(Object.keys(MODE_LABEL) as BudgetMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={clsx(
            "rounded-md px-2.5 py-1 text-[10px] transition",
            mode === m
              ? "bg-accent font-semibold text-white"
              : "text-muted hover:bg-surface active:scale-95",
          )}
        >
          {MODE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: ตรวจว่า build ผ่าน**

Run: `npm run build`
Expected: **FAIL** ที่ `src/app/page.tsx` เพราะยังส่ง prop `initialBalance` และยังไม่ส่ง `budgetMode` / `onBudgetModeChange` / `week` — Task 7 แก้ให้

- [ ] **Step 8: Commit**

```bash
git add src/components/DayView.tsx
git commit -m "feat: add budget mode toggle and week context line to DayView"
```

---

### Task 7: ต่อสายทั้งหมดใน page.tsx

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `computeBudget`, `datesFrom`, `weekSliceInMonth`, `BudgetMode` (Task 1-2), `PUT /api/settings` (Task 4), `dates[]` API (Task 5), props ใหม่ของ `DayView` (Task 6)

- [ ] **Step 1: แก้ import**

แก้ import จาก `@/lib/shared`:

```ts
import {
  computeBudget,
  datesFrom,
  daysInMonth,
  thisMonthKey,
  todayKey,
  totals,
  weekSliceInMonth,
  type BudgetMode,
  type DailyBudget,
  type MonthData,
  type Tx,
} from "@/lib/shared";
```

- [ ] **Step 2: แทนที่ useMemo ที่คำนวณงบ**

แทนที่ block `const { initialBalance, isAutoBudget } = useMemo(() => {…}, [month, date]);` (บรรทัด ~100-116) ทั้งก้อนด้วย:

```ts
  // การคำนวณย้ายไป shared.ts แล้ว (ทดสอบด้วย vitest ที่ shared.test.ts)
  const budget = useMemo(
    () => (month ? computeBudget(month, date, month.budgetMode) : null),
    [month, date],
  );
```

`isAutoBudget` เดิมไม่มีใครใช้ — หายไปพร้อมกันได้เลย

- [ ] **Step 3: แก้ updateDailyBudget ให้ส่งหลายวัน**

แทนที่ฟังก์ชัน `updateDailyBudget` ทั้งก้อนด้วย:

```ts
  /** โหมดเดือนเขียนวันเดียว โหมดสัปดาห์เขียนวันที่เหลือในสัปดาห์ (ไม่ทับวันที่ผ่านไปแล้ว) */
  async function updateDailyBudget(amount: number) {
    if (!month) return;
    const dates =
      month.budgetMode === "week"
        ? datesFrom(date, weekSliceInMonth(date, ym).to)
        : [date];

    const res = await fetch(`/api/months/${ym}/daily-budgets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dates, amount }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "บันทึกไม่สำเร็จ");
      return;
    }

    const updated: DailyBudget[] = await res.json();
    setMonth((m) => {
      if (!m) return m;
      const byDate = new Map(m.dailyBudgets.map((b) => [b.date, b]));
      for (const u of updated) byDate.set(u.date, u);
      return { ...m, dailyBudgets: [...byDate.values()] };
    });
  }
```

- [ ] **Step 4: เพิ่มฟังก์ชันสลับโหมด**

วางต่อจาก `updateDailyBudget`:

```ts
  /** โหมดเป็น setting ระดับผู้ใช้ ใช้ร่วมกันทุกเดือน — เดือนอื่นจะได้ค่าใหม่ตอน fetch */
  async function changeBudgetMode(mode: BudgetMode) {
    const before = month;
    setMonth((m) => (m ? { ...m, budgetMode: mode } : m));

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetMode: mode }),
    });
    if (!res.ok) {
      setMonth(before); // สลับไม่สำเร็จ ย้อนสถานะกลับ
      setError((await res.json()).error ?? "เปลี่ยนโหมดไม่สำเร็จ");
    }
  }
```

- [ ] **Step 5: แก้ props ที่ส่งให้ DayView**

ใน JSX แก้ `<DayView …>` สามบรรทัดท้าย:

```tsx
            dailyBudget={budget?.amount ?? 0}
            onBudgetChange={updateDailyBudget}
            budgetMode={month.budgetMode}
            onBudgetModeChange={changeBudgetMode}
            week={budget?.week ?? null}
```

(ลบบรรทัด `initialBalance={initialBalance}` ทิ้ง)

- [ ] **Step 6: ตรวจว่า build ผ่าน**

Run: `npm run build`
Expected: PASS — ไม่มี type error และเห็น `ƒ /api/settings` ในตารางเส้นทาง

- [ ] **Step 7: ตรวจว่า lint ผ่าน**

Run: `npm run lint`
Expected: ไม่มี error (คำเตือนเรื่อง import ที่ไม่ได้ใช้ต้องไม่มี — ถ้ามีให้ลบ import นั้นออก)

- [ ] **Step 8: รันเทสต์อีกรอบกันของเดิมพัง**

Run: `npm test`
Expected: PASS ทั้งหมด

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire weekly budget mode into day view"
```

---

### Task 8: ตรวจด้วยมือ

**Files:** ไม่แก้ไฟล์ (ยกเว้นเจอบั๊ก)

- [ ] **Step 1: รัน dev server**

```bash
npm run dev
```

- [ ] **Step 2: ไล่เช็คตามรายการนี้ที่ `http://localhost:3000`**

- [ ] เปิดแท็บ "รายวัน" เห็นตัวสลับ `[ เดือน | สัปดาห์ ]` ในการ์ดงบ ค่าเริ่มต้นอยู่ที่ "เดือน"
- [ ] กด "สัปดาห์" → ตัวเลข "เฉลี่ย/วัน" เปลี่ยน และมีบรรทัด "งบสัปดาห์นี้ … · เหลืออีก … วัน" โผล่ขึ้นมา
- [ ] กด "เดือน" → บรรทัดบริบทสัปดาห์หายไป ตัวเลขกลับเป็นค่าเดิม
- [ ] refresh หน้า → โหมดที่เลือกไว้ยังอยู่ (ไม่เด้งกลับเป็น "เดือน")
- [ ] เปลี่ยนไปเดือนอื่นแล้วกลับมา → โหมดยังเป็นอันที่เลือกไว้
- [ ] ในโหมดสัปดาห์ กด "แก้ไขงบสัปดาห์นี้" ใส่ 250 บันทึก → วันที่ดูอยู่และวันที่เหลือในสัปดาห์เป็น 250 ทั้งหมด
- [ ] กดย้อนไปวันก่อนหน้าในสัปดาห์เดียวกัน → **ไม่ถูกเขียนทับ** ยังเป็นค่าเดิม
- [ ] กดปุ่มแก้ไขซ้ำอีกรอบทันทีหลังบันทึก → **ไม่ crash** (นี่คือบั๊กที่แก้ใน Task 5)
- [ ] เปิดวันที่ 1 ของเดือนที่ไม่ใช่วันจันทร์ ในโหมดสัปดาห์ → "เหลืออีก N วัน" ต้องน้อยกว่า 7 และงบต้องได้สัดส่วนตาม
- [ ] ปิดยอดเดือน → ตัวสลับโหมดและปุ่มแก้ไขหายไปทั้งคู่
- [ ] ยอด "คงเหลือ" บน header ยังตรงเหมือนเดิมไม่ว่าอยู่โหมดไหน

- [ ] **Step 3: ถ้าทุกข้อผ่าน — รายงานให้ผู้ใช้ตรวจ**

หยุดตรงนี้ รอผู้ใช้ยืนยันก่อน push ขึ้น `origin/main` (Vercel จะ auto-deploy ทันทีที่ push)
