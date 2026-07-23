"use client";

import { useState } from "react";
import { X, Plus, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onTopicCreated: (newTopic: { id: number; title: string; icon: string; color: string }) => void;
};

const EMOJI_OPTIONS = ["🚗", "🏠", "💊", "📌", "🛠️", "💳", "🐶", "💻", "✈️", "📱", "📑", "⚙️"];

const COLOR_OPTIONS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Cyan", value: "#06b6d4" },
];

export default function MemoTopicModal({ isOpen, onClose, onTopicCreated }: Props) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🚗");
  const [color, setColor] = useState("#3b82f6");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("กรุณากรอกชื่อเรื่อง/หมวดหมู่");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/memos/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), icon, color }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "สร้างเรื่องไม่สำเร็จ");
      }

      const created = await res.json();
      onTopicCreated(created);
      setTitle("");
      setIcon("🚗");
      setColor("#3b82f6");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md space-y-4 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3>สร้างหัวข้อเรื่องความจำใหม่</h3>
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
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              ชื่อเรื่อง / หมวดหมู่ (เช่น เช็กระยะรถยนต์, ซ่อมบ้าน)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น เช็กระยะรถยนต์..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              ไอคอนประจำเรื่อง
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`flex h-10 items-center justify-center rounded-xl border text-lg transition ${
                    icon === emoji
                      ? "border-accent bg-accent/15 ring-2 ring-accent/30"
                      : "border-border/60 bg-surface/50 hover:bg-surface-hover"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              ธีมสีประจำเรื่อง
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c.value
                      ? "scale-125 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
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
              <Plus size={14} />
              <span>{saving ? "กำลังบันทึก..." : "สร้างหัวข้อนี้"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
