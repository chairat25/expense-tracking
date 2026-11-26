"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  ReceiptText,
  CreditCard,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Clock,
  Landmark,
} from "lucide-react";
import WorkspaceHeader from "./WorkspaceHeader";
import { formatBaht } from "../lib/shared";

interface DebtItem {
  id: string;
  name: string;
  lender: string;
  monthlyAmount: number;
  totalRemaining?: number;
  dueDate: number; // Day of month (e.g. 5, 25)
  isPaidThisMonth: boolean;
  category: "installment" | "credit_card" | "utility" | "loan";
}

const INITIAL_DEBTS: DebtItem[] = [
  {
    id: "d1",
    name: "ค่างวดผ่อนรถยนต์",
    lender: "ธนาคารกสิกรไทย",
    monthlyAmount: 8500,
    totalRemaining: 153000,
    dueDate: 5,
    isPaidThisMonth: true,
    category: "installment",
  },
  {
    id: "d2",
    name: "สินเชื่อคอนโดมิเนียม",
    lender: "ธนาคารไทยพาณิชย์",
    monthlyAmount: 14200,
    totalRemaining: 2450000,
    dueDate: 25,
    isPaidThisMonth: false,
    category: "loan",
  },
  {
    id: "d3",
    name: "บัตรเครดิตรอบบิล",
    lender: "KTC",
    monthlyAmount: 4350,
    dueDate: 28,
    isPaidThisMonth: false,
    category: "credit_card",
  },
];

export default function DebtsWorkspaceView() {
  const [debts, setDebts] = useState<DebtItem[]>(INITIAL_DEBTS);

  const totalMonthlyDebt = debts.reduce((sum, d) => sum + (d?.monthlyAmount || 0), 0);
  const paidMonthlyDebt = debts
    .filter((d) => d?.isPaidThisMonth)
    .reduce((sum, d) => sum + (d?.monthlyAmount || 0), 0);
  const pendingMonthlyDebt = totalMonthlyDebt - paidMonthlyDebt;

  const togglePaid = (id: string) => {
    setDebts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPaidThisMonth: !item.isPaidThisMonth } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500/30">
      <WorkspaceHeader activeWorkspace="debts" />

      <main className="mx-auto max-w-md px-4 py-5 sm:max-w-xl space-y-4">
        {/* Workspace Title & Badge */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
              <ReceiptText size={12} />
              <span>พื้นที่จัดการหนี้สินรายเดือน</span>
            </div>
            <h1 className="text-xl font-bold text-white">หนี้สินและค่างวด</h1>
          </div>

          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>เพิ่มรายการ</span>
          </button>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
            <span className="block text-[10px] font-medium text-slate-400">
              ภาระรวมเดือนนี้
            </span>
            <span className="block text-xs sm:text-sm font-bold text-rose-400 truncate">
              ฿{formatBaht(totalMonthlyDebt)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
            <span className="block text-[10px] font-medium text-slate-400">
              ชำระแล้ว
            </span>
            <span className="block text-xs sm:text-sm font-bold text-emerald-400 truncate">
              ฿{formatBaht(paidMonthlyDebt)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
            <span className="block text-[10px] font-medium text-slate-400">
              คงเหลือต้องจ่าย
            </span>
            <span className="block text-xs sm:text-sm font-bold text-amber-400 truncate">
              ฿{formatBaht(pendingMonthlyDebt)}
            </span>
          </div>
        </div>

        {/* Debt Obligations List */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              รายการรอบบิลและค่างวด ({debts.length})
            </h2>
            <span className="text-[11px] text-slate-500">แตะเพื่อเปลี่ยนสถานะชำระ</span>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
            {debts.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => togglePaid(item.id)}
                  className="flex items-center justify-between p-3.5 transition-colors hover:bg-slate-800/40 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={clsx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm",
                        item.isPaidThisMonth
                          ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                          : "bg-rose-950/40 border-rose-500/30 text-rose-400"
                      )}
                    >
                      {item.isPaidThisMonth ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <CreditCard size={18} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={clsx(
                            "truncate text-sm font-medium",
                            item.isPaidThisMonth
                              ? "text-slate-400 line-through"
                              : "text-slate-200"
                          )}
                        >
                          {item.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{item.lender}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-300">
                          <CalendarClock size={11} />
                          <span>ครบกำหนดวันที่ {item.dueDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-3">
                    <span
                      className={clsx(
                        "text-sm font-bold tracking-tight",
                        item.isPaidThisMonth ? "text-slate-500" : "text-rose-400"
                      )}
                    >
                      ฿{formatBaht(item.monthlyAmount)}
                    </span>
                    <span
                      className={clsx(
                        "text-[10px] font-semibold mt-0.5",
                        item.isPaidThisMonth
                          ? "text-emerald-400"
                          : "text-amber-400"
                      )}
                    >
                      {item.isPaidThisMonth ? "ชำระแล้ว" : "รอชำระ"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
