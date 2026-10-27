"use client";

import { useEffect, useState, useCallback } from "react";
import { type ThemeMode, resolveTheme, type ColorTheme } from "./themeTokens";

export const WEB_THEME_STORAGE_KEY = "expense_theme_mode";

export function applyThemeToDOM(resolvedMode: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolvedMode);
  if (resolvedMode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Update meta theme-color for mobile top notch / status bar
  const isDark = resolvedMode === "dark";
  const color = isDark ? "#020617" : "#ffffff";
  const barStyle = isDark ? "black-translucent" : "default";

  if (typeof document.querySelectorAll === "function") {
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length > 0) {
      metas.forEach((m) => {
        if (typeof m.removeAttribute === "function") {
          m.removeAttribute("media");
        }
        m.setAttribute("content", color);
      });
    } else if (document.head && typeof document.createElement === "function") {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = color;
      document.head.appendChild(meta);
    }
  }

  // Update apple-mobile-web-app-status-bar-style
  if (typeof document.querySelector === "function") {
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta && document.head && typeof document.createElement === "function") {
      appleMeta = document.createElement("meta");
      appleMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(appleMeta);
    }
    if (appleMeta) {
      appleMeta.setAttribute("content", barStyle);
    }
  }
}

export function useWebTheme() {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Read stored preference
    try {
      const stored = localStorage.getItem(WEB_THEME_STORAGE_KEY);
      if (stored === "system" || stored === "light" || stored === "dark") {
        setModeState(stored);
      }
    } catch {
      // Ignore localStorage access errors
    }

    // 2. Setup system media query listener
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateScheme = (matches: boolean) => {
      setSystemScheme(matches ? "dark" : "light");
    };

    updateScheme(media.matches);

    const listener = (e: MediaQueryListEvent) => updateScheme(e.matches);
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      // Fallback for older browsers
      const anyMedia = media as unknown as {
        addListener: (cb: (e: MediaQueryListEvent) => void) => void;
        removeListener: (cb: (e: MediaQueryListEvent) => void) => void;
      };
      if (anyMedia.addListener) {
        anyMedia.addListener(listener);
        return () => anyMedia.removeListener(listener);
      }
    }
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(WEB_THEME_STORAGE_KEY, newMode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const theme: ColorTheme = resolveTheme(mode, systemScheme);

  useEffect(() => {
    applyThemeToDOM(theme.mode);
  }, [theme.mode]);

  return {
    mode,
    setMode,
    theme,
    isDark: theme.mode === "dark",
  };
}
