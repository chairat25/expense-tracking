"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
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
import QuickAdd, { type NewTx } from "./QuickAdd";
import CustomDatePicker from "./CustomDatePicker";

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
  const { income, expense } = totals(txs);
  const isToday = date === todayKey();

  const [showPicker, setShowPicker] = useState(false);

  const [editingBudget, setEditingBudget] = useState(false);
  const [draftBudget, setDraftBudget] = useState(String(dailyBudget));
  const remaining = dailyBudget + income - expense;

  // ลบต้องกด 2 ครั้ง กันนิ้วเผลอโดนบนมือถือ — ค้างไว้ 3 วิแล้วรีเซ็ตเอง
  const [confirmId, setConfirmId] = useState<number | null>(null);
  useEffect(() => {
    if (confirmId === null) return;
    const t = setTimeout(() => setConfirmId(null), 3000);
    return () => clearTimeout(t);
  }, [confirmId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <NavBtn
          dir="prev"
          disabled={!canPrev}
          onClick={() => onDateChange(shiftDate(date, -1))}
        />
        <div id="tour-date-picker" className="relative text-center flex-1 mx-2">
          <div 
            className="cursor-pointer transition hover:bg-surface-2 rounded-xl py-1 select-none"
            onClick={() => setShowPicker(!showPicker)}
          >
            <p className="font-semibold">{formatDayTH(date)}</p>
            {isToday ? (
              <p className="text-[11px] text-accent mt-0.5">วันนี้</p>
            ) : (
              <div className="mt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    // ให้ปุ่มนี้ยังกดได้โดยไม่ไปโดน DatePicker ถ้ายิง Event มา
                    e.preventDefault();
                    e.stopPropagation();
                    onDateChange(todayKey());
                    setShowPicker(false);
                  }}
                  className="text-[11px] text-muted underline underline-offset-2 pointer-events-auto relative z-20"
                >
                  กลับไปวันนี้
                </button>
              </div>
            )}
          </div>
          
          {showPicker && (
            <CustomDatePicker
              date={date}
              onChange={(d) => {
                onDateChange(d);
                setShowPicker(false);
              }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
        <NavBtn
          dir="next"
          disabled={!canNext}
          onClick={() => onDateChange(shiftDate(date, 1))}
        />
      </div>

      {!locked && <QuickAdd onAdd={onAdd} />}

      {locked && (
        <div className="card p-3 text-center text-[13px] text-muted">
          เดือนนี้ปิดยอดแล้ว — แก้ไขไม่ได้ ถ้าจะแก้ให้กด &ldquo;เปิดยอดใหม่&rdquo; ที่หน้าสรุปเดือน
        </div>
      )}

      {/* สรุปของวัน — เงินตั้งต้น + รายรับ − ที่ใช้ไป = เหลือ */}
      <div id="tour-daily-budget" className="card p-3">
        {editingBudget && !locked ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const v = Number(draftBudget);
              if (Number.isFinite(v) && v >= 0) await onBudgetChange(v);
              setEditingBudget(false);
            }}
            className="mb-3 flex gap-2"
          >
            <input
              autoFocus
              value={draftBudget}
              onChange={(e) => setDraftBudget(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              className="tnum min-w-0 flex-1 rounded-xl border border-accent bg-surface-2 px-3 py-2 text-sm font-bold outline-none"
              placeholder={
                budgetMode === "week"
                  ? "เงินต่อวัน (ใช้กับทุกวันที่เหลือในสัปดาห์)"
                  : "กรอกเงินเฉลี่ยต่อวัน"
              }
            />
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 text-sm font-semibold text-white active:scale-95 transition hover:bg-accent/90"
            >
              บันทึก
            </button>
            <button
              type="button"
              onClick={() => setEditingBudget(false)}
              className="rounded-xl px-2 text-sm text-muted hover:bg-surface-2 transition"
            >
              ยกเลิก
            </button>
          </form>
        ) : (
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
        )}
        <div className="grid grid-cols-3 divide-x divide-border text-center">
          <Cell label="เฉลี่ย/วัน" value={dailyBudget} tone="income" />
          <Cell label="ใช้ไป" value={expense} tone="expense" />
          <Cell label="เหลือ" value={remaining} tone={remaining < 0 ? "expense" : "income"} strong />
        </div>
        {week && (
          <p className="tnum mt-2 text-center text-[11px] text-muted">
            งบสัปดาห์นี้ {formatBaht(week.envelope)} ฿ · เหลืออีก {week.daysLeft}{" "}
            วัน
          </p>
        )}
        {remaining < 0 && (
          <p className="mt-2 rounded-lg bg-expense-soft px-2 py-1.5 text-center text-[11px] text-expense">
            ใช้เกินโควตาของวันนี้ไป {formatBaht(Math.abs(remaining))} ฿
          </p>
        )}
      </div>

      {txs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          ยังไม่มีรายการของวันนี้
        </p>
      ) : (
        <ul className="card divide-y divide-border overflow-hidden">
          {txs.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-3 pop-in">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-base">
                {t.type === "income" ? "💰" : CATEGORY_ICON[t.category]}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {t.note || (
                    <span className="text-muted">
                      {t.type === "income" ? "รายรับ" : CATEGORY_LABEL[t.category]}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted">
                  {formatTimeTH(t.spentAt)}
                  {t.type === "expense" && ` · ${CATEGORY_LABEL[t.category]}`}
                </p>
              </div>

              <span
                className={clsx(
                  "tnum shrink-0 text-sm font-semibold",
                  t.type === "income" ? "text-income" : "text-expense",
                )}
              >
                {t.type === "income" ? "+" : "−"}
                {formatBaht(t.amount)}
              </span>

              {!locked &&
                (confirmId === t.id ? (
                  <button
                    onClick={() => {
                      setConfirmId(null);
                      void onDelete(t.id);
                    }}
                    className="shrink-0 rounded-lg bg-expense px-2.5 py-1.5 text-[11px] font-semibold text-white active:scale-95"
                  >
                    แน่ใจ?
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmId(t.id)}
                    aria-label="ลบรายการ"
                    className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-expense-soft hover:text-expense active:scale-90"
                  >
                    <Trash2 size={15} />
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NavBtn({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={dir === "prev" ? "วันก่อนหน้า" : "วันถัดไป"}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-muted transition enabled:hover:bg-surface-2 enabled:active:scale-95 disabled:opacity-25"
    >
      <Icon size={20} />
    </button>
  );
}

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

function Cell({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: number;
  tone: "income" | "expense";
  strong?: boolean;
}) {
  return (
    <div className="px-1">
      <p className="text-[10px] text-muted">{label}</p>
      <p
        className={clsx(
          "tnum font-semibold",
          strong ? "text-lg" : "text-base",
          tone === "income" ? "text-income" : "text-expense",
        )}
      >
        {formatBaht(value)}
      </p>
    </div>
  );
}
