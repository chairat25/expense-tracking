"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Lock, LogOut } from "lucide-react";
import clsx from "clsx";
import { Skeleton } from "@/components/Skeleton";
import { formatBaht, formatMonthTH, shiftMonth, thisMonthKey } from "@/lib/shared";

type Props = {
  ym: string;
  onChange: (ym: string) => void;
  opening: number;
  income: number;
  expense: number;
  savings: number;
  closed: boolean;
  loading?: boolean;
  currentView?: "home" | "day" | "month" | "salary" | "memo" | "profile";
};

/** เดือนที่ให้เลื่อนได้: ย้อนหลัง 12 เดือน ถึงเดือนปัจจุบัน และโชว์อนาคตอีก 12 เดือน (แต่กดไม่ได้) */
function monthRange(): string[] {
  const now = thisMonthKey();
  return Array.from({ length: 25 }, (_, i) => shiftMonth(now, i - 12));
}

const VIEW_HEADERS: Record<string, { icon: string; title: string }> = {
  home: { icon: "🏠", title: "หน้าหลัก" },
  day: { icon: "💰", title: "บันทึกรายรับรายจ่าย" },
  salary: { icon: "💵", title: "บันทึกเงินเดือน" },
  month: { icon: "📊", title: "สรุปรายเดือน" },
  memo: { icon: "🧠", title: "บันทึกความจำ & เตือนความจำ" },
  profile: { icon: "👤", title: "โปรไฟล์ส่วนตัว & สังคมคอมมูนิตี้" },
};

export default function MonthStrip({
  ym,
  onChange,
  opening,
  income,
  expense,
  savings,
  closed,
  loading = false,
  currentView = "day",
}: Props) {
  const now = thisMonthKey();
  const months = monthRange();
  const idx = months.indexOf(ym);
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // เลื่อนให้เดือนที่เลือกมาอยู่กลางจอเสมอ (ทั้งตอนโหลดและตอนกดลูกศร)
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [ym]);

  const remaining = opening + income - expense;
  const canPrev = idx > 0;
  const canNext = ym < now; // กดไปข้างหน้าได้แค่ถึงเดือนปัจจุบัน
  const headerInfo = VIEW_HEADERS[currentView] || VIEW_HEADERS.day;

  return (
    <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-2xl px-3 pt-3 pb-2">
        <div className="mb-3 flex items-center justify-center gap-1.5 text-base font-bold">
          <span>{headerInfo.icon}</span>
          <span>{headerInfo.title}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="เดือนก่อนหน้า"
            disabled={!canPrev}
            onClick={() => canPrev && onChange(months[idx - 1])}
            className="shrink-0 grid place-items-center size-9 rounded-full text-muted enabled:hover:bg-surface-2 enabled:active:scale-95 disabled:opacity-25 transition"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            ref={stripRef}
            className="snap-strip flex-1 flex gap-1 overflow-x-auto px-[38%] sm:px-[40%]"
          >
            {months.map((m) => {
              const active = m === ym;
              const isFuture = m > now;
              return (
                <button
                  key={m}
                  ref={active ? activeRef : undefined}
                  onClick={() => !isFuture && onChange(m)}
                  disabled={isFuture}
                  className={clsx(
                    "snap-item shrink-0 rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold shadow-md shadow-indigo-500/30 scale-105"
                      : isFuture
                      ? "opacity-30 cursor-not-allowed text-muted"
                      : "text-muted hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  {formatMonthTH(m, true)}
                </button>
              );
            })}
          </div>

          <button
            aria-label="เดือนถัดไป"
            disabled={!canNext}
            onClick={() => {
              // หา index ถัดไปของเดือนที่ถูกเลือก (ที่ยังไม่เกิน now)
              const nextMonth = months[idx + 1];
              if (canNext && nextMonth) onChange(nextMonth);
            }}
            className="shrink-0 grid place-items-center size-9 rounded-full text-muted enabled:hover:bg-surface-2 enabled:active:scale-95 disabled:opacity-25 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="relative mt-2.5 flex items-center justify-center gap-2">
          <h1 className="text-center text-[15px] font-bold tracking-wide">
            {formatMonthTH(ym)}
          </h1>
          {closed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-expense-soft border border-expense/30 px-2.5 py-0.5 text-[11px] font-medium text-expense shadow-sm">
              <Lock size={11} /> ปิดยอดแล้ว
            </span>
          )}
          <form action="/auth/signout" method="post" className="absolute right-0">
            <button
              type="submit"
              aria-label="ออกจากระบบ"
              className="grid size-8 place-items-center rounded-xl text-muted transition hover:bg-expense-soft hover:text-expense active:scale-95"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>

        {/* ซ่อนสถิติการเงินเมื่ออยู่ในหน้าความจำ หรือหน้าหลัก */}
        {currentView !== "memo" && currentView !== "home" && (
          <>
            <dl id="tour-month-summary" className="mt-2.5 grid grid-cols-4 gap-2 text-center">
              <Stat type="opening" label="งบสัปดาห์นี้" value={opening} loading={loading} />
              <Stat type="expense" label="ใช้ไป" value={expense} loading={loading} />
              <Stat type="remaining" label="คงเหลือ" value={remaining} loading={loading} />
              <Stat type="savings" label="เงินเก็บ" value={savings} loading={loading} />
            </dl>
            {income > 0 && (
              <p className="mt-2 text-center text-[11px] text-emerald-400 font-medium tnum flex items-center justify-center gap-1">
                <span>✨ + รายรับระหว่างเดือน {formatBaht(income)} ฿</span>
              </p>
            )}
          </>
        )}
      </div>
    </header>
  );
}

function Stat({
  type,
  label,
  value,
  loading,
}: {
  type: "opening" | "expense" | "remaining" | "savings";
  label: string;
  value: number;
  loading?: boolean;
}) {
  const styles = {
    opening: "bg-blue-500/10 border-blue-500/25 text-blue-400",
    expense: "bg-rose-500/10 border-rose-500/25 text-rose-400",
    remaining: value < 0 ? "bg-rose-500/15 border-rose-500/30 text-rose-400" : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
    savings: "bg-indigo-500/10 border-indigo-500/25 text-indigo-400",
  }[type];

  return (
    <div className={clsx("rounded-2xl border py-2 px-1 backdrop-blur-md transition-all duration-200 hover:scale-[1.02]", styles)}>
      <dt className="text-[10px] font-medium opacity-80">{label}</dt>
      {loading ? (
        <dd className="flex justify-center py-[3px]">
          <Skeleton className="h-[16px] w-12" />
        </dd>
      ) : (
        <dd className="tnum text-[15px] font-bold tracking-tight">
          {formatBaht(value)}
        </dd>
      )}
    </div>
  );
}
