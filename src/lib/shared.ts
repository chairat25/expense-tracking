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

/**
 * วันจันทร์ต้นสัปดาห์ของ dateKey (ISO: จันทร์ต้น อาทิตย์ท้าย)
 * บวกลบปฏิทินล้วน ไม่ผูกโซนเวลา — สร้าง Date กับอ่าน getDay() อยู่โซนเดียวกันเสมอ
 */
export function weekStart(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0=อาทิตย์ … 6=เสาร์
  return shiftDate(dateKey, -(dow === 0 ? 6 : dow - 1));
}

/** วันอาทิตย์ท้ายสัปดาห์ของ dateKey */
export function weekEnd(dateKey: string): string {
  return shiftDate(weekStart(dateKey), 6);
}

/** จำนวนวันจาก from ถึง to แบบนับปลายทั้งสองข้าง ('07-01'..'07-01' = 1) */
export function dayCount(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const ms =
    new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
  // ปัดเศษกันเครื่อง dev ที่อยู่โซนมี DST ทำให้ผลต่างออกมาเป็น 6.958 วัน (ไทยไม่มี DST)
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * ช่วงสัปดาห์ของ dateKey ที่ตัดขอบให้อยู่ในเดือน ym เท่านั้น
 * สัปดาห์คาบเกี่ยวข้ามเดือนจะได้ slice สั้นกว่า 7 วัน เพราะแอปโหลดข้อมูลทีละเดือน
 */
export function weekSliceInMonth(
  dateKey: string,
  ym: string,
): { from: string; to: string; days: number } {
  const monthFrom = `${ym}-01`;
  const monthTo = `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;
  const start = weekStart(dateKey);
  const end = weekEnd(dateKey);
  // ISO date เทียบด้วย string ตรงๆ ได้ เรียงตามลำดับเวลาพอดี
  const from = start < monthFrom ? monthFrom : start;
  const to = end > monthTo ? monthTo : end;
  return { from, to, days: dayCount(from, to) };
}

/** ทุกวันตั้งแต่ from ถึง to แบบนับปลายทั้งสองข้าง */
export function datesFrom(from: string, to: string): string[] {
  if (to < from) return [];
  const out: string[] = [];
  for (let d = from; d <= to; d = shiftDate(d, 1)) out.push(d);
  return out;
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
  budgetMode: BudgetMode;
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

export const BUDGET_MODES = ["month", "week"] as const;
export type BudgetMode = (typeof BUDGET_MODES)[number];

export type BudgetInfo = {
  /** เงินเฉลี่ยต่อวันของวันที่ดูอยู่ */
  amount: number;
  /** true = มาจาก daily_budgets ที่ผู้ใช้กรอกเอง ไม่ได้คำนวณให้ */
  isManual: boolean;
  /** null ในโหมด month — ใช้โชว์บรรทัดบริบทสัปดาห์ */
  week: { from: string; to: string; envelope: number; daysLeft: number } | null;
};

/** โหมดเดิม: เงินคงเหลือทั้งเดือน ณ ก่อนวันนี้ หารด้วยวันที่เหลือทั้งเดือน */
function monthPerDay(month: MonthData, date: string): number {
  const { income, expense } = totals(
    month.transactions.filter((t) => t.date < date),
  );
  const remainingBefore = month.openingBalance + income - expense;
  const day = Number(date.slice(8, 10));
  const daysLeft = Math.max(1, daysInMonth(month.ym) - day + 1);
  return remainingBefore / daysLeft;
}

/**
 * โหมดสัปดาห์: ขังการหารใหม่ไว้ในสัปดาห์เดียว เงินสัปดาห์ก่อนไม่ทบมา
 * สูตรขนานกับ monthPerDay ต่างแค่ใช้ส่วนแบ่งของสัปดาห์ และหน้าต่างเวลาเป็น slice
 */
function weekInfo(month: MonthData, date: string) {
  const { from, to, days } = weekSliceInMonth(date, month.ym);
  const share = month.openingBalance * (days / daysInMonth(month.ym));

  const { income, expense } = totals(
    month.transactions.filter((t) => t.date >= from && t.date < date),
  );
  const daysLeft = Math.max(1, dayCount(date, to));
  const perDay = (share + income - expense) / daysLeft;

  // envelope โชว์เงินของสัปดาห์นี้ทั้งก้อน จึงนับรายรับทั้ง slice
  // ต่างจากตัวตั้งของ perDay ที่นับแค่ก่อนวันนี้ตามธรรมเนียมของแอป — จงใจ ไม่ใช่บั๊ก
  const weekIncome = totals(
    month.transactions.filter((t) => t.date >= from && t.date <= to),
  ).income;

  return { from, to, envelope: share + weekIncome, daysLeft, perDay };
}

/** เงินเฉลี่ยต่อวันของวันที่ดูอยู่ + บริบทสัปดาห์ (ถ้าอยู่โหมด week) */
export function computeBudget(
  month: MonthData,
  date: string,
  mode: BudgetMode,
): BudgetInfo {
  const manual = month.dailyBudgets?.find((b) => b.date === date);
  // คำนวณ week เสมอเมื่ออยู่โหมด week ไม่ว่าจะกรอกเองหรือไม่ — บรรทัดบริบทต้องโชว์ทั้งสองกรณี
  const week = mode === "week" ? weekInfo(month, date) : null;
  const auto = week ? week.perDay : monthPerDay(month, date);

  return {
    amount: manual ? manual.amount : auto,
    isManual: manual != null,
    week: week && {
      from: week.from,
      to: week.to,
      envelope: week.envelope,
      daysLeft: week.daysLeft,
    },
  };
}
