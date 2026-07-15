"use client";

import { useState } from "react";
import { ArrowRight, Pencil, PiggyBank } from "lucide-react";
import { formatBaht, formatMonthTH } from "@/lib/shared";

type Props = {
  remaining: number;
  nextYm: string;
  savingsAmount: number | null;
  onConfirm: (savingsAmount: number) => Promise<void>;
};

export default function CarryOverCard({
  remaining,
  nextYm,
  savingsAmount,
  onConfirm,
}: Props) {
  const [editing, setEditing] = useState(savingsAmount === null);
  const [draft, setDraft] = useState(savingsAmount ?? 0);
  const [busy, setBusy] = useState(false);

  if (remaining <= 0) {
    return (
      <p className="border-t border-border px-4 py-3 text-center text-[13px] text-muted">
        ติดลบ {formatBaht(remaining)} ฿ — ไม่มีเงินเหลือให้แบ่ง
      </p>
    );
  }

  if (!editing && savingsAmount !== null) {
    const carryOverAmount = remaining - savingsAmount;
    return (
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
        <p className="text-muted">
          ยกยอด{" "}
          <span className="font-semibold text-income">
            {formatBaht(carryOverAmount)} ฿
          </span>{" "}
          ไปเดือน{formatMonthTH(nextYm, true)} · เก็บ{" "}
          <span className="font-semibold text-accent">
            {formatBaht(savingsAmount)} ฿
          </span>
        </p>
        <button
          onClick={() => {
            setDraft(savingsAmount);
            setEditing(true);
          }}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-accent hover:bg-accent/10"
        >
          <Pencil size={12} /> แก้ไข
        </button>
      </div>
    );
  }

  function setSavings(v: number) {
    setDraft(Math.min(Math.max(v, 0), remaining));
  }

  const carryOverDraft = remaining - draft;

  return (
    <div className="space-y-3 border-t border-border p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-accent">
          <PiggyBank size={15} /> เงินเก็บ
        </span>
        <span className="flex items-center gap-1.5 text-income">
          ใช้เดือนหน้า <ArrowRight size={14} />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={remaining}
        step={1}
        value={draft}
        onChange={(e) => setSavings(Number(e.target.value))}
        className="w-full accent-accent"
      />

      <div className="flex items-center gap-2">
        <AmountInput value={draft} onChange={setSavings} />
        <span className="text-muted">/</span>
        <AmountInput
          value={carryOverDraft}
          onChange={(v) => setSavings(remaining - v)}
        />
      </div>

      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onConfirm(draft);
          setBusy(false);
          setEditing(false);
        }}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
      >
        {busy ? "กำลังบันทึก…" : "ยืนยันการแบ่ง"}
      </button>
    </div>
  );
}

function AmountInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      inputMode="decimal"
      value={String(value)}
      onChange={(e) => {
        const n = Number(e.target.value.replace(/[^\d.]/g, ""));
        if (Number.isFinite(n)) onChange(n);
      }}
      className="tnum min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-right text-sm outline-none focus:border-accent"
    />
  );
}
