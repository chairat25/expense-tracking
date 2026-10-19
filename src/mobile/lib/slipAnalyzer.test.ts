import { describe, expect, it } from "vitest";
import { analyzeSlip, DEFAULT_SLIP_NOTE, supabaseStorageKey } from "./slipAnalyzer";

describe("analyzeSlip", () => {
  it("returns amount, receiver note and category for a transfer slip", () => {
    const text = ["โอนเงินสำเร็จ", "ไปยัง Café Amazon", "จำนวนเงิน 85.00 บาท"].join("\n");

    const result = analyzeSlip(text);

    expect(result).toEqual({ isSlip: true, amount: 85, note: "Café Amazon", category: "drink" });
  });

  it("reads a Pao Tang co-payment receipt: paid amount, shop name and drink category", () => {
    const text = [
      "เป๋าตัง",
      "ทำรายการสำเร็จ",
      "รหัสอ้างอิง 5233b8e7d30a4816b37dd0344e5ad271",
      "19 ต.ค. 2569 09:13 น.",
      "ชัยรัชต์ ศ***",
      "G-Wallet ID: **** ******* 9662",
      "Coffee Talk",
      "อาหาร ของหวาน เครื่องดื่ม",
      "ค่าสินค้า/บริการ",
      "60 บาท",
      "สิทธิไทยช่วยไทยพลัส",
      "-36 บาท",
      "จำนวนเงินที่ชำระ",
      "24 บาท",
    ].join("\n");

    const result = analyzeSlip(text);

    expect(result).toEqual({ isSlip: true, amount: 24, note: "Coffee Talk", category: "drink" });
  });

  it("falls back to a default note when the receiver cannot be read", () => {
    const text = ["โอนเงินสำเร็จ", "จำนวนเงิน 120.00 บาท"].join("\n");

    const result = analyzeSlip(text);

    expect(result).toMatchObject({ isSlip: true, amount: 120, note: DEFAULT_SLIP_NOTE });
  });

  it("rejects text that is not a slip", () => {
    const text = ["แชทกับเพื่อน", "ข้าวมันไก่ 50 บาท อร่อยมาก"].join("\n");

    expect(analyzeSlip(text)).toEqual({ isSlip: false });
  });

  it("rejects empty text", () => {
    expect(analyzeSlip("")).toEqual({ isSlip: false });
  });
});

describe("supabaseStorageKey", () => {
  it("matches supabase-js default key derived from the project subdomain", () => {
    expect(supabaseStorageKey("https://abcdefgh.supabase.co")).toBe("sb-abcdefgh-auth-token");
  });
});
