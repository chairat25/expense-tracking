"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Coins,
  Banknote,
  PieChart,
  Plus,
  ShieldCheck,
  Wallet,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import WorkspaceHeader from "./WorkspaceHeader";
import { formatBaht } from "../lib/shared";

interface SalaryPocketItem {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  colorClass: string;
  badgeClass: string;
  icon: typeof Wallet;
}

const INITIAL_SALARY = 45000;

const INITIAL_POCKETS: SalaryPocketItem[] = [
  {
    id: "p1",
    name: "ค่าใช้จ่ายจำเป็นประจำเดือน (Fixed Needs)",
    percentage: 50,
    amount: 22500,
    colorClass: "text-indigo-400",
    badgeClass: "bg-indigo-500/10 border-indigo-500/30",
    icon: Wallet,
  },
  {
    id: "p2",
    name: "ซองงบใช้จ่ายรายสัปดาห์ (Weekly Envelopes)",
    percentage: 30,
    amount: 13500,
    colorClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 border-emerald-500/30",
    icon: Calendar,
  },
  {
    id: "p3",
    name: "เงินออมและสำรองฉุกเฉิน (Savings & Buffer)",
    percentage: 20,
    amount: 9000,
    colorClass: "text-amber-400",
    badgeClass: "bg-amber-500/10 border-amber-500/30",
    icon: Coins,
  },
];

export default function SalaryWorkspaceView() {
  const [salaryAmount, setSalaryAmount] = useState<number>(INITIAL_SALARY);
  const [pockets, setPockets] = useState<SalaryPocketItem[]>(INITIAL_POCKETS);

  const totalAllocated = pockets.reduce((sum, p) => sum + (p?.amount || 0), 0);
  const remainingAmount = salaryAmount - totalAllocated;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30">
      <WorkspaceHeader activeWorkspace="salary" />

      <main className="mx-auto max-w-md px-4 py-5 sm:max-w-xl space-y-4">
        {/* Workspace Title & Badge */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
              <Coins size={12} />
              <span>พื้นที่จัดการเงินเดือนและการจัดสรร</span>
            </div>
            <h1 className="text-xl font-bold text-white">เงินเดือนและ Pocket</h1>
          </div>

          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>เพิ่ม Pocket</span>
          </button>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
            <span className="block text-[10px] font-medium text-slate-400">
              เงินเดือนรอบนี้
            </span>
            <span className="block text-xs sm:text-sm font-bold text-indigo-400 truncate">
              ฿{formatBaht(salaryAmount)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
            <span className="block text-[10px] font-medium text-slate-400">
              จัดสรรลงกระเป๋า
            </span>
            <span className="block text-xs sm:text-sm font-bold text-emerald-400 truncate">
              ฿{formatBaht(totalAllocated)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
            <span className="block text-[10px] font-medium text-slate-400">
              คงเหลือยังไม่จัดสรร
            </span>
            <span className="block text-xs sm:text-sm font-bold text-slate-300 truncate">
              ฿{formatBaht(remainingAmount)}
            </span>
          </div>
        </div>

        {/* Pockets List */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              กระเป๋าและซองงบประมาณ ({pockets.length})
            </h2>
            <span className="text-[11px] text-slate-500">แผนการแบ่งเงินรายเดือน</span>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
            {pockets.map((pocket) => {
              const Icon = pocket.icon;
              return (
                <div
                  key={pocket.id}
                  className="flex items-center justify-between p-3.5 transition-colors hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={clsx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm",
                        pocket.badgeClass
                      )}
                    >
                      <Icon size={18} className={pocket.colorClass} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {pocket.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>สัดส่วน {pocket.percentage}% ของเงินเดือน</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-3">
                    <span className="text-sm font-bold text-white tracking-tight">
                      ฿{formatBaht(pocket.amount)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 mt-0.5">
                      พร้อมใช้งาน
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
