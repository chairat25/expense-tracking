import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarSearch, ListPlus, Plus, ScanLine, TrendingDown, TrendingUp } from "lucide-react-native";
import { formatDayTH } from "../../lib/shared";
import { DEFAULT_NOTE_SUGGESTIONS } from "../../lib/receipt/patterns";
import type { NewTransaction } from "../hooks/useDayData";
import { colors, radius, tints } from "../theme";
import type { CategoryOption } from "../types";

interface Props {
  selectedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  categories: CategoryOption[];
  onSubmit: (input: NewTransaction) => Promise<void>;
  onOpenDatePicker: () => void;
  onOpenBatchAdd: () => void;
  onScanSlip?: () => void;
}

const SUGGESTION_COUNT = 6;

export function QuickAddCard({
  selectedDate,
  isToday,
  isYesterday,
  categories,
  onSubmit,
  onOpenDatePicker,
  onOpenBatchAdd,
  onScanSlip,
}: Props) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      setError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ type, amount: value, category, note });
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  }

  const targetLabel = isToday ? "วันนี้" : isYesterday ? "เมื่อวาน" : formatDayTH(selectedDate);

  return (
    <View style={styles.card}>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          บันทึกลง:{" "}
          <Text style={{ color: isToday ? colors.emerald400 : colors.amber400, fontWeight: "700" }}>
            {targetLabel}
          </Text>
        </Text>
        <View style={styles.metaActions}>
          {onScanSlip && (
            <TouchableOpacity style={[styles.smallBtn, styles.scanBtn]} onPress={onScanSlip} activeOpacity={0.75}>
              <ScanLine size={13} color={colors.emerald400} />
              <Text style={[styles.smallBtnText, { color: colors.emerald300 }]}>สแกนสลิป</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.smallBtn, styles.batchBtn]} onPress={onOpenBatchAdd} activeOpacity={0.75}>
            <ListPlus size={13} color={colors.indigo400} />
            <Text style={[styles.smallBtnText, { color: colors.indigo300 }]}>หลายรายการ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={onOpenDatePicker} activeOpacity={0.75}>
            <CalendarSearch size={13} color={colors.slate400} />
            <Text style={styles.smallBtnText}>เปลี่ยนวัน</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.typeSwitch}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "expense" && styles.typeExpenseActive]}
          onPress={() => setType("expense")}
        >
          <TrendingDown size={14} color={type === "expense" ? colors.white : colors.slate400} />
          <Text style={[styles.typeText, type === "expense" && styles.typeTextActive]}>รายจ่าย</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "income" && styles.typeIncomeActive]}
          onPress={() => setType("income")}
        >
          <TrendingUp size={14} color={type === "income" ? colors.white : colors.slate400} />
          <Text style={[styles.typeText, type === "income" && styles.typeTextActive]}>รายรับ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountWrap}>
        <Text style={styles.amountCurrency}>฿</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.slate600}
          keyboardType="decimal-pad"
        />
      </View>

      <View>
        <Text style={styles.sectionLabel}>หมวดหมู่</Text>
        <View style={styles.chipWrap}>
          {categories.map((cat) => {
            const selected = category === cat.slug;
            return (
              <TouchableOpacity
                key={cat.slug}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setCategory(cat.slug)}
              >
                <Text style={styles.chipIcon}>{cat.icon || "📦"}</Text>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.noteBlock}>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="หมายเหตุ (เช่น ข้าวกะเพรา, ค่าน้ำมัน)"
          placeholderTextColor={colors.slate600}
        />
        <View style={styles.suggestRow}>
          <Text style={styles.suggestLabel}>ตัวอย่าง:</Text>
          {DEFAULT_NOTE_SUGGESTIONS.slice(0, SUGGESTION_COUNT).map((sug) => (
            <TouchableOpacity
              key={sug}
              style={[styles.suggestChip, note === sug && styles.suggestChipActive]}
              onPress={() => setNote(sug)}
            >
              <Text style={[styles.suggestText, note === sug && styles.suggestTextActive]}>{sug}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submit, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.submitText}>กำลังบันทึก...</Text>
          </>
        ) : (
          <>
            <Plus size={18} color={colors.white} />
            <Text style={styles.submitText}>บันทึกรายการ ({formatDayTH(selectedDate)})</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(30,41,59,0.8)",
    backgroundColor: tints.card,
    padding: 16,
    gap: 14,
  },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  metaText: { color: colors.slate400, fontSize: 12 },
  metaActions: { flexDirection: "row", gap: 6 },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  scanBtn: { borderColor: tints.emerald40, backgroundColor: "rgba(2,44,34,0.7)" },
  batchBtn: { borderColor: "rgba(99,102,241,0.4)", backgroundColor: "rgba(49,46,129,0.4)" },
  smallBtnText: { color: colors.slate400, fontSize: 11, fontWeight: "600" },
  error: {
    color: colors.rose300,
    fontSize: 12,
    borderWidth: 1,
    borderColor: tints.rose30,
    backgroundColor: tints.roseBg,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeSwitch: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: "rgba(2,6,23,0.8)",
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  typeExpenseActive: { backgroundColor: colors.rose500 },
  typeIncomeActive: { backgroundColor: colors.emerald600 },
  typeText: { color: colors.slate400, fontSize: 12, fontWeight: "600" },
  typeTextActive: { color: colors.white },
  amountWrap: { justifyContent: "center" },
  amountCurrency: {
    position: "absolute",
    left: 14,
    zIndex: 1,
    color: colors.slate400,
    fontSize: 18,
    fontWeight: "700",
  },
  amountInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
    paddingVertical: 12,
    paddingLeft: 36,
    paddingRight: 16,
    color: colors.white,
    fontSize: 24,
    fontWeight: "700",
  },
  sectionLabel: {
    color: colors.slate400,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  chipSelected: { borderColor: tints.emerald60, backgroundColor: tints.emerald20 },
  chipIcon: { fontSize: 13 },
  chipText: { color: colors.slate400, fontSize: 12, fontWeight: "500" },
  chipTextSelected: { color: colors.emerald300 },
  noteBlock: { gap: 6 },
  noteInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.slate200,
    fontSize: 13,
  },
  suggestRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  suggestLabel: { color: colors.slate500, fontSize: 10, fontWeight: "500" },
  suggestChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  suggestChipActive: { borderColor: "rgba(16,185,129,0.8)", backgroundColor: "rgba(2,44,34,0.6)" },
  suggestText: { color: colors.slate400, fontSize: 11 },
  suggestTextActive: { color: colors.emerald300, fontWeight: "600" },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.emerald600,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
