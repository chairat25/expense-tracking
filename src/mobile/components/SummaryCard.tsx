import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { TrendingUp } from "lucide-react-native";
import { formatBaht, formatDayTH } from "../../lib/shared";
import { colors, radius, tints } from "../theme";

interface Props {
  isToday: boolean;
  selectedDate: string;
  loading: boolean;
  spent: number;
  income: number;
  dailyBudget: number;
}

export function SummaryCard({ isToday, selectedDate, loading, spent, income, dailyBudget }: Props) {
  const remaining = dailyBudget > 0 ? dailyBudget - spent : null;

  return (
    <View style={styles.card}>
      <View style={styles.glow} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          {isToday ? "ยอดใช้จ่ายวันนี้" : `ยอดใช้จ่าย (${formatDayTH(selectedDate)})`}
        </Text>
        {!loading && income > 0 && (
          <View style={styles.incomeBadge}>
            <TrendingUp size={12} color={colors.emerald400} />
            <Text style={styles.incomeText}>+฿{formatBaht(income)}</Text>
          </View>
        )}
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.currency}>฿</Text>
        {loading ? (
          <ActivityIndicator color={colors.emerald500} style={styles.loader} />
        ) : (
          <Text style={styles.amount}>{formatBaht(spent)}</Text>
        )}
      </View>

      <View style={styles.budgetRow}>
        {loading ? null : dailyBudget > 0 ? (
          <>
            <Text style={styles.budgetLabel}>
              งบรายวัน: <Text style={styles.budgetStrong}>฿{formatBaht(dailyBudget)}</Text>
            </Text>
            {remaining !== null && (
              <Text
                style={[styles.remaining, { color: remaining >= 0 ? colors.emerald400 : colors.rose400 }]}
              >
                {remaining >= 0
                  ? `เหลือ ฿${formatBaht(remaining)}`
                  : `เกินงบ ฿${formatBaht(Math.abs(remaining))}`}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.noBudget}>ยังไม่ได้ตั้งงบรายวัน</Text>
            <Text style={styles.noBudgetHint}>กำหนดได้ใน Dashboard</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate900,
    padding: 20,
  },
  glow: {
    position: "absolute",
    right: -24,
    top: -24,
    height: 112,
    width: 112,
    borderRadius: 56,
    backgroundColor: tints.emerald10,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.slate400, fontSize: 12, fontWeight: "500", letterSpacing: 0.6 },
  incomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tints.emerald20,
    backgroundColor: "rgba(2,44,34,0.4)",
  },
  incomeText: { color: colors.emerald400, fontSize: 11, fontWeight: "500" },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 8, minHeight: 40 },
  currency: { color: colors.rose400, fontSize: 14, fontWeight: "600" },
  amount: { color: colors.white, fontSize: 36, fontWeight: "800", letterSpacing: -0.5 },
  loader: { alignSelf: "center" },
  budgetRow: {
    marginTop: 14,
    paddingTop: 12,
    minHeight: 34,
    borderTopWidth: 1,
    borderTopColor: "rgba(30,41,59,0.8)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  budgetLabel: { color: colors.slate400, fontSize: 12 },
  budgetStrong: { color: colors.slate200, fontWeight: "700" },
  remaining: { fontSize: 12, fontWeight: "500" },
  noBudget: { color: colors.slate500, fontSize: 12 },
  noBudgetHint: { color: colors.slate500, fontSize: 11 },
});
