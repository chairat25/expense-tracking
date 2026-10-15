import { describe, it, expect } from "vitest";
import { formatBaht, shiftDate, todayKey } from "./shared";

describe("Mobile Shared Utils", () => {
  it("formats baht correctly", () => {
    expect(formatBaht(150.5)).toBe("150.50");
    expect(formatBaht(0)).toBe("0.00");
  });

  it("shifts date correctly", () => {
    expect(shiftDate("2026-10-15", -1)).toBe("2026-10-14");
    expect(shiftDate("2026-10-15", 1)).toBe("2026-10-16");
  });

  it("returns today key in YYYY-MM-DD format", () => {
    const today = todayKey();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
