import { describe, it, expect, beforeEach } from "vitest";
import { getSavedPattern, savePattern, getQuickNoteSuggestions, clearPatterns } from "./patterns";

describe("patterns", () => {
  beforeEach(() => {
    clearPatterns();
  });

  it("saves and retrieves a merchant pattern", () => {
    savePattern("7-Eleven", "food", "มื้อเช้า 7-Eleven");
    const p = getSavedPattern("7-Eleven");
    expect(p?.category).toBe("food");
    expect(p?.note).toBe("มื้อเช้า 7-Eleven");
  });

  it("retrieves pattern by substring matching", () => {
    savePattern("7-Eleven", "food", "มื้อเช้า 7-Eleven");
    const p = getSavedPattern("7-Eleven สาขาอโศก");
    expect(p?.category).toBe("food");
    expect(p?.note).toBe("มื้อเช้า 7-Eleven");
  });

  it("provides fallback quick suggestions when no pattern exists", () => {
    const list = getQuickNoteSuggestions();
    expect(list.length).toBeGreaterThan(0);
    expect(list).toContain("มื้อเช้า");
  });

  it("includes saved pattern note in suggestions when merchant matches", () => {
    savePattern("Grab", "transport", "ค่าเดินทาง Grab");
    const list = getQuickNoteSuggestions("Grab");
    expect(list).toContain("ค่าเดินทาง Grab");
  });
});
