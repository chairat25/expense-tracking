export interface CategoryOption {
  slug: string;
  name: string;
  icon: string;
  type: string;
}

export interface DailyHistoryItem {
  date: string;
  expense: number;
  income: number;
  count: number;
}

export interface UserProfile {
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
}

export interface Budgets {
  daily: number;
  weekly: number;
  monthly: number;
}

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { slug: "food", name: "อาหาร", icon: "🍚", type: "expense" },
  { slug: "drink", name: "เครื่องดื่ม", icon: "🧋", type: "expense" },
  { slug: "transport", name: "เดินทาง", icon: "🚗", type: "expense" },
  { slug: "bill", name: "บิล/ค่างวด", icon: "🧾", type: "expense" },
  { slug: "shopping", name: "ของใช้", icon: "🛍️", type: "expense" },
  { slug: "fun", name: "บันเทิง", icon: "🎬", type: "expense" },
  { slug: "other", name: "อื่นๆ", icon: "📦", type: "expense" },
];
