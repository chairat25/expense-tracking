"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  WalletCards,
  ReceiptText,
  Coins,
  LayoutGrid,
  ChevronDown,
  Check,
  Layers,
} from "lucide-react";
import { useBodyScrollLock } from "../lib/useBodyScrollLock";

export type WorkspaceType = "landing" | "daily" | "debts" | "salary";

interface WorkspaceConfig {
  id: WorkspaceType;
  title: string;
  shortTitle: string;
  href: string;
  colorClass: string;
  badgeClass: string;
  icon: typeof WalletCards;
}

export const WORKSPACES: WorkspaceConfig[] = [
  {
    id: "daily",
    title: "รายรับ-รายจ่าย รายวัน",
    shortTitle: "รายรับ-รายจ่าย",
    href: "/daily",
    colorClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: WalletCards,
  },
  {
    id: "debts",
    title: "หนี้สินรายเดือน",
    shortTitle: "หนี้สินรายเดือน",
    href: "/debts",
    colorClass: "text-rose-400",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    icon: ReceiptText,
  },
  {
    id: "salary",
    title: "เงินเดือนและการจัดสรร",
    shortTitle: "เงินเดือน",
    href: "/salary",
    colorClass: "text-indigo-400",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    icon: Coins,
  },
];

interface WorkspaceHeaderProps {
  activeWorkspace?: WorkspaceType;
  rightContent?: React.ReactNode;
  subtitle?: string;
}

export default function WorkspaceHeader({
  activeWorkspace = "landing",
  rightContent,
  subtitle,
}: WorkspaceHeaderProps) {
  const [open, setOpen] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const currentWorkspace = WORKSPACES.find((w) => w.id === activeWorkspace);

  return (
    <>
      {/* Click-outside Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] touch-none overscroll-none"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <header
        className={clsx(
          "sticky top-0 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]",
          open ? "z-50" : "z-30"
        )}
      >
        <div className="relative mx-auto flex max-w-md items-center justify-between px-4 py-3">
          {/* Left: Brand + Workspace Switcher Pill */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
              title="กลับหน้าหลัก"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>EXPENSE</span>
            </Link>

            {/* Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-label="สลับ Workspace"
                className={clsx(
                  "flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-all active:scale-95 shadow-sm",
                  open
                    ? "border-emerald-500/60 bg-slate-800 text-white ring-2 ring-emerald-500/20"
                    : "border-slate-800 bg-slate-900/90 text-slate-200 hover:border-slate-700 hover:bg-slate-800"
                )}
              >
                {currentWorkspace ? (
                  <>
                    <currentWorkspace.icon
                      size={13}
                      className={currentWorkspace.colorClass}
                    />
                    <span className="max-w-[110px] truncate text-[11px]">
                      {currentWorkspace.shortTitle}
                    </span>
                  </>
                ) : (
                  <>
                    <Layers size={13} className="text-emerald-400" />
                    <span className="text-[11px]">Hub</span>
                  </>
                )}
                <ChevronDown
                  size={12}
                  className={clsx(
                    "text-slate-400 transition-transform duration-200",
                    open && "rotate-180"
                  )}
                />
              </button>

              {/* Workspace Switcher Popover */}
              {open && (
                <div
                  role="dialog"
                  aria-label="เลือก Workspace"
                  className="absolute left-0 top-full mt-2 z-50 w-[min(calc(100vw-2rem),19rem)] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/98 p-2.5 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 origin-top-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    พื้นที่จัดการ (Workspaces)
                  </div>

                  <div className="space-y-1">
                    {/* Landing Hub Link */}
                    <Link
                      href="/"
                      onClick={() => setOpen(false)}
                      className={clsx(
                        "flex items-center justify-between rounded-xl p-2 text-xs font-semibold transition-colors",
                        activeWorkspace === "landing"
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                          <LayoutGrid size={14} />
                        </div>
                        <span>หน้าหลัก (Hub)</span>
                      </div>
                      {activeWorkspace === "landing" && (
                        <Check size={14} className="text-emerald-400" />
                      )}
                    </Link>

                    {/* Workspaces */}
                    {WORKSPACES.map((w) => {
                      const isCurrent = w.id === activeWorkspace;
                      const Icon = w.icon;
                      return (
                        <Link
                          key={w.id}
                          href={w.href}
                          onClick={() => setOpen(false)}
                          className={clsx(
                            "flex items-center justify-between rounded-xl p-2 text-xs font-semibold transition-colors",
                            isCurrent
                              ? "bg-slate-800 text-white"
                              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={clsx(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                                w.badgeClass
                              )}
                            >
                              <Icon size={14} className={w.colorClass} />
                            </div>
                            <span className="truncate">{w.title}</span>
                          </div>
                          {isCurrent && (
                            <Check size={14} className="text-emerald-400 shrink-0 ml-1.5" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Slot */}
          {rightContent && (
            <div className="flex items-center gap-2">{rightContent}</div>
          )}
        </div>
      </header>
    </>
  );
}
