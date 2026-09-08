"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import clsx from "clsx";
import {
  User,
  Plus,
  Trash2,
  LogOut,
  X,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  Sun,
  Loader2,
  ChevronLeft,
  ChevronRight,
  History,
  RotateCcw,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  todayKey,
  shiftDate,
  formatDayTH,
  formatTimeTH,
  formatBaht,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  type Category,
  type Tx,
} from "@/lib/shared";
import { createClient } from "@/lib/supabase/client";

interface CategoryOption {
  slug: string;
  name: string;
  icon: string;
  type: string;
}

interface DailyHistoryItem {
  date: string;
  expense: number;
  income: number;
  count: number;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { slug: "food", name: "อาหาร", icon: "🍚", type: "expense" },
  { slug: "drink", name: "เครื่องดื่ม", icon: "🧋", type: "expense" },
  { slug: "transport", name: "เดินทาง", icon: "🚗", type: "expense" },
  { slug: "bill", name: "บิล/ค่างวด", icon: "🧾", type: "expense" },
  { slug: "shopping", name: "ของใช้", icon: "🛍️", type: "expense" },
  { slug: "fun", name: "บันเทิง", icon: "🎬", type: "expense" },
  { slug: "other", name: "อื่นๆ", icon: "📦", type: "expense" },
];

