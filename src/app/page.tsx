"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { CalendarDays, ListTodo } from "lucide-react";
import AccountBar from "@/components/AccountBar";
import MonthStrip from "@/components/MonthStrip";
import DayView from "@/components/DayView";
import MonthView from "@/components/MonthView";
import { Skeleton } from "@/components/Skeleton";
import type { NewTx } from "@/components/QuickAdd";
import {
  computeBudget,
  datesFrom,
  daysInMonth,
  thisMonthKey,
  todayKey,
  totals,
  weekSliceInMonth,
  type BudgetMode,
  type MonthData,
  type Tx,
  type DailyBudget,
} from "@/lib/shared";

type View = "day" | "month";

export default function Home() {
  const [ym, setYm] = useState(thisMonthKey);
  const [date, setDate] = useState(todayKey);
  const [view, setView] = useState<View>("day");
  const [month, setMonth] = useState<MonthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // กันเคสปัดเปลี่ยนเดือนรัวๆ แล้ว response ของเดือนเก่าที่มาช้ากว่าทับเดือนล่าสุด
  const ymRef = useRef(ym);
  ymRef.current = ym;

  const load = useCallback(async (m: string) => {
    setLoadingMonth(true);
    try {
      const res = await fetch(`/api/months/${m}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error((await res.json()).error ?? "โหลดข้อมูลไม่สำเร็จ");
      }
      const data = await res.json();
      if (ymRef.current !== m) return; // ผู้ใช้เปลี่ยนเดือนไปแล้ว ทิ้ง response นี้
      setMonth(data);
      setError(null);
    } catch (e) {
      if (ymRef.current !== m) return;
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (ymRef.current === m) setLoadingMonth(false);
    }
  }, []);

  useEffect(() => {
    void load(ym);
  }, [ym, load]);

  // โชว์ skeleton ก็ต่อเมื่อโหลดนานเกิน 200ms เท่านั้น — กันไม่ให้กะพริบตอนโหลดไวจนไม่ทันสังเกต
  useEffect(() => {
    if (!loadingMonth) {
      setShowSkeleton(false);
      return;
    }
    const t = setTimeout(() => setShowSkeleton(true), 200);
    return () => clearTimeout(t);
  }, [loadingMonth]);

  const loadSavings = useCallback(async () => {
    const res = await fetch("/api/savings", { cache: "no-store" });
    if (res.ok) setTotalSavings((await res.json()).total);
  }, []);

  useEffect(() => {
    void loadSavings();
  }, [loadSavings]);

  // เปลี่ยนเดือน = เด้งไปวันที่ 1 ของเดือนนั้น (ถ้าเป็นเดือนปัจจุบันให้ไปวันนี้)
  function pickMonth(next: string) {
    setYm(next);
    setDate(next === thisMonthKey() ? todayKey() : `${next}-01`);
  }

  function pickDate(next: string) {
    setDate(next);
    const nextYm = next.slice(0, 7);
    if (nextYm !== ym) setYm(nextYm);
  }

  const dayTxs = useMemo(
    () => (month?.transactions ?? []).filter((t) => t.date === date),
    [month, date],
  );

  const monthTotals = useMemo(() => totals(month?.transactions ?? []), [month]);

  const locked = month?.closedAt != null;

  // การคำนวณย้ายไป shared.ts แล้ว (ทดสอบด้วย vitest ที่ shared.test.ts)
  const budget = useMemo(
    () => (month ? computeBudget(month, date, month.budgetMode) : null),
    [month, date],
  );

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

  async function addTx(input: NewTx) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, date }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    const created: Tx = await res.json();
    setMonth((m) =>
      m ? { ...m, transactions: [...m.transactions, created] } : m,
    );
  }

  async function deleteTx(id: number) {
    const before = month;
    setMonth((m) =>
      m ? { ...m, transactions: m.transactions.filter((t) => t.id !== id) } : m,
    );
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMonth(before); // ลบไม่สำเร็จ ย้อนสถานะกลับ
      setError("ลบไม่สำเร็จ");
    }
  }

  async function patchMonth(body: Record<string, unknown>) {
    const res = await fetch(`/api/months/${ym}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    const updated = await res.json();
    setMonth((m) => (m ? { ...m, ...updated } : m));
  }

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

  const lastDay = `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;

  return (
    <>
      <MonthStrip
        ym={ym}
        onChange={pickMonth}
        opening={month?.openingBalance ?? 0}
        income={monthTotals.income}
        expense={monthTotals.expense}
        savings={totalSavings}
        closed={locked === true}
        loading={showSkeleton}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-28 pt-3">
        {error && (
          <p
            onClick={() => setError(null)}
            className="mb-3 cursor-pointer rounded-xl bg-expense-soft px-3 py-2 text-center text-[13px] text-expense"
          >
            {error} (แตะเพื่อปิด)
          </p>
        )}

        {!month || showSkeleton ? (
          <ContentSkeleton />
        ) : view === "day" ? (
          <DayView
            date={date}
            onDateChange={pickDate}
            canPrev={date > `${ym}-01`}
            canNext={date < lastDay && date < todayKey()}
            txs={dayTxs}
            onAdd={addTx}
            onDelete={deleteTx}
            locked={locked === true}
            dailyBudget={budget?.amount ?? 0}
            onBudgetChange={updateDailyBudget}
            budgetMode={month.budgetMode}
            onBudgetModeChange={changeBudgetMode}
            week={budget?.week ?? null}
          />
        ) : (
          <div className="space-y-3">
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
            <AccountBar />
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto grid max-w-2xl grid-cols-2">
          <Tab
            active={view === "day"}
            onClick={() => setView("day")}
            icon={<ListTodo size={18} />}
            label="รายวัน"
          />
          <Tab
            active={view === "month"}
            onClick={() => setView("month")}
            icon={<CalendarDays size={18} />}
            label="สรุปเดือน"
          />
        </div>
      </nav>
    </>
  );
}

/** เนื้อหาระหว่างรอโหลด ใช้เหมือนกันทั้งแท็บรายวันและสรุปเดือน — เอาไว้แค่บอกว่ากำลังโหลด ไม่ต้องเลียนแบบทุกพิกเซล */
function ContentSkeleton() {
  return (
    <div className="space-y-3 pop-in">
      <div className="card space-y-3 p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="card space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition",
        active ? "font-semibold text-accent" : "text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
