import { parseReceiptText } from "../../lib/receipt/parser";
import { getSavedPattern } from "../../lib/receipt/patterns";
import { CategorySlug } from "./shared";

export interface ParsedSlipResult {
  success: boolean;
  amount: number | null;
  date: string | null;
  receiver: string | null;
  category: CategorySlug;
  rawText?: string;
  error?: string;
}

/**
 * สกัดข้อมูลสลิปจากข้อความ OCR (หรือ mock / vision text)
 * พัฒนาร่วมกับคำแนะนำจาก Google Gemini Web
 */
export function parseSlipText(text: string): ParsedSlipResult {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      amount: null,
      date: null,
      receiver: null,
      category: "food",
      error: "ไม่มีข้อความในสลิป",
    };
  }

  const receipt = parseReceiptText(text);

  // สกัดชื่อผู้รับ / ร้านค้า เพิ่มเติมตามคำแนะนำจาก Gemini Web
  let receiver = receipt.merchant;
  if (!receiver) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const targetKeywords = ["ไปยัง", "ถึง", "ผู้รับเงิน", "to:", "to", "receiver"];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const kw of targetKeywords) {
        if (line.toLowerCase().includes(kw)) {
          const cleaned = line.replace(new RegExp(`^.*?${kw}[:\\s-]*`, "i"), "").trim();
          if (cleaned.length > 2 && !cleaned.includes("xxx") && !/^[0-9\s-]+$/.test(cleaned)) {
            receiver = cleaned;
            break;
          }
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine.length > 2 && !nextLine.toLowerCase().startsWith("xxx") && !/^[0-9\s-]+$/.test(nextLine)) {
              receiver = nextLine;
              break;
            }
          }
        }
      }
      if (receiver) break;
    }
  }

  // ทำ Pattern Learning หาหมวดหมู่ที่เหมาะสมอัตโนมัติ
  let category: CategorySlug = "food";
  if (receiver) {
    const pattern = getSavedPattern(receiver);
    if (pattern && pattern.category) {
      category = pattern.category as CategorySlug;
    } else if (/บิล|ค่าไฟ|ค่าน้ำ|การประปา|การไฟ/i.test(receiver)) {
      category = "bill";
    } else if (/กาแฟ|amazon|cafe|tea|ชา/i.test(receiver)) {
      category = "drink";
    } else if (/bts|mrt|grab|bolt|taxi|เติมเงิน|ทางด่วน/i.test(receiver)) {
      category = "transport";
    } else if (/shopee|lazada|7-eleven|cj|big c|lotus/i.test(receiver)) {
      category = "shopping";
    }
  }

  const hasData = receipt.amount !== null || receipt.date !== null || receiver !== null;

  return {
    success: hasData,
    amount: receipt.amount,
    date: receipt.date,
    receiver: receiver || null,
    category,
    rawText: text,
  };
}

// Phrases that appear on Thai bank / e-wallet transfer slips but rarely elsewhere.
const SLIP_MARKERS = [
  /(?:โอนเงิน|ทำรายการ|ชำระเงิน|จ่ายบิล|เติมเงิน)\s*สำเร็จ/,
  /เลขที่รายการ|รหัสอ้างอิง|เลขอ้างอิง|หมายเลขอ้างอิง/,
  /พร้อมเพย์|promptpay/i,
  /(?:transfer|payment|transaction)\s+(?:successful|completed)/i,
  /ref(?:erence)?\.?\s*(?:no|id|code)|transaction\s*id/i,
  /กสิกร|ไทยพาณิชย์|กรุงเทพ|กรุงไทย|กรุงศรี|ทหารไทยธนชาต|ออมสิน|ธ\.ก\.ส\.|ยูโอบี|ซีไอเอ็มบี|เกียรตินาคิน/,
  /\b(?:k\s?plus|kbank|scb|ktb|krungthai|bualuang|krungsri|ttb|gsb|uob|truemoney)\b/i,
];

/**
 * Decide whether OCR text comes from a payment slip: it must contain an
 * amount and at least one slip-specific marker, so selfies and chat
 * screenshots that merely mention a price are ignored.
 */
export function isLikelySlip(text: string): boolean {
  if (!text.trim()) return false;
  const hasMarker = SLIP_MARKERS.some((re) => re.test(text));
  if (!hasMarker) return false;
  return parseReceiptText(text).amount !== null;
}
