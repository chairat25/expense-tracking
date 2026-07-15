export const CATEGORIES = [
  "food",
  "drink",
  "transport",
  "bill",
  "shopping",
  "fun",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  food: "อาหาร",
  drink: "เครื่องดื่ม",
  transport: "เดินทาง",
  bill: "บิล/ค่างวด",
  shopping: "ของใช้",
  fun: "บันเทิง",
  other: "อื่นๆ",
};

export const CATEGORY_ICON: Record<Category, string> = {
  food: "🍚",
  drink: "🥤",
  transport: "🚕",
  bill: "🧾",
  shopping: "🛍️",
  fun: "🎬",
  other: "📦",
};

export const TH_MONTHS = [
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

export const TH_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export const TH_DAYS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

/**
 * ทุกอย่างอิงเวลาไทย ไม่ใช่เวลาเครื่อง/เวลา server
 * (Vercel รันบน UTC — ถ้าไม่ล็อกโซน รายการที่กรอกตอนเย็นจะเด้งไปอยู่ผิดวัน)
 */
export const TZ = "Asia/Bangkok";

// en-CA ให้รูปแบบ YYYY-MM-DD พอดี
const bkkDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const bkkTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** 'YYYY-MM-DD' ของ "ตอนนี้" ตามเวลาไทย */
export function todayKey(): string {
  return bkkDate.format(new Date());
}

export function thisMonthKey(): string {
  return todayKey().slice(0, 7);
}

/**
 * 'YYYY-MM-DD' จาก Date ที่สร้างด้วยเลขปฏิทิน เช่น new Date(2026, 6, 15)
 * ใช้ getFullYear/getMonth/getDate ตรงๆ ได้ เพราะเป็นการบวกลบวันที่ล้วน ไม่เกี่ยวกับโซนเวลา
 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toMonthKey(d: Date): string {
  return toDateKey(d).slice(0, 7);
}

export function shiftDate(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + delta));
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  return toMonthKey(new Date(y, m - 1 + delta, 1));
}

export function formatMonthTH(ym: string, short = false): string {
  const [y, m] = ym.split("-").map(Number);
  const names = short ? TH_MONTHS_SHORT : TH_MONTHS;
  return `${names[m - 1]} ${y + 543}`;
}

/** 'อังคาร 15 ก.ค.' */
export function formatDayTH(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${TH_DAYS[dt.getDay()]} ${d} ${TH_MONTHS_SHORT[m - 1]}`;
}

/** '14:32 น.' — แปลง timestamp เป็นเวลาไทยเสมอ ไม่ว่าเครื่องจะตั้งโซนอะไรไว้ */
export function formatTimeTH(iso: string): string {
  return `${bkkTime.format(new Date(iso))} น.`;
}

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function formatBaht(n: number): string {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export type TxType = "income" | "expense";

export type Tx = {
  id: number;
  date: string;
  spentAt: string;
  type: TxType;
  amount: number;
  category: Category;
  note: string;
};

export type MonthData = {
  ym: string;
  openingBalance: number;
  closedAt: string | null;
  savingsAmount: number | null;
  transactions: Tx[];
  dailyBudgets: DailyBudget[];
};

export type DailyBudget = {
  id: number;
  userId: string;
  date: string;
  amount: number;
};

/** รวมยอดของชุดรายการที่ส่งเข้ามา (ใช้ได้ทั้งรายวันและรายเดือน) */
export function totals(txs: Tx[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense };
}
