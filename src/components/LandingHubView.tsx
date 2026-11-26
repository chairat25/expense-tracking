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
  gradientBg: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
  icon: typeof WalletCards;
}

export const WORKSPACE_CARDS: WorkspaceCardItem[] = [
  {
    id: "daily",
    title: "รายรับ-รายจ่าย รายวัน",
    href: "/daily",
    accentColor: "emerald",
    gradientBg:
      "bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-slate-950 hover:from-emerald-900/60 hover:to-slate-900",
    borderColor: "border-emerald-500/40 hover:border-emerald-400/80 shadow-emerald-950/20",
    textColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950",
    icon: WalletCards,
  },
  {
    id: "debts",
    title: "หนี้สินรายเดือน",
    href: "/debts",
    accentColor: "rose",
    gradientBg:
      "bg-gradient-to-r from-rose-950/70 via-slate-900/90 to-slate-950 hover:from-rose-900/60 hover:to-slate-900",
    borderColor: "border-rose-500/40 hover:border-rose-400/80 shadow-rose-950/20",
    textColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/30 text-rose-400 group-hover:bg-rose-500 group-hover:text-slate-950",
    icon: ReceiptText,
  },
  {
    id: "salary",
    title: "เงินเดือน",
    href: "/salary",
    accentColor: "indigo",
    gradientBg:
      "bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-slate-950 hover:from-indigo-900/60 hover:to-slate-900",
    borderColor: "border-indigo-500/40 hover:border-indigo-400/80 shadow-indigo-950/20",
    textColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-950",
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
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Financial Workspaces
          </h1>
          <p className="text-xs text-slate-400">
            เลือกหน้าจัดการที่ต้องการ
          </p>
        </div>

        {/* 3 Prominent Action Buttons */}
        <div className="space-y-3.5 pt-1">
          {WORKSPACE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className={clsx(
                  "group relative flex items-center justify-between overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-lg",
                  card.gradientBg,
                  card.borderColor,
                  "hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
                )}
              >
                {/* Ambient glow accent */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
                  style={{
                    backgroundColor:
                      card.accentColor === "emerald"
                        ? "#10b981"
                        : card.accentColor === "rose"
                        ? "#f43f5e"
                        : "#6366f1",
                  }}
                />

                <div className="relative flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div
                    className={clsx(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 shadow-md",
                      card.iconBg
                    )}
                  >
                    <Icon size={24} />
                  </div>
                  <span className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                    {card.title}
                  </span>
                </div>

                <div className="relative flex items-center gap-1 shrink-0">
                  <div
                    className={clsx(
                      "flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/80 transition-transform group-hover:translate-x-1 group-hover:border-slate-500",
                      card.textColor
                    )}
                  >
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-[11px] text-slate-500">
          <span>สามารถสลับ Workspace ได้ตลอดเวลาผ่านเมนูด้านบน</span>
        </div>
      </main>
    </div>
  );
}
