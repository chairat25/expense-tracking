/**
 * Shared Design Tokens for Expense Tracker (Single Source of Truth)
 * Shared across Next.js Web PWA and React Native Mobile.
 */

export type ThemeMode = "system" | "light" | "dark";

export interface ColorTheme {
  mode: "light" | "dark";
  /** Main background */
  bg: string;
  /** Primary card surface */
  surface: string;
  /** Secondary surface (subtle cards, list items) */
  surfaceSubtle: string;
  /** Border stroke */
  border: string;
  /** Subtle border stroke */
  borderSubtle: string;
  /** Primary high-contrast text */
  text: string;
  /** Secondary text */
  textSecondary: string;
  /** Muted caption / label text */
  textMuted: string;
  /** Income / success green */
  income: string;
  /** Income soft background pill */
  incomeSoft: string;
  /** Expense / danger rose */
  expense: string;
  /** Expense soft background pill */
  expenseSoft: string;
  /** Accent brand color (indigo/emerald) */
  accent: string;
  /** Accent subtle tint */
  accentLight: string;
  /** Bottom navigation bar background */
  navBg: string;
  /** Bottom navigation hairline border */
  navBorder: string;
}

export const lightTheme: ColorTheme = {
  mode: "light",
  bg: "#f1f5f9", // slate-100
  surface: "#ffffff", // pure white card
  surfaceSubtle: "#f8fafc", // slate-50
  border: "#e2e8f0", // slate-200
  borderSubtle: "rgba(226, 232, 240, 0.6)",
  text: "#0f172a", // slate-900
  textSecondary: "#475569", // slate-600
  textMuted: "#94a3b8", // slate-400
  income: "#059669", // emerald-600
  incomeSoft: "#d1fae5", // emerald-100
  expense: "#e11d48", // rose-600
  expenseSoft: "#ffe4e6", // rose-100
  accent: "#4f46e5", // indigo-600
  accentLight: "#818cf8",
  navBg: "#ffffff",
  navBorder: "rgba(0, 0, 0, 0.08)",
};

export const darkTheme: ColorTheme = {
  mode: "dark",
  bg: "#020617", // slate-950 titanium
  surface: "#0f172a", // slate-900 card
  surfaceSubtle: "#1e293b", // slate-800
  border: "#1e293b", // slate-800
  borderSubtle: "rgba(30, 41, 59, 0.6)",
  text: "#f1f5f9", // slate-100
  textSecondary: "#94a3b8", // slate-400
  textMuted: "#64748b", // slate-500
  income: "#10b981", // emerald-500
  incomeSoft: "rgba(16, 185, 129, 0.15)",
  expense: "#fb7185", // rose-400
  expenseSoft: "rgba(244, 63, 94, 0.15)",
  accent: "#6366f1", // indigo-500
  accentLight: "#a5b4fc",
  navBg: "#080c15",
  navBorder: "rgba(255, 255, 255, 0.09)",
};

/**
 * Resolves the active theme based on user preference and system appearance.
 */
export function resolveTheme(
  mode: ThemeMode,
  systemColorScheme?: string | null
): ColorTheme {
  if (mode === "light") return lightTheme;
  if (mode === "dark") return darkTheme;
  return systemColorScheme === "light" ? lightTheme : darkTheme;
}
