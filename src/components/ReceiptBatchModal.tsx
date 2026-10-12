"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import clsx from "clsx";
import {
  X,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  Calendar,
  AlertCircle,
  Layers,
  ZoomIn,
  DollarSign,
  Tag,
  FileText,
} from "lucide-react";
import { formatDayTH, type Tx } from "@/lib/shared";
import { recognizeReceiptImage } from "@/lib/receipt/ocr";
import { parseReceiptText } from "@/lib/receipt/parser";
import { getSavedPattern, savePattern } from "@/lib/receipt/patterns";

export interface CategoryOption {
  slug: string;
  name: string;
  icon?: string;
  type: string;
}

export interface StagedReceiptItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "scanning" | "ready" | "saving" | "error";
  progressPercent: number;
  amount: string;
  date: string;
  category: string;
  note: string;
  merchant: string | null;
  errorMsg?: string;
}

interface ReceiptBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: File[];
  categories: CategoryOption[];
  currentDate: string;
  onTransactionAdded: (createdTx: Tx) => void;
}

export default function ReceiptBatchModal({
  isOpen,
  onClose,
  files,
  categories,
  currentDate,
  onTransactionAdded,
}: ReceiptBatchModalProps) {
  const [items, setItems] = useState<StagedReceiptItem[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const isProcessingRef = useRef(false);

  // Initialize staging items when files change
  useEffect(() => {
    if (!isOpen || files.length === 0) return;

    const newItems: StagedReceiptItem[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
      progressPercent: 0,
      amount: "",
      date: currentDate,
      category: categories[0]?.slug || "food",
      note: "",
      merchant: null,
    }));

    setItems(newItems);

    return () => {
      // Cleanup object URLs on unmount/re-init
      newItems.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {}
      });
    };
  }, [isOpen, files, currentDate, categories]);

  // Process items sequentially
  useEffect(() => {
    if (!isOpen || isProcessingRef.current) return;

    const pendingItem = items.find((it) => it.status === "pending");
    if (!pendingItem) return;

    async function processNext(item: StagedReceiptItem) {
      isProcessingRef.current = true;

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "scanning", progressPercent: 10 } : it
        )
      );

      try {
        const rawText = await recognizeReceiptImage(item.file, (pct) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, progressPercent: pct } : it
            )
          );
        });

        const parsed = parseReceiptText(rawText);
        const saved = parsed.merchant ? getSavedPattern(parsed.merchant) : null;
        const assignedCat = saved?.category || categories[0]?.slug || "food";
        const assignedNote = saved?.note || parsed.merchant || "";
        const assignedDate = parsed.date || currentDate;
        const assignedAmount = parsed.amount ? parsed.amount.toString() : "";

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "ready",
                  progressPercent: 100,
                  amount: assignedAmount,
                  date: assignedDate,
                  category: assignedCat,
                  note: assignedNote,
                  merchant: parsed.merchant,
                }
              : it
          )
        );
      } catch (err: any) {
        console.error("Receipt OCR processing error", err);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "error",
                  errorMsg: "อ่านตัวเลขอัตโนมัติไม่สำเร็จ กรุณากรอกด้วยตนเอง",
                  date: currentDate,
                  category: categories[0]?.slug || "food",
                }
              : it
          )
        );
      } finally {
        isProcessingRef.current = false;
      }
    }

    void processNext(pendingItem);
  }, [isOpen, items, categories, currentDate]);

  // Update item field
  const handleUpdateItem = useCallback((id: string, updates: Partial<StagedReceiptItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  }, []);

  // Accept a single item
  const handleAcceptItem = useCallback(
    async (id: string) => {
      const target = items.find((it) => it.id === id);
      if (!target) return;

      const numAmount = parseFloat(target.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, errorMsg: "กรุณาระบุจำนวนเงินให้ถูกต้อง" } : it
          )
        );
        return;
      }

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "saving", errorMsg: undefined } : it))
      );

      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: target.date,
            type: "expense",
            amount: numAmount,
            category: target.category,
            note: target.note.trim(),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "บันทึกรายการไม่สำเร็จ");
        }

        const createdTx: Tx = await res.json();

        if (target.merchant && target.note.trim()) {
          savePattern(target.merchant, target.category, target.note.trim());
        }

        onTransactionAdded(createdTx);

        // Remove from list
        setItems((prev) => {
          const remaining = prev.filter((it) => it.id !== id);
          if (remaining.length === 0) {
            onClose();
          }
          return remaining;
        });

        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, status: "ready", errorMsg: err.message || "เกิดข้อผิดพลาดในการบันทึก" }
              : it
          )
        );
      }
    },
    [items, onTransactionAdded, onClose]
  );

  // Reject a single item
  const handleRejectItem = useCallback(
    (id: string) => {
      const target = items.find((it) => it.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      }

      setItems((prev) => {
        const remaining = prev.filter((it) => it.id !== id);
        if (remaining.length === 0) {
          onClose();
        }
        return remaining;
      });
    },
    [items, onClose]
  );

  // Accept all ready items
  const handleAcceptAll = useCallback(async () => {
    const readyItems = items.filter(
      (it) => (it.status === "ready" || it.status === "error") && parseFloat(it.amount) > 0
    );

    if (readyItems.length === 0) return;

    setSavingAll(true);

    for (const item of readyItems) {
      const numAmount = parseFloat(item.amount);
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: item.date,
            type: "expense",
            amount: numAmount,
            category: item.category,
            note: item.note.trim(),
          }),
        });

        if (res.ok) {
          const createdTx: Tx = await res.json();
          if (item.merchant && item.note.trim()) {
            savePattern(item.merchant, item.category, item.note.trim());
          }
          onTransactionAdded(createdTx);
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {}
        }
      } catch (err) {
        console.error("Batch save item failed", err);
      }
    }

    setSavingAll(false);
    onClose();
  }, [items, onTransactionAdded, onClose]);

  if (!isOpen || items.length === 0) return null;

  const totalCount = items.length;
  const readyCount = items.filter(
    (it) => (it.status === "ready" || it.status === "error") && parseFloat(it.amount) > 0
  ).length;
  const scanningItem = items.find((it) => it.status === "scanning");
  const scanningIdx = items.findIndex((it) => it.status === "scanning");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      {/* Container */}
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-3xl sm:rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                จัดการสลิป ({totalCount} รายการ)
              </h2>
              <p className="text-[11px] text-slate-400">
                ตรวจสอบความถูกต้องก่อนบันทึกเข้าระบบ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {readyCount > 1 && (
              <button
                type="button"
                onClick={handleAcceptAll}
                disabled={savingAll}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-600/20"
              >
                {savingAll ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCheck size={14} />
                )}
                <span>บันทึกทั้งหมด ({readyCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Global Scanning Progress Bar (if processing) */}
        {scanningItem && (
          <div className="border-b border-indigo-500/20 bg-indigo-950/30 px-4 py-2 sm:px-5">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-indigo-400" />
                <span>
                  กำลังอ่านสลิปใบที่ {scanningIdx + 1}/{totalCount}...
                </span>
              </div>
              <span className="font-semibold text-indigo-400 text-[11px]">
                {scanningItem.progressPercent}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-200"
                style={{ width: `${scanningItem.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Cards Scrollable Tray */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.map((item, index) => {
            const isScanning = item.status === "scanning";
            const isPending = item.status === "pending";
            const isSaving = item.status === "saving";
            const isReady = item.status === "ready" || item.status === "error";

            return (
              <div
                key={item.id}
                className={clsx(
                  "relative rounded-2xl border p-3.5 sm:p-4 transition-all shadow-sm",
                  isScanning
                    ? "border-indigo-500/50 bg-indigo-950/20"
                    : isPending
                    ? "border-slate-800/80 bg-slate-900/30 opacity-75"
                    : "border-slate-800 bg-slate-900/60"
                )}
              >
                {/* Header row of Card */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-300">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[160px] sm:max-w-xs">
                      {item.merchant || item.file.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isScanning && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-950/50 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                        <Loader2 size={11} className="animate-spin text-indigo-400" />
                        อ่านข้อความ {item.progressPercent}%
                      </span>
                    )}

                    {isPending && (
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        รอคิวอ่าน
                      </span>
                    )}

                    {isSaving && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <Loader2 size={11} className="animate-spin text-emerald-400" />
                        กำลังบันทึก
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRejectItem(item.id)}
                      disabled={isSaving}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                      title="ทิ้งสลิปนี้"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Card Body: Thumbnail + Inputs */}
                <div className="flex gap-3 items-start">
                  {/* Thumbnail (Click to zoom) */}
                  <div className="relative shrink-0 group">
                    <img
                      src={item.previewUrl}
                      alt="สลิป"
                      className="h-20 w-16 sm:h-24 sm:w-20 rounded-xl border border-slate-800 object-cover bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedImage(item.previewUrl)}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      title="แตะเพื่อดูภาพขนาดเต็ม"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="flex-1 space-y-2">
                    {/* Amount & Date row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Amount Input */}
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                          <DollarSign size={13} />
                        </div>
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={item.amount}
                          onChange={(e) =>
                            handleUpdateItem(item.id, {
                              amount: e.target.value,
                              errorMsg: undefined,
                            })
                          }
                          placeholder="0.00"
                          disabled={isScanning || isSaving}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-2.5 text-sm font-bold text-white placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      {/* Date Input */}
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                          <Calendar size={13} />
                        </div>
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { date: e.target.value })
                          }
                          disabled={isScanning || isSaving}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Category & Note row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Category select */}
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                          <Tag size={13} />
                        </div>
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { category: e.target.value })
                          }
                          disabled={isScanning || isSaving}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-6 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 appearance-none"
                        >
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Note Input */}
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                          <FileText size={13} />
                        </div>
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { note: e.target.value })
                          }
                          placeholder="หมายเหตุ (ร้านค้า, รายการ)"
                          disabled={isScanning || isSaving}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {item.errorMsg && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-rose-400">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{item.errorMsg}</span>
                  </div>
                )}

                {/* Bottom Action Buttons per card */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                  <span className="text-[11px] text-slate-500">
                    บันทึกลง: {formatDayTH(item.date)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRejectItem(item.id)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X size={13} />
                      <span>ทิ้ง</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAcceptItem(item.id)}
                      disabled={isScanning || isSaving || !item.amount}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                      {isSaving ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      <span>บันทึกรายการนี้</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
