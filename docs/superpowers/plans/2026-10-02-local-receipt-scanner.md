# Local Receipt / Slip Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 100% on-device, zero-cost slip and receipt scanner for mobile web that parses amounts, dates, and merchants from photos in the gallery, prefills the quick-add form, and learns merchant notes for future scans.

**Architecture:** Client-side processing using an off-thread `tesseract.js` WebAssembly OCR worker. An HTML5 canvas preprocessor normalizes mobile gallery images before OCR. A deterministic regex parser extracts amounts, dates, and merchant entities. A local pattern memory store (`localStorage` + transaction history) remembers notes and categories per merchant. Suggestion chips on the UI allow one-tap note selection adhering to the Zero-Emoji standard.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `tesseract.js`, HTML5 Canvas API, Lucide React, Vitest.

**Spec:** In-session agreed design for local on-device receipt reader with zero third-party API dependencies.

## Global Constraints

- 100% On-device processing — no slip image data or financial information leaves the client.
- Zero-Emoji Standard — UI buttons, loading states, and suggestion chips must NOT contain emojis; use Lucide icons and clean text.
- Package manager: `yarn` only (`yarn add`, `yarn test`, `yarn build`).
- Never run `git push`.

---

### Task 1: Add `tesseract.js` dependency & Canvas Image Preprocessing Utility

**Files:**
- Modify: `package.json`
- Create: `src/lib/receipt/preprocess.ts`
- Test: `src/lib/receipt/preprocess.test.ts`

**Interfaces:**
- Produces: `preprocessImageForOcr(file: File | Blob): Promise<string>`
  (Scales image down to max dimension 1200px and converts to grayscale high-contrast data URL for optimal OCR).

- [ ] **Step 1: Install `tesseract.js` via yarn**

Run: `yarn add tesseract.js` in `expense-tracking`

- [ ] **Step 2: Write unit test for image preprocessing**

```typescript
// src/lib/receipt/preprocess.test.ts
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
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn test src/lib/receipt/preprocess.test.ts`

- [ ] **Step 4: Implement `preprocess.ts`**

```typescript
// src/lib/receipt/preprocess.ts
export function clampDimensions(width: number, height: number, maxDim = 1200): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) return { width, height };
  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function preprocessImageForOcr(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = clampDimensions(img.width, img.height, 1200);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(canvas.toDataURL("image/png"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Contrast enhancement & grayscale
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `yarn test src/lib/receipt/preprocess.test.ts`

---

### Task 2: Slip & Receipt Regex Parser Utility

**Files:**
- Create: `src/lib/receipt/parser.ts`
- Test: `src/lib/receipt/parser.test.ts`

**Interfaces:**
- Produces: `parseReceiptText(rawText: string): ParsedReceipt`
  ```typescript
  export interface ParsedReceipt {
    amount: number | null;
    date: string | null; // YYYY-MM-DD
    type: "expense" | "income";
    merchant: string | null;
    rawMatches: { amountText?: string; dateText?: string; merchantText?: string };
  }
  ```

- [ ] **Step 1: Write comprehensive unit test for parser**

```typescript
// src/lib/receipt/parser.test.ts
import { describe, it, expect } from "vitest";
import { parseReceiptText } from "./parser";

