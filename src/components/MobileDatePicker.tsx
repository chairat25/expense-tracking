"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Sun,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  todayKey,
  shiftDate,
  formatDayTH,
  formatMonthTH,
  daysInMonth,
  toMonthKey,
  shiftMonth,
  thisMonthKey,
  TH_DAYS,
} from "@/lib/shared";

interface MobileDatePickerProps {
  isOpen: boolean;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

const WEEK_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function MobileDatePicker({
  isOpen,
  selectedDate,
  onSelectDate,
  onClose,
}: MobileDatePickerProps) {
  const today = todayKey();
  const yesterday = shiftDate(today, -1);
  const twoDaysAgo = shiftDate(today, -2);
  const threeDaysAgo = shiftDate(today, -3);

  // Month navigation in calendar
  const [viewYm, setViewYm] = useState(() => selectedDate.slice(0, 7));

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const [y, m] = viewYm.split("-").map(Number);
    const totalDays = daysInMonth(viewYm);
    const firstDayOfWeek = new Date(y, m - 1, 1).getDay(); // 0=Sun .. 6=Sat

    const days: { dateKey: string; dayNum: number; isCurrentMonth: boolean; isFuture: boolean }[] = [];

    // Empty slots before day 1
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        dateKey: `empty-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        isFuture: false,
      });
    }

    // Days in month
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = `${viewYm}-${String(day).padStart(2, "0")}`;
      const isFuture = dateKey > today;
      days.push({
        dateKey,
        dayNum: day,
        isCurrentMonth: true,
        isFuture,
      });
    }

    return days;
  }, [viewYm, today]);

  if (!isOpen) return null;

  const currentYm = thisMonthKey();
  const canGoNextMonth = viewYm < currentYm;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-[32px] border border-slate-800 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl sm:rounded-[28px] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber handle bar */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-700/80 sm:hidden" />

        {/* 1. Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CalendarIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">เลือกวันที่</h3>
              <p className="text-[11px] text-slate-400">ระบุวันที่ต้องการบันทึกหรือดูย้อนหลัง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Quick Preset Chips (Thumb-friendly row) */}
        <div className="my-3.5 flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
          {[
            { label: "☀️ วันนี้", date: today },
            { label: "⏪ เมื่อวาน", date: yesterday },
            { label: "2 วันก่อน", date: twoDaysAgo },
            { label: "3 วันก่อน", date: threeDaysAgo },
          ].map((preset) => {
            const isSelected = selectedDate === preset.date;
            return (
              <button
                key={preset.date}
                type="button"
                onClick={() => {
                  onSelectDate(preset.date);
                  onClose();
                }}
                className={clsx(
                  "flex-1 rounded-xl py-2 px-2 text-center text-xs font-semibold transition-all active:scale-95 shrink-0",
                  isSelected
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* 3. Month Switcher */}
        <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2 border border-slate-800/80 mb-3">
          <button
            type="button"
            onClick={() => setViewYm(shiftMonth(viewYm, -1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-200">
            {formatMonthTH(viewYm)}
          </span>
          <button
            type="button"
            onClick={() => canGoNextMonth && setViewYm(shiftMonth(viewYm, 1))}
            disabled={!canGoNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 4. Calendar Matrix */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-3 shadow-inner">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEK_DAYS_SHORT.map((wd, i) => (
              <span
                key={wd}
                className={clsx(
                  "text-[10px] font-bold uppercase",
                  i === 0 ? "text-rose-400" : i === 6 ? "text-indigo-400" : "text-slate-400"
                )}
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((d) => {
              if (!d.isCurrentMonth) {
                return <div key={d.dateKey} className="h-9 w-9" />;
              }

              const isSelected = selectedDate === d.dateKey;
              const isToday = today === d.dateKey;

              return (
                <button
                  key={d.dateKey}
                  type="button"
                  disabled={d.isFuture}
                  onClick={() => {
                    onSelectDate(d.dateKey);
                    onClose();
                  }}
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all active:scale-90 relative mx-auto",
                    isSelected
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105"
                      : isToday
                      ? "border-2 border-emerald-500/80 text-emerald-400 bg-emerald-500/10"
                      : d.isFuture
                      ? "text-slate-700 opacity-30 cursor-not-allowed pointer-events-none"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <span>{d.dayNum}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Bottom Quick Confirm */}
        <div className="mt-4 flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              onSelectDate(today);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw size={13} className="text-emerald-400" />
            <span>กลับสู่วันนี้</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors"
          >
            เรียบร้อย
          </button>
        </div>
      </div>
    </div>
  );
}
