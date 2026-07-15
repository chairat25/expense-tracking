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

type Props = {
  month: MonthData;
  onOpeningChange: (v: number) => Promise<void>;
  onToggleClose: (closed: boolean) => Promise<void>;
  onCarryOver: (remaining: number) => Promise<void>;
  onPickDay: (date: string) => void;
};

export default function MonthView({
  month,
  onOpeningChange,
  onToggleClose,
  onCarryOver,
  onPickDay,
}: Props) {
  const { ym, openingBalance, closedAt, transactions } = month;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(openingBalance));

  const { income, expense } = totals(transactions);
  const remaining = openingBalance + income - expense;

  // ไล่ยอดคงเหลือสะสมทีละวัน เหมือนคอลัมน์ "รวม" ในชีตเดิม
  const rows = useMemo(() => {
    const n = daysInMonth(ym);
    let running = openingBalance;
    return Array.from({ length: n }, (_, i) => {
      const date = `${ym}-${String(i + 1).padStart(2, "0")}`;
      const dayTxs = transactions.filter((t) => t.date === date);
      const t = totals(dayTxs);
      running += t.net;
      return {
        date,
        day: i + 1,
        weekday: TH_DAYS[new Date(...dateParts(date)).getDay()][0],
        income: t.income,
        expense: t.expense,
        running,
        empty: dayTxs.length === 0,
        note: summarize(dayTxs),
      };
    });
  }, [ym, openingBalance, transactions]);

  const byCategory = useMemo(() => {
    const m = new Map<Category, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const closed = closedAt !== null;
  const today = todayKey();

  return (
    <div className="space-y-3">
      {/* ยอดยกมา */}
      <div className="card p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] text-muted">เงินใช้เดือนนี้ทั้งหมด</p>
          {!closed && !editing && (
            <button
              onClick={() => {
                setDraft(String(openingBalance));
                setEditing(true);
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-accent hover:bg-accent/10"
            >
              <Pencil size={12} /> แก้ไข
            </button>
          )}
        </div>

        {editing ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const v = Number(draft);
              if (Number.isFinite(v) && v >= 0) await onOpeningChange(v);
              setEditing(false);
            }}
            className="mt-2 flex gap-2"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              className="tnum min-w-0 flex-1 rounded-xl border border-accent bg-surface-2 px-3 py-2 text-lg font-bold outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 text-sm font-semibold text-white active:scale-95"
            >
              บันทึก
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl px-3 text-sm text-muted"
            >
              ยกเลิก
            </button>
          </form>
        ) : (
          <p className="tnum mt-1 text-2xl font-bold">
            {formatBaht(openingBalance)} <span className="text-base text-muted">฿</span>
          </p>
        )}
      </div>

      {/* สรุปยอดสิ้นเดือน */}
      <div className="card overflow-hidden">
        <div className="space-y-2 p-4">
          <Line label="เงินใช้เดือนนี้ทั้งหมด" value={openingBalance} />
          <Line label="รายรับระหว่างเดือน" value={income} sign="+" tone="income" />
          <Line label="รายจ่ายทั้งเดือน" value={expense} sign="−" tone="expense" />
          <div className="!mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-semibold">คงเหลือ</span>
            <span
              className={clsx(
                "tnum text-2xl font-bold",
                remaining < 0 ? "text-expense" : "text-income",
              )}
            >
              {formatBaht(remaining)} ฿
            </span>
          </div>
        </div>

        <button
          onClick={() => void onToggleClose(!closed)}
          className={clsx(
            "flex w-full items-center justify-center gap-2 border-t border-border py-3 text-sm font-semibold transition",
            closed
              ? "text-muted hover:bg-surface-2"
              : "bg-accent text-white hover:brightness-110",
          )}
        >
          {closed ? (
            <>
              <LockOpen size={15} /> เปิดยอดใหม่เพื่อแก้ไข
            </>
          ) : (
            <>
              <Lock size={15} /> ปิดยอดสิ้นเดือน {formatMonthTH(ym)}
            </>
          )}
        </button>

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
      </div>

      {byCategory.length > 0 && (
        <div className="card p-4">
          <p className="mb-3 text-[13px] font-semibold text-muted">
            รายจ่ายแยกตามหมวด
          </p>
          <ul className="space-y-2">
            {byCategory.map(([cat, amt]) => (
              <li key={cat}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{CATEGORY_LABEL[cat]}</span>
                  <span className="tnum text-muted">
                    {formatBaht(amt)} · {Math.round((amt / expense) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-expense"
                    style={{ width: `${(amt / expense) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ตารางรายวัน หน้าตาแบบชีตเดิม */}
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-[11px] text-muted">
              <th className="px-2 py-2 text-left font-medium">วันที่</th>
              <th className="px-2 py-2 text-left font-medium">รายการ</th>
              <th className="px-2 py-2 text-right font-medium">รับ</th>
              <th className="px-2 py-2 text-right font-medium">จ่าย</th>
              <th className="px-2 py-2 text-right font-medium">คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.date}
                onClick={() => onPickDay(r.date)}
                className={clsx(
                  "cursor-pointer border-b border-border/60 transition last:border-0 hover:bg-surface-2",
                  r.empty && "text-muted/50",
                  r.date === today && "bg-accent/[0.06]",
                )}
              >
                <td className="whitespace-nowrap px-2 py-2 tnum">
                  {r.day} <span className="text-[10px] text-muted">{r.weekday}</span>
                </td>
                <td className="max-w-0 truncate px-2 py-2">{r.note || "—"}</td>
                <td className="tnum px-2 py-2 text-right text-income">
                  {r.income ? formatBaht(r.income) : ""}
                </td>
                <td className="tnum px-2 py-2 text-right text-expense">
                  {r.expense ? formatBaht(r.expense) : ""}
                </td>
                <td
                  className={clsx(
                    "tnum px-2 py-2 text-right font-medium",
                    r.running < 0 && "text-expense",
                  )}
                >
                  {formatBaht(r.running)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function dateParts(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y, m - 1, d];
}

/** ย่อรายการของวันให้เหลือข้อความเดียว เช่น 'ชาเขียว, ข้าวมันไก่ +2' */
function summarize(txs: { note: string; category: Category; type: string }[]) {
  const names = txs
    .filter((t) => t.type === "expense")
    .map((t) => t.note || CATEGORY_LABEL[t.category]);
  if (names.length === 0) return "";
  const head = names.slice(0, 2).join(", ");
  return names.length > 2 ? `${head} +${names.length - 2}` : head;
}

function Line({
  label,
  value,
  sign,
  tone,
}: {
  label: string;
  value: number;
  sign?: string;
  tone?: "income" | "expense";
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span
        className={clsx(
          "tnum",
          tone === "income" && "text-income",
          tone === "expense" && "text-expense",
        )}
      >
        {sign} {formatBaht(value)}
      </span>
    </div>
  );
}