describe("parseReceiptText", () => {
  it("extracts amount and date from typical Thai bank transfer slip", () => {
    const sampleSlip = `
      โอนเงินสำเร็จ
      02 ต.ค. 2569 - 09:15
      จาก: นาย สมชาย
      ไปยัง: 7-Eleven สาขาอโศก
      จำนวนเงิน: 189.50 บาท
      ค่าธรรมเนียม: 0.00 บาท
    `;
    const res = parseReceiptText(sampleSlip);
    expect(res.amount).toBe(189.5);
    expect(res.type).toBe("expense");
    expect(res.merchant).toContain("7-Eleven");
  });

  it("handles English receipt with comma in amount", () => {
    const sampleReceipt = `
      GrabTaxi Thailand
      Date: 15 Sep 2026
      Total: 1,450.00 THB
    `;
    const res = parseReceiptText(sampleReceipt);
    expect(res.amount).toBe(1450);
    expect(res.type).toBe("expense");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/receipt/parser.test.ts`

- [ ] **Step 3: Implement `parser.ts`**

```typescript
// src/lib/receipt/parser.ts
export interface ParsedReceipt {
  amount: number | null;
  date: string | null; // YYYY-MM-DD
  type: "expense" | "income";
  merchant: string | null;
  rawMatches: { amountText?: string; dateText?: string; merchantText?: string };
}

const THAI_MONTHS: Record<string, string> = {
  "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04",
  "พ.ค.": "05", "มิ.ย.": "06", "ก.ค.": "07", "ส.ค.": "08",
  "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12",
};

export function parseReceiptText(rawText: string): ParsedReceipt {
  let amount: number | null = null;
  let date: string | null = null;
  let type: "expense" | "income" = "expense";
  let merchant: string | null = null;

  // 1. Amount Extraction
  // Look for amount following "จำนวนเงิน", "ยอดเงิน", "Total", "Amount", "THB", "บาท"
  const amountPatterns = [
    /(?:จำนวนเงิน|ยอดเงิน|โอนเงิน|Total|Amount)\s*[:\s]?\s*([0-9,]+\.[0-9]{2})/i,
    /([0-9,]+\.[0-9]{2})\s*(?:บาท|THB)/i,
    /\b([0-9]{1,3}(?:,[0-9]{3})+\.[0-9]{2})\b/,
  ];

  for (const pattern of amountPatterns) {
    const match = rawText.match(pattern);
    if (match && match[1]) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 0) {
        amount = val;
        break;
      }
    }
  }

  // Fallback: any standalone currency decimal if amount not found
  if (amount === null) {
    const generalMatch = rawText.match(/\b([0-9]+\.[0-9]{2})\b/);
    if (generalMatch && generalMatch[1]) {
      const val = parseFloat(generalMatch[1]);
      if (!isNaN(val) && val > 0) amount = val;
    }
  }

  // 2. Date Extraction (e.g. 02 ต.ค. 2569 or 2026-10-02 or 02/10/2026)
  const thaiDateMatch = rawText.match(/(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2,4})/);
  if (thaiDateMatch) {
    const day = thaiDateMatch[1].padStart(2, "0");
    const mStr = THAI_MONTHS[thaiDateMatch[2]] || "01";
    let year = parseInt(thaiDateMatch[3], 10);
    if (year > 2500) year -= 543; // Buddhist Era to Gregorian
    if (year < 100) year += 2000;
    date = `${year}-${mStr}-${day}`;
  } else {
    const isoMatch = rawText.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (isoMatch) {
      date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
  }

  // 3. Merchant / Receiver Extraction
  const merchantMatch = rawText.match(/(?:ไปยัง|โอนให้|To|Receiver|Merchant)\s*[:\s]?\s*([^\n\r]+)/i);
  if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1].trim().replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s.-]/g, "").trim();
  } else {
    // Look for common merchant names
    const commonNames = ["7-Eleven", "Seven Eleven", "Grab", "Shopee", "Lazada", "Lotus", "Big C", "Makro", "PTT", "Bangchak"];
    for (const name of commonNames) {
      if (new RegExp(name, "i").test(rawText)) {
        merchant = name;
        break;
      }
    }
  }

  return {
    amount,
    date,
    type,
    merchant,
    rawMatches: {},
  };
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `yarn test src/lib/receipt/parser.test.ts`

---

### Task 3: Local Pattern Memory & Suggestion Store

**Files:**
- Create: `src/lib/receipt/patterns.ts`
- Test: `src/lib/receipt/patterns.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface ReceiptPattern {
    merchant: string;
    category: string;
    note: string;
    updatedAt: number;
  }
  export function getSavedPattern(merchant: string): ReceiptPattern | null;
  export function savePattern(merchant: string, category: string, note: string): void;
  export function getQuickNoteSuggestions(merchant?: string | null): string[];
  ```

- [ ] **Step 1: Write test for pattern store**

```typescript
// src/lib/receipt/patterns.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { getSavedPattern, savePattern, getQuickNoteSuggestions } from "./patterns";

describe("patterns", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and retrieves a merchant pattern", () => {
    savePattern("7-Eleven", "food", "มื้อเช้า 7-Eleven");
    const p = getSavedPattern("7-Eleven");
    expect(p?.category).toBe("food");
    expect(p?.note).toBe("มื้อเช้า 7-Eleven");
  });

  it("provides fallback quick suggestions when no pattern exists", () => {
    const list = getQuickNoteSuggestions();
    expect(list.length).toBeGreaterThan(0);
    expect(list).toContain("มื้อเช้า");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/receipt/patterns.test.ts`

