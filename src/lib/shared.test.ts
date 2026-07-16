import { describe, expect, it } from "vitest";
import {
  computeBudget,
  dayCount,
  datesFrom,
  weekEnd,
  weekSliceInMonth,
  weekStart,
  type MonthData,
  type Tx,
} from "./shared";

describe("weekStart", () => {
  it("คืนตัวเองเมื่อเป็นวันจันทร์อยู่แล้ว", () => {
    expect(weekStart("2026-07-13")).toBe("2026-07-13");
  });

  it("วันอาทิตย์ถอยกลับ 6 วัน (ไม่ใช่ถอยไปอาทิตย์ถัดไป)", () => {
    expect(weekStart("2026-07-19")).toBe("2026-07-13");
  });

  it("ถอยข้ามเดือนได้", () => {
    expect(weekStart("2026-07-01")).toBe("2026-06-29");
  });

  it("ถอยข้ามปีได้", () => {
    expect(weekStart("2026-01-01")).toBe("2025-12-29");
  });
});

describe("weekEnd", () => {
  it("วันจันทร์จบที่อาทิตย์ถัดไป", () => {
    expect(weekEnd("2026-07-13")).toBe("2026-07-19");
  });

  it("เดินหน้าข้ามเดือนได้", () => {
    expect(weekEnd("2026-06-29")).toBe("2026-07-05");
  });
});

describe("dayCount", () => {
  it("วันเดียวกันนับเป็น 1", () => {
    expect(dayCount("2026-07-01", "2026-07-01")).toBe(1);
  });

  it("นับปลายทั้งสองข้าง", () => {
    expect(dayCount("2026-07-01", "2026-07-31")).toBe(31);
  });

  it("ข้ามเดือนในปีที่ไม่ใช่อธิกสุรทิน", () => {
    expect(dayCount("2026-02-28", "2026-03-01")).toBe(2);
  });

  it("ข้ามเดือนในปีอธิกสุรทิน (มี 29 ก.พ. คั่น)", () => {
    expect(dayCount("2024-02-28", "2024-03-01")).toBe(3);
  });
});

describe("weekSliceInMonth", () => {
  it("สัปดาห์ที่อยู่ในเดือนเต็มๆ ได้ 7 วัน", () => {
    expect(weekSliceInMonth("2026-07-17", "2026-07")).toEqual({
      from: "2026-07-13",
      to: "2026-07-19",
      days: 7,
    });
  });

  it("สัปดาห์แรกถูกตัดหัวที่วันที่ 1 ของเดือน", () => {
    expect(weekSliceInMonth("2026-07-01", "2026-07")).toEqual({
      from: "2026-07-01",
      to: "2026-07-05",
      days: 5,
    });
  });

  it("สัปดาห์สุดท้ายถูกตัดท้ายที่วันสิ้นเดือน", () => {
    expect(weekSliceInMonth("2026-07-31", "2026-07")).toEqual({
      from: "2026-07-27",
      to: "2026-07-31",
      days: 5,
    });
  });

  it("เดือนที่ขึ้นต้นด้วยวันอาทิตย์ เหลือ slice แรกแค่วันเดียว", () => {
    // ก.พ. 2026 วันที่ 1 เป็นวันอาทิตย์ = วันสุดท้ายของสัปดาห์ที่เริ่มตั้งแต่ ม.ค.
    expect(weekSliceInMonth("2026-02-01", "2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-01",
      days: 1,
    });
  });
});

describe("datesFrom", () => {
  it("ไล่วันแบบนับปลายทั้งสองข้าง", () => {
    expect(datesFrom("2026-07-17", "2026-07-19")).toEqual([
      "2026-07-17",
      "2026-07-18",
      "2026-07-19",
    ]);
  });

  it("วันเดียวได้ array ยาว 1", () => {
    expect(datesFrom("2026-07-17", "2026-07-17")).toEqual(["2026-07-17"]);
  });

  it("คืน array ว่างถ้า to อยู่ก่อน from (กันลูปไม่รู้จบ)", () => {
    expect(datesFrom("2026-07-19", "2026-07-17")).toEqual([]);
  });
});

function tx(date: string, type: "income" | "expense", amount: number): Tx {
  return {
    id: 1,
    date,
    spentAt: `${date}T03:00:00.000Z`,
    type,
    amount,
    category: "other",
    note: "",
  };
}

/** ก.ค. 2026 มี 31 วัน ตั้งต้น 6,200 = 200/วันพอดี ทำให้ assert อ่านง่าย */
function monthData(over: Partial<MonthData> = {}): MonthData {
  return {
    ym: "2026-07",
    openingBalance: 6200,
    closedAt: null,
    savingsAmount: null,
    budgetMode: "month",
    transactions: [],
    dailyBudgets: [],
    ...over,
  };
}

