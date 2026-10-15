import { describe, it, expect } from "vitest";

describe("Receipt Sniffer Validation", () => {
  it("detects asset created within 15 minutes", () => {
    const now = Date.now();
    const assetTime = now - 5 * 60 * 1000; // 5 min ago
    const isRecent = now - assetTime <= 15 * 60 * 1000;
    expect(isRecent).toBe(true);
  });

  it("ignores asset created older than 15 minutes", () => {
    const now = Date.now();
    const assetTime = now - 20 * 60 * 1000; // 20 min ago
    const isRecent = now - assetTime <= 15 * 60 * 1000;
    expect(isRecent).toBe(false);
  });
});
