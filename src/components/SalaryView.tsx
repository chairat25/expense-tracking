"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  Banknote,
  CheckCircle2,
  Coins,
  Pencil,
  Wallet,
  Calendar,
  Sparkles,
  History,
  AlertCircle,
  Plus,
  Trash2,
  PieChart,
  ArrowRight,
  Calculator,
  Layers,
} from "lucide-react";
import {
  formatBaht,
  formatMonthTH,
  getMonthWeeks,
  todayKey,
  type SalaryRecord,
  type MonthWeekInfo,
} from "@/lib/shared";

type Props = {
  ym: string;
  onSalarySaved: () => void;
};

export type PocketItem = {
  id: number;
  name: string;
  icon: string;
  color: string;
  allocatedAmount: number;
  isWeeklyPool: boolean;
};

export type WeeklyEnvelopeItem = {
  weekIndex: number;
  startDate: string;
  endDate: string;
  budgetAmount: number;
};

const PRESET_POCKET_EMOJIS = ["🛒", "🏡", "🚗", "🛍️", "🐷", "⚡", "💊", "🎓", "✈️", "🍿"];
const PRESET_POCKET_COLORS = ["#3b82f6", "#10b981", "#f43f5e", "#8b5cf6", "#f59e0b", "#06b6d4"];

