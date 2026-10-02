const STORAGE_KEY = "expense_receipt_patterns_v1";

export interface ReceiptPattern {
  merchant: string;
  category: string;
  note: string;
  updatedAt: number;
}

// Zero-Emoji standard: purely textual professional suggestions
export const DEFAULT_NOTE_SUGGESTIONS = [
  "มื้อเช้า",
  "มื้อเที่ยง",
  "มื้อเย็น",
  "ของกิน",
  "ของใช้",
  "กาแฟ",
  "ค่าเดินทาง",
  "ค่าน้ำมัน",
  "โอนจ่ายทั่วไป",
];

let inMemoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage.getItem(key);
    }
  } catch {}
  return inMemoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
      (globalThis as any).localStorage.setItem(key, value);
      return;
    }
  } catch {}
  inMemoryStore[key] = value;
}

export function clearPatterns(): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
      (globalThis as any).localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
  inMemoryStore = {};
}

function getAllPatterns(): Record<string, ReceiptPattern> {
  const raw = getStorageItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getSavedPattern(merchant: string): ReceiptPattern | null {
  if (!merchant) return null;
  const all = getAllPatterns();
  const normalized = merchant.toLowerCase().trim();

  // 1. Direct match
  if (all[normalized]) return all[normalized];

  // 2. Substring match
  for (const [key, val] of Object.entries(all)) {
    const normKey = key.toLowerCase();
    if (normalized.includes(normKey) || normKey.includes(normalized)) {
      return val;
    }
  }
  return null;
}

export function savePattern(merchant: string, category: string, note: string): void {
  if (!merchant) return;
  const all = getAllPatterns();
  all[merchant.trim().toLowerCase()] = {
    merchant: merchant.trim(),
    category,
    note,
    updatedAt: Date.now(),
  };
  setStorageItem(STORAGE_KEY, JSON.stringify(all));
}

export function getQuickNoteSuggestions(merchant?: string | null): string[] {
  const suggestions: string[] = [];
  if (merchant) {
    const p = getSavedPattern(merchant);
    if (p && p.note) suggestions.push(p.note);
    if (!suggestions.includes(merchant)) suggestions.push(merchant);
  }
  for (const def of DEFAULT_NOTE_SUGGESTIONS) {
    if (!suggestions.includes(def)) suggestions.push(def);
  }
  return suggestions.slice(0, 6);
}
