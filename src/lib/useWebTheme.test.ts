import { describe, expect, it, vi, beforeEach } from "vitest";
import { useWebTheme, applyThemeToDOM, WEB_THEME_STORAGE_KEY } from "./useWebTheme";

describe("useWebTheme & applyThemeToDOM", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    });

    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("exports useWebTheme hook function and storage key", () => {
    expect(typeof useWebTheme).toBe("function");
    expect(WEB_THEME_STORAGE_KEY).toBe("expense_theme_mode");
  });

  it("applies theme to DOM correctly", () => {
    const classList = new Set<string>();
    const attributes: Record<string, string> = {};
    const metaAttrs: Record<string, string> = {};
    let appleMetaRemoved = false;

    vi.stubGlobal("document", {
      documentElement: {
        setAttribute: (k: string, v: string) => {
          attributes[k] = v;
        },
        classList: {
          add: (cls: string) => classList.add(cls),
          remove: (cls: string) => classList.delete(cls),
          contains: (cls: string) => classList.has(cls),
        },
      },
      querySelectorAll: (selector: string) => {
        if (selector === 'meta[name="theme-color"]') {
          return [
            {
              removeAttribute: vi.fn(),
              setAttribute: (k: string, v: string) => {
                metaAttrs[k] = v;
              },
            },
          ];
        }
        if (selector === 'meta[name="apple-mobile-web-app-status-bar-style"]') {
          return [
            {
              remove: () => {
                appleMetaRemoved = true;
              },
            },
          ];
        }
        return [];
      },
    });

    applyThemeToDOM("light");
    expect(attributes["data-theme"]).toBe("light");
    expect(classList.has("dark")).toBe(false);
    expect(metaAttrs["content"]).toBe("#ffffff");
    expect(appleMetaRemoved).toBe(true);

    applyThemeToDOM("dark");
    expect(attributes["data-theme"]).toBe("dark");
    expect(classList.has("dark")).toBe(true);
    expect(metaAttrs["content"]).toBe("#020617");
  });
});
