"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  DollarSign,
  Layers,
  Check,
  CheckCheck,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ImagePlus,
  ZoomIn,
} from "lucide-react";
import { formatDayTH, type Tx } from "@/lib/shared";
import { recognizeReceiptImage } from "@/lib/receipt/ocr";
import { parseReceiptText } from "@/lib/receipt/parser";
import { getSavedPattern, savePattern } from "@/lib/receipt/patterns";
import { OcrScanOverlay } from "@/components/OcrScanOverlay";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

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
  previewUrl?: string;
  scanning?: boolean;
  scanPercent?: number;
  scanStatus?: string;
  scanError?: string;
  merchant?: string | null;
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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const rowFileInputRef = useRef<HTMLInputElement>(null);
  const targetRowIdRef = useRef<string | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const revokeUrl = useCallback((url?: string) => {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch {}
    previewUrlsRef.current.delete(url);
  }, []);

  const revokeAllUrls = useCallback(() => {
    previewUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    previewUrlsRef.current.clear();
  }, []);

  // Initialize with 3 rows whenever modal opens; release preview URLs when closed/unmounted
  useEffect(() => {
    if (isOpen) {
      revokeAllUrls();
      setSelectedDate(currentDate);
      setErrorMsg(null);
      setSavingProgress(null);
      setZoomedImage(null);
      setRows([
        createEmptyRow(defaultCategory),
        createEmptyRow(defaultCategory),
        createEmptyRow(defaultCategory),
      ]);
    } else {
      revokeAllUrls();
      setZoomedImage(null);
    }
    return () => {
      revokeAllUrls();
    };
  }, [isOpen, currentDate, defaultCategory, revokeAllUrls]);

  // Prevent background page scrolling on mobile / iOS PWA while popover is open
  useBodyScrollLock(isOpen);

  // Prevent dismissing modal with Escape while batch commit is in progress
  useEffect(() => {
    if (!isOpen || !submitting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, submitting]);

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow(defaultCategory)]);
  }, [defaultCategory]);

  const handleRemoveRow = useCallback(
    (id: string) => {
      setRows((prev) => {
        const target = prev.find((r) => r.id === id);
        if (target?.previewUrl) {
          revokeUrl(target.previewUrl);
        }
        if (prev.length <= 1) {
          // Reset the single remaining row instead of deleting
          return [createEmptyRow(defaultCategory)];
        }
        return prev.filter((r) => r.id !== id);
      });
    },
    [defaultCategory, revokeUrl]
  );

  const handleClearRowSlip = useCallback(
    (id: string) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          if (r.previewUrl) {
            revokeUrl(r.previewUrl);
          }
          return {
            ...r,
            previewUrl: undefined,
            scanning: false,
            scanPercent: undefined,
            scanStatus: undefined,
            scanError: undefined,
            merchant: null,
          };
        })
      );
    },
    [revokeUrl]
  );

  const handleUpdateRow = useCallback((id: string, updates: Partial<BatchRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  // Trigger file picker for a specific row
  const handlePickSlipForRow = useCallback((rowId: string) => {
    targetRowIdRef.current = rowId;
    rowFileInputRef.current?.click();
  }, []);

  // Run OpenThai 2.1 OCR (with Tesseract fallback) for a single row and fill its fields
  const handleRowSlipFile = useCallback(
    async (rowId: string, file: File) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);

      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          if (r.previewUrl && r.previewUrl !== previewUrl) {
            revokeUrl(r.previewUrl);
          }
          return {
            ...r,
            previewUrl,
            scanning: true,
            scanPercent: 10,
            scanStatus: "กำลังเตรียมสลิป...",
            scanError: undefined,
          };
        })
      );

      try {
        const rawText = await recognizeReceiptImage(file, (percent, status) => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    scanPercent: percent,
                    scanStatus: status || "กำลังอ่านสลิป...",
                  }
                : r
            )
          );
        });

        const parsed = parseReceiptText(rawText);
        const saved = parsed?.merchant ? getSavedPattern(parsed.merchant) : null;

        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== rowId) return r;
            const nextAmount = parsed?.amount ? parsed.amount.toString() : r.amount;
            const nextCategory = saved?.category || r.category;
            const nextNote = saved?.note || parsed?.merchant || r.note;
            return {
              ...r,
              scanning: false,
              scanPercent: 100,
              scanStatus: "อ่านสลิปแล้ว",
              scanError: parsed?.amount ? undefined : "ไม่พบยอดเงินในสลิป กรุณากรอกเอง",
              type: parsed?.type ?? r.type,
              amount: nextAmount,
              category: nextCategory,
              note: nextNote,
              merchant: parsed?.merchant ?? null,
            };
          })
        );
      } catch (err) {
        console.error("Row receipt OCR error", err);
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  scanning: false,
                  scanPercent: undefined,
                  scanStatus: undefined,
                  scanError: "อ่านสลิปไม่สำเร็จ กรุณากรอกข้อมูลเอง",
                }
              : r
          )
        );
      }
    },
    [revokeUrl]
  );

  // Compute Summary
  const isAnyScanning = rows.some((r) => Boolean(r?.scanning));
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
    if (submitting || isAnyScanning) return;
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
        if (row?.merchant && row?.note?.trim()) {
          savePattern(row.merchant, row.category, row.note.trim());
        }
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overscroll-none animate-in fade-in duration-150"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      {/* Shared hidden file input for per-row slip attachment */}
      <input
        ref={rowFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const targetId = targetRowIdRef.current;
          if (file && targetId) {
            void handleRowSlipFile(targetId, file);
          }
          if (rowFileInputRef.current) rowFileInputRef.current.value = "";
          targetRowIdRef.current = null;
        }}
      />

      {/* Popover Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="เพิ่มหลายรายการพร้อมกัน"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] sm:max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-150"
      >
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
                  disabled={submitting}
                  className={clsx(
                    "bg-transparent text-emerald-300 font-semibold underline outline-none",
                    submitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  )}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!submitting) onClose();
            }}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
            title={submitting ? "กำลังบันทึก กรุณารอสักครู่" : "ปิดหน้าต่าง"}
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
          <div className="border-b border-emerald-500/20 bg-emerald-950/30 px-4 py-2.5 sm:px-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-emerald-400 shrink-0" />
                <span>
                  กำลังบันทึกรายการที่ {savingProgress.current} จาก {savingProgress.total} (กรุณารอสักครู่...)
                </span>
              </div>
              <span className="font-semibold text-emerald-400 text-[11px] tabular-nums">
                {Math.round((savingProgress.current / Math.max(1, savingProgress.total)) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full bg-emerald-500 transition-all duration-200"
                style={{
                  width: `${Math.round((savingProgress.current / Math.max(1, savingProgress.total)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Rows Scroll Area */}
        <div
          aria-busy={submitting}
          className={clsx(
            "flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3 transition-opacity",
            submitting && "pointer-events-none opacity-60 select-none"
          )}
        >
          {rows.map((row, index) => {
            const hasAmount = parseFloat(row.amount) > 0;
            const rowLocked = submitting || Boolean(row.scanning);

            return (
              <div
                key={row.id}
                className={clsx(
                  "relative rounded-2xl border p-3 sm:p-3.5 transition-all",
                  row.scanning
                    ? "border-indigo-500/50 bg-indigo-950/20 ocr-scanning-card"
                    : hasAmount
                    ? "border-slate-800 bg-slate-900/70"
                    : "border-slate-800/60 bg-slate-900/30"
                )}
              >
                {/* Row Header: Number badge, Type toggle, Attach Slip, Delete button */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-300">
                      {index + 1}
                    </span>

                    {/* Expense / Income toggle */}
                    <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleUpdateRow(row.id, { type: "expense" })}
                        disabled={rowLocked}
                        className={clsx(
                          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all disabled:opacity-50",
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
                        disabled={rowLocked}
                        className={clsx(
                          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all disabled:opacity-50",
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

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePickSlipForRow(row.id)}
                      disabled={rowLocked}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-indigo-500/35 bg-indigo-950/60 px-2 py-1 text-[11px] font-semibold text-indigo-300 hover:border-indigo-400 hover:bg-indigo-900/50 transition-colors active:scale-95 disabled:opacity-50"
                      title={row.previewUrl ? "เปลี่ยนรูปสลิป" : "แนบสลิปเพื่ออ่านยอดอัตโนมัติ"}
                    >
                      <ImagePlus size={12} className="shrink-0 text-indigo-400" />
                      <span>{row.previewUrl ? "เปลี่ยนสลิป" : "แนบสลิป"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={rowLocked}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-300 transition-colors disabled:opacity-40"
                      title="ลบแถวนี้"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Attached Slip Strip (Thumbnail + OCR Status) */}
                {row.previewUrl && (
                  <div className="mb-2.5 flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/80 p-2">
                    <div className="relative h-12 w-12 shrink-0 group overflow-hidden rounded-lg">
                      <img
                        src={row.previewUrl}
                        alt="รูปสลิป"
                        className="h-full w-full rounded-lg border border-slate-800 object-cover bg-slate-900"
                      />
                      <OcrScanOverlay active={Boolean(row.scanning)} compact />
                      {!row.scanning && (
                        <button
                          type="button"
                          onClick={() => setZoomedImage(row.previewUrl ?? null)}
                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          title="ดูภาพขนาดเต็ม"
                        >
                          <ZoomIn size={14} />
                        </button>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {row.scanning ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-indigo-300">
                            <span className="flex items-center gap-1.5 truncate font-medium">
                              <Loader2 size={12} className="animate-spin shrink-0 text-indigo-400" />
                              <span className="truncate">{row.scanStatus || "กำลังอ่านสลิป..."}</span>
                            </span>
                            <span className="shrink-0 font-bold tabular-nums text-indigo-400 ml-2">
                              {row.scanPercent ?? 0}%
                            </span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-900">
                            <div
                              className="ocr-shimmer-bar h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-200"
                              style={{ width: `${row.scanPercent ?? 0}%` }}
                            />
                          </div>
                        </div>
                      ) : row.scanError ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
                          <AlertCircle size={13} className="shrink-0" />
                          <span className="truncate">{row.scanError}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                          <Check size={13} className="shrink-0" />
                          <span className="truncate font-medium">
                            {row.merchant ? `อ่านสลิปแล้ว (${row.merchant})` : "อ่านสลิปแล้ว"}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClearRowSlip(row.id)}
                      disabled={rowLocked}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
                      title="ลบรูปสลิปออกจากแถวนี้"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

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
                      disabled={rowLocked}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-sm font-bold text-white placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Category (4 cols on desktop) */}
                  <div className="sm:col-span-4">
                    <select
                      value={row.category}
                      onChange={(e) => handleUpdateRow(row.id, { category: e.target.value })}
                      disabled={rowLocked}
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
                      disabled={rowLocked}
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
              disabled={submitting || isAnyScanning || validRows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : isAnyScanning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>กำลังอ่านสลิป...</span>
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

      {/* Zoomed Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-lg">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
              title="ปิด"
            >
              <X size={24} />
            </button>
            <img
              src={zoomedImage}
              alt="ภาพสลิปขนาดเต็ม"
              className="max-h-[85vh] w-auto rounded-xl object-contain border border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