export default function SalaryView({ ym, onSalarySaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Salary States
  const [defaultSalary, setDefaultSalary] = useState<number>(0);
  const [salaryAmount, setSalaryAmount] = useState<string>("");
  const [receivedAt, setReceivedAt] = useState<string>(todayKey());
  const [currentSalary, setCurrentSalary] = useState<SalaryRecord | null>(null);

  // 2. Pockets States
  const [pockets, setPockets] = useState<PocketItem[]>([]);
  const [showPocketModal, setShowPocketModal] = useState(false);
  const [editingPocket, setEditingPocket] = useState<PocketItem | null>(null);
  const [pocketName, setPocketName] = useState("");
  const [pocketIcon, setPocketIcon] = useState("📦");
  const [pocketColor, setPocketColor] = useState("#6366f1");
  const [pocketAmount, setPocketAmount] = useState("");
  const [pocketIsWeekly, setPocketIsWeekly] = useState(false);

  // 3. Weekly Envelopes States
  const [envelopes, setEnvelopes] = useState<Record<number, number>>({});
  const monthWeeks = useMemo(() => getMonthWeeks(ym), [ym]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      // Fetch Salary
      const salRes = await fetch(`/api/salary?ym=${ym}`, { cache: "no-store" });
      if (salRes.ok) {
        const salData = await salRes.json();
        setDefaultSalary(salData.defaultSalary ?? 0);
        setCurrentSalary(salData.salary ?? null);
        if (salData.salary) {
          setSalaryAmount(String(salData.salary.amount));
          setReceivedAt(salData.salary.receivedAt);
        } else if (salData.defaultSalary > 0) {
          setSalaryAmount(String(salData.defaultSalary));
        }
      }

      // Fetch Pockets
      const pocRes = await fetch(`/api/pockets?ym=${ym}`, { cache: "no-store" });
      if (pocRes.ok) {
        const pocData = await pocRes.json();
        setPockets(
          (pocData.pockets || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            icon: p.icon,
            color: p.color,
            allocatedAmount: Number(p.allocatedAmount) || 0,
            isWeeklyPool: Boolean(p.isWeeklyPool),
          })),
        );
      }

      // Fetch Weekly Envelopes
      const envRes = await fetch(`/api/weekly-envelopes?ym=${ym}`, { cache: "no-store" });
      if (envRes.ok) {
        const envData = await envRes.json();
        const map: Record<number, number> = {};
        for (const e of envData.envelopes || []) {
          map[e.weekIndex] = Number(e.budgetAmount) || 0;
        }
        setEnvelopes(map);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [ym]);

  // Calculations
  const grossSalary = Number(salaryAmount) || 0;
  const totalAllocatedToPockets = useMemo(
    () => pockets.reduce((sum, p) => sum + p.allocatedAmount, 0),
    [pockets],
  );
  const unallocatedSalary = Math.max(grossSalary - totalAllocatedToPockets, 0);

  const totalWeeklyAllocated = useMemo(
    () => Object.values(envelopes).reduce((sum, val) => sum + val, 0),
    [envelopes],
  );

  // Handlers: Save Salary
  async function handleSaveSalary(e: React.FormEvent) {
    e.preventDefault();
    if (grossSalary <= 0) {
      setError("กรุณากรอกจำนวนเงินเดือนที่ถูกต้อง");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ym,
          amount: grossSalary,
          receivedAt,
          applyMode: "opening_balance",
          note: "จัดสรรผ่านระบบกระปุกเงินเดือน",
        }),
      });
      if (!res.ok) throw new Error("บันทึกเงินเดือนไม่สำเร็จ");
      const data = await res.json();
      setCurrentSalary(data.salary);
      setSuccessMsg("บันทึกยอดเงินเดือนเรียบร้อย!");
      onSalarySaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  // Handlers: Pocket Modal (Create / Edit / Delete)
  function openCreatePocket() {
    setEditingPocket(null);
    setPocketName("");
    setPocketIcon("📦");
    setPocketColor("#6366f1");
    setPocketAmount("");
    setPocketIsWeekly(false);
    setShowPocketModal(true);
  }

  function openEditPocket(p: PocketItem) {
    setEditingPocket(p);
    setPocketName(p.name);
    setPocketIcon(p.icon);
    setPocketColor(p.color);
    setPocketAmount(String(p.allocatedAmount));
    setPocketIsWeekly(p.isWeeklyPool);
    setShowPocketModal(true);
  }

  async function handleSavePocket(e: React.FormEvent) {
    e.preventDefault();
    if (!pocketName.trim()) {
      setError("กรุณากรอกชื่อกระปุกเงิน");
      return;
    }
    const numAmt = Number(pocketAmount) || 0;

    setSaving(true);
    try {
      const res = await fetch("/api/pockets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPocket?.id,
          ym,
          name: pocketName.trim(),
          icon: pocketIcon,
          color: pocketColor,
          allocatedAmount: numAmt,
          isWeeklyPool: pocketIsWeekly,
        }),
      });

      if (!res.ok) throw new Error("บันทึกกระปุกไม่สำเร็จ");
      setShowPocketModal(false);
      void loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePocket(id: number) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบกระปุกนี้?")) return;
    setSaving(true);
    try {
      await fetch("/api/pockets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      void loadData();
    } catch (e) {
      setError("ลบกระปุกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  // Handlers: Save Weekly Envelopes
  async function handleSaveWeeklyEnvelopes() {
    setSaving(true);
    setError(null);
    try {
      const payload = monthWeeks.map((w) => ({
        weekIndex: w.weekIndex,
        startDate: w.startDate,
        endDate: w.endDate,
        budgetAmount: envelopes[w.weekIndex] || 0,
      }));

      const res = await fetch("/api/weekly-envelopes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ym, envelopes: payload }),
      });

      if (!res.ok) throw new Error("บันทึกงบสัปดาห์ไม่สำเร็จ");
      setSuccessMsg("บันทึกการจัดสรรงบสัปดาห์เรียบร้อยแล้ว!");
      onSalarySaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pop-in pb-10">
      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: บันทึกเงินเดือนรวมประจำเดือน */}
      <div className="card space-y-4 p-5 bg-gradient-to-br from-indigo-900/30 via-surface to-surface border-indigo-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-400 border border-indigo-500/30">
              1
            </span>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Banknote className="text-indigo-400" size={18} />
              บันทึกเงินเดือนรวมประจำเดือน ({formatMonthTH(ym)})
            </h2>
          </div>

          {currentSalary && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 size={12} /> บันทึกแล้ว
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSalary} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-muted">
                จำนวนเงินเดือนทั้งหมด (บาท)
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  placeholder="เช่น 35000"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-bold text-foreground placeholder:text-muted/50 focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted">฿</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted">
                วันที่เงินเดือนออก
              </label>
              <input
                type="date"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={15} />
            {saving ? "กำลังบันทึก..." : "บันทึกยอดเงินเดือนรวม"}
          </button>
        </form>
      </div>

      {/* STEP 2: กระปุกเงินเดือน (Money Pockets Grid) */}
      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              2
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Layers className="text-emerald-400" size={18} />
                แบ่งใส่กระปุกเงิน (Money Pockets)
              </h3>
              <p className="text-[11px] text-muted">
                กระจายเงินเดือนเป็นกระปุกสี่เหลี่ยมแยกตามทิศทางใช้งาน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreatePocket}
            className="flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 active:scale-95 transition"
          >
            <Plus size={14} />
            <span>สร้างกระปุก</span>
          </button>
        </div>

        {/* Unallocated Salary Progress Bar */}
        {grossSalary > 0 && (
          <div className="space-y-1.5 rounded-2xl bg-surface-2/60 p-3.5 border border-border/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                เงินเดือนคงเหลือยังไม่ได้จัดสรร:
              </span>
              <span
                className={clsx(
                  "font-bold tnum",
                  unallocatedSalary > 0 ? "text-emerald-400" : "text-muted",
                )}
              >
                {formatBaht(unallocatedSalary)} ฿ / {formatBaht(grossSalary)} ฿
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (totalAllocatedToPockets / grossSalary) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Pockets Grid */}
        {pockets.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pockets.map((p) => (
              <div
                key={p.id}
                onClick={() => openEditPocket(p)}
                className="group relative cursor-pointer rounded-2xl border p-3.5 space-y-2 transition-all hover:scale-[1.02] active:scale-95 bg-surface-2/40"
                style={{ borderColor: `${p.color}40` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex size-9 place-items-center justify-center rounded-xl text-lg shadow-sm"
                    style={{ backgroundColor: `${p.color}20` }}
                  >
                    {p.icon}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeletePocket(p.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-rose-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div>
                  <h4 className="truncate text-xs font-bold text-foreground">
                    {p.name}
                  </h4>
                  <p
                    className="tnum text-sm font-extrabold mt-0.5"
                    style={{ color: p.color }}
                  >
                    {formatBaht(p.allocatedAmount)} ฿
                  </p>
                </div>

                {p.isWeeklyPool && (
                  <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    🎯 งบสัปดาห์
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted space-y-2">
            <p>ยังไม่มีกระปุกเงินในเดือนนี้</p>
            <button
              type="button"
              onClick={openCreatePocket}
              className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:underline"
            >
              <Plus size={14} /> กดที่นี่เพื่อสร้างกระปุกเงินแรกของคุณ
            </button>
          </div>
        )}
      </div>

      {/* STEP 3: โอน/จัดสรรลง "งบสัปดาห์" (Weekly Budget Allocation Cards) */}
      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              3
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Calculator className="text-blue-400" size={18} />
                จัดสรรลง "งบสัปดาห์" (Weekly Envelopes)
              </h3>
              <p className="text-[11px] text-muted">
                แบ่งเงินลงแต่ละสัปดาห์เพื่อคำนวณโควตาใช้เงินต่อวันให้อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveWeeklyEnvelopes}
            disabled={saving}
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            <span>บันทึกงบสัปดาห์</span>
          </button>
        </div>

        <div className="space-y-3">
          {monthWeeks.map((w) => {
            const currentBudget = envelopes[w.weekIndex] || 0;
            const dailyQuota = currentBudget > 0 ? currentBudget / w.days : 0;

            return (
              <div
                key={w.weekIndex}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-2/30 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">
                    {w.label}
                  </h4>
                  <p className="text-[11px] text-muted flex items-center gap-1">
                    <span>ระยะเวลา {w.days} วัน</span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-400">
                      เฉลี่ย {formatBaht(dailyQuota)} ฿ / วัน
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 sm:pt-0">
                  <div className="relative w-36">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={envelopes[w.weekIndex] ?? ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setEnvelopes((prev) => ({
                          ...prev,
                          [w.weekIndex]: val,
                        }));
                      }}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground text-right focus:border-blue-500 focus:outline-none"
                    />
                    <span className="absolute left-2.5 top-1.5 text-xs text-muted">
                      ฿
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POCKET CREATION/EDIT MODAL */}
      {showPocketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">
                {editingPocket ? "แก้ไขกระปุกเงิน" : "สร้างกระปุกเงินใหม่"}
              </h3>
              <button
                type="button"
                onClick={() => setShowPocketModal(false)}
                className="text-xs text-muted hover:text-foreground"
              >
                ✕ ปิด
              </button>
            </div>

            <form onSubmit={handleSavePocket} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted">
                  ชื่อกระปุกเงิน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ค่าอาหาร, ค่าน้ำไฟ, เงินออม"
                  value={pocketName}
                  onChange={(e) => setPocketName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted">
                  เลือกไอคอน Emoji
                </label>
                <div className="mt-1 grid grid-cols-5 gap-1.5">
                  {PRESET_POCKET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setPocketIcon(emoji)}
                      className={clsx(
                        "grid h-9 place-items-center rounded-xl text-lg transition",
                        pocketIcon === emoji
                          ? "bg-indigo-500/20 border-2 border-indigo-500 scale-105"
                          : "bg-surface-2 hover:bg-surface-2/80",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted">
                  ธีมสีประจำกระปุก
                </label>
                <div className="mt-1 flex items-center gap-2">
                  {PRESET_POCKET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPocketColor(c)}
                      className={clsx(
                        "size-7 rounded-full border-2 transition",
                        pocketColor === c ? "scale-110 border-white" : "border-transparent opacity-70",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted">
                  จำนวนเงินที่แบ่งใส่กระปุกนี้ (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pocketAmount}
                  onChange={(e) => setPocketAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-foreground focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isWeekly"
                  checked={pocketIsWeekly}
                  onChange={(e) => setPocketIsWeekly(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="isWeekly" className="text-xs text-foreground font-medium">
                  เน้นเป็นกระปุกใช้จ่ายประจำสัปดาห์ 🎯
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก..." : editingPocket ? "บันทึกการแก้ไข" : "สร้างกระปุกเงิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
