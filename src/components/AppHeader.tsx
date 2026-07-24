"use client";

import { Menu, Wallet, User, Sparkles } from "lucide-react";
import type { View } from "./Sidebar";
import NotificationCenter from "./NotificationCenter";

type Props = {
  currentView: View;
  onOpenMobileSidebar: () => void;
  onSelectView: (view: View) => void;
};

const VIEW_TITLES: Record<View, string> = {
  home: "หน้าหลัก (Analytics)",
  day: "บันทึกรายรับรายจ่าย",
  salary: "จัดสรรเงินเดือน & กระปุก",
  month: "สรุปรายเดือน",
  memo: "ความจำ & เตือนความจำ",
  profile: "โปรไฟล์ส่วนตัว",
  chat: "แชท & ข้อความ (Messenger)",
};

export default function AppHeader({
  currentView,
  onOpenMobileSidebar,
  onSelectView,
}: Props) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/80 bg-surface/95 backdrop-blur-xl px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex size-9 items-center justify-center rounded-xl bg-surface-2 border border-border text-foreground hover:bg-surface transition active:scale-95 shadow-xs"
          title="เปิดเมนู"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Wallet size={15} />
          </div>
          <div>
            <h1 className="text-xs font-bold text-foreground tracking-tight line-clamp-1">
              {VIEW_TITLES[currentView] || "ExpenseTracker"}
            </h1>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <NotificationCenter onSelectView={onSelectView} />
        <button
          type="button"
          onClick={() => onSelectView("profile")}
          className="flex size-9 items-center justify-center rounded-xl bg-surface-2 border border-border text-indigo-400 hover:bg-surface transition active:scale-95 shadow-xs"
          title="โปรไฟล์"
        >
          <User size={17} />
        </button>
      </div>
    </header>
  );
}