export default function HomeView() {
  const today = todayKey();
  const yesterday = shiftDate(today, -1);

  // Selected Date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Data States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [spentForDate, setSpentForDate] = useState(0);
  const [incomeForDate, setIncomeForDate] = useState(0);
  const [dailyBudget, setDailyBudget] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);

  // Form State
  const [formDate, setFormDate] = useState<string>(today);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState<string>("food");
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History Modal State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<DailyHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Profile Modal State
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{
    displayName: string;
    email: string;
    avatarUrl: string;
    bio: string;
  } | null>(null);
  const [budgets, setBudgets] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
  } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editName, setEditName] = useState("");

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Load Transactions for Selected Date
  const loadDateData = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?date=${targetDate}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setSpentForDate(data.todaySpent || 0);
        setIncomeForDate(data.todayIncome || 0);
        setDailyBudget(data.dailyBudget ?? null);
      }
    } catch (err) {
      console.error("Failed to load date transactions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // When selectedDate changes, load data
  useEffect(() => {
    void loadDateData(selectedDate);
    setFormDate(selectedDate);
  }, [selectedDate, loadDateData]);

  // Load Categories & Profile
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, profRes] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/profile", { cache: "no-store" }),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData.categories) && catData.categories.length > 0) {
            setCategories(catData.categories);
          }
        }

        if (profRes.ok) {
          const profData = await profRes.json();
          setProfile(profData.profile || null);
          setEditName(profData.profile?.displayName || "");
          setBudgets(profData.budgets || null);
          if (profData.budgets?.daily && dailyBudget === null) {
            setDailyBudget(profData.budgets.daily);
          }
        }
      } catch (err) {
        console.error("Failed to load meta data:", err);
      }
    }

    void loadMeta();
  }, []);

  // Load 14-day history
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/transactions?history=true&days=14", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (historyOpen) {
      void loadHistory();
    }
  }, [historyOpen, loadHistory]);

  // Handle Quick Add Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      amountInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          type,
          amount: numAmount,
          category,
          note: note.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "บันทึกรายการไม่สำเร็จ");
      }

      const created: Tx = await res.json();

      // If created for the currently viewed date, update list
      if (formDate === selectedDate) {
        setTransactions((prev) => [created, ...prev]);
        if (type === "expense") {
          setSpentForDate((prev) => prev + numAmount);
        } else {
          setIncomeForDate((prev) => prev + numAmount);
        }
      } else {
        // If created for a different date (e.g. yesterday while viewing today), switch to that date
        setSelectedDate(formDate);
      }

      // Reset form & Focus back
      setAmount("");
      setNote("");
      amountInputRef.current?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Delete
  async function handleDelete(id: number, txAmount: number, txType: "income" | "expense") {
    const beforeTxs = transactions;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (txType === "expense") {
      setSpentForDate((prev) => Math.max(0, prev - txAmount));
    } else {
      setIncomeForDate((prev) => Math.max(0, prev - txAmount));
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("ลบรายการไม่สำเร็จ");
      }
    } catch {
      setTransactions(beforeTxs);
      if (txType === "expense") setSpentForDate((prev) => prev + txAmount);
      else setIncomeForDate((prev) => prev + txAmount);
      alert("ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  // Handle Logout
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Handle Save Profile
  async function handleSaveProfile() {
    if (!editName.trim()) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: editName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Save profile failed:", err);
    } finally {
      setSavingProfile(false);
    }
  }

  const isToday = selectedDate === today;
  const isYesterday = selectedDate === yesterday;
  const canGoNext = selectedDate < today;

  const activeDailyBudget = dailyBudget ?? budgets?.daily ?? 0;
  const budgetRemaining = activeDailyBudget > 0 ? activeDailyBudget - spentForDate : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Expense Tracking
            </span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 text-xs font-medium text-slate-300 transition-all hover:border-emerald-500/50 hover:bg-slate-800 hover:text-white active:scale-95"
              title="ประวัติย้อนหลัง"
            >
              <History size={15} className="text-emerald-400" />
              <span>ประวัติ</span>
            </button>

            <button
              onClick={() => setProfileOpen(true)}
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-all hover:border-emerald-500/50 hover:bg-slate-800 hover:text-white active:scale-95"
              title="โปรไฟล์และงบประมาณ"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User size={18} className="transition-transform group-hover:scale-110" />
              )}
            </button>
          </div>
        </div>

        {/* 2. Date Navigator Bar */}
        <div className="border-t border-slate-900 bg-slate-950/60 px-4 py-2">
          <div className="mx-auto flex max-w-md items-center justify-between">
            {/* Prev Day Button */}
            <button
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white active:scale-90"
              title="วันก่อนหน้า"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Current Date Display */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    isToday
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isYesterday
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-slate-800 text-slate-400"
                  )}
                >
                  {isToday ? "☀️ วันนี้" : isYesterday ? "⏪ เมื่อวาน" : "📅 ย้อนหลัง"}
                </span>
                <span className="text-sm font-bold text-slate-100">
                  {formatDayTH(selectedDate)}
                </span>
              </div>
            </div>

            {/* Next Day Button */}
            <button
              onClick={() => canGoNext && setSelectedDate(shiftDate(selectedDate, 1))}
              disabled={!canGoNext}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
              title="วันถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Date Quick-Chips */}
          <div className="mx-auto mt-2 flex max-w-md items-center justify-center gap-1.5">
            <button
              onClick={() => setSelectedDate(today)}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all",
                isToday
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              )}
            >
              วันนี้
            </button>
            <button
              onClick={() => setSelectedDate(yesterday)}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all",
                isYesterday
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              )}
            >
              เมื่อวาน
            </button>

            {/* Custom Date Input */}
            <div className="relative">
              <input
                type="date"
                max={today}
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="w-28 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-300 outline-none focus:border-emerald-500"
              />
            </div>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="flex items-center gap-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-900/50"
                title="กลับสู่วันนี้"
              >
                <RotateCcw size={12} />
                <span>กลับวันนี้</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Main Content Container */}
      <main className="mx-auto max-w-md space-y-4 px-4 pb-12 pt-3">
        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 4. Status Card (Displays totals for the selected date) */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-xl">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {isToday ? "ยอดใช้จ่ายวันนี้" : `ยอดใช้จ่าย (${formatDayTH(selectedDate)})`}
            </span>
            {incomeForDate > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                <TrendingUp size={12} />
                +฿{formatBaht(incomeForDate)}
              </span>
            )}
          </div>

          <div className="relative mt-2 flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-rose-400">฿</span>
            <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {formatBaht(spentForDate)}
            </span>
          </div>

          {/* Budget Comparison Subtitle */}
          <div className="mt-3.5 border-t border-slate-800/80 pt-3 text-xs">
            {activeDailyBudget > 0 ? (
              <div className="flex items-center justify-between text-slate-400">
                <span>
                  งบรายวัน: <strong className="text-slate-200">฿{formatBaht(activeDailyBudget)}</strong>
                </span>
                {budgetRemaining !== null && (
                  <span
                    className={clsx(
                      "font-medium",
                      budgetRemaining >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {budgetRemaining >= 0
                      ? `เหลือ ฿${formatBaht(budgetRemaining)}`
                      : `เกินงบ ฿${formatBaht(Math.abs(budgetRemaining))}`}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-slate-500">
                <span>ยังไม่ได้ตั้งงบรายวัน</span>
                <span className="text-[11px] text-slate-500">กำหนดได้ใน Dashboard</span>
              </div>
            )}
          </div>
        </section>

        {/* 5. Quick Add Form (With Backdated Date Selector) */}
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Target Date Pill in Form */}
            <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-1.5 border border-slate-800 text-xs">
              <span className="text-slate-400">บันทึกลงวันที่:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormDate(today)}
                  className={clsx(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors",
                    formDate === today
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => setFormDate(yesterday)}
                  className={clsx(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors",
                    formDate === yesterday
                      ? "bg-amber-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  เมื่อวาน
                </button>
                <input
                  type="date"
                  max={today}
                  value={formDate}
                  onChange={(e) => e.target.value && setFormDate(e.target.value)}
                  className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-300 outline-none"
                />
              </div>
            </div>

            {/* Type Selector (Expense vs Income) */}
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-950/80 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={clsx(
                  "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                  type === "expense"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <TrendingDown size={14} />
                รายจ่าย
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={clsx(
                  "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                  type === "income"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <TrendingUp size={14} />
                รายรับ
              </button>
            </div>

            {/* Amount Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                ฿
              </span>
              <input
                ref={amountInputRef}
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-9 pr-4 text-2xl font-bold tracking-tight text-white placeholder-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
            </div>

            {/* Category Chips Selector */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                หมวดหมู่
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isSelected = category === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setCategory(cat.slug)}
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95",
                        isSelected
                          ? "border border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-sm"
                          : "border border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      )}
                    >
                      <span>{cat.icon || (CATEGORY_ICON as any)[cat.slug] || "📦"}</span>
                      <span>{cat.name || (CATEGORY_LABEL as any)[cat.slug] || cat.slug}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Input */}
            <div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุ (เช่น ข้าวกะเพรา, ค่าน้ำมัน)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>บันทึกรายการ ({formatDayTH(formDate)})</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* 6. Date Timeline */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              รายการวันที่ {formatDayTH(selectedDate)} ({transactions.length})
            </h2>
            {transactions.length > 0 && (
              <span className="text-[11px] text-slate-500">เรียงตามเวลาล่าสุด</span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-slate-500">
              <Loader2 size={24} className="animate-spin text-emerald-500 mb-2" />
              <p className="text-xs">กำลังโหลดข้อมูล...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 py-10 text-center text-slate-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-emerald-400 mb-2">
                <Sparkles size={20} />
              </div>
              <p className="text-sm font-medium text-slate-300">
                ยังไม่มีรายการในวันที่ {formatDayTH(selectedDate)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                ระบุจำนวนเงินด้านบนแล้วกดบันทึกได้เลย ✨
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
              {transactions.map((tx) => {
                const isExp = tx.type === "expense";
                const catObj = categories.find((c) => c.slug === tx.category);
                const icon = catObj?.icon || (CATEGORY_ICON as any)[tx.category] || "📦";
                const catName = catObj?.name || (CATEGORY_LABEL as any)[tx.category] || tx.category;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 transition-colors hover:bg-slate-800/30"
                  >
                    {/* Left details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-lg">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {tx.note || catName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatTimeTH(tx.spentAt)}</span>
                          {tx.note && (
                            <>
                              <span>•</span>
                              <span className="truncate">{catName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right amount & delete */}
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span
                        className={clsx(
                          "text-sm font-bold tracking-tight",
                          isExp ? "text-rose-400" : "text-emerald-400"
                        )}
                      >
                        {isExp ? "-" : "+"}฿{formatBaht(tx.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(tx.id, tx.amount, tx.type)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-950/40 hover:text-rose-400 active:scale-95"
                        title="ลบรายการ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 7. History Drawer / Modal (ประวัติย้อนหลัง 14 วัน) */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md max-h-[85vh] flex flex-col rounded-t-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:rounded-3xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <History size={20} />
                <h3 className="text-base font-bold text-white">ประวัติรายวันย้อนหลัง (14 วันล่าสุด)</h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Daily Summary List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                </div>
              ) : historyList.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">ไม่พบประวัติรายการย้อนหลัง</p>
              ) : (
                historyList.map((item) => {
                  const isCurrent = item.date === selectedDate;
                  const itemIsToday = item.date === today;
                  const itemIsYesterday = item.date === yesterday;

                  return (
                    <button
                      key={item.date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(item.date);
                        setHistoryOpen(false);
                      }}
                      className={clsx(
                        "w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all active:scale-[0.99]",
                        isCurrent
                          ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300"
                          : "border-slate-800/80 bg-slate-950 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300"
                      )}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {formatDayTH(item.date)}
                          </span>
                          {(itemIsToday || itemIsYesterday) && (
                            <span
                              className={clsx(
                                "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                itemIsToday
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/20 text-amber-400"
                              )}
                            >
                              {itemIsToday ? "วันนี้" : "เมื่อวาน"}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          {item.count > 0 ? `${item.count} รายการ` : "ไม่มีรายการ"}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        {item.expense > 0 && (
                          <span className="text-xs font-bold text-rose-400">
                            -฿{formatBaht(item.expense)}
                          </span>
                        )}
                        {item.income > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-400">
                            +฿{formatBaht(item.income)}
                          </span>
                        )}
                        {item.expense === 0 && item.income === 0 && (
                          <span className="text-xs font-medium text-slate-600">-</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. Profile & Budget Quotas Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-t-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:rounded-3xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    profile?.displayName?.slice(0, 1).toUpperCase() || <User size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {profile?.displayName || "โปรไฟล์ผู้ใช้"}
                  </h3>
                  <p className="text-xs text-slate-400">{profile?.email || ""}</p>
                </div>
              </div>
              <button
                onClick={() => setProfileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Budget Quota Summary */}
            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  โควต้างบประมาณ (กำหนดจากหลังบ้าน)
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <Sun size={16} className="mx-auto text-amber-400 mb-1" />
                    <span className="block text-[10px] text-slate-400">งบรายวัน</span>
                    <span className="mt-0.5 block text-xs font-bold text-white">
                      ฿{formatBaht(budgets?.daily || 0)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <Calendar size={16} className="mx-auto text-indigo-400 mb-1" />
                    <span className="block text-[10px] text-slate-400">งบรายสัปดาห์</span>
                    <span className="mt-0.5 block text-xs font-bold text-white">
                      ฿{formatBaht(budgets?.weekly || 0)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <Wallet size={16} className="mx-auto text-emerald-400 mb-1" />
                    <span className="block text-[10px] text-slate-400">งบประจำเดือน</span>
                    <span className="mt-0.5 block text-xs font-bold text-white">
                      ฿{formatBaht(budgets?.monthly || 0)}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  💡 กำหนดและปรับเปลี่ยนตัวเลขงบประมาณได้ที่ระบบ Expense Dashboard หลังบ้าน
                </p>
              </div>

              {/* Edit Display Name */}
              <div className="border-t border-slate-800/80 pt-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อที่แสดง
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                  >
                    {savingProfile ? "กำลังบันทึก..." : "บันทึกชื่อ"}
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <div className="border-t border-slate-800/80 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 py-2.5 text-xs font-bold text-rose-400 transition-colors hover:bg-rose-950/50 active:scale-[0.98]"
                >
                  <LogOut size={16} />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
