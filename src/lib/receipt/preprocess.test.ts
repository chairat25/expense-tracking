import { describe, it, expect } from "vitest";
import { clampDimensions } from "./preprocess";

describe("clampDimensions", () => {
  it("scales down dimensions exceeding max limit while preserving aspect ratio", () => {
    const { width, height } = clampDimensions(2400, 1600, 1200);
    expect(width).toBe(1200);
    expect(height).toBe(800);
  });

  it("leaves dimensions within limit untouched", () => {
    const { width, height } = clampDimensions(800, 600, 1200);
    expect(width).toBe(800);
    expect(height).toBe(600);
  });

  it("handles portrait images correctly", () => {
    const { width, height } = clampDimensions(1080, 1920, 1200);
    expect(height).toBe(1200);
    expect(width).toBe(675);
  });
});
