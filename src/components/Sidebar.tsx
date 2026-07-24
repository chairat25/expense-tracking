"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Home,
  ListTodo,
  Banknote,
  CalendarDays,
  BookmarkCheck,
  User,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  ShieldCheck,
  Wallet,
  Settings,
} from "lucide-react";
import { formatBaht, type MonthData } from "@/lib/shared";
import NotificationCenter from "./NotificationCenter";

export type View = "home" | "day" | "month" | "salary" | "memo" | "profile" | "chat";

type SidebarTab = {
  key: string;
  label: string;
  icon: React.ReactNode;
  view: View;
  category: "main" | "finance" | "tools" | "account";
  badge?: string;
};

type Props = {
  currentView: View;
  onSelectView: (view: View) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  month: MonthData | null;
};

export default function Sidebar({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  month,
}: Props) {
  const [profileName, setProfileName] = useState("คุณผู้ใช้งาน");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Load User Profile for Sidebar Header
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfileName(data.profile.displayName || "คุณผู้ใช้งาน");
            setAvatarUrl(data.profile.avatarUrl || "");
          }
        }
      } catch {
        // ignore
      }
    }
    void loadProfile();
  }, [currentView]);

  const menuGroups: {
    category: "main" | "finance" | "tools" | "account";
    title: string;
    items: SidebarTab[];
  }[] = [
    {
      category: "main",
      title: "หลัก",
      items: [
        {
          key: "home",
          label: "หน้าหลัก",
          icon: <Home size={18} />,
          view: "home",
          category: "main",
          badge: "Analytics",
        },
      ],
        },
    {
      category: "finance",
      title: "การเงิน",
      items: [
        {
          key: "day",
          label: "บันทึกรายวัน",
          icon: <ListTodo size={18} />,
          view: "day",
          category: "finance",
        },
        {
          key: "salary",
          label: "จัดสรรเงินเดือน",
          icon: <Banknote size={18} />,
          view: "salary",
          category: "finance",
          badge: "New UX",
        },
        {
          key: "month",
          label: "สรุปรายเดือน",
          icon: <CalendarDays size={18} />,
          view: "month",
          category: "finance",
        },
      ],
    },
    {
      category: "tools",
      title: "เครื่องมือ",
      items: [
        {
          key: "memo",
          label: "ความจำ & เตือนความจำ",
          icon: <BookmarkCheck size={18} />,
          view: "memo",
          category: "tools",
        },
      ],
    },
    {
      category: "account",
      title: "บัญชี & สังคม",
      items: [
        {
          key: "chat",
          label: "แชท & ข้อความ",
          icon: <MessageCircle size={18} />,
          view: "chat",
          category: "account",
          badge: "Messenger",
        },
        {
          key: "profile",
          label: "โปรไฟล์ส่วนตัว",
          icon: <User size={18} />,
          view: "profile",
          category: "account",
        },
      ],
    },
  ];

  // Render Inner Nav List
  function renderNavItems(isMobile = false) {
    return (
      <div className="space-y-4 px-2">
        {menuGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            {(!collapsed || isMobile) && (
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted">
                {group.title}
              </h4>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onSelectView(item.view);
                      if (isMobile) onCloseMobile();
                    }}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95",
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "text-muted hover:bg-surface-2 hover:text-foreground",
                      collapsed && !isMobile && "justify-center px-0",
                    )}
                    title={item.label}
                  >
                    <span className="shrink-0">{item.icon}</span>

                    {(!collapsed || isMobile) && (
                      <div className="flex flex-1 items-center justify-between truncate text-left">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={clsx(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-indigo-500/15 text-indigo-400",
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (lg:flex) */}
      <aside
        className={clsx(
          "relative hidden lg:flex flex-col justify-between border-r border-border/80 bg-surface/95 backdrop-blur-xl py-4 sidebar-transition shrink-0 z-30 sticky top-0 h-screen",
          collapsed ? "w-20" : "w-64",
        )}
      >
        {/* Floating Expand/Collapse Toggle Badge on Border */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3.5 top-6 z-40 size-7 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-white hover:bg-indigo-600 transition-all duration-200 shadow-md active:scale-90"
          title={collapsed ? "ขยาย Sidebar" : "ย่อ Sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="space-y-4">
          {/* Header Brand Logo */}
          <div
            className={clsx(
              "flex items-center px-4 pb-2 border-b border-border/60",
              collapsed ? "justify-center px-0" : "justify-between",
            )}
          >
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/40">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-foreground tracking-tight">
                      ExpenseTracker
                    </h1>
                    <p className="text-[10px] text-muted font-medium">
                      ระบบจัดการการเงิน
                    </p>
                  </div>
                </div>
                <NotificationCenter align="left" onSelectView={onSelectView} />
              </>
            ) : (
              <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Wallet size={20} />
              </div>
            )}
          </div>

          {/* User Profile Mini Snippet */}
          <div
            onClick={() => onSelectView("profile")}
            className={clsx(
              "mx-3 cursor-pointer rounded-2xl border border-border/80 bg-surface-2/60 transition hover:border-indigo-500/50 hover:bg-surface-2",
              collapsed ? "mx-2 p-2 flex justify-center" : "p-2.5",
            )}
            title={collapsed ? profileName : undefined}
          >
            <div className={clsx("flex items-center gap-2.5", collapsed && "justify-center")}>
              <div className="relative shrink-0 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profileName}
                    className="size-9 rounded-xl object-cover border border-indigo-500/40"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                    <User size={18} />
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-surface" />
              </div>

              {!collapsed && (
                <div className="flex-1 truncate text-left">
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {profileName}
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck size={10} /> สมาชิกยืนยันตัวตน
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Nav List */}
          <div className="overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-none">
            {renderNavItems(false)}
          </div>
        </div>

        {/* Footer Quick Budget Widget */}
        {!collapsed && month && (
          <div className="mx-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-400">
              <span>งบรวมเดือนนี้</span>
              <Sparkles size={13} />
            </div>
            <p className="tnum text-base font-bold text-foreground">
              {formatBaht(month.openingBalance)} ฿
            </p>
          </div>
        )}
      </aside>

      {/* 2. MOBILE DRAWER SIDEBAR (lg:hidden) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Box */}
          <aside className="relative flex w-72 max-w-[80vw] flex-col justify-between border-r border-border bg-surface p-4 shadow-2xl z-50 pop-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-foreground">
                      ExpenseTracker
                    </h1>
                    <p className="text-[10px] text-muted">ระบบจัดการการเงิน</p>
                  </div>
                </div>

                <button
                  onClick={onCloseMobile}
                  className="flex size-8 items-center justify-center rounded-xl bg-surface-2 text-muted hover:text-foreground transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* User Snippet */}
              <div
                onClick={() => {
                  onSelectView("profile");
                  onCloseMobile();
                }}
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface-2/60 p-3"
              >
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profileName}
                      className="size-9 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold text-xs">
                      {profileName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-surface" />
                </div>
                <div className="flex-1 truncate">
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {profileName}
                  </h4>
                  <p className="text-[10px] text-muted">แตะเพื่อแก้ไขโปรไฟล์</p>
                </div>
              </div>

              {/* Nav Items */}
              <div className="overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-none">
                {renderNavItems(true)}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
