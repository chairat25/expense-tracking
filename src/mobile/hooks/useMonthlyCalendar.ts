import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import type { DailyHistoryItem } from "../types";
import { thisMonthKey } from "../../lib/shared";

interface MonthResponse {
  history?: DailyHistoryItem[];
  month?: string;
  fromDate?: string;
  toDate?: string;
}

export function useMonthlyCalendar(initialMonth = thisMonthKey()) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [dailyData, setDailyData] = useState<Record<string, DailyHistoryItem>>({});
  const [loading, setLoading] = useState(false);

  const fetchMonth = useCallback(async (targetMonth: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<MonthResponse>(`/api/transactions?month=${targetMonth}`, {
        cache: "no-store",
      });
      const map: Record<string, DailyHistoryItem> = {};
      if (data.history) {
        for (const item of data.history) {
          map[item.date] = item;
        }
      }
      setDailyData(map);
    } catch (err) {
      console.warn("[useMonthlyCalendar] Failed to load month:", targetMonth, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(currentMonth);
  }, [currentMonth, fetchMonth]);

  // Compute overall monthly totals
  let totalExpense = 0;
  let totalIncome = 0;
  for (const item of Object.values(dailyData)) {
    totalExpense += item.expense || 0;
    totalIncome += item.income || 0;
  }

  const shiftMonth = useCallback((delta: number) => {
    setCurrentMonth((prev) => {
      const [yStr, mStr] = prev.split("-");
      let year = parseInt(yStr, 10);
      let month = parseInt(mStr, 10) + delta;
      if (month < 1) {
        month = 12;
        year -= 1;
      } else if (month > 12) {
        month = 1;
        year += 1;
      }
      return `${year}-${String(month).padStart(2, "0")}`;
    });
  }, []);

  return {
    currentMonth,
    setCurrentMonth,
    shiftMonth,
    dailyData,
    loading,
    totalExpense,
    totalIncome,
    net: totalIncome - totalExpense,
    reload: () => fetchMonth(currentMonth),
  };
}
