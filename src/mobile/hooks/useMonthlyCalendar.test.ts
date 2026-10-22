import { describe, it, expect } from "vitest";

describe("Monthly Calendar Logic", () => {
  function shiftMonthHelper(prev: string, delta: number): string {
    const [yStr, mStr] = prev.split("-");
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10) + delta;
    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  it("shifts month forward within the same year", () => {
    expect(shiftMonthHelper("2026-05", 1)).toBe("2026-06");
  });

  it("shifts month forward across new year boundary", () => {
    expect(shiftMonthHelper("2026-12", 1)).toBe("2027-01");
  });

  it("shifts month backward within the same year", () => {
    expect(shiftMonthHelper("2026-05", -1)).toBe("2026-04");
  });

  it("shifts month backward across new year boundary", () => {
    expect(shiftMonthHelper("2026-01", -1)).toBe("2025-12");
  });

  it("computes accurate days in month for leap and non-leap years", () => {
    // 2024 is a leap year (February has 29 days)
    const daysFeb2024 = new Date(2024, 2, 0).getDate();
    expect(daysFeb2024).toBe(29);

    // 2026 is non-leap (February has 28 days)
    const daysFeb2026 = new Date(2026, 2, 0).getDate();
    expect(daysFeb2026).toBe(28);

    // October has 31 days
    const daysOct2026 = new Date(2026, 10, 0).getDate();
    expect(daysOct2026).toBe(31);
  });
});
