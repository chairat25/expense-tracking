"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Trash2, Wallet } from "lucide-react";
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  formatBaht,
  formatDayTH,
  formatTimeTH,
  shiftDate,
  todayKey,
  totals,
  type Tx,
} from "@/lib/shared";
import QuickAdd, { type NewTx } from "./QuickAdd";

type Props = {
  date: string;
  onDateChange: (d: string) => void;
  canPrev: boolean;
  canNext: boolean;
  txs: Tx[];
  onAdd: (tx: NewTx) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  locked: boolean;
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
}: Props) {
  const { income, expense, net } = totals(txs);
  const isToday = date === todayKey();
  const hasIncome = income > 0;

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
        <div className="text-center">
          <p className="font-semibold">{formatDayTH(date)}</p>
          {isToday ? (
            <p className="text-[11px] text-accent">วันนี้</p>
          ) : (
            <button
              onClick={() => onDateChange(todayKey())}
              className="text-[11px] text-muted underline underline-offset-2"
            >
              กลับไปวันนี้
            </button>
          )}
        </div>
        <NavBtn
          dir="next"
          disabled={!canNext}
          onClick={() => onDateChange(shiftDate(date, 1))}
        />
      </div>

      {/* ยังไม่ได้ตั้งเงินตั้งต้นของวัน — เตือนไว้ก่อน แต่ไม่ล็อกไม่ให้กรอกรายจ่าย */}
      {!hasIncome && !locked && (
        <div className="card border-dashed p-3 flex items-start gap-2.5 pop-in">
          <Wallet size={18} className="mt-0.5 shrink-0 text-income" />
          <p className="text-[13px] leading-relaxed text-muted">
            ยังไม่ได้ใส่<b className="text-text"> เงินตั้งต้นของวันนี้ </b>
            เลย กดปุ่ม <b className="text-income">+ รายรับ</b> ด้านล่างใส่ก่อน
            เดี๋ยวพอจบวันจะได้รู้ว่าเหลือเท่าไหร่
          </p>
        </div>
      )}

      {!locked && <QuickAdd onAdd={onAdd} />}

      {locked && (
        <div className="card p-3 text-center text-[13px] text-muted">
          เดือนนี้ปิดยอดแล้ว — แก้ไขไม่ได้ ถ้าจะแก้ให้กด &ldquo;เปิดยอดใหม่&rdquo; ที่หน้าสรุปเดือน
        </div>
      )}

      {/* สรุปของวัน — เงินตั้งต้น − ที่ใช้ไป = เหลือ */}
      <div className="card p-3">
        <div className="grid grid-cols-3 divide-x divide-border text-center">
          <Cell label="เงินตั้งต้น" value={income} tone="income" />
          <Cell label="ใช้ไป" value={expense} tone="expense" />
          <Cell label="เหลือ" value={net} tone={net < 0 ? "expense" : "income"} strong />
        </div>
        {net < 0 && (
          <p className="mt-2 rounded-lg bg-expense-soft px-2 py-1.5 text-center text-[11px] text-expense">
            ใช้เกินเงินตั้งต้นของวันไป {formatBaht(Math.abs(net))} ฿
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
