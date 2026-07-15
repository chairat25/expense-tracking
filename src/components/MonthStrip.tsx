"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Lock, LogOut } from "lucide-react";
import clsx from "clsx";
import { formatBaht, formatMonthTH, shiftMonth, thisMonthKey } from "@/lib/shared";

type Props = {
  ym: string;
  onChange: (ym: string) => void;
  opening: number;
  income: number;
  expense: number;
  savings: number;
  closed: boolean;
};

/** เดือนที่ให้เลื่อนได้: ย้อนหลัง 12 เดือน ถึงเดือนปัจจุบัน (อนาคตกรอกไม่ได้) */
function monthRange(): string[] {
  const now = thisMonthKey();
  return Array.from({ length: 13 }, (_, i) => shiftMonth(now, i - 12));
}

export default function MonthStrip({
  ym,
  onChange,
  opening,
  income,
  expense,
  savings,
  closed,
}: Props) {
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
  const canNext = idx < months.length - 1;

  return (
    <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-2xl px-3 pt-3 pb-2">
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
              return (
                <button
                  key={m}
                  ref={active ? activeRef : undefined}
                  onClick={() => onChange(m)}
                  className={clsx(
                    "snap-item shrink-0 rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition",
                    active
                      ? "bg-accent text-white font-semibold shadow"
                      : "text-muted hover:bg-surface-2",
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
            onClick={() => canNext && onChange(months[idx + 1])}
            className="shrink-0 grid place-items-center size-9 rounded-full text-muted enabled:hover:bg-surface-2 enabled:active:scale-95 disabled:opacity-25 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="relative mt-2 flex items-center justify-center gap-2">
          <h1 className="text-center text-[15px] font-semibold">
            {formatMonthTH(ym)}
          </h1>
          {closed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[11px] text-muted">
              <Lock size={11} /> ปิดยอดแล้ว
            </span>
          )}
          <form action="/auth/signout" method="post" className="absolute right-0">
            <button
              type="submit"
              aria-label="ออกจากระบบ"
              className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-expense-soft hover:text-expense active:scale-95"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>

        <dl className="mt-2 grid grid-cols-4 gap-2 text-center">
          <Stat label="เงินใช้เดือนนี้ทั้งหมด" value={opening} />
          <Stat label="ใช้ไป" value={expense} tone="expense" />
          <Stat label="คงเหลือ" value={remaining} strong />
          <Stat label="เงินเก็บ" value={savings} />
        </dl>
        {income > 0 && (
          <p className="mt-1.5 text-center text-[11px] text-muted tnum">
            + รายรับระหว่างเดือน {formatBaht(income)} ฿
          </p>
        )}
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: number;
  tone?: "expense";
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface border border-border py-1.5">
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd
        className={clsx(
          "tnum text-[15px] font-semibold",
          tone === "expense" && "text-expense",
          strong && (value < 0 ? "text-expense" : "text-income"),
        )}
      >
        {formatBaht(value)}
      </dd>
    </div>
  );
}
