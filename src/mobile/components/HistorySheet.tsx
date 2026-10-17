import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { History } from "lucide-react-native";
import { formatBaht, formatDayTH, shiftDate } from "../../lib/shared";
import { useHistory } from "../hooks/useHistory";
import { colors, radius, tints } from "../theme";
import { BottomSheet } from "../ui/BottomSheet";
import { SheetHeader } from "../ui/SheetHeader";

interface Props {
  visible: boolean;
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

export function HistorySheet({ visible, today, selectedDate, onSelectDate, onClose }: Props) {
  const { history, loading } = useHistory(visible);
  const yesterday = shiftDate(today, -1);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader
        icon={<History size={20} color={colors.emerald400} />}
        title="ประวัติรายวันย้อนหลัง (14 วันล่าสุด)"
        onClose={onClose}
      />
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading ? (
          <ActivityIndicator color={colors.emerald500} style={styles.loader} />
        ) : history.length === 0 ? (
          <Text style={styles.empty}>ไม่พบประวัติรายการย้อนหลัง</Text>
        ) : (
          history.map((item) => {
            const isCurrent = item.date === selectedDate;
            const badge = item.date === today ? "วันนี้" : item.date === yesterday ? "เมื่อวาน" : null;
            return (
              <TouchableOpacity
                key={item.date}
                style={[styles.item, isCurrent && styles.itemCurrent]}
                onPress={() => {
                  onSelectDate(item.date);
                  onClose();
                }}
              >
                <View>
                  <View style={styles.dateRow}>
                    <Text style={styles.date}>{formatDayTH(item.date)}</Text>
                    {badge && (
                      <Text
                        style={[
                          styles.badge,
                          item.date === today ? styles.badgeToday : styles.badgeYesterday,
                        ]}
                      >
                        {badge}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.count}>
                    {item.count > 0 ? `${item.count} รายการ` : "ไม่มีรายการ"}
                  </Text>
                </View>
                <View style={styles.amounts}>
                  {item.expense > 0 && <Text style={styles.expense}>-฿{formatBaht(item.expense)}</Text>}
                  {item.income > 0 && <Text style={styles.income}>+฿{formatBaht(item.income)}</Text>}
                  {item.expense === 0 && item.income === 0 && <Text style={styles.dash}>-</Text>}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 14 },
  listContent: { gap: 8, paddingBottom: 16 },
  loader: { paddingVertical: 40 },
  empty: { color: colors.slate500, fontSize: 12, textAlign: "center", paddingVertical: 32 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(30,41,59,0.8)",
    backgroundColor: colors.slate950,
  },
  itemCurrent: { borderColor: tints.emerald60, backgroundColor: "rgba(2,44,34,0.3)" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  date: { color: colors.white, fontSize: 12, fontWeight: "700" },
  badge: { fontSize: 9, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  badgeToday: { backgroundColor: tints.emerald20, color: colors.emerald400 },
  badgeYesterday: { backgroundColor: tints.amber20, color: colors.amber400 },
  count: { color: colors.slate500, fontSize: 11, marginTop: 2 },
  amounts: { alignItems: "flex-end" },
  expense: { color: colors.rose400, fontSize: 12, fontWeight: "700" },
  income: { color: colors.emerald400, fontSize: 11, fontWeight: "600" },
  dash: { color: colors.slate600, fontSize: 12 },
});
