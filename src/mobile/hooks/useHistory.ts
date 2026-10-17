import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import type { DailyHistoryItem } from "../types";

/** สรุปรายวันย้อนหลัง 14 วัน โหลดเมื่อเปิดหน้าต่างประวัติ */
export function useHistory(isOpen: boolean) {
  const [history, setHistory] = useState<DailyHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<{ history?: DailyHistoryItem[] }>("/api/transactions?history=true&days=14", {
      cache: "no-store",
    })
      .then((data) => {
        if (!cancelled) setHistory(data.history ?? []);
      })
      .catch((err) => console.warn("Failed to load history:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return { history, loading };
}
