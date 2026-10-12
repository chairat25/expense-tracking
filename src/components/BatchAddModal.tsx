"use client";

import { useState, useEffect, useCallback, useId } from "react";
import clsx from "clsx";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  DollarSign,
  Layers,
  CheckCheck,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { formatDayTH, type Tx } from "@/lib/shared";

export interface CategoryOption {
  slug: string;
  name: string;
  icon?: string;
  type: string;
}

export interface BatchRow {
  id: string;
  amount: string;
  type: "expense" | "income";
  category: string;
  note: string;
}

interface BatchAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  currentDate: string;
  onTransactionsAdded: (createdTxs: Tx[]) => void;
}

function createEmptyRow(catSlug: string): BatchRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    amount: "",
    type: "expense",
    category: catSlug,
    note: "",
  };
}

export default function BatchAddModal({
  isOpen,
  onClose,
  categories,
  currentDate,
  onTransactionsAdded,
}: BatchAddModalProps) {
  const defaultCategory = categories[0]?.slug || "food";
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingProgress, setSavingProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize with 3 rows whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(currentDate);
      setErrorMsg(null);
      setSavingProgress(null);
      setRows([
        createEmptyRow(defaultCategory),
        createEmptyRow(defaultCategory),
        createEmptyRow(defaultCategory),
      ]);
    }
  }, [isOpen, currentDate, defaultCategory]);

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow(defaultCategory)]);
  }, [defaultCategory]);

  const handleRemoveRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        // Reset the single remaining row instead of deleting
        return [createEmptyRow(defaultCategory)];
      }
      return prev.filter((r) => r.id !== id);
    });
  }, [defaultCategory]);

  const handleUpdateRow = useCallback((id: string, updates: Partial<BatchRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  // Compute Summary
  const validRows = rows.filter((r) => {
    const val = parseFloat(r.amount);
    return !isNaN(val) && val > 0;
  });

  const totalExpense = validRows
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + parseFloat(r.amount), 0);

  const totalIncome = validRows
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + parseFloat(r.amount), 0);

  // Handle Submit All
  const handleSubmitAll = async () => {
    if (validRows.length === 0) {
      setErrorMsg("กรุณาระบุจำนวนเงินอย่างน้อย 1 รายการ");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSavingProgress({ current: 0, total: validRows.length });

    const createdList: Tx[] = [];
    const failedRows: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setSavingProgress({ current: i + 1, total: validRows.length });

      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDate,
            type: row.type,
            amount: parseFloat(row.amount),
            category: row.category,
            note: row.note.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error("บันทึกไม่สำเร็จ");
        }

        const created: Tx = await res.json();
        createdList.push(created);
      } catch (err) {
        console.error("Batch add item failed", row, err);
        failedRows.push(row.note || `${row.amount} บาท`);
      }
    }

    setSubmitting(false);
    setSavingProgress(null);

    if (createdList.length > 0) {
      onTransactionsAdded(createdList);
    }

    if (failedRows.length > 0) {
      setErrorMsg(`บันทึกสำเร็จ ${createdList.length} รายการ (เกิดข้อผิดพลาด ${failedRows.length} รายการ)`);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      {/* Container */}
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                เพิ่มหลายรายการพร้อมกัน
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Calendar size={12} className="text-emerald-400" />
                <span>บันทึกลง:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-emerald-300 font-semibold underline outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3.5 py-2 text-xs text-rose-300">
            <AlertCircle size={14} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Saving Progress Bar */}
        {savingProgress && (
          <div className="border-b border-emerald-500/20 bg-emerald-950/30 px-4 py-2 sm:px-5">
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-emerald-400" />
                <span>
                  กำลังบันทึกรายการที่ {savingProgress.current} จาก {savingProgress.total}...
                </span>
              </div>
              <span className="font-semibold text-emerald-400 text-[11px]">
                {Math.round((savingProgress.current / savingProgress.total) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Rows Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {rows.map((row, index) => {
            const hasAmount = parseFloat(row.amount) > 0;
            return (
              <div
                key={row.id}
                className={clsx(
                  "relative rounded-2xl border p-3 sm:p-3.5 transition-all",
                  hasAmount
                    ? "border-slate-800 bg-slate-900/70"
                    : "border-slate-800/60 bg-slate-900/30"
                )}
              >
                {/* Row Header: Number badge, Type toggle, Delete button */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-300">
                      {index + 1}
                    </span>

                    {/* Expense / Income toggle */}
                    <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleUpdateRow(row.id, { type: "expense" })}
                        className={clsx(
                          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all",
                          row.type === "expense"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        <TrendingDown size={11} />
                        <span>จ่าย</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateRow(row.id, { type: "income" })}
                        className={clsx(
                          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all",
                          row.type === "income"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        <TrendingUp size={11} />
                        <span>รับ</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={submitting}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                    title="ลบแถวนี้"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Row Inputs Grid: Amount, Category, Note */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  {/* Amount (4 cols on desktop) */}
                  <div className="sm:col-span-4 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                      <DollarSign size={14} />
                    </div>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(e) => handleUpdateRow(row.id, { amount: e.target.value })}
                      placeholder="0.00"
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-sm font-bold text-white placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Category (4 cols on desktop) */}
                  <div className="sm:col-span-4">
                    <select
                      value={row.category}
                      onChange={(e) => handleUpdateRow(row.id, { category: e.target.value })}
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Note (4 cols on desktop) */}
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={row.note}
                      onChange={(e) => handleUpdateRow(row.id, { note: e.target.value })}
                      placeholder="หมายเหตุ (เช่น กาแฟ, ข้าวเที่ยง)"
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Row Button */}
          <button
            type="button"
            onClick={handleAddRow}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 py-2.5 text-xs font-semibold text-slate-400 hover:border-emerald-500/40 hover:bg-slate-900/60 hover:text-emerald-300 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <Plus size={14} />
            <span>เพิ่มรายการถัดไป</span>
          </button>
        </div>

        {/* Footer Summary & Submit Button */}
        <div className="border-t border-slate-800/80 bg-slate-950 px-4 py-3 sm:px-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Live Total Badge */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                รวมทั้งหมด <strong className="text-white">{validRows.length}</strong> รายการ:
              </span>
              <div className="flex items-center gap-2">
                {totalExpense > 0 && (
                  <span className="font-bold text-rose-400">
                    -฿{totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                {totalIncome > 0 && (
                  <span className="font-bold text-emerald-400">
                    +฿{totalIncome.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                {totalExpense === 0 && totalIncome === 0 && (
                  <span className="text-slate-500">฿0.00</span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={submitting || validRows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCheck size={16} />
                  <span>
                    บันทึกทั้งหมด ({validRows.length} รายการ) ลง {formatDayTH(selectedDate)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
