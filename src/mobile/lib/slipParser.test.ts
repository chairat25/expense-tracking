import { describe, it, expect } from "vitest";
import { parseSlipText } from "./slipParser";

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
