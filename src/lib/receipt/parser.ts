export interface ParsedReceipt {
  amount: number | null;
  date: string | null; // YYYY-MM-DD
  type: "expense" | "income";
  merchant: string | null;
}

const THAI_MONTHS: Record<string, string> = {
  "ม.ค.": "01",
  "ก.พ.": "02",
  "มี.ค.": "03",
  "เม.ย.": "04",
  "พ.ค.": "05",
  "มิ.ย.": "06",
  "ก.ค.": "07",
  "ส.ค.": "08",
  "ก.ย.": "09",
  "ต.ค.": "10",
  "พ.ย.": "11",
  "ธ.ค.": "12",
  "มกราคม": "01",
  "กุมภาพันธ์": "02",
  "มีนาคม": "03",
  "เมษายน": "04",
  "พฤษภาคม": "05",
  "มิถุนายน": "06",
  "กรกฎาคม": "07",
  "สิงหาคม": "08",
  "กันยายน": "09",
  "ตุลาคม": "10",
  "พฤศจิกายน": "11",
  "ธันวาคม": "12",
};

const ENGLISH_MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

export function parseReceiptText(rawText: string): ParsedReceipt {
  let amount: number | null = null;
  let date: string | null = null;
  let type: "expense" | "income" = "expense";
  let merchant: string | null = null;

  // Normalize spaces and clean up text
  const cleaned = rawText.replace(/\r/g, "\n");

  // 1. Amount Extraction
  // Prefer lines with keywords "จำนวนเงิน", "ยอดเงิน", "โอนเงิน", "Total", "Amount", "THB", "บาท"
  // Exclude lines explicitly saying "ค่าธรรมเนียม: 0.00"
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Ignore fee lines
    if (/ค่าธรรมเนียม|fee/i.test(line) && !/จำนวนเงิน|ยอดเงิน|total|amount/i.test(line)) {
      continue;
    }

    const keywordMatch = line.match(
      /(?:จำนวนเงิน|ยอดเงิน|โอนเงิน|ยอดรวม|Total|Amount|Grand Total)\s*[:\s]?\s*(?:THB|฿)?\s*([0-9,]+\.[0-9]{2})/i
    );
    if (keywordMatch && keywordMatch[1]) {
      const val = parseFloat(keywordMatch[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 0) {
        amount = val;
        break;
      }
    }
  }

  // Fallback: look for "xxx.xx บาท" or "xxx.xx THB"
  if (amount === null) {
    const currencySuffixMatch = cleaned.match(/([0-9,]+\.[0-9]{2})\s*(?:บาท|THB)/i);
    if (currencySuffixMatch && currencySuffixMatch[1]) {
      const val = parseFloat(currencySuffixMatch[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 0) {
        amount = val;
      }
    }
  }

  // Fallback 2: largest plausible decimal number in the document (avoiding 0.00 fee)
  if (amount === null) {
    const allDecimals = Array.from(cleaned.matchAll(/\b([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b/g))
      .map((m) => parseFloat(m[1].replace(/,/g, "")))
      .filter((v) => !isNaN(v) && v > 0);

    if (allDecimals.length > 0) {
      amount = allDecimals[0];
    }
  }

  // 2. Date Extraction
  const thaiDateRegex = /(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(\d{2,4})/;
  const thaiMatch = cleaned.match(thaiDateRegex);
  if (thaiMatch) {
    const day = thaiMatch[1].padStart(2, "0");
    const mStr = THAI_MONTHS[thaiMatch[2]] || "01";
    let yr = parseInt(thaiMatch[3], 10);
    if (yr > 2500) yr -= 543;
    else if (yr < 100) yr += yr >= 50 ? 1900 + (yr - 43) : 2000 + yr;
    date = `${yr}-${mStr}-${day}`;
  } else {
    const engDateRegex = /(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{4})/i;
    const engMatch = cleaned.match(engDateRegex);
    if (engMatch) {
      const day = engMatch[1].padStart(2, "0");
      const mStr = ENGLISH_MONTHS[engMatch[2].toLowerCase()] || "01";
      const yr = engMatch[3];
      date = `${yr}-${mStr}-${day}`;
    } else {
      const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (slashMatch) {
        let yr = parseInt(slashMatch[3], 10);
        if (yr > 2500) yr -= 543;
        date = `${yr}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
      } else {
        const isoMatch = cleaned.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
        if (isoMatch) {
          date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
        }
      }
    }
  }

  // 3. Merchant / Receiver Extraction
  // Use word boundaries for English keywords (\bTo\b) to avoid matching "Total"
  const targetMatch = cleaned.match(/(?:ไปยัง|โอนให้|โอนเงินให้|ผู้รับเงิน|\bTo\b|Receiver|Merchant|ร้านค้า)\s*[:\s]?\s*([^\n\r]+)/i);
  if (targetMatch && targetMatch[1]) {
    const rawName = targetMatch[1].trim();
    // Exclude if it accidentally captured amount or fee words
    if (!/total|amount|fee|baht|บาท/i.test(rawName)) {
      const cleanName = rawName.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s.-]/g, "").trim();
      if (cleanName.length > 1) {
        merchant = cleanName.split(/\s{2,}|\t/)[0];
      }
    }
  }

  // Common chain names sorted by length descending so specific chains take priority
  const commonChains = [
    "Seven Eleven", "7-Eleven", "เซเว่น",
    "Café Amazon", "Amazon", "Starbucks",
    "GrabTaxi", "GrabFood", "Grab",
    "ShopeePay", "Shopee", "Lazada", "LINE MAN",
    "Lotus's", "Lotus", "โลตัส", "Big C", "บิ๊กซี",
    "Makro", "แม็คโคร", "Bangchak", "บางจาก", "PTT",
  ];

  for (const chain of commonChains) {
    if (new RegExp(`\\b${chain}\\b|${chain}`, "i").test(cleaned)) {
      if (!merchant || merchant.length < chain.length) {
        merchant = chain;
      }
      break;
    }
  }

  return {
    amount,
    date,
    type,
    merchant,
  };
}
