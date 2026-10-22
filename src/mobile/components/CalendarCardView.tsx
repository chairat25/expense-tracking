import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  formatBaht,
  formatDayTH,
  formatTimeTH,
  todayKey,
  type Category,
  type Tx,
} from "../../lib/shared";
import { useMonthlyCalendar } from "../hooks/useMonthlyCalendar";
import { colors, MAX_CONTENT_WIDTH, radius, tints } from "../theme";
import type { CategoryOption } from "../types";

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onGoToMain: (date: string) => void;
  dailyBudget?: number;
  transactions?: Tx[];
  loadingTransactions?: boolean;
  categories?: CategoryOption[];
  onEditTransaction?: (tx: Tx) => void;
  onDeleteTransaction?: (tx: Tx) => void;
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatMonthTH(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const yearBE = parseInt(yStr, 10) + 543;
  const monthIdx = parseInt(mStr, 10) - 1;
  return `${THAI_MONTHS[monthIdx]} ${yearBE}`;
}

function formatCompactAmount(amount: number): string {
  if (amount >= 100000) {
    return `${Math.round(amount / 1000)}k`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return formatBaht(amount);
}

export function CalendarCardView({
  selectedDate,
  onSelectDate,
  onGoToMain,
  dailyBudget = 0,
  transactions = [],
  loadingTransactions = false,
  categories = [],
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  const today = todayKey();
  const selectedMonth = selectedDate.slice(0, 7);
  const { currentMonth, shiftMonth, dailyData, loading, totalExpense, totalIncome } =
    useMonthlyCalendar(selectedMonth);

  // คำนวณวันทั้งหมดในตารางเดือน
  const gridCells = useMemo(() => {
    const [yStr, mStr] = currentMonth.split("-");
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);

    const totalDays = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    const cells: Array<{ dateKey: string; dayNum: number; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dateKey: `prev-${i}`, dayNum: 0, isCurrentMonth: false });
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateKey = `${currentMonth}-${String(day).padStart(2, "0")}`;
      cells.push({ dateKey, dayNum: day, isCurrentMonth: true });
    }

    return cells;
  }, [currentMonth]);

  const selectedItem = dailyData[selectedDate];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Month Navigation & Stats Header */}
        <View style={styles.headerCard}>
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => shiftMonth(-1)}
              activeOpacity={0.7}
              accessibilityLabel="เดือนก่อนหน้า"
            >
              <ChevronLeft size={20} color={colors.slate300} />
            </TouchableOpacity>

            <View style={styles.monthTitleBox}>
              <CalendarDays size={16} color={colors.emerald400} />
              <Text style={styles.monthTitle}>{formatMonthTH(currentMonth)}</Text>
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => shiftMonth(1)}
              activeOpacity={0.7}
              accessibilityLabel="เดือนถัดไป"
            >
              <ChevronRight size={20} color={colors.slate300} />
            </TouchableOpacity>
          </View>

          {/* Monthly Financial Health Bar */}
          <View style={styles.monthlyStatsBar}>
            <View style={styles.statBox}>
              <View style={styles.statLabelRow}>
                <TrendingDown size={13} color={colors.rose400} />
                <Text style={styles.statLabel}>รายจ่ายรวม</Text>
              </View>
              <Text style={styles.statExpense}>฿{formatBaht(totalExpense)}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={styles.statLabelRow}>
                <TrendingUp size={13} color={colors.emerald400} />
                <Text style={styles.statLabel}>รายรับรวม</Text>
              </View>
              <Text style={styles.statIncome}>฿{formatBaht(totalIncome)}</Text>
            </View>
          </View>
        </View>

        {/* Calendar Card Grid */}
        <View style={styles.calendarCard}>
          {/* Weekday Labels */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w, idx) => (
              <View key={w} style={styles.weekdayCell}>
                <Text
                  style={[
                    styles.weekdayText,
                    idx === 0 && styles.weekdaySunday,
                    idx === 6 && styles.weekdaySaturday,
                  ]}
                >
                  {w}
                </Text>
              </View>
            ))}
          </View>

          {/* Day Cells Grid */}
          {loading && Object.keys(dailyData).length === 0 ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator color={colors.emerald500} size="small" />
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {gridCells.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return <View key={`empty-${idx}`} style={styles.emptyDayCell} />;
                }

                const item = dailyData[cell.dateKey];
                const isSelected = cell.dateKey === selectedDate;
                const isToday = cell.dateKey === today;
                const expense = item?.expense || 0;
                const income = item?.income || 0;
                const isOverBudget = dailyBudget > 0 && expense > dailyBudget;

                return (
                  <TouchableOpacity
                    key={cell.dateKey}
                    style={[
                      styles.dayCard,
                      isSelected && styles.dayCardSelected,
                      isToday && styles.dayCardToday,
                    ]}
                    onPress={() => onSelectDate(cell.dateKey)}
                    activeOpacity={0.75}
                  >
                    {/* Top Row: Day Number & Today indicator */}
                    <View style={styles.dayTopRow}>
                      <Text
                        style={[
                          styles.dayNumber,
                          isToday && styles.dayNumberToday,
                          isSelected && styles.dayNumberSelected,
                        ]}
                      >
                        {cell.dayNum}
                      </Text>
                      {isToday && <View style={styles.todayDot} />}
                    </View>

                    {/* Bottom Area: Daily Total Amount */}
                    <View style={styles.dayAmountArea}>
                      {expense > 0 ? (
                        <Text
                          style={[
                            styles.dayExpenseText,
                            isOverBudget && styles.dayExpenseOverBudget,
                          ]}
                          numberOfLines={1}
                        >
                          -฿{formatCompactAmount(expense)}
                        </Text>
                      ) : income > 0 ? (
                        <Text style={styles.dayIncomeText} numberOfLines={1}>
                          +฿{formatCompactAmount(income)}
                        </Text>
                      ) : (
                        <Text style={styles.dayEmptyDash}>-</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Selected Day Transaction Breakdown Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.txHeaderRow}>
            <View style={styles.txHeaderLeft}>
              <Text style={styles.txSectionTitle}>
                รายการวันที่ {formatDayTH(selectedDate)}
              </Text>
              <Text style={styles.txSectionSubtitle}>
                {selectedItem && selectedItem.count > 0
                  ? `${selectedItem.count} รายการ · รวมจ่าย ฿${formatBaht(selectedItem.expense)}`
                  : "ยังไม่มีรายการ"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addDayBtn}
              onPress={() => onGoToMain(selectedDate)}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#ffffff" strokeWidth={2.4} />
              <Text style={styles.addDayBtnText}>บันทึกเพิ่ม</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Items List for the Selected Day */}
          {loadingTransactions ? (
            <View style={styles.txStateBox}>
              <ActivityIndicator color={colors.emerald500} size="small" />
              <Text style={styles.txStateText}>กำลังโหลดรายการของวันนี้...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={[styles.txStateBox, styles.txEmptyBox]}>
              <View style={styles.emptyIconCircle}>
                <Inbox size={22} color={colors.slate400} />
              </View>
              <Text style={styles.emptyTitle}>ไม่มีรายการบันทึกในวันนี้</Text>
              <Text style={styles.txStateText}>แตะปุ่ม "บันทึกเพิ่ม" เพื่อลงรายการของวันดังกล่าว</Text>
            </View>
          ) : (
            <View style={styles.txListCard}>
              {transactions.map((tx, index) => {
                const isExpense = tx.type === "expense";
                const cat = categories.find((c) => c.slug === tx.category);
                const catName = cat?.name || CATEGORY_LABEL[tx.category as Category] || tx.category;

                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={[styles.txRow, index > 0 && styles.txRowDivider]}
                    onPress={() => onEditTransaction?.(tx)}
                    activeOpacity={0.65}
                  >
                    <View style={styles.txLeft}>
                      <View style={styles.catIndicator}>
                        <View
                          style={[
                            styles.catDot,
                            { backgroundColor: isExpense ? colors.rose400 : colors.emerald400 },
                          ]}
                        />
                      </View>
                      <View style={styles.txTexts}>
                        <Text style={styles.txNote} numberOfLines={1}>
                          {tx.note || catName}
                        </Text>
                        <Text style={styles.txMeta} numberOfLines={1}>
                          {formatTimeTH(tx.spentAt)} · {catName}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: isExpense ? colors.rose400 : colors.emerald400 },
                        ]}
                      >
                        {isExpense ? "-" : "+"}฿{formatBaht(tx.amount)}
                      </Text>

                      {onDeleteTransaction && (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => onDeleteTransaction(tx)}
                          hitSlop={6}
                        >
                          <Trash2 size={14} color={colors.slate500} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate950,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110, // เว้นพื้นที่สำหรับ BottomNavBar
  },
  content: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    gap: 12,
  },
  headerCard: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    gap: 12,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  monthTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
  monthlyStatsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 23, 0.6)",
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  statBox: {
    flex: 1,
    gap: 2,
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.slate400,
    fontWeight: "500",
  },
  statExpense: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.rose400,
    fontVariant: ["tabular-nums"],
  },
  statIncome: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.emerald400,
    fontVariant: ["tabular-nums"],
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginHorizontal: 12,
  },
  calendarCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 10,
  },
  weekdayRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 8,
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.slate400,
  },
  weekdaySunday: {
    color: colors.rose400,
  },
  weekdaySaturday: {
    color: colors.indigo400,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: 58,
  },
  dayCard: {
    width: `${100 / 7}%`,
    height: 58,
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    backgroundColor: "rgba(2, 6, 23, 0.4)",
    justifyContent: "space-between",
  },
  dayCardSelected: {
    borderColor: colors.emerald400,
    backgroundColor: "rgba(2, 44, 34, 0.4)",
  },
  dayCardToday: {
    borderColor: tints.emerald40,
  },
  dayTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.slate300,
  },
  dayNumberToday: {
    color: colors.emerald400,
    fontWeight: "800",
  },
  dayNumberSelected: {
    color: colors.white,
    fontWeight: "800",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.emerald400,
  },
  dayAmountArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayExpenseText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.slate200,
    fontVariant: ["tabular-nums"],
  },
  dayExpenseOverBudget: {
    color: colors.rose400,
  },
  dayIncomeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.emerald400,
    fontVariant: ["tabular-nums"],
  },
  dayEmptyDash: {
    fontSize: 9,
    color: colors.slate600,
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Selected Day Breakdown */
  transactionsSection: {
    gap: 10,
    marginTop: 4,
  },
  txHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  txHeaderLeft: {
    gap: 2,
  },
  txSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  txSectionSubtitle: {
    fontSize: 11,
    color: colors.slate400,
  },
  addDayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.emerald600,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  addDayBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  txStateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 28,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  txStateText: {
    fontSize: 11,
    color: colors.slate500,
  },
  txEmptyBox: {
    borderStyle: "dashed",
    backgroundColor: "rgba(15, 23, 42, 0.2)",
    paddingVertical: 24,
  },
  emptyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate900,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.slate300,
  },
  txListCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    overflow: "hidden",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  txRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  catIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(2, 6, 23, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  txTexts: {
    flex: 1,
    minWidth: 0,
  },
  txNote: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.slate200,
  },
  txMeta: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 1,
  },
  txRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  deleteBtn: {
    padding: 4,
  },
});
