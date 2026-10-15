import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar } from "lucide-react-native";
import { shiftDate, todayKey } from "../lib/shared";

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DateCapsuleBar: React.FC<Props> = ({ selectedDate, onSelectDate }) => {
  const today = todayKey();
  const yesterday = shiftDate(today, -1);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pill, selectedDate === yesterday && styles.activePill]}
        onPress={() => onSelectDate(yesterday)}
      >
        <Text style={[styles.pillText, selectedDate === yesterday && styles.activePillText]}>เมื่อวาน</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pill, selectedDate === today && styles.activePill]}
        onPress={() => onSelectDate(today)}
      >
        <Text style={[styles.pillText, selectedDate === today && styles.activePillText]}>วันนี้</Text>
      </TouchableOpacity>

      <View style={styles.dateDisplay}>
        <Calendar size={16} color="#94a3b8" />
        <Text style={styles.dateText}>{selectedDate}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e293b",
  },
  activePill: {
    backgroundColor: "#10b981",
  },
  pillText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
  activePillText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dateText: {
    color: "#cbd5e1",
    fontSize: 13,
  },
});
