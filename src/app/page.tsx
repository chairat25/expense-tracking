"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Banknote, CalendarDays, ListTodo, Loader2, Settings, BookmarkCheck, Home as HomeIcon } from "lucide-react";
import AccountBar from "@/components/AccountBar";
import MonthStrip from "@/components/MonthStrip";
import DayView from "@/components/DayView";
import MonthView from "@/components/MonthView";
import SalaryView from "@/components/SalaryView";
import MemoView from "@/components/MemoView";
import HomeView from "@/components/HomeView";
import { Skeleton } from "@/components/Skeleton";
import type { NewTx } from "@/components/QuickAdd";
import {
  computeBudget,
  datesFrom,
  daysInMonth,
  thisMonthKey,
  todayKey,
  totals,
  weekSliceInMonth,
  type BudgetMode,
  type MonthData,
  type Tx,
  type DailyBudget,
} from "@/lib/shared";

import RestrictedNotice from "@/components/RestrictedNotice";
import { createClient } from "@/lib/supabase/client";

type View = "home" | "day" | "month" | "salary" | "memo";

type DynamicMenu = {
  id: number;
  key: string;
  label: string;
  icon: string;
  targetView: View;
  isActive: boolean;
};

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <HomeIcon size={18} />,
  ListTodo: <ListTodo size={18} />,
  Banknote: <Banknote size={18} />,
  CalendarDays: <CalendarDays size={18} />,
  BookmarkCheck: <BookmarkCheck size={18} />,
  Settings: <Settings size={18} />,
};

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export default function Home() {
  const [ym, setYm] = useState(thisMonthKey);
  const [date, setDate] = useState(todayKey);
  const [view, setView] = useState<View>("home");
  const [month, setMonth] = useState<MonthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [navMenus, setNavMenus] = useState<DynamicMenu[] | null>(null);
  const [isRefreshingMenus, setIsRefreshingMenus] = useState(false);

  // กันเคสปัดเปลี่ยนเดือนรัวๆ แล้ว response ของเดือนเก่าที่มาช้ากว่าทับเดือนล่าสุด
  const ymRef = useRef(ym);
  ymRef.current = ym;

  const loadMenus = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshingMenus(true);
    try {
      const res = await fetch("/api/menus", { cache: "no-store" });
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data.menus)) {
          setNavMenus(data.menus);
        }
      }
    } catch (e) {
      // fallback to default nav tabs
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsRefreshingMenus(false), 400);
      }
    }
  }, []);

  useEffect(() => {
    void loadMenus(false);

    // Supabase Realtime: ฟังการ Broadcast สัญญาณสิทธิ์เมนู (Pure Broadcast - 0% DB Overhead)
    const supabase = createClient();
    const channel = supabase
      .channel("menu-realtime-sync")
      .on("broadcast", { event: "menu_updated" }, () => {
        void loadMenus(true);
      })
      .subscribe();

    const handleFocus = () => void loadMenus(true);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      void supabase.removeChannel(channel);
    };
  }, [loadMenus]);

  const load = useCallback(async (m: string) => {
    setLoadingMonth(true);
    try {
      const res = await fetch(`/api/months/${m}`, { cache: "no-store" });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
      }
      if (ymRef.current !== m) return;
      setMonth(data);
      setError(null);
    } catch (e) {
      if (ymRef.current !== m) return;
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (ymRef.current === m) setLoadingMonth(false);
    }
  }, []);

  useEffect(() => {
    void load(ym);
  }, [ym, load]);

  useEffect(() => {
    if (!loadingMonth) {
      setShowSkeleton(false);
      return;
    }
    const t = setTimeout(() => setShowSkeleton(true), 200);
    return () => clearTimeout(t);
  }, [loadingMonth]);

  const loadSavings = useCallback(async () => {
    const res = await fetch("/api/savings", { cache: "no-store" });
    if (res.ok) {
      const data = await safeJson(res);
      setTotalSavings(data.total ?? 0);
    }
  }, []);

  useEffect(() => {
    void loadSavings();
  }, [loadSavings]);

  function pickMonth(next: string) {
    setYm(next);
    setDate(next === thisMonthKey() ? todayKey() : `${next}-01`);
  }

  function pickDate(next: string) {
    setDate(next);
    const nextYm = next.slice(0, 7);
    if (nextYm !== ym) setYm(nextYm);
  }

  const dayTxs = useMemo(
    () => (month?.transactions ?? []).filter((t) => t.date === date),
    [month, date],
  );

  const monthTotals = useMemo(() => totals(month?.transactions ?? []), [month]);

  const locked = month?.closedAt != null;

  const budget = useMemo(
    () => (month ? computeBudget(month, date, month.budgetMode) : null),
    [month, date],
  );

  async function updateDailyBudget(amount: number) {
    if (!month) return;
    const dates =
      month.budgetMode === "week"
        ? datesFrom(date, weekSliceInMonth(date, ym).to)
        : [date];

    const res = await fetch(`/api/months/${ym}/daily-budgets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dates, amount }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }

    const updated: DailyBudget[] = Array.isArray(data) ? data : [];
    setMonth((m) => {
      if (!m) return m;
      const byDate = new Map(m.dailyBudgets.map((b) => [b.date, b]));
      for (const u of updated) byDate.set(u.date, u);
      return { ...m, dailyBudgets: [...byDate.values()] };
    });
  }

  async function changeBudgetMode(mode: BudgetMode) {
    const before = month;
    setMonth((m) => (m ? { ...m, budgetMode: mode } : m));

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetMode: mode }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      setMonth(before);
      setError(data.error ?? "เปลี่ยนโหมดไม่สำเร็จ");
    }
  }

  async function addTx(input: NewTx) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, date }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    const created: Tx = data;
    setMonth((m) =>
      m ? { ...m, transactions: [...m.transactions, created] } : m,
    );
  }

  async function deleteTx(id: number) {
    const before = month;
    setMonth((m) =>
      m ? { ...m, transactions: m.transactions.filter((t) => t.id !== id) } : m,
    );
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMonth(before);
      setError("ลบไม่สำเร็จ");
    }
  }

  async function patchMonth(body: Record<string, unknown>) {
    const res = await fetch(`/api/months/${ym}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setMonth((m) => (m ? { ...m, ...data } : m));
  }

  async function confirmCarryOver(savingsAmount: number) {
    const res = await fetch(`/api/months/${ym}/carry-over`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savingsAmount }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      setError(data.error ?? "แบ่งเงินไม่สำเร็จ");
      return;
    }
    const { nextYm }: { nextYm?: string } = data;
    setMonth((m) => (m ? { ...m, savingsAmount } : m));
    void loadSavings();
    if (nextYm && nextYm <= thisMonthKey()) pickMonth(nextYm);
  }

  const lastDay = `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;

  const defaultTabs: { key: string; label: string; icon: React.ReactNode; view: View }[] = [
    { key: "day", label: "รายวัน", icon: <ListTodo size={18} />, view: "day" },
    { key: "month", label: "สรุปเดือน", icon: <CalendarDays size={18} />, view: "month" },
    { key: "home", label: "หน้าหลัก", icon: <HomeIcon size={18} />, view: "home" },
    { key: "salary", label: "เงินเดือน", icon: <Banknote size={18} />, view: "salary" },
    { key: "memo", label: "ความจำ", icon: <BookmarkCheck size={18} />, view: "memo" },
  ];

  const activeTabs = useMemo(() => {
    const homeTabItem = { key: "home", label: "หน้าหลัก", icon: <HomeIcon size={18} />, view: "home" as View };
    if (!navMenus) return defaultTabs;
    const dynamic = navMenus
      .filter((m) => m.key !== "admin")
      .map((m) => ({
        key: m.key,
        label: m.label,
        icon: ICON_MAP[m.icon] || <ListTodo size={18} />,
        view: (m.targetView as View) || "home",
      }));
    if (!dynamic.some((t) => t.view === "home")) {
      dynamic.push(homeTabItem);
    }
    return dynamic;
  }, [navMenus]);

  const isViewAllowed = useMemo(() => {
    return activeTabs.some((t) => t.view === view);
  }, [view, activeTabs]);

  return (
    <>
      {isRefreshingMenus && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-border bg-surface/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-foreground shadow-xl transition-all animate-in fade-in slide-in-from-top-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          <span>กำลังอัปเดตสิทธิ์เมนู...</span>
        </div>
      )}

      {isViewAllowed && (
        <MonthStrip
          ym={ym}
          onChange={pickMonth}
          opening={month?.openingBalance ?? 0}
          income={monthTotals.income}
          expense={monthTotals.expense}
          savings={totalSavings}
          closed={locked === true}
          loading={showSkeleton}
          currentView={view}
        />
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-28 pt-3">
        {error && (
          <p
            onClick={() => setError(null)}
            className="mb-3 cursor-pointer rounded-xl bg-expense-soft px-3 py-2 text-center text-[13px] text-expense"
          >
            {error} (แตะเพื่อปิด)
          </p>
        )}

        {!month || showSkeleton ? (
          <ContentSkeleton />
        ) : !isViewAllowed ? (
          <RestrictedNotice
            menuTitle={
              view === "home"
                ? "หน้าหลัก"
                : view === "day"
                ? "เมนูรายวัน"
                : view === "salary"
                  ? "เมนูเงินเดือน"
                  : view === "month"
                    ? "เมนูสรุปเดือน"
                    : "เมนูความจำ"
            }
            onGoHome={() => {
              const firstAllowed = activeTabs[0]?.view ?? "home";
              setView(firstAllowed);
            }}
          />
        ) : view === "home" ? (
          <HomeView month={month} />
        ) : view === "day" ? (
          <DayView
            date={date}
            onDateChange={pickDate}
            canPrev={date > `${ym}-01`}
            canNext={date < lastDay && date < todayKey()}
            txs={dayTxs}
            onAdd={addTx}
            onDelete={deleteTx}
            locked={locked === true}
            dailyBudget={budget?.amount ?? 0}
            onBudgetChange={updateDailyBudget}
            budgetMode={month.budgetMode}
            onBudgetModeChange={changeBudgetMode}
            week={budget?.week ?? null}
          />
        ) : view === "salary" ? (
          <SalaryView ym={ym} onSalarySaved={() => void load(ym)} />
        ) : view === "memo" ? (
          <MemoView />
        ) : (
          <div className="space-y-3">
            <MonthView
              month={month}
              onOpeningChange={(v) => patchMonth({ openingBalance: v })}
              onToggleClose={(closed) => patchMonth({ closed })}
              onCarryOver={confirmCarryOver}
              onPickDay={(d) => {
                setDate(d);
                setView("day");
              }}
            />
            <AccountBar />
          </div>
        )}
      </main>

      <CurvedFloatingDock
        tabs={activeTabs}
        activeView={view}
        onSelectTab={(v) => setView(v)}
      />
    </>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-3 pop-in">
      <div className="card space-y-3 p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="card space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

function CurvedFloatingDock({
  tabs,
  activeView,
  onSelectTab,
}: {
  tabs: { key: string; label: string; icon: React.ReactNode; view: View }[];
  activeView: View;
  onSelectTab: (view: View) => void;
}) {
  const homeTab = tabs.find((t) => t.view === "home") || tabs.find((t) => t.view === "day");
  const otherTabs = tabs.filter((t) => t !== homeTab);

  // แบ่งแท็บอื่นๆ ออกเป็นฝั่งซ้ายและขวา เพื่อล้อมรอบปุ่มตรงกลาง
  const mid = Math.ceil(otherTabs.length / 2);
  const leftTabs = otherTabs.slice(0, mid);
  const rightTabs = otherTabs.slice(mid);

  return (
    <nav className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto relative flex items-center justify-between gap-2 rounded-[28px] border border-border/80 bg-surface/95 backdrop-blur-xl px-5 py-2.5 shadow-2xl shadow-black/40 min-w-[320px] max-w-md w-full">
        {/* ฝั่งซ้าย */}
        <div className="flex flex-1 items-center justify-around">
          {leftTabs.map((t) => {
            const isActive = activeView === t.view;
            return (
              <button
                key={t.key}
                onClick={() => onSelectTab(t.view)}
                className="group relative flex flex-col items-center justify-center p-2 text-muted transition-all duration-200 active:scale-95"
                title={t.label}
              >
                <span
                  className={clsx(
                    "transition-colors duration-200",
                    isActive ? "text-emerald-500 font-bold" : "hover:text-foreground opacity-70",
                  )}
                >
                  {t.icon}
                </span>
                {/* Active Dot */}
                <span
                  className={clsx(
                    "absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-500 transition-all duration-200",
                    isActive ? "scale-100 opacity-100" : "scale-0 opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* ปุ่มวงกลมลอยตรงกลาง (หน้าหลัก / Home) */}
        {homeTab && (
          <div className="relative -top-5 flex flex-col items-center shrink-0">
            <button
              onClick={() => onSelectTab(homeTab.view)}
              className={clsx(
                "flex h-13 w-13 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 border-4 border-bg transition-all duration-200 active:scale-90 hover:scale-105 hover:bg-emerald-500",
                activeView === homeTab.view && "ring-4 ring-emerald-500/30",
              )}
              title={homeTab.label}
            >
              <HomeIcon size={22} />
            </button>
            {/* Active Dot สำหรับปุ่มตรงกลาง */}
            <span
              className={clsx(
                "absolute -bottom-3.5 h-1.5 w-1.5 rounded-full bg-emerald-500 transition-all duration-200",
                activeView === homeTab.view ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            />
          </div>
        )}

        {/* ฝั่งขวา */}
        <div className="flex flex-1 items-center justify-around">
          {rightTabs.map((t) => {
            const isActive = activeView === t.view;
            return (
              <button
                key={t.key}
                onClick={() => onSelectTab(t.view)}
                className="group relative flex flex-col items-center justify-center p-2 text-muted transition-all duration-200 active:scale-95"
                title={t.label}
              >
                <span
                  className={clsx(
                    "transition-colors duration-200",
                    isActive ? "text-emerald-500 font-bold" : "hover:text-foreground opacity-70",
                  )}
                >
                  {t.icon}
                </span>
                {/* Active Dot */}
                <span
                  className={clsx(
                    "absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-500 transition-all duration-200",
                    isActive ? "scale-100 opacity-100" : "scale-0 opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
