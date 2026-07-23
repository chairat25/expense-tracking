"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Calendar, Gauge, Coins, ListPlus, Notebook } from "lucide-react";

export type MemoTopicOption = {
  id: number;
  title: string;
  icon: string;
  color: string;
};

export type MemoEntryData = {
  id?: number;
  topicId: number;
  date: string;
  title: string;
  items: string[];
  mileage?: number | null;
  cost?: string | number | null;
  note?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  topics: MemoTopicOption[];
  defaultDate: string;
  defaultTopicId?: number;
  editingEntry?: MemoEntryData | null;
  onSaved: (savedEntry: MemoEntryData) => void;
};

export default function MemoEntryModal({
  isOpen,
  onClose,
  topics,
  defaultDate,
  defaultTopicId,
  editingEntry,
  onSaved,
}: Props) {
  const [topicId, setTopicId] = useState<number>(defaultTopicId || topics[0]?.id || 0);
  const [date, setDate] = useState<string>(defaultDate);
  const [title, setTitle] = useState<string>("");
  const [items, setItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingEntry) {
      setTopicId(editingEntry.topicId);
      setDate(editingEntry.date);
      setTitle(editingEntry.title || "");
      setItems(editingEntry.items || []);
      setMileage(editingEntry.mileage ? String(editingEntry.mileage) : "");
      setCost(editingEntry.cost ? String(editingEntry.cost) : "");
      setNote(editingEntry.note || "");
    } else {
      setTopicId(defaultTopicId || topics[0]?.id || 0);
      setDate(defaultDate);
      setTitle("");
      setItems([]);
      setNewItemText("");
      setMileage("");
      setCost("");
      setNote("");
    }
    setError(null);
  }, [editingEntry, defaultDate, defaultTopicId, topics, isOpen]);

  if (!isOpen) return null;

  function addItem() {
    if (!newItemText.trim()) return;
    setItems((prev) => [...prev, newItemText.trim()]);
    setNewItemText("");
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleKeyDownNewItem(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!topicId) {
      setError("กรุณาเลือกหัวข้อเรื่อง");
      return;
    }
    if (!date) {
      setError("กรุณาระบุวันที่");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      topicId,
      date,
      title: title.trim(),
      items,
      mileage: mileage ? parseInt(mileage, 10) : null,
      cost: cost ? parseFloat(cost) : null,
      note: note.trim(),
    };

    try {
      const isEdit = !!editingEntry?.id;
      const url = isEdit
        ? `/api/memos/entries/${editingEntry.id}`
        : `/api/memos/entries`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "บันทึกข้อมูลไม่สำเร็จ");
      }

      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="card my-6 w-full max-w-lg space-y-4 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <Notebook className="h-5 w-5 text-accent" />
            <h3>{editingEntry ? "แก้ไขบันทึกความจำ" : "เพิ่มบันทึกความจำย้อนหลัง"}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface-hover hover:text-foreground transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-expense-soft p-3 text-xs text-expense text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                หัวข้อเรื่อง *
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                วันที่ทำรายการ *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              หัวข้อสรุป / ชื่อรายการ (เช่น เช็กระยะ 50,000 กม., เปลี่ยนอะไหล่)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น เช็กระยะ 50,000 กม. ..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Sub-items Builder */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-surface/40 p-3.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ListPlus className="h-4 w-4 text-accent" />
                <span>รายการย่อยที่ทำภายในวัน (Sub-items)</span>
              </label>
              <span className="text-[11px] text-muted">{items.length} รายการ</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={handleKeyDownNewItem}
                placeholder="เช่น เปลี่ยนน้ำมันเครื่อง, สลับยาง..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition"
              >
                <Plus size={14} />
                <span>เพิ่ม</span>
              </button>
            </div>

            {items.length > 0 ? (
              <ul className="space-y-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-muted hover:text-expense transition p-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted italic text-center py-2">
                ยังไม่มีรายการย่อย (กดเพิ่มรายการเพื่อบันทึกสิ่งที่ทำหลายๆ อย่างในวันเดียว)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted flex items-center gap-1">
                <Gauge size={13} />
                <span>เลขกิโลเมตร (ถ้ามี)</span>
              </label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="เช่น 52400"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted flex items-center gap-1">
                <Coins size={13} />
                <span>ค่าใช้จ่าย (บาท) (ถ้ามี)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="เช่น 2450"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              หมายเหตุเพิ่มเติม
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น เปลี่ยนที่ศูนย์โตโยต้า สาขา..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted hover:bg-surface-hover transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-accent/90 transition disabled:opacity-50"
            >
              <span>{saving ? "กำลังบันทึก..." : editingEntry ? "บันทึกแก้ไข" : "เพิ่มบันทึกนี้"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
