import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react-native";
import { formatBaht } from "../lib/shared";

interface Props {
  spent: number;
  income: number;
  budget: number | null;
}

export const StatusCard: React.FC<Props> = ({ spent, income, budget }) => {
  const remaining = budget !== null ? budget - spent : null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.statBox}>
          <View style={styles.labelRow}>
            <TrendingDown size={14} color="#f43f5e" />
            <Text style={styles.label}>ใช้ไปแล้ว</Text>
          </View>
          <Text style={styles.expenseAmount}>{formatBaht(spent)} ฿</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <View style={styles.labelRow}>
            <TrendingUp size={14} color="#10b981" />
            <Text style={styles.label}>รายรับ</Text>
          </View>
          <Text style={styles.incomeAmount}>{formatBaht(income)} ฿</Text>
        </View>
      </View>

      {remaining !== null && (
        <View style={styles.budgetRow}>
          <Wallet size={14} color="#94a3b8" />
          <Text style={styles.budgetText}>
            งบคงเหลือ: <Text style={{ color: remaining >= 0 ? "#10b981" : "#f43f5e", fontWeight: "700" }}>{formatBaht(remaining)} ฿</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: "#334155",
    marginHorizontal: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
  },
  expenseAmount: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  incomeAmount: {
    color: "#10b981",
    fontSize: 20,
    fontWeight: "700",
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  budgetText: {
    color: "#94a3b8",
    fontSize: 13,
  },
});
