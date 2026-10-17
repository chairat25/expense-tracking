import { useCallback, useEffect, useRef, useState } from "react";
import type { Tx } from "../../lib/shared";
import { apiFetch } from "../lib/apiClient";

interface DayResponse {
  transactions?: Tx[];
  todaySpent?: number;
  todayIncome?: number;
  dailyBudget?: number | null;
}

interface DayState {
  transactions: Tx[];
  spent: number;
  income: number;
  dailyBudget: number | null;
}

const EMPTY_DAY: DayState = { transactions: [], spent: 0, income: 0, dailyBudget: null };

export interface NewTransaction {
  type: "expense" | "income";
  amount: number;
  category: string;
  note: string;
}

function applyDelta(day: DayState, tx: Pick<Tx, "type" | "amount">, sign: 1 | -1): DayState {
  const delta = sign * Number(tx.amount);
  return tx.type === "expense"
    ? { ...day, spent: Math.max(0, day.spent + delta) }
    : { ...day, income: Math.max(0, day.income + delta) };
}

/** โหลด/เพิ่ม/ลบรายการของวันที่เลือก ตรรกะเดียวกับ HomeView บนเว็บ */
export function useDayData(selectedDate: string) {
  const [day, setDay] = useState<DayState>(EMPTY_DAY);
  const [loading, setLoading] = useState(true);
  const activeDateRef = useRef(selectedDate);

  const reload = useCallback(async (targetDate: string) => {
    activeDateRef.current = targetDate;
    setLoading(true);
    try {
      const data = await apiFetch<DayResponse>(`/api/transactions?date=${targetDate}`, {
        cache: "no-store",
      });
      if (activeDateRef.current !== targetDate) return;
      setDay({
        transactions: data.transactions ?? [],
        spent: data.todaySpent ?? 0,
        income: data.todayIncome ?? 0,
        dailyBudget: data.dailyBudget ?? null,
      });
    } catch (err) {
      console.warn("Failed to load date transactions:", err);
    } finally {
      if (activeDateRef.current === targetDate) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(selectedDate);
  }, [selectedDate, reload]);

  const addTransaction = useCallback(
    async (input: NewTransaction, date: string): Promise<Tx> => {
      const created = await apiFetch<Tx>("/api/transactions", {
        method: "POST",
        body: JSON.stringify({ date, ...input, note: input.note.trim() }),
      });
      if (created.date === activeDateRef.current) {
        setDay((prev) => ({
          ...applyDelta(prev, created, 1),
          transactions: [created, ...prev.transactions],
        }));
      }
      return created;
    },
    [],
  );

  const addCreated = useCallback((created: readonly Tx[]) => {
    const matching = created.filter((tx) => tx.date === activeDateRef.current);
    if (matching.length === 0) return;
    setDay((prev) => ({
      ...matching.reduce((acc, tx) => applyDelta(acc, tx, 1), prev),
      transactions: [...matching, ...prev.transactions],
    }));
  }, []);

  /** ลบแบบ optimistic แล้วย้อนกลับถ้า API ล้มเหลว — throw ต่อให้ UI แจ้งเตือน */
  const removeTransaction = useCallback(
    async (tx: Tx) => {
      const before = day;
      setDay((prev) => ({
        ...applyDelta(prev, tx, -1),
        transactions: prev.transactions.filter((t) => t.id !== tx.id),
      }));
      try {
        await apiFetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
      } catch (err) {
        setDay(before);
        throw err;
      }
    },
    [day],
  );

  return { ...day, loading, addTransaction, addCreated, removeTransaction, reload };
}
