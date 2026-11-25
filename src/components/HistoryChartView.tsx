"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowUpRight, Flame, TrendingDown, TrendingUp } from "lucide-react";
import { formatBaht, formatDayTH } from "@/lib/shared";

export interface DailyHistoryItem {
  date: string;
  expense: number;
  income: number;
  count: number;
}

interface HistoryChartViewProps {
  historyList: DailyHistoryItem[];
  selectedDate: string;
  today: string;
  yesterday: string;
  onSelectDate: (date: string) => void;
}

/**
 * Interactive 14-day bar chart and KPI summary for the History modal.
 */
export default function HistoryChartView({
  historyList,
  selectedDate,
  today,
  yesterday,
  onSelectDate,
}: HistoryChartViewProps) {
  // Sort oldest -> newest from left to right for chronological trend reading.
  const chronologicalItems = useMemo(
    () => [...(historyList ?? [])].reverse(),
    [historyList]
  );

  const { totalExpense, avgExpense, maxExpense, peakItem } = useMemo(() => {
    let total = 0;
    let max = 0;
    let peak: DailyHistoryItem | null = null;

    for (const item of chronologicalItems) {
      const exp = Number(item?.expense ?? 0);
      total += exp;
      if (exp > max) {
        max = exp;
        peak = item;
      }
    }

    const avg = chronologicalItems.length > 0 ? total / chronologicalItems.length : 0;
    return {
      totalExpense: total,
      avgExpense: avg,
      maxExpense: max,
      peakItem: peak,
    };
  }, [chronologicalItems]);

  const [activeDate, setActiveDate] = useState<string>(
    () => today || selectedDate || ""
  );

  useEffect(() => {
    const exists = chronologicalItems.some((item) => item?.date === activeDate);
    if (!exists) {
      setActiveDate(today || selectedDate || "");
    }
  }, [chronologicalItems, activeDate, selectedDate, today]);

  const activeItem =
    chronologicalItems.find((item) => item?.date === activeDate) ??
    chronologicalItems[chronologicalItems.length - 1] ??
    null;

  const chartScrollRef = useRef<HTMLDivElement | null>(null);
  const activeBarRef = useRef<HTMLButtonElement | null>(null);

  // Scroll the chart to the active (latest) bar on mount and whenever data loads
  useLayoutEffect(() => {
    const scrollToActiveBar = () => {
      const container = chartScrollRef.current;
      if (!container) return;
      const activeEl = activeBarRef.current;
      if (activeEl) {
        const elLeft = activeEl.offsetLeft;
        const elRight = elLeft + activeEl.offsetWidth;
        const viewLeft = container.scrollLeft;
        const viewRight = viewLeft + container.clientWidth;

        if (elRight > viewRight) {
          container.scrollLeft = Math.max(
            0,
            elRight - container.clientWidth + 8
          );
        } else if (elLeft < viewLeft) {
          container.scrollLeft = Math.max(0, elLeft - 8);
        }
      } else {
        container.scrollLeft = container.scrollWidth;
      }
    };

    scrollToActiveBar();
    const rafId = requestAnimationFrame(scrollToActiveBar);
    return () => cancelAnimationFrame(rafId);
  }, [chronologicalItems, activeItem?.date]);

  const activeExpense = Number(activeItem?.expense ?? 0);
  const activeIncome = Number(activeItem?.income ?? 0);
  const activeCount = Number(activeItem?.count ?? 0);
  const activeIsToday = activeItem?.date === today;
  const activeIsYesterday = activeItem?.date === yesterday;

  return (
    <div className="space-y-3">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-2.5">
          <span className="block text-[10px] font-medium text-slate-400">
            รวม {chronologicalItems.length} วัน
          </span>
          <span className="mt-0.5 block truncate text-xs font-bold text-rose-400">
            -฿{formatBaht(totalExpense)}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-2.5">
          <span className="block text-[10px] font-medium text-slate-400">
            เฉลี่ย/วัน
          </span>
          <span className="mt-0.5 block truncate text-xs font-bold text-slate-200">
            ฿{formatBaht(avgExpense)}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-2.5">
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
            <Flame size={11} className="shrink-0 text-amber-400" />
            <span>สูงสุด</span>
          </span>
          <span className="mt-0.5 block truncate text-xs font-bold text-amber-400">
            ฿{formatBaht(maxExpense)}
          </span>
          {peakItem?.date && maxExpense > 0 && (
            <span className="block truncate text-[10px] text-slate-500">
              {formatDayTH(peakItem.date)}
            </span>
          )}
        </div>
      </div>

      {/* Interactive Vertical Bar Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>แนวโน้มรายจ่ายรายวัน (แตะแท่งเพื่อดูยอด)</span>
          <span className="text-[10px] text-slate-500">เก่า → ล่าสุด</span>
        </div>

        <div
          ref={chartScrollRef}
          className="relative flex items-end justify-between gap-1.5 overflow-x-auto pt-2 pb-1"
        >
          {chronologicalItems.map((item) => {
            const exp = Number(item?.expense ?? 0);
            const dateStr = item?.date ?? "";
            const isActive = dateStr === activeItem?.date;
            const isPeak = maxExpense > 0 && exp === maxExpense;
            const isItemToday = dateStr === today;
            const heightPct =
              maxExpense > 0 && exp > 0
                ? Math.max(10, Math.round((exp / maxExpense) * 100))
                : 0;
            const dayNum = dateStr.length >= 10 ? dateStr.slice(8, 10) : dateStr;

            return (
              <button
                key={dateStr}
                ref={isActive ? activeBarRef : undefined}
                type="button"
                onClick={() => setActiveDate(dateStr)}
                className="group flex min-w-[20px] flex-1 flex-col items-center gap-1.5 focus:outline-none"
                title={`${formatDayTH(dateStr)}: ฿${formatBaht(exp)}`}
              >
                {/* Fixed-height bar track so percentage height always resolves reliably */}
                <div className="flex h-32 w-full items-end justify-center">
                  <div
                    className={clsx(
                      "w-full max-w-[16px] rounded-t-md transition-all",
                      exp <= 0
                        ? "h-1 bg-slate-800/80"
                        : isPeak
                        ? "bg-rose-500"
                        : "bg-rose-500/55 group-hover:bg-rose-400/80",
                      isActive && "ring-2 ring-emerald-400/80 ring-offset-1 ring-offset-slate-950"
                    )}
                    style={exp > 0 ? { height: `${heightPct}%` } : undefined}
                  />
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className={clsx(
                      "text-[10px] font-medium tabular-nums",
                      isActive
                        ? "font-bold text-emerald-400"
                        : isPeak
                        ? "font-semibold text-rose-400"
                        : "text-slate-500"
                    )}
                  >
                    {dayNum}
                  </span>
                  <span
                    className={clsx(
                      "h-1 w-1 rounded-full",
                      isItemToday ? "bg-emerald-400" : "bg-transparent"
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Bar Detail Card */}
      {activeItem && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950 p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-xs font-bold text-white">
                {formatDayTH(activeItem?.date ?? "")}
              </span>
              {(activeIsToday || activeIsYesterday) && (
                <span
                  className={clsx(
                    "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                    activeIsToday
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  )}
                >
                  {activeIsToday ? "วันนี้" : "เมื่อวาน"}
                </span>
              )}
              {peakItem?.date === activeItem?.date && maxExpense > 0 && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">
                  <Flame size={9} />
                  <span>ใช้สูงสุด</span>
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px]">
              <span className="text-slate-400">
                {activeCount > 0 ? `${activeCount} รายการ` : "ไม่มีรายการ"}
              </span>
              {activeExpense > 0 && (
                <span className="inline-flex items-center gap-0.5 font-bold text-rose-400">
                  <TrendingDown size={11} />
                  -฿{formatBaht(activeExpense)}
                </span>
              )}
              {activeIncome > 0 && (
                <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-400">
                  <TrendingUp size={11} />
                  +฿{formatBaht(activeIncome)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectDate(activeItem?.date ?? today)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 transition-all hover:border-emerald-400 hover:bg-emerald-900/60 active:scale-95"
          >
            <span>เปิดดูวันนี้</span>
            <ArrowUpRight size={13} className="shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
}
