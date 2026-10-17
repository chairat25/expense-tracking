import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight, History, RotateCcw, User } from "lucide-react-native";
import { formatDayTH, shiftDate } from "../../lib/shared";
import { colors, MAX_CONTENT_WIDTH, radius, tints } from "../theme";

interface Props {
  selectedDate: string;
  today: string;
  avatarUrl?: string;
  onSelectDate: (date: string) => void;
  onOpenDatePicker: () => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
}

export function HomeHeader({
  selectedDate,
  today,
  avatarUrl,
  onSelectDate,
  onOpenDatePicker,
  onOpenHistory,
  onOpenProfile,
}: Props) {
  const isToday = selectedDate === today;
  const isYesterday = selectedDate === shiftDate(today, -1);
  const canGoNext = selectedDate < today;
  const dotColor = isToday ? colors.emerald400 : isYesterday ? colors.amber400 : colors.indigo400;
  const label = isToday ? "วันนี้" : isYesterday ? "เมื่อวาน" : "ย้อนหลัง";

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>EXPENSE TRACKING</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.historyBtn} onPress={onOpenHistory} activeOpacity={0.7}>
            <History size={15} color={colors.emerald400} />
            <Text style={styles.historyText}>ประวัติ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={onOpenProfile} activeOpacity={0.7}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <User size={18} color={colors.slate300} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() => onSelectDate(shiftDate(selectedDate, -1))}
        >
          <ChevronLeft size={18} color={colors.slate400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.capsule} onPress={onOpenDatePicker} activeOpacity={0.8}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.capsuleLabel}>{label}:</Text>
          <Text style={styles.capsuleDate}>{formatDayTH(selectedDate)}</Text>
          <CalendarDays size={14} color={colors.emerald400} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.arrowBtn, !canGoNext && styles.disabled]}
          disabled={!canGoNext}
          onPress={() => onSelectDate(shiftDate(selectedDate, 1))}
        >
          <ChevronRight size={18} color={colors.slate400} />
        </TouchableOpacity>

        {!isToday && (
          <TouchableOpacity style={styles.todayBtn} onPress={() => onSelectDate(today)}>
            <RotateCcw size={12} color={colors.emerald400} />
            <Text style={styles.todayText}>วันนี้</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(30,41,59,0.8)",
    backgroundColor: "rgba(2,6,23,0.95)",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    alignItems: "stretch",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: colors.emerald500 },
  brandText: { color: colors.emerald400, fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyBtn: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate900,
  },
  historyText: { color: colors.slate300, fontSize: 12, fontWeight: "600" },
  avatarBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate900,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { height: 36, width: 36 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  arrowBtn: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate900,
  },
  disabled: { opacity: 0.2 },
  capsule: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  dot: { height: 8, width: 8, borderRadius: 4 },
  capsuleLabel: { color: colors.white, fontSize: 12, fontWeight: "700" },
  capsuleDate: { color: colors.slate300, fontSize: 12, fontWeight: "600" },
  todayBtn: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: tints.emerald40,
    backgroundColor: "rgba(2,44,34,0.8)",
  },
  todayText: { color: colors.emerald400, fontSize: 12, fontWeight: "700" },
});
