"use client";

import Link from "next/link";
import clsx from "clsx";
import {
  WalletCards,
  ReceiptText,
  Coins,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  CreditCard,
  Layers,
  ChevronRight,
} from "lucide-react";

export interface WorkspaceCardItem {
  id: "daily" | "debts" | "salary";
  title: string;
  badge: string;
  description: string;
  href: string;
  accentColor: string;
  gradientBg: string;
  borderColor: string;
  textColor: string;
  buttonClass: string;
  icon: typeof WalletCards;
  highlights: string[];
}

export const WORKSPACE_CARDS: WorkspaceCardItem[] = [
  {
    id: "daily",
    title: "รายรับ-รายจ่าย รายวัน",
    badge: "บันทึกเร็ว / สแกนสลิป",
    description:
      "บันทึกรายรับ-รายจ่ายประจำวัน สแกนสลิปธนาคารอัตโนมัติ และตรวจดูกราฟประวัติย้อนหลัง 14 วัน",
    href: "/daily",
    accentColor: "emerald",
    gradientBg:
      "bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-slate-950",
    borderColor: "border-emerald-500/40 hover:border-emerald-400",
    textColor: "text-emerald-400",
    buttonClass:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30",
    icon: WalletCards,
    highlights: ["สแกนสลิป OCR ภาษาไทย", "ประวัติย้อนหลัง 14 วัน", "สรุปยอดประจำวัน"],
  },
  {
    id: "debts",
    title: "หนี้สินรายเดือน",
    badge: "ภาระผ่อน / รอบบิล",
    description:
      "จัดการรายการผ่อนชำระ บิลรายเดือน ค่างวด และติดตามกำหนดวันตัดรอบชำระอย่างเป็นระบบ",
    href: "/debts",
    accentColor: "rose",
    gradientBg:
      "bg-gradient-to-br from-rose-950/50 via-slate-900/90 to-slate-950",
    borderColor: "border-rose-500/40 hover:border-rose-400",
    textColor: "text-rose-400",
    buttonClass:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30",
    icon: ReceiptText,
    highlights: ["ยอดภาระหนี้สินคงค้าง", "แจ้งเตือนวันครบกำหนด", "ติดตามค่างวดรายเดือน"],
  },
  {
    id: "salary",
    title: "เงินเดือนและการจัดสรร",
    badge: "เงินเดือน / จัดสรร Pocket",
    description:
      "บันทึกเงินเดือนเข้า จัดสรรงบประมาณเป็นกระเป๋า Pocket และแบ่งซองใช้จ่ายรายสัปดาห์",
    href: "/salary",
    accentColor: "indigo",
    gradientBg:
      "bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-slate-950",
    borderColor: "border-indigo-500/40 hover:border-indigo-400",
    textColor: "text-indigo-400",
    buttonClass:
      "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30",
    icon: Coins,
    highlights: ["จัดสรร Pocket แยกหมวด", "ซองงบสัปดาห์ Envelope", "วางแผนเงินออมคงเหลือ"],
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
      <main className="mx-auto max-w-md px-4 py-6 sm:max-w-xl space-y-5">
        {/* Hero Section */}
        <div className="space-y-1.5 text-center sm:text-left pt-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles size={13} />
            <span>เลือกพื้นที่จัดการการเงินของคุณ</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Financial Workspaces
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            แยกหน้าจัดการออกเป็น 3 หมวดชัดเจน เพื่อความสะดวก รวดเร็ว
            และโฟกัสเฉพาะงานที่ต้องการ
          </p>
        </div>

        {/* 3 Large Action Cards */}
        <div className="space-y-3.5 pt-1">
          {WORKSPACE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={clsx(
                  "group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-xl",
                  card.gradientBg,
                  card.borderColor,
                  "hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99]"
                )}
              >
                {/* Ambient glow accent */}
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-35"
                  style={{
                    backgroundColor:
                      card.accentColor === "emerald"
                        ? "#10b981"
                        : card.accentColor === "rose"
                        ? "#f43f5e"
                        : "#6366f1",
                  }}
                />

                <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={clsx(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-slate-950/80 shadow-md",
                          card.borderColor
                        )}
                      >
                        <Icon size={20} className={card.textColor} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white">
                            {card.title}
                          </h2>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {card.badge}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pr-2">
                      {card.description}
                    </p>

                    {/* Feature Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {card.highlights.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md border border-slate-800 bg-slate-950/70 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Link Button */}
                  <div className="pt-2 sm:pt-0 shrink-0">
                    <Link
                      href={card.href}
                      className={clsx(
                        "flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all active:scale-95 w-full sm:w-auto",
                        card.buttonClass
                      )}
                    >
                      <span>เข้าจัดการ</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
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
