"use client";

import Link from "next/link";
import clsx from "clsx";
import {
  WalletCards,
  ReceiptText,
  Coins,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export interface WorkspaceCardItem {
  id: "daily" | "debts" | "salary";
  title: string;
  href: string;
  accentColor: "emerald" | "rose" | "indigo";
  buttonBg: string;
  shadowClass: string;
  icon: typeof WalletCards;
}

export const WORKSPACE_CARDS: WorkspaceCardItem[] = [
  {
    id: "daily",
    title: "รายรับ-รายจ่าย รายวัน",
    href: "/daily",
    accentColor: "emerald",
    buttonBg: "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700",
    shadowClass: "shadow-lg shadow-emerald-600/35 hover:shadow-emerald-500/45",
    icon: WalletCards,
  },
  {
    id: "debts",
    title: "หนี้สินรายเดือน",
    href: "/debts",
    accentColor: "rose",
    buttonBg: "bg-rose-600 hover:bg-rose-500 active:bg-rose-700",
    shadowClass: "shadow-lg shadow-rose-600/35 hover:shadow-rose-500/45",
    icon: ReceiptText,
  },
  {
    id: "salary",
    title: "เงินเดือน",
    href: "/salary",
    accentColor: "indigo",
    buttonBg: "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700",
    shadowClass: "shadow-lg shadow-indigo-600/35 hover:shadow-indigo-500/45",
    icon: Coins,
  },
];

export default function LandingHubView() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 sm:max-w-xl">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Expense Tracking
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded-full px-2.5 py-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Workspace Hub</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-xl space-y-6">
        {/* Heading */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Financial Workspaces
          </h1>
          <p className="text-xs text-slate-400">
            เลือกหน้าจัดการที่ต้องการ
          </p>
        </div>

        {/* 3 Compact Vibrant Action Buttons */}
        <div className="flex flex-col items-center space-y-3 pt-2">
          {WORKSPACE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className={clsx(
                  "group flex w-full max-w-[310px] sm:max-w-[330px] items-center justify-between rounded-2xl px-5 py-3.5 text-white font-bold transition-all duration-200 active:scale-95",
                  card.buttonBg,
                  card.shadowClass
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm">
                    <Icon size={18} />
                  </div>
                  <span className="text-sm sm:text-base font-bold tracking-wide truncate">
                    {card.title}
                  </span>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-200 group-hover:translate-x-1">
                  <ArrowRight size={15} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-4 text-center text-[11px] text-slate-500">
          <span>สามารถสลับ Workspace ได้ตลอดเวลาผ่านเมนูด้านบน</span>
        </div>
      </main>
    </div>
  );
}
