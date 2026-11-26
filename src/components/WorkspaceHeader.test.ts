import { describe, it, expect } from "vitest";
import { WORKSPACES } from "./WorkspaceHeader";

describe("Workspace Configuration & Metadata", () => {
  it("defines all 3 primary workspaces with required attributes", () => {
    expect(WORKSPACES.length).toBe(3);

    const ids = WORKSPACES.map((w) => w.id);
    expect(ids).toEqual(["daily", "debts", "salary"]);

    const hrefs = WORKSPACES.map((w) => w.href);
    expect(hrefs).toEqual(["/daily", "/debts", "/salary"]);
  });

  it("assigns distinct theme colors for each workspace", () => {
    const daily = WORKSPACES.find((w) => w.id === "daily");
    const debts = WORKSPACES.find((w) => w.id === "debts");
    const salary = WORKSPACES.find((w) => w.id === "salary");

    expect(daily?.colorClass).toContain("emerald");
    expect(debts?.colorClass).toContain("rose");
    expect(salary?.colorClass).toContain("indigo");
  });

  it("provides valid Lucide icon components for all workspaces", () => {
    for (const w of WORKSPACES) {
      expect(typeof w.icon).toBe("object"); // Lucide icon forwardRef object/function
      expect(w.title.length).toBeGreaterThan(0);
      expect(w.shortTitle.length).toBeGreaterThan(0);
    }
  });
});
