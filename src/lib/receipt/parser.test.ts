import { describe, it, expect } from "vitest";
import { parseReceiptText } from "./parser";

describe("parseReceiptText", () => {
  it("extracts amount, date, and receiver from standard Thai bank slip", () => {
    const sample = `
      ธนาคารกสิกรไทย
      โอนเงินสำเร็จ
      02 ต.ค. 2569 - 09:15 น.
      จาก: นาย สมชาย
      ไปยัง: 7-Eleven สาขาอโศก
      จำนวนเงิน: 189.50 บาท
      ค่าธรรมเนียม: 0.00 บาท
    `;
    const res = parseReceiptText(sample);
    expect(res.amount).toBe(189.5);
    expect(res.date).toBe("2026-10-02");
    expect(res.type).toBe("expense");
    expect(res.merchant).toContain("7-Eleven");
  });

  it("extracts amounts with commas and english dates", () => {
    const sample = `
      GrabTaxi Thailand
      Date: 15 Sep 2026
      Total: 1,450.00 THB
    `;
    const res = parseReceiptText(sample);
    expect(res.amount).toBe(1450);
    expect(res.date).toBe("2026-09-15");
    expect(res.merchant).toContain("Grab");
  });

  it("handles standalone decimals and chain names accurately", () => {
    const sample = `
      Café Amazon PTT
      2026-08-20 14:30
      ยอดเงิน 65.00
    `;
    const res = parseReceiptText(sample);
    expect(res.amount).toBe(65);
    expect(res.date).toBe("2026-08-20");
    expect(res.merchant).toContain("Amazon");
  });

  it("handles 2-digit Thai Buddhist year (e.g. 69 -> 2026)", () => {
    const sample = `
      02 ต.ค. 69 13:40
      จำนวนเงิน 60.00 บาท
    `;
    const res = parseReceiptText(sample);
    expect(res.amount).toBe(60);
    expect(res.date).toBe("2026-10-02");
  });

  it("discards bogus year artifacts outside valid window", () => {
    const sample = `
      02 ต.ค. 1995
      จำนวนเงิน 60.00 บาท
    `;
    const res = parseReceiptText(sample);
    expect(res.amount).toBe(60);
    // 1995 is outside currentYear - 3..+1, should be ignored/null
    expect(res.date).toBeNull();
  });
});
