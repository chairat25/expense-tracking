import { describe, it, expect } from "vitest";
import {
  parseRecDict,
  flattenGrayscaleCrop,
  extractTextBoxes,
  ctcGreedyDecode,
  countMixedThaiLatin,
  groupBoxesIntoLines,
} from "./openthaiUtils";

describe("openthaiUtils", () => {
  it("parses rec_dict.txt with blank at index 0 and space at tail", () => {
    const chars = parseRecDict("ก\nข\n\n0\n");
    expect(chars).toEqual(["", "ก", "ข", "0", " "]);
  });

  it("flattens dark-on-light and light-on-dark crops into dark text on crisp white", () => {
    const w = 12;
    const h = 12;

    // 1) Dark text (value 20) in middle of light background (value 235)
    const lightBg = new Uint8Array(w * h).fill(235);
    for (let y = 4; y <= 7; y++) {
      for (let x = 4; x <= 7; x++) {
        lightBg[y * w + x] = 20;
      }
    }
    const flatLight = flattenGrayscaleCrop(lightBg, w, h);
    expect(flatLight[0]).toBe(255); // border background stays white
    expect(flatLight[5 * w + 5]).toBeLessThan(20); // text becomes dark

    // 2) Light text (value 240) on dark background (value 25, e.g. dark mode slip)
    const darkBg = new Uint8Array(w * h).fill(25);
    for (let y = 4; y <= 7; y++) {
      for (let x = 4; x <= 7; x++) {
        darkBg[y * w + x] = 240;
      }
    }
    const flatDark = flattenGrayscaleCrop(darkBg, w, h);
    expect(flatDark[0]).toBe(255); // dark border normalized to white
    expect(flatDark[5 * w + 5]).toBeLessThan(20); // light text inverted to dark
  });

  it("extracts connected text components, applies unclip, and filters weak blobs", () => {
    const mapW = 40;
    const mapH = 40;
    const prob = new Float32Array(mapW * mapH);

    // Strong 10x6 text blob at x=[10..19], y=[12..17]
    for (let y = 12; y <= 17; y++) {
      for (let x = 10; x <= 19; x++) {
        prob[y * mapW + x] = 0.85;
      }
    }

    // Weak 4x4 noise blob (prob 0.25 > thresh 0.2 but < boxThresh 0.4)
    for (let y = 2; y <= 5; y++) {
      for (let x = 2; x <= 5; x++) {
        prob[y * mapW + x] = 0.25;
      }
    }

    const boxes = extractTextBoxes(prob, mapW, mapH, 200, 200, 0, 5, 5);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].score).toBeCloseTo(0.85, 2);
    // Expanded outward from [50..100, 60..90]
    expect(boxes[0].x1).toBeLessThan(50);
    expect(boxes[0].x2).toBeGreaterThan(95);
    expect(boxes[0].y1).toBeLessThan(60);
    expect(boxes[0].y2).toBeGreaterThan(85);
  });

  it("greedily decodes CTC outputs collapsing repeats and skipping blank 0", () => {
    const chars = ["", "1", "5", "0", "."];
    const C = chars.length;
    // Steps: 1, 1, blank(0), 1, 5, blank(0), 0, 0
    const seq = [1, 1, 0, 1, 5, 2, 0, 3]; // emits "1", "1", <?> -> let's map indices cleanly!
    const probs = new Float32Array(seq.length * C);
    // Step sequence for "115.0": idx1=1("1"), idx1=1, blank=0, idx1=1("1"), idx2=2("5"), idx4=4("."), idx3=3("0")
    const targetIds = [1, 1, 0, 1, 2, 4, 3, 0];
    for (let t = 0; t < targetIds.length; t++) {
      probs[t * C + targetIds[t]] = 0.9;
    }

    const decoded = ctcGreedyDecode(probs, targetIds.length, C, chars);
    expect(decoded.text).toBe("115.0");
    expect(decoded.confidence).toBeCloseTo(0.9, 4);
  });

  it("counts Latin look-alikes mixed inside Thai words", () => {
    expect(countMixedThaiLatin("โอนเงินสำเร็จ 150.00 บาท")).toBe(0);
    expect(countMixedThaiLatin("150.00 Uาท GrabFood")).toBe(1); // U inside Uาท, GrabFood is pure Latin
    expect(countMixedThaiLatin("ร้านU้าn 7-Eleven")).toBe(2);
  });

  it("groups boxes by vertical line centers and sorts left to right", () => {
    const text = groupBoxesIntoLines([
      {
        box: { x1: 120, y1: 10, x2: 180, y2: 30, width: 60, height: 20, score: 0.9 },
        text: "150.00 บาท",
      },
      {
        box: { x1: 10, y1: 50, x2: 110, y2: 70, width: 100, height: 20, score: 0.9 },
        text: "ร้านค้าถุงเงิน",
      },
      {
        box: { x1: 10, y1: 12, x2: 90, y2: 32, width: 80, height: 20, score: 0.9 },
        text: "ยอดชำระ",
      },
    ]);

    expect(text).toBe("ยอดชำระ 150.00 บาท\nร้านค้าถุงเงิน");
  });
});
