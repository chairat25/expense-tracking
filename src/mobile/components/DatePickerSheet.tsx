import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react-native";
import {
  daysInMonth,
  formatMonthTH,
  shiftDate,
  shiftMonth,
  thisMonthKey,
  todayKey,
} from "../../lib/shared";
import { colors, radius, tints } from "../theme";
import { BottomSheet } from "../ui/BottomSheet";
import { SheetHeader } from "../ui/SheetHeader";

interface Props {
  visible: boolean;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

const WEEK_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const WEEKEND_COLORS: Record<number, string> = { 0: colors.rose400, 6: colors.indigo400 };

function buildCalendar(viewYm: string): (string | null)[] {
  const [y, m] = viewYm.split("-").map(Number);
  const leading = new Array<null>(new Date(y, m - 1, 1).getDay()).fill(null);
  const days = Array.from(
    { length: daysInMonth(viewYm) },
    (_, i) => `${viewYm}-${String(i + 1).padStart(2, "0")}`,
  );
  return [...leading, ...days];
}

export function DatePickerSheet({ visible, selectedDate, onSelectDate, onClose }: Props) {
  const today = todayKey();
  const [viewYm, setViewYm] = useState(() => selectedDate.slice(0, 7));
  const cells = useMemo(() => buildCalendar(viewYm), [viewYm]);
  const canGoNextMonth = viewYm < thisMonthKey();

  const presets = [
    { label: "☀️ วันนี้", date: today },
    { label: "⏪ เมื่อวาน", date: shiftDate(today, -1) },
    { label: "2 วันก่อน", date: shiftDate(today, -2) },
    { label: "3 วันก่อน", date: shiftDate(today, -3) },
  ];

  function pick(date: string) {
    onSelectDate(date);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader
        icon={
          <View style={styles.headerIcon}>
            <Calendar size={16} color={colors.emerald400} />
          </View>
        }
        title="เลือกวันที่"
        subtitle="ระบุวันที่ต้องการบันทึกหรือดูย้อนหลัง"
        onClose={onClose}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.presetRow}>
          {presets.map((preset) => {
            const selected = selectedDate === preset.date;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.preset, selected && styles.presetSelected]}
                onPress={() => pick(preset.date)}
              >
                <Text style={[styles.presetText, selected && styles.presetTextSelected]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.monthSwitch}>
          <TouchableOpacity style={styles.monthBtn} onPress={() => setViewYm(shiftMonth(viewYm, -1))}>
            <ChevronLeft size={16} color={colors.slate400} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthTH(viewYm)}</Text>
          <TouchableOpacity
            style={[styles.monthBtn, !canGoNextMonth && styles.disabled]}
            disabled={!canGoNextMonth}
            onPress={() => setViewYm(shiftMonth(viewYm, 1))}
          >
            <ChevronRight size={16} color={colors.slate400} />
          </TouchableOpacity>
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {WEEK_DAYS_SHORT.map((wd, i) => (
              <Text key={wd} style={[styles.weekday, { color: WEEKEND_COLORS[i] ?? colors.slate400 }]}>
                {wd}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((dateKey, index) => {
              if (!dateKey) return <View key={`empty-${index}`} style={styles.cell} />;
              const isSelected = selectedDate === dateKey;
              const isToday = today === dateKey;
              const isFuture = dateKey > today;
              return (
                <View key={dateKey} style={styles.cell}>
                  <TouchableOpacity
                    disabled={isFuture}
                    onPress={() => pick(dateKey)}
                    style={[
                      styles.day,
                      isSelected && styles.daySelected,
                      !isSelected && isToday && styles.dayToday,
                      isFuture && styles.dayFuture,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && { color: colors.white },
                        !isSelected && isToday && { color: colors.emerald400 },
                      ]}
                    >
                      {Number(dateKey.slice(8, 10))}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.todayBtn} onPress={() => pick(today)}>
            <RotateCcw size={13} color={colors.emerald400} />
            <Text style={styles.todayText}>กลับสู่วันนี้</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>เรียบร้อย</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const CELL_WIDTH = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  headerIcon: {
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: tints.emerald40,
    backgroundColor: tints.emerald10,
  },
  body: { paddingTop: 14, paddingBottom: 16, gap: 12 },
  presetRow: { flexDirection: "row", gap: 6 },
  preset: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  presetSelected: { backgroundColor: colors.emerald600, borderColor: colors.emerald600 },
  presetText: { color: colors.slate300, fontSize: 11, fontWeight: "600" },
  presetTextSelected: { color: colors.white },
  monthSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(30,41,59,0.8)",
    backgroundColor: colors.slate950,
  },
  monthBtn: { height: 28, width: 28, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.2 },
  monthText: { color: colors.slate200, fontSize: 12, fontWeight: "700" },
  calendar: {
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(30,41,59,0.8)",
    backgroundColor: "rgba(2,6,23,0.8)",
  },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekday: { width: CELL_WIDTH, textAlign: "center", fontSize: 10, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: CELL_WIDTH, alignItems: "center", paddingVertical: 3 },
  day: { height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  daySelected: { backgroundColor: colors.emerald500 },
  dayToday: { borderWidth: 2, borderColor: "rgba(16,185,129,0.8)", backgroundColor: tints.emerald10 },
  dayFuture: { opacity: 0.3 },
  dayText: { color: colors.slate300, fontSize: 12, fontWeight: "700" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  todayText: { color: colors.slate300, fontSize: 12, fontWeight: "600" },
  doneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: colors.emerald600,
  },
  doneText: { color: colors.white, fontSize: 12, fontWeight: "700" },
});