describe("computeBudget — โหมด month (กันพฤติกรรมเดิมเพี้ยน)", () => {
  it("วันแรกของเดือน = เงินตั้งต้นหารจำนวนวันทั้งเดือน", () => {
    const b = computeBudget(monthData(), "2026-07-01", "month");
    expect(b.amount).toBeCloseTo(200);
    expect(b.week).toBeNull();
  });

  it("หักที่ใช้ไปก่อนหน้า แล้วหารด้วยวันที่เหลือ", () => {
    const month = monthData({ transactions: [tx("2026-07-01", "expense", 200)] });
    // เหลือ 6000 หาร 30 วันที่เหลือ (2..31)
    expect(computeBudget(month, "2026-07-02", "month").amount).toBeCloseTo(200);
  });

  it("ตัวเลขพองเมื่อประหยัด — นี่คือปัญหาที่โหมด week มาแก้", () => {
    const spent = Array.from({ length: 21 }, (_, i) =>
      tx(`2026-07-${String(i + 1).padStart(2, "0")}`, "expense", 100),
    );
    // ใช้ไป 2,100 เหลือ 4,100 หาร 10 วัน (22..31) = 410/วัน ทั้งที่ควรได้ราว 200
    expect(
      computeBudget(monthData({ transactions: spent }), "2026-07-22", "month")
        .amount,
    ).toBeCloseTo(410);
  });
});

describe("computeBudget — โหมด week", () => {
  it("สัปดาห์เต็มได้ส่วนแบ่งตามสัดส่วนวัน แล้วหารเท่าๆ กัน", () => {
    const b = computeBudget(monthData(), "2026-07-13", "week");
    // share = 6200 × 7/31 = 1400 หาร 7 วัน = 200
    expect(b.amount).toBeCloseTo(200);
    expect(b.week?.from).toBe("2026-07-13");
    expect(b.week?.to).toBe("2026-07-19");
    expect(b.week?.daysLeft).toBe(7);
    // toBeCloseTo ไม่ใช่ toBe เพราะ 6200 × (7/31) ไม่ลงตัวใน floating point
    expect(b.week?.envelope).toBeCloseTo(1400);
  });

  it("สัปดาห์ที่ถูกตัดขอบเดือนยังได้ค่าเฉลี่ยต่อวันเท่าเดิม", () => {
    const b = computeBudget(monthData(), "2026-07-01", "week");
    // share = 6200 × 5/31 = 1000 หาร 5 วัน = 200
    expect(b.amount).toBeCloseTo(200);
    expect(b.week?.from).toBe("2026-07-01");
    expect(b.week?.to).toBe("2026-07-05");
    expect(b.week?.daysLeft).toBe(5);
    expect(b.week?.envelope).toBeCloseTo(1000);
  });

  it("ไม่ทบข้ามสัปดาห์ — ใช้เกินสัปดาห์ก่อน สัปดาห์ใหม่ได้งบเต็ม", () => {
    const month = monthData({ transactions: [tx("2026-07-06", "expense", 2000)] });
    // 07-06 อยู่สัปดาห์ 07-06..07-12 ส่วน 07-13 เป็นสัปดาห์ใหม่
    expect(computeBudget(month, "2026-07-13", "week").amount).toBeCloseTo(200);
  });

  it("ไม่พองข้ามสัปดาห์เหมือนโหมด month", () => {
    const spent = Array.from({ length: 21 }, (_, i) =>
      tx(`2026-07-${String(i + 1).padStart(2, "0")}`, "expense", 100),
    );
    const month = monthData({ transactions: spent });
    // สัปดาห์ 07-20..07-26 share 1400, ใช้ไป 07-20/07-21 อย่างละ 100 → 1200 หาร 5 วัน = 240
    // (เทียบกับโหมด month ที่ให้ 410 — นี่คือหัวใจของ feature)
    expect(computeBudget(month, "2026-07-22", "week").amount).toBeCloseTo(240);
  });

  it("รายรับกลางสัปดาห์เพิ่มงบให้สัปดาห์นั้น", () => {
    const month = monthData({ transactions: [tx("2026-07-13", "income", 700)] });
    // 07-14: share 1400 + รายรับ 700 = 2100 หาร 6 วันที่เหลือ = 350
    expect(computeBudget(month, "2026-07-14", "week").amount).toBeCloseTo(350);
  });

  it("envelope รวมรายรับทั้งสัปดาห์ แม้วันที่ดูอยู่จะมาก่อนวันที่เงินเข้า", () => {
    const month = monthData({ transactions: [tx("2026-07-17", "income", 700)] });
    const b = computeBudget(month, "2026-07-13", "week");
    expect(b.week?.envelope).toBeCloseTo(2100); // 1400 + 700
    expect(b.amount).toBeCloseTo(200); // แต่ค่าเฉลี่ยยังไม่นับรายรับของวันข้างหน้า
  });

  it("ใช้เกินงบสัปดาห์แล้วค่าเฉลี่ยติดลบ", () => {
    const month = monthData({ transactions: [tx("2026-07-13", "expense", 1500)] });
    // 07-14: 1400 − 1500 = −100 หาร 6 = −16.67
    expect(computeBudget(month, "2026-07-14", "week").amount).toBeCloseTo(
      -16.666,
      2,
    );
  });

  it("งบที่กรอกเองชนะค่าที่คำนวณให้ แต่ยังโชว์บริบทสัปดาห์อยู่", () => {
    const month = monthData({
      dailyBudgets: [{ id: 1, userId: "u", date: "2026-07-17", amount: 99 }],
    });
    const b = computeBudget(month, "2026-07-17", "week");
    expect(b.amount).toBe(99);
    expect(b.isManual).toBe(true);
    expect(b.week).not.toBeNull();
  });
});
