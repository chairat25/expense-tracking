import { describe, it, expect } from "vitest";
import { WORKSPACE_CARDS } from "./LandingHubView";

describe("LandingHubView Workspace Cards", () => {
  it("defines exactly 3 primary workspace cards with distinct color schemes", () => {
    expect(WORKSPACE_CARDS.length).toBe(3);

    const cardIds = WORKSPACE_CARDS.map((c) => c.id);
    expect(cardIds).toEqual(["daily", "debts", "salary"]);

    const hrefs = WORKSPACE_CARDS.map((c) => c.href);
    expect(hrefs).toEqual(["/daily", "/debts", "/salary"]);
  });

  it("assigns distinct colors for Daily (emerald), Debts (rose), and Salary (indigo)", () => {
    const daily = WORKSPACE_CARDS.find((c) => c.id === "daily");
    const debts = WORKSPACE_CARDS.find((c) => c.id === "debts");
    const salary = WORKSPACE_CARDS.find((c) => c.id === "salary");

    expect(daily?.accentColor).toBe("emerald");
    expect(debts?.accentColor).toBe("rose");
    expect(salary?.accentColor).toBe("indigo");

    expect(daily?.buttonBg).toContain("emerald");
    expect(debts?.buttonBg).toContain("rose");
    expect(salary?.buttonBg).toContain("indigo");
  });

  it("includes clean title and icon for each action button", () => {
    for (const card of WORKSPACE_CARDS) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.href.startsWith("/")).toBe(true);
      expect(typeof card.icon).toBe("object");
    }

    const titles = WORKSPACE_CARDS.map((c) => c.title);
    expect(titles).toEqual([
      "รายรับ-รายจ่าย รายวัน",
      "หนี้สินรายเดือน",
      "เงินเดือน",
    ]);
  });
});
