import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type ColorTheme,
  type ThemeMode,
  darkTheme,
  lightTheme,
  resolveTheme,
} from "../lib/themeTokens";

export { darkTheme, lightTheme, resolveTheme, type ColorTheme, type ThemeMode };

interface ThemeContextValue {
  theme: ColorTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "@expense_theme_mode";

export function ThemeProvider({
  initialMode = "system",
  children,
}: {
  initialMode?: ThemeMode;
  children: React.ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const systemScheme = useColorScheme();

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (active && (stored === "system" || stored === "light" || stored === "dark")) {
          setModeState(stored);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const theme = useMemo(() => {
    return resolveTheme(mode, systemScheme);
  }, [mode, systemScheme]);

  const value = useMemo(
    () => ({
      theme,
      mode,
      setMode,
      isDark: theme.mode === "dark",
    }),
    [theme, mode, setMode]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

/**
 * Hook to access current active theme, theme mode, and switcher.
 * Works both inside and outside ThemeProvider (falls back to system scheme).
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  const systemScheme = useColorScheme();

  if (context) {
    return context;
  }

  // Graceful fallback when outside ThemeProvider
  const fallbackTheme = resolveTheme("system", systemScheme);
  return {
    theme: fallbackTheme,
    mode: "system",
    setMode: () => {},
    isDark: fallbackTheme.mode === "dark",
  };
}

/** Tailwind slate/emerald/rose/indigo/amber palette ที่เว็บ PWA ใช้ */
export const colors = {
  slate950: "#020617",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  white: "#ffffff",
  emerald300: "#6ee7b7",
  emerald400: "#34d399",
  emerald500: "#10b981",
  emerald600: "#059669",
  rose300: "#fda4af",
  rose400: "#fb7185",
  rose500: "#f43f5e",
  indigo300: "#a5b4fc",
  indigo400: "#818cf8",
  indigo600: "#4f46e5",
  amber400: "#fbbf24",
} as const;

/** สีโปร่งใสที่เว็บเขียนเป็น color/opacity */
export const tints = {
  emerald10: "rgba(16,185,129,0.10)",
  emerald20: "rgba(16,185,129,0.20)",
  emerald40: "rgba(16,185,129,0.40)",
  emerald60: "rgba(16,185,129,0.60)",
  emeraldBg: "rgba(2,44,34,0.45)",
  rose30: "rgba(244,63,94,0.30)",
  rose20: "rgba(244,63,94,0.20)",
  roseBg: "rgba(76,5,25,0.50)",
  indigo30: "rgba(99,102,241,0.30)",
  indigoBg: "rgba(30,27,75,0.45)",
  amber20: "rgba(251,191,36,0.20)",
  card: "rgba(15,23,42,0.60)",
  overlay: "rgba(0,0,0,0.70)",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const MAX_CONTENT_WIDTH = 448;
