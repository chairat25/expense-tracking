import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sparkles, Trash2 } from "lucide-react-native";
import { CATEGORY_LABEL, formatBaht, formatDayTH, formatTimeTH, type Category, type Tx } from "../../lib/shared";
import { colors, radius, tints, useTheme } from "../theme";
import type { CategoryOption } from "../types";

interface Props {
  selectedDate: string;
  loading: boolean;
  transactions: Tx[];
  categories: CategoryOption[];
  onEdit: (tx: Tx) => void;
  onDelete: (tx: Tx) => void;
}

export function TransactionList({ selectedDate, loading, transactions, categories, onEdit, onDelete }: Props) {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>
          รายการวันที่ {formatDayTH(selectedDate)} ({transactions.length})
        </Text>
        {transactions.length > 0 && <Text style={[styles.hint, { color: theme.textMuted }]}>แตะรายการเพื่อแก้ไข</Text>}
      </View>

      {loading ? (
        <View style={[styles.stateBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ActivityIndicator color={colors.emerald500} />
          <Text style={[styles.stateText, { color: theme.textMuted }]}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={[styles.stateBox, styles.empty, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.surface }]}>
            <Sparkles size={20} color={colors.emerald400} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>ยังไม่มีรายการในวันที่ {formatDayTH(selectedDate)}</Text>
          <Text style={[styles.stateText, { color: theme.textMuted }]}>ระบุจำนวนเงินด้านบนแล้วกดบันทึกได้เลย</Text>
        </View>
      ) : (
        <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {transactions.map((tx, index) => {
            const isExpense = tx.type === "expense";
            const cat = categories.find((c) => c.slug === tx.category);
            const catName = cat?.name || CATEGORY_LABEL[tx.category as Category] || tx.category;
            const initial = (catName || "T").trim().slice(0, 1).toUpperCase();
            return (
              <TouchableOpacity
                key={tx.id}
                style={[styles.row, index > 0 && [styles.rowDivider, { borderTopColor: theme.borderSubtle }]]}
                onPress={() => onEdit(tx)}
                activeOpacity={0.6}
              >
                <View style={styles.left}>
                  <View style={[styles.iconBox, { backgroundColor: theme.surfaceSubtle }]}>
                    <Text style={[styles.iconInitial, { color: theme.text }]}>{initial}</Text>
                    <View
                      style={[
                        styles.dotIndicator,
                        { backgroundColor: isExpense ? colors.rose400 : colors.emerald400 },
                      ]}
                    />
                  </View>
                  <View style={styles.texts}>
                    <Text style={[styles.note, { color: theme.text }]} numberOfLines={1}>
                      {tx.note || catName}
                    </Text>
                    <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={1}>
                      {formatTimeTH(tx.spentAt)}
                      {tx.note ? `  •  ${catName}` : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.right}>
                  <Text style={[styles.amount, { color: isExpense ? colors.rose400 : colors.emerald400 }]}>
                    {isExpense ? "-" : "+"}฿{formatBaht(tx.amount)}
                  </Text>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(tx)} hitSlop={6}>
                    <Trash2 size={15} color={colors.slate500} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  title: { color: colors.slate400, fontSize: 12, fontWeight: "600", letterSpacing: 0.4, flexShrink: 1 },
  hint: { color: colors.slate500, fontSize: 11 },
  stateBox: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 40,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: "rgba(15,23,42,0.4)",
  },
  stateText: { color: colors.slate500, fontSize: 12 },
  empty: { borderStyle: "dashed", backgroundColor: "rgba(15,23,42,0.2)", paddingVertical: 36 },
  emptyIcon: {
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate900,
  },
  emptyTitle: { color: colors.slate300, fontSize: 14, fontWeight: "500" },
  list: {
    overflow: "hidden",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: tints.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: "rgba(30,41,59,0.8)" },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  iconBox: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
    position: "relative",
  },
  iconInitial: { fontSize: 14, fontWeight: "700", color: colors.slate300 },
  dotIndicator: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  texts: { flex: 1, minWidth: 0 },
  note: { color: colors.slate200, fontSize: 14, fontWeight: "500" },
  meta: { color: colors.slate400, fontSize: 11, marginTop: 2 },
  right: { flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 12 },
  amount: { fontSize: 14, fontWeight: "700" },
  deleteBtn: { height: 32, width: 32, alignItems: "center", justifyContent: "center" },
});