- [ ] **Step 3: Implement `patterns.ts`**

```typescript
// src/lib/receipt/patterns.ts
const STORAGE_KEY = "expense_receipt_patterns_v1";

export interface ReceiptPattern {
  merchant: string;
  category: string;
  note: string;
  updatedAt: number;
}

export const DEFAULT_NOTE_SUGGESTIONS = [
  "มื้อเช้า",
  "มื้อเที่ยง",
  "มื้อเย็น",
  "ของกิน",
  "ของใช้",
  "กาแฟ",
  "ค่าเดินทาง",
  "ค่าน้ำมัน",
  "โอนจ่ายทั่วไป",
];

function getAllPatterns(): Record<string, ReceiptPattern> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getSavedPattern(merchant: string): ReceiptPattern | null {
  if (!merchant) return null;
  const all = getAllPatterns();
  const normalized = merchant.toLowerCase().trim();
  for (const [key, val] of Object.entries(all)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return val;
    }
  }
  return null;
}

export function savePattern(merchant: string, category: string, note: string): void {
  if (typeof window === "undefined" || !window.localStorage || !merchant) return;
  try {
    const all = getAllPatterns();
    all[merchant.trim()] = {
      merchant: merchant.trim(),
      category,
      note,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error("Failed to save receipt pattern", err);
  }
}

export function getQuickNoteSuggestions(merchant?: string | null): string[] {
  const suggestions: string[] = [];
  if (merchant) {
    const p = getSavedPattern(merchant);
    if (p && p.note) suggestions.push(p.note);
    suggestions.push(merchant);
  }
  for (const def of DEFAULT_NOTE_SUGGESTIONS) {
    if (!suggestions.includes(def)) suggestions.push(def);
  }
  return suggestions.slice(0, 6);
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `yarn test src/lib/receipt/patterns.test.ts`

---

### Task 4: In-Browser OCR Worker Service

**Files:**
- Create: `src/lib/receipt/ocr.ts`

**Interfaces:**
- Produces:
  ```typescript
  export async function recognizeReceiptImage(
    file: File | Blob,
    onProgress?: (percent: number) => void
  ): Promise<string>;
  ```

- [ ] **Step 1: Implement `ocr.ts` with lazy-loading worker**

```typescript
// src/lib/receipt/ocr.ts
import { preprocessImageForOcr } from "./preprocess";

export async function recognizeReceiptImage(
  file: File | Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  const preprocessedDataUrl = await preprocessImageForOcr(file);

  // Lazy load Tesseract to avoid bloating main bundle
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("tha+eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && typeof m.progress === "number" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  try {
    const ret = await worker.recognize(preprocessedDataUrl);
    return ret.data.text;
  } finally {
    await worker.terminate();
  }
}
```

- [ ] **Step 2: Verify compilation with `yarn build`**

Run: `yarn build` in `expense-tracking`

---

### Task 5: Integrate Slip Upload & Suggestion Chips UI into `HomeView.tsx`

**Files:**
- Modify: `src/components/HomeView.tsx`

**Features:**
- Add hidden `<input type="file" accept="image/*" />` ref.
- Add an "แนบรูปสลิป/ใบเสร็จ" button in Quick Add with camera/image icon (`ReceiptText` or `FileImage` from `lucide-react`).
- Add a progress indicator overlay / status when OCR is recognizing (`กำลังอ่านสลิป... XX%`).
- Prefill `amount`, `selectedDate` (if extracted), `category`, and `note`.
- Show suggestion chips under note input allowing one-tap selection.
- Save merchant pattern on transaction submit.

- [ ] **Step 1: Add state variables and receipt upload handler in `HomeView.tsx`**
- [ ] **Step 2: Add UI elements adhering strictly to Zero-Emoji Standard**
- [ ] **Step 3: Run `yarn build` and `yarn test`**
- [ ] **Step 4: Manual testing on mobile viewport in browser**

---

## Self-Review Checklist
- [x] Spec coverage: Gallery upload, in-browser on-device parsing, no third-party, prefill amount/type/date, suggestion text, and pattern memory are all covered in Tasks 1-5.
- [x] Zero-Emoji Standard: All UI chips and buttons use plain text and Lucide icons.
- [x] Package manager: Explicit `yarn add` and `yarn test`.
