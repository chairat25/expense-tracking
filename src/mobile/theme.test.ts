import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  useColorScheme: () => "dark",
}));

import { darkTheme, lightTheme, resolveTheme, colors, radius, tints } from "./theme";

describe("Mobile Theme System", () => {
  it("exports darkTheme and lightTheme", () => {
    expect(darkTheme).toBeDefined();
    expect(lightTheme).toBeDefined();
    expect(darkTheme.mode).toBe("dark");
    expect(lightTheme.mode).toBe("light");
  });

  it("resolves theme based on scheme", () => {
    expect(resolveTheme("dark")).toEqual(darkTheme);
    expect(resolveTheme("light")).toEqual(lightTheme);
    expect(resolveTheme("system", "light")).toEqual(lightTheme);
    expect(resolveTheme("system", "dark")).toEqual(darkTheme);
  });

  it("maintains backward compatibility with legacy palette and tints", () => {
    expect(colors.slate950).toBe("#020617");
    expect(colors.emerald500).toBe("#10b981");
    expect(colors.rose400).toBe("#fb7185");
    expect(tints.card).toBe("rgba(15,23,42,0.60)");
    expect(radius.lg).toBe(16);
  });
});
