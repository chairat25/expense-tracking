import { describe, expect, it } from "vitest";
import { darkTheme, lightTheme, resolveTheme } from "./themeTokens";

describe("themeTokens", () => {
  it("exports valid lightTheme and darkTheme with matching keys", () => {
    const lightKeys = Object.keys(lightTheme).sort();
    const darkKeys = Object.keys(darkTheme).sort();
    expect(lightKeys).toEqual(darkKeys);
    expect(lightTheme.mode).toBe("light");
    expect(darkTheme.mode).toBe("dark");
  });

  it("resolves explicit mode correctly", () => {
    expect(resolveTheme("light", "dark")).toBe(lightTheme);
    expect(resolveTheme("dark", "light")).toBe(darkTheme);
  });

  it("resolves system mode based on systemColorScheme", () => {
    expect(resolveTheme("system", "light")).toBe(lightTheme);
    expect(resolveTheme("system", "dark")).toBe(darkTheme);
    // Defaults to dark if systemColorScheme is null/undefined
    expect(resolveTheme("system", null)).toBe(darkTheme);
    expect(resolveTheme("system", undefined)).toBe(darkTheme);
  });
});
