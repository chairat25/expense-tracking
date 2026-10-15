export type CategorySlug = "food" | "drink" | "transport" | "bill" | "shopping" | "fun" | "other";

export interface CategoryItem {
  slug: CategorySlug;
  name: string;
  iconName: string;
  type: "expense" | "income";
}

export const CATEGORIES: CategoryItem[] = [
  { slug: "food", name: "อาหาร", iconName: "Utensils", type: "expense" },
  { slug: "drink", name: "เครื่องดื่ม", iconName: "Coffee", type: "expense" },
  { slug: "transport", name: "เดินทาง", iconName: "Car", type: "expense" },
  { slug: "bill", name: "บิล/ค่างวด", iconName: "Receipt", type: "expense" },
  { slug: "shopping", name: "ของใช้", iconName: "ShoppingBag", type: "expense" },
  { slug: "fun", name: "บันเทิง", iconName: "Film", type: "expense" },
  { slug: "other", name: "อื่นๆ", iconName: "Package", type: "expense" },
];

export function todayKey(): string {
  const now = new Date();
  const thTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const y = thTime.getFullYear();
  const m = String(thTime.getMonth() + 1).padStart(2, "0");
  const d = String(thTime.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const ry = dt.getUTCFullYear();
  const rm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const rd = String(dt.getUTCDate()).padStart(2, "0");
  return `${ry}-${rm}-${rd}`;
}

export function formatBaht(amount: number): string {
  return Number(amount || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
