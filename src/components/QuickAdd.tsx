"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { Plus } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  type Category,
  type TxType,
} from "@/lib/shared";

import LoadingBackdrop from "./LoadingBackdrop";

export type NewTx = {
  type: TxType;
  amount: number;
  category: Category;
  note: string;
};

/**
 * ฟอร์มกรอกด่วน — เปิดแอปมาแล้วพิมพ์ตัวเลขได้เลย
 * กด Enter = บันทึก แล้วเคลียร์ช่อง + โฟกัสกลับที่จำนวนเงิน เพื่อกรอกอันถัดไปรัวๆ
 */
export default function QuickAdd({
  onAdd,
  disabled,
}: {
  onAdd: (tx: NewTx) => Promise<void>;
  disabled?: boolean;
}) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("food");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const value = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(value) && value > 0;

  async function submit() {
    if (!valid || busy || disabled) return;
    setBusy(true);
    try {
      await onAdd({
        type,
        amount: value,
        category: type === "income" ? "other" : category,
        note: note.trim(),
      });
      setAmount("");
      setNote("");
      amountRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form
        id="tour-quick-add"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="card p-3 space-y-3"
      >
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
          <Toggle
            active={type === "expense"}
            onClick={() => setType("expense")}
            className={type === "expense" ? "bg-expense text-white" : ""}
          >
            − รายจ่าย
          </Toggle>
          <Toggle
            active={type === "income"}
            onClick={() => setType("income")}
            className={type === "income" ? "bg-income text-white" : ""}
          >
            + รายรับ
          </Toggle>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={amountRef}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            aria-label="จำนวนเงิน"
            disabled={disabled}
            className={clsx(
              "tnum min-w-0 flex-1 bg-transparent text-4xl font-bold outline-none placeholder:text-muted/35",
              type === "income" ? "text-income" : "text-expense",
            )}
          />
          <span className="text-xl text-muted">฿</span>
        </div>

        {type === "expense" && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 snap-strip">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={clsx(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs transition active:scale-95",
                  category === c
                    ? "border-accent bg-accent/10 text-accent font-semibold"
                    : "border-border text-muted hover:bg-surface-2",
                )}
              >
                <span className="mr-1">{CATEGORY_ICON[c]}</span>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              type === "income" ? "มาจากไหน (ไม่ใส่ก็ได้)" : "หมายเหตุ เช่น ชาเขียว"
            }
            aria-label="หมายเหตุ"
            disabled={disabled}
            maxLength={300}
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
          />
          <button
            type="submit"
            disabled={!valid || busy || disabled}
            className={clsx(
              "grid shrink-0 place-items-center rounded-xl px-4 text-white transition active:scale-95 disabled:opacity-30",
              type === "income" ? "bg-income" : "bg-expense",
            )}
            aria-label="บันทึก"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </form>
      <LoadingBackdrop open={busy} />
    </>
  );
}

function Toggle({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-lg py-2 text-sm font-semibold transition",
        active ? clsx("shadow", className) : "text-muted",
      )}
    >
      {children}
    </button>
  );
}
