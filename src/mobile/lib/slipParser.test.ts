import { describe, it, expect } from "vitest";
import { parseSlipText, isLikelySlip } from "./slipParser";

describe("isLikelySlip", () => {
  it("accepts a bank transfer slip with amount and slip keywords", () => {
    const text = `
      โอนเงินสำเร็จ
      16 ต.ค. 69 12:04 น.
      นาย ชัยรัตน์ ศ.
      ธ.กสิกรไทย
      ร้านกาแฟดี
      เลขที่รายการ: 016289120412BTF01234
      จำนวน: 65.00 บาท
    `;
    expect(isLikelySlip(text)).toBe(true);
  });

  it("accepts an English PromptPay slip", () => {
    const text = "Transfer successful\nPromptPay\nAmount 1,250.00 THB\nRef No. 2026101712345";
    expect(isLikelySlip(text)).toBe(true);
  });

  it("rejects a photo with no text", () => {
    expect(isLikelySlip("")).toBe(false);
  });

  it("rejects a screenshot of chat that mentions money without slip markers", () => {
    const text = "เย็นนี้กินอะไรดี\nร้านนี้ 150.00 บาท แพงไปมั้ย\nโอเค";
    expect(isLikelySlip(text)).toBe(false);
  });

  it("parses Apple Vision OCR output of a K PLUS slip", () => {
    const ocr = [
      "โอนเงินสำเร็จ",
      "17 ต.ค. 69 16:40 น.",
      "นาย ชัยรัตน์ ศ.",
      "ธ.กสิกรไทย",
      "ไปยัง",
      "ร้านกาแฟดีจัง",
      "เลขที่รายการ: 016290164012BTFO",
      "จำนวน: 1,265.00 บาท",
      "ค่าธรรมเนียม: 0.00 บาท",
    ].join("\n");
    expect(isLikelySlip(ocr)).toBe(true);
    const result = parseSlipText(ocr);
    expect(result.amount).toBe(1265);
    expect(result.receiver).toBe("ร้านกาแฟดีจัง");
  });

  it("rejects text with slip keywords but no amount", () => {
    expect(isLikelySlip("โอนเงินสำเร็จ\nเลขที่รายการ 12345")).toBe(false);
  });
});

describe("Mobile Slip Parser", () => {
  it("extracts amount and receiver from K PLUS slip text", () => {
    const slipText = `
      โอนเงินสำเร็จ
      15 ต.ค. 2567 09:30
      จาก นายทดสอบ
      ไปยัง Café Amazon
      จำนวนเงิน 85.00 บาท
      ค่าธรรมเนียม 0.00 บาท
    `;
    const result = parseSlipText(slipText);
    expect(result.success).toBe(true);
    expect(result.amount).toBe(85);
    expect(result.receiver).toContain("Café Amazon");
    expect(result.category).toBe("drink");
  });

  it("extracts bill category when receiver is electricity authority", () => {
    const slipText = `
      โอนเงินสำเร็จ
      ไปยัง การไฟฟ้านครหลวง
      จำนวนเงิน: 1,420.50 THB
    `;
    const result = parseSlipText(slipText);
    expect(result.success).toBe(true);
    expect(result.amount).toBe(1420.5);
    expect(result.category).toBe("bill");
  });
});
