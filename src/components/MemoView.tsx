"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookmarkCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Gauge,
  Coins,
  ListTodo,
  Sparkles,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { daysInMonth, thisMonthKey, todayKey } from "@/lib/shared";
import MemoTopicModal from "./MemoTopicModal";
import MemoEntryModal, { type MemoEntryData, type MemoTopicOption } from "./MemoEntryModal";

export default function MemoView() {
  const [ym, setYm] = useState(thisMonthKey());
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [topics, setTopics] = useState<MemoTopicOption[]>([]);
  const [entries, setEntries] = useState<MemoEntryData[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MemoEntryData | null>(null);

  // Fetch topics
  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/memos/topics", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch entries for month
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const topicQuery = selectedTopicId ? `&topicId=${selectedTopicId}` : "";
      const res = await fetch(`/api/memos/entries?ym=${ym}${topicQuery}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ym, selectedTopicId]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  // Calendar calculations
  const yearNum = parseInt(ym.slice(0, 4), 10);
  const monthNum = parseInt(ym.slice(5, 7), 10); // 1-12

  function prevMonth() {
    let y = yearNum;
    let m = monthNum - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    const nextYm = `${y}-${String(m).padStart(2, "0")}`;
    setYm(nextYm);
    setSelectedDate(null);
  }

  function nextMonth() {
    let y = yearNum;
    let m = monthNum + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const nextYm = `${y}-${String(m).padStart(2, "0")}`;
    setYm(nextYm);
    setSelectedDate(null);
  }

  const totalDays = daysInMonth(ym);
  const firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay(); // 0 = Sun

  const daysGrid = useMemo(() => {
    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    // padding prev month
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateStr: "", dayNum: 0, isCurrentMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${ym}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }
    return cells;
  }, [ym, firstDayOfWeek, totalDays]);

  // Map of dates that have entries -> count or colors
  const entriesByDate = useMemo(() => {
    const map = new Map<string, MemoEntryData[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) || [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

  // Filter entries to show in list below calendar
  const filteredEntries = useMemo(() => {
    if (selectedDate) {
      return entries.filter((e) => e.date === selectedDate);
    }
    return entries;
  }, [entries, selectedDate]);

  async function handleDeleteEntry(id: number) {
    if (!confirm("คุณต้องการลบบันทึกความจำนี้หรือไม่?")) return;
    try {
      const res = await fetch(`/api/memos/entries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (e) {
      alert("ลบไม่สำเร็จ");
    }
  }

  const selectedTopic = useMemo(
    () => topics.find((t) => String(t.id) === selectedTopicId),
    [topics, selectedTopicId],
  );

  const topicMap = useMemo(() => {
    const map = new Map<number, MemoTopicOption>();
    for (const t of topics) map.set(t.id, t);
    return map;
  }, [topics]);

  // TH Month format
  const thMonthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const formattedMonth = `${thMonthNames[monthNum - 1]} ${yearNum + 543}`;

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <BookmarkCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">ความจำ & บันทึกจิปาถะ</h2>
              <p className="text-[11px] text-muted">บันทึกเตือนความจำ การบำรุงรักษา และเช็กระยะ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTopicModalOpen(true)}
              className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition"
            >
              <Plus size={14} className="text-accent" />
              <span>+ เรื่องใหม่</span>
            </button>

            <button
              onClick={() => {
                setEditingEntry(null);
                setIsEntryModalOpen(true);
              }}
              disabled={topics.length === 0}
              className="flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-accent/90 transition disabled:opacity-50"
            >
              <Plus size={14} />
              <span>+ ลงบันทึก</span>
            </button>
          </div>
        </div>

        {/* Topic Selector Dropdown & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter size={14} className="text-muted shrink-0" />
            <span className="text-xs text-muted shrink-0">เรื่องที่ต้องการดู:</span>
            <select
              value={selectedTopicId}
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                setSelectedDate(null);
              }}
              className="w-full max-w-xs rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
            >
              <option value="all">✨ ทั้งหมด (ทุกเรื่องความจำ)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.title}
                </option>
              ))}
            </select>
          </div>

          {selectedTopic && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: selectedTopic.color }}
            >
              <span>{selectedTopic.icon}</span>
              <span>{selectedTopic.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* No Topic Alert Prompt */}
      {topics.length === 0 && !loading && (
        <div className="card space-y-3 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">ยังไม่มีหัวข้อเรื่องความจำ</h3>
            <p className="text-xs text-muted max-w-xs mx-auto">
              เริ่มต้นด้วยการเพิ่มชื่อเรื่องแรก เช่น &quot;เช็กระยะรถยนต์&quot; หรือ &quot;บำรุงรักษาบ้าน&quot;
            </p>
          </div>
          <button
            onClick={() => setIsTopicModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-accent/90 transition"
          >
            <Plus size={15} />
            <span>สร้างหัวข้อเรื่องแรกเลย</span>
          </button>
        </div>
      )}

      {/* Calendar Section */}
      {topics.length > 0 && (
        <div className="card space-y-3 p-4">
          {/* Calendar Month Selector Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold text-foreground">{formattedMonth}</span>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent hover:bg-accent/25 transition"
                >
                  แสดงทั้งเดือน ✖
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="rounded-xl border border-border p-1.5 text-muted hover:bg-surface-hover hover:text-foreground transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                className="rounded-xl border border-border p-1.5 text-muted hover:bg-surface-hover hover:text-foreground transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Days Grid Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
            <div className="text-expense">อา</div>
            <div>จ</div>
            <div>อ</div>
            <div>พ</div>
            <div>พฤ</div>
            <div>ศ</div>
            <div className="text-accent">ส</div>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <div key={idx} className="h-10 rounded-xl" />;
              }

              const isToday = cell.dateStr === todayKey();
              const isSelected = cell.dateStr === selectedDate;
              const dateLogs = entriesByDate.get(cell.dateStr) || [];
              const hasEntries = dateLogs.length > 0;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                  className={`relative flex h-11 flex-col items-end justify-between rounded-xl p-1.5 text-xs transition ${
                    isSelected
                      ? "bg-accent text-white font-bold shadow-md"
                      : isToday
                      ? "border border-accent/60 bg-accent/10 font-bold text-accent"
                      : hasEntries
                      ? "bg-surface-hover font-semibold text-foreground hover:bg-surface"
                      : "hover:bg-surface-hover/60 text-muted"
                  }`}
                >
                  <span className="self-end text-[11px] font-semibold leading-none pr-0.5 pt-0.5">
                    {cell.dayNum}
                  </span>

                  {/* Dot Badges for Entries */}
                  {hasEntries && (
                    <div className="flex items-center gap-0.5 self-center pb-0.5">
                      {dateLogs.slice(0, 3).map((log, i) => {
                        const t = topicMap.get(log.topicId);
                        return (
                          <span
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSelected ? "bg-white" : ""
                            }`}
                            style={{ backgroundColor: isSelected ? "#ffffff" : t?.color || "#3b82f6" }}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Entries List Header */}
      {topics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              {selectedDate ? `บันทึกประจำวันที่ ${selectedDate}` : `ประวัติบันทึกในเดือนนี้ (${filteredEntries.length} รายการ)`}
            </h3>
            {selectedDate && (
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setIsEntryModalOpen(true);
                }}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <Plus size={13} />
                <span>เพิ่มบันทึกในวันนี้</span>
              </button>
            )}
          </div>

          {/* Log Entry Cards */}
          {loading ? (
            <div className="card p-6 text-center text-xs text-muted">กำลังโหลดข้อมูลความจำ...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="card p-8 text-center space-y-2">
              <p className="text-xs text-muted">
                {selectedDate
                  ? "ไม่มีบันทึกความจำในวันที่เลือก"
                  : "ยังไม่มีการบันทึกประวัติในเดือนนี้"}
              </p>
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setIsEntryModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline pt-1"
              >
                <Plus size={13} />
                <span>คลิกที่นี่เพื่อเพิ่มบันทึกใหม่</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredEntries.map((entry) => {
                const topic = topicMap.get(entry.topicId);
                const itemList = Array.isArray(entry.items) ? entry.items : [];

                return (
                  <div
                    key={entry.id}
                    className="card space-y-2.5 p-4 hover:border-accent/40 transition group"
                  >
                    {/* Entry Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                            style={{ backgroundColor: topic?.color || "#3b82f6" }}
                          >
                            <span>{topic?.icon || "📌"}</span>
                            <span>{topic?.title || "เรื่องทั่วไป"}</span>
                          </span>

                          <span className="text-xs font-medium text-muted">
                            📅 {entry.date}
                          </span>
                        </div>

                        {entry.title && (
                          <h4 className="text-sm font-bold text-foreground pt-0.5">
                            {entry.title}
                          </h4>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsEntryModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground transition"
                          title="แก้ไข"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => entry.id && handleDeleteEntry(entry.id)}
                          className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-expense transition"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Nested Sub-items Checklist */}
                    {itemList.length > 0 && (
                      <div className="rounded-xl border border-border/60 bg-surface/40 p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted mb-1">
                          <ListTodo size={13} className="text-accent" />
                          <span>รายการย่อยที่บันทึกไว้ ({itemList.length} รายการ):</span>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-foreground">
                          {itemList.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 bg-background/80 rounded-lg px-2.5 py-1 border border-border/40">
                              <CheckCircle2 size={13} className="text-accent shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Metadata Badges (Mileage, Cost, Note) */}
                    {(entry.mileage || entry.cost || entry.note) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted pt-1 border-t border-border/40">
                        {entry.mileage && (
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            <Gauge size={13} className="text-accent" />
                            <span>{entry.mileage.toLocaleString()} กม.</span>
                          </div>
                        )}

                        {entry.cost && (
                          <div className="flex items-center gap-1 font-medium text-expense">
                            <Coins size={13} />
                            <span>{Number(entry.cost).toLocaleString()} บาท</span>
                          </div>
                        )}

                        {entry.note && (
                          <div className="text-[11px] text-muted italic">
                            💬 {entry.note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <MemoTopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onTopicCreated={(newTopic) => {
          setTopics((prev) => [...prev, newTopic]);
          setSelectedTopicId(String(newTopic.id));
        }}
      />

      <MemoEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingEntry(null);
        }}
        topics={topics}
        defaultDate={selectedDate || todayKey()}
        defaultTopicId={selectedTopicId !== "all" ? Number(selectedTopicId) : undefined}
        editingEntry={editingEntry}
        onSaved={() => void loadEntries()}
      />
    </div>
  );
}
