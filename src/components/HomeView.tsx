"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Loader2,
  Calendar,
  Info,
} from "lucide-react";
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  formatBaht,
  formatMonthTH,
  shiftDate,
  todayKey,
  totals,
  type Category,
  type MonthData,
} from "@/lib/shared";

type Props = {
  month: MonthData | null;
};

type Range = "1W" | "1M" | "1Y" | "2Y" | "3Y" | "5Y";

type MonthlyAnalytics = {
  ym: string;
  income: number;
  expense: number;
};

type CategoryAnalytics = {
  category: Category;
  amount: number;
};

export default function HomeView({ month }: Props) {
  const [range, setRange] = useState<Range>("1M");
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<MonthlyAnalytics[]>([]);
  const [historicalCategories, setHistoricalCategories] = useState<CategoryAnalytics[]>([]);

  // Hover Tooltip State
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // โหลดข้อมูลย้อนหลังเมื่อเลือกช่วงเวลา 1Y, 2Y, 3Y, 5Y
  useEffect(() => {
    if (range === "1W" || range === "1M") {
      setLoading(false);
      return;
    }

    const years = range === "1Y" ? 1 : range === "2Y" ? 2 : range === "3Y" ? 3 : 5;
    let isCancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?years=${years}`);
        const data = await res.json();
        if (!isCancelled && data.success) {
          setHistoricalData(data.monthlyData || []);
          setHistoricalCategories(data.categoryData || []);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void loadAnalytics();
    return () => {
      isCancelled = true;
    };
  }, [range]);

  // --- ข้อมูล 1M / 1W (จากเดือนปัจจุบัน) ---
  const currentMonthTxs = month?.transactions ?? [];
  const currentTotals = useMemo(() => totals(currentMonthTxs), [currentMonthTxs]);

  // 1W: ย้อนหลัง 7 วันนับจากวันนี้
  const weeklyChartData = useMemo(() => {
    const today = todayKey();
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      dates.push(shiftDate(today, -i));
    }

    const dayMap = new Map<string, number>();
    for (const t of currentMonthTxs) {
      if (t.type === "expense") {
        dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.amount);
      }
    }

    return dates.map((d) => {
      const parts = d.split("-");
      return {
        label: `${parts[2]}/${parts[1]}`,
        fullLabel: `วันที่ ${parts[2]}/${parts[1]}/${parts[0]}`,
        amount: dayMap.get(d) || 0,
      };
    });
  }, [currentMonthTxs]);

  // 1M: รายวันทั้งเดือน
  const dailyChartData = useMemo(() => {
    if (!month?.ym) return [];
    const [y, m] = month.ym.split("-").map(Number);
    const totalDays = new Date(y, m, 0).getDate();

    const dayMap = new Map<number, number>();
    for (const t of currentMonthTxs) {
      if (t.type === "expense") {
        const day = Number(t.date.split("-")[2]);
        dayMap.set(day, (dayMap.get(day) || 0) + t.amount);
      }
    }

    const data: { label: string; fullLabel: string; amount: number }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      data.push({
        label: `${d}`,
        fullLabel: `วันที่ ${d} ${formatMonthTH(month.ym, true)}`,
        amount: dayMap.get(d) || 0,
      });
    }
    return data;
  }, [month?.ym, currentMonthTxs]);

  // --- รวมจุดข้อมูลตามช่วงเวลาที่เลือก ---
  const chartPoints = useMemo(() => {
    if (range === "1W") return weeklyChartData;
    if (range === "1M") return dailyChartData;
    return historicalData.map((d) => ({
      label: formatMonthTH(d.ym, true),
      fullLabel: `เดือน ${formatMonthTH(d.ym)}`,
      amount: d.expense,
    }));
  }, [range, weeklyChartData, dailyChartData, historicalData]);

  // คำนวณสรุปยอดเงิน
  const totalExpense = useMemo(() => {
    if (range === "1W") return weeklyChartData.reduce((acc, d) => acc + d.amount, 0);
    if (range === "1M") return currentTotals.expense;
    return historicalData.reduce((acc, d) => acc + d.expense, 0);
  }, [range, weeklyChartData, currentTotals.expense, historicalData]);

  const totalIncome = useMemo(() => {
    if (range === "1W" || range === "1M") return currentTotals.income;
    return historicalData.reduce((acc, d) => acc + d.income, 0);
  }, [range, currentTotals.income, historicalData]);

  // จุดสูงสุดของช่วงเวลาที่เลือก
  const maxPoint = useMemo(() => {
    if (chartPoints.length === 0) return { label: "-", fullLabel: "-", amount: 0 };
    return chartPoints.reduce(
      (max, cur) => (cur.amount > max.amount ? cur : max),
      { label: "-", fullLabel: "-", amount: 0 },
    );
  }, [chartPoints]);

  const maxChartVal = Math.max(...chartPoints.map((d) => d.amount), 100);

  // ค่าเฉลี่ย
  const avgExpense = useMemo(() => {
    if (chartPoints.length === 0) return 0;
    return totalExpense / chartPoints.length;
  }, [totalExpense, chartPoints]);

  // หมวดหมู่ค่าใช้จ่าย
  const categoryList = useMemo(() => {
    if (range === "1W" || range === "1M") {
      const map = new Map<Category, number>();
      for (const t of currentMonthTxs) {
        if (t.type === "expense") {
          map.set(t.category, (map.get(t.category) || 0) + t.amount);
        }
      }
      return Array.from(map.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    } else {
      return historicalCategories.map((item) => ({
        category: item.category,
        amount: item.amount,
        pct: totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0,
      }));
    }
  }, [range, currentMonthTxs, historicalCategories, totalExpense]);

  // Interactive Hover Handler
  function handleSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || chartPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = mouseX / rect.width;
    const index = Math.min(
      Math.max(Math.floor(pct * chartPoints.length), 0),
      chartPoints.length - 1,
    );
    setHoveredIndex(index);
  }

  const activeHoveredPoint =
    hoveredIndex !== null && chartPoints[hoveredIndex]
      ? chartPoints[hoveredIndex]
      : null;

  return (
    <div className="space-y-4 pop-in pb-8">
      {/* 1. Header Overview Banner */}
      <div className="card space-y-4 p-5 bg-gradient-to-br from-indigo-900/40 via-surface to-surface border-indigo-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                วิเคราะห์การใช้เงิน
              </h2>
              <p className="text-[11px] text-muted">
                {range === "1W"
                  ? "ย้อนหลัง 7 วันล่าสุด"
                  : range === "1M"
                    ? month?.ym
                      ? formatMonthTH(month.ym)
                      : "เดือนปัจจุบัน"
                    : `ภาพรวมย้อนหลัง ${range}`}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-400">
            <ShieldCheck size={13} /> สถานะปกติ
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ArrowUpRight size={13} />
              <span>รายรับช่วงนี้</span>
            </div>
            <p className="tnum mt-1 text-lg font-bold text-emerald-400">
              +{formatBaht(totalIncome)} ฿
            </p>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
            <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
              <ArrowDownRight size={13} />
              <span>รายจ่ายช่วงนี้</span>
            </div>
            <p className="tnum mt-1 text-lg font-bold text-rose-400">
              −{formatBaht(totalExpense)} ฿
            </p>
          </div>
        </div>
      </div>

      {/* 2. Spending Trend Chart with X-Axis, Y-Axis, and Hover Tooltip */}
      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-foreground">
              แนวโน้มการใช้เงิน (Spending Trend)
            </h3>
          </div>

          {/* Time Range Selector Filter */}
          <div role="group" className="flex items-center rounded-xl bg-surface-2 p-1 border border-border">
            {(["1W", "1M", "1Y", "2Y", "3Y", "5Y"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRange(r);
                  setHoveredIndex(null);
                }}
                className={clsx(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-200 active:scale-95",
                  range === r
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/50"
                    : "text-muted hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic SVG Chart with Axes & Hover Tooltip */}
        {loading ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted gap-2">
            <Loader2 className="animate-spin text-indigo-400" size={18} />
            <span>กำลังโหลดข้อมูลย้อนหลัง {range}...</span>
          </div>
        ) : chartPoints.length > 0 ? (
          <div className="space-y-3 pt-1">
            {/* Hover Floating Tooltip Card */}
            <div className="min-h-[44px] flex items-center justify-between rounded-xl bg-surface-2/80 px-3 py-2 border border-border/80">
              {activeHoveredPoint ? (
                <div className="flex items-center justify-between w-full text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Calendar size={14} className="text-indigo-400" />
                    <span>{activeHoveredPoint.fullLabel}</span>
                  </div>
                  <div className="tnum font-bold text-rose-400">
                    ใช้เงินไป: {formatBaht(activeHoveredPoint.amount)} ฿
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Info size={14} className="text-muted" />
                  <span>แตะหรือเลื่อนเมาส์บนกราฟเพื่อดูรายจ่ายรายวัน/รายเดือน</span>
                </div>
              )}
            </div>

            {/* Chart Area with Left Y-Axis & Bottom X-Axis */}
            <div className="flex gap-2">
              {/* Y-AXIS LABELS (แกน Y ด้านซ้าย) */}
              <div className="flex flex-col justify-between py-1 text-[10px] text-muted font-medium tnum text-right w-12 shrink-0">
                <span>{formatBaht(maxChartVal)}</span>
                <span>{formatBaht(maxChartVal / 2)}</span>
                <span>0</span>
              </div>

              {/* MAIN SVG CANVAS */}
              <div className="relative flex-1">
                <div className="relative h-44 w-full">
                  <svg
                    ref={svgRef}
                    onMouseMove={handleSvgMouseMove}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="h-full w-full overflow-visible cursor-crosshair select-none"
                    viewBox={`0 0 ${Math.max(chartPoints.length * 10, 10)} 100`}
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    <line x1="0" y1="10" x2={chartPoints.length * 10} y2="10" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" opacity="0.5" />
                    <line x1="0" y1="52.5" x2={chartPoints.length * 10} y2="52.5" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" opacity="0.5" />
                    <line x1="0" y1="95" x2={chartPoints.length * 10} y2="95" stroke="#334155" strokeWidth="0.5" opacity="0.5" />

                    {/* Area Gradient */}
                    <path
                      d={`
                        M 5 95
                        ${chartPoints
                          .map((d, i) => {
                            const x = i * 10 + 5;
                            const y = 95 - (d.amount / maxChartVal) * 85;
                            return `L ${x} ${y}`;
                          })
                          .join(" ")}
                        L ${(chartPoints.length - 1) * 10 + 5} 95 Z
                      `}
                      fill="url(#chartGlow)"
                    />

                    {/* Main Curve Line */}
                    <path
                      d={`
                        M 5 ${95 - (chartPoints[0]?.amount / maxChartVal) * 85}
                        ${chartPoints
                          .map((d, i) => {
                            const x = i * 10 + 5;
                            const y = 95 - (d.amount / maxChartVal) * 85;
                            return `L ${x} ${y}`;
                          })
                          .join(" ")}
                      `}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Peak Point Circle */}
                    {maxPoint.amount > 0 && (
                      <circle
                        cx={
                          (chartPoints.findIndex((p) => p.fullLabel === maxPoint.fullLabel) ?? 0) * 10 + 5
                        }
                        cy={95 - (maxPoint.amount / maxChartVal) * 85}
                        r="4"
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Hover Guide Line & Active Circle */}
                    {hoveredIndex !== null && chartPoints[hoveredIndex] && (
                      <g>
                        <line
                          x1={hoveredIndex * 10 + 5}
                          y1="10"
                          x2={hoveredIndex * 10 + 5}
                          y2="95"
                          stroke="#a5b4fc"
                          strokeDasharray="2 2"
                          strokeWidth="1"
                        />
                        <circle
                          cx={hoveredIndex * 10 + 5}
                          cy={
                            95 -
                            (chartPoints[hoveredIndex].amount / maxChartVal) *
                              85
                          }
                          r="5"
                          fill="#6366f1"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </g>
                    )}
                  </svg>
                </div>

                {/* X-AXIS LABELS (แกน X ด้านล่าง) */}
                <div className="flex justify-between pt-2 text-[10px] text-muted font-medium">
                  {range === "1W" ? (
                    chartPoints.map((p, i) => <span key={i}>{p.label}</span>)
                  ) : range === "1M" ? (
                    <>
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                      <span>{chartPoints.length}</span>
                    </>
                  ) : (
                    chartPoints
                      .filter((_, i) => i % Math.ceil(chartPoints.length / 6) === 0)
                      .map((p, i) => <span key={i}>{p.label}</span>)
                  )}
                </div>
              </div>
            </div>

            {/* Chart Footer Info */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted pt-2 border-t border-border/40 gap-2">
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="text-amber-400" />
                <span>จุดใช้เงินสูงสุด: </span>
                <span className="font-bold text-rose-400">
                  {maxPoint.fullLabel} ({formatBaht(maxPoint.amount)} ฿)
                </span>
              </div>
              <div>
                เฉลี่ย/{range === "1W" || range === "1M" ? "วัน" : "เดือน"}:{" "}
                <span className="font-semibold text-foreground">
                  {formatBaht(avgExpense)} ฿
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-muted py-8">
            ยังไม่มีข้อมูลประวัติในช่วงเวลาที่เลือก
          </p>
        )}
      </div>

      {/* 3. Category Breakdown (สัดส่วนการใช้เงินตามหมวดหมู่) */}
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <PieChart className="text-emerald-400" size={18} />
            <h3 className="text-sm font-bold text-foreground">
              สัดส่วนค่าใช้จ่ายตามหมวดหมู่ ({range})
            </h3>
          </div>
          <span className="text-[11px] text-muted font-medium">
            รวม {categoryList.length} หมวด
          </span>
        </div>

        {categoryList.length > 0 ? (
          <div className="space-y-3 pt-1">
            {categoryList.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-base">{CATEGORY_ICON[item.category]}</span>
                    <span className="text-foreground">
                      {CATEGORY_LABEL[item.category]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 tnum">
                    <span className="font-bold text-foreground">
                      {formatBaht(item.amount)} ฿
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-400 w-10 text-right">
                      {item.pct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${Math.min(item.pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-muted py-6">
            ยังไม่มีรายการรายจ่ายสำหรับประมวลผลหมวดหมู่
          </p>
        )}
      </div>
    </div>
  );
}
