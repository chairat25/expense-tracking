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

    expect(daily?.textColor).toContain("emerald");
    expect(debts?.textColor).toContain("rose");
    expect(salary?.textColor).toContain("indigo");
  });

  it("includes description and highlights for every card", () => {
    for (const card of WORKSPACE_CARDS) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.badge.length).toBeGreaterThan(0);
      expect(card.description.length).toBeGreaterThan(0);
      expect(card.highlights.length).toBeGreaterThanOrEqual(2);
      expect(typeof card.icon).toBe("object");
    }
  });
});
