import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCheck, Layers, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react-native";
import { formatBaht, formatDayTH, type Tx } from "../../lib/shared";
import type { NewTransaction } from "../hooks/useDayData";
import { colors, radius, tints } from "../theme";
import type { CategoryOption } from "../types";
import { BottomSheet } from "../ui/BottomSheet";
import { SheetHeader } from "../ui/SheetHeader";

interface Props {
  visible: boolean;
  currentDate: string;
  categories: CategoryOption[];
  onSave: (input: NewTransaction, date: string) => Promise<Tx>;
  onClose: () => void;
}

interface BatchRow {
  id: string;
  amount: string;
  type: "expense" | "income";
  category: string;
  note: string;
}

const INITIAL_ROW_COUNT = 3;
let rowSeq = 0;

function createRow(category: string): BatchRow {
  rowSeq += 1;
  return { id: `row-${rowSeq}`, amount: "", type: "expense", category, note: "" };
}

export function BatchAddSheet({ visible, currentDate, categories, onSave, onClose }: Props) {
  const defaultCategory = categories[0]?.slug ?? "food";
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setRows(Array.from({ length: INITIAL_ROW_COUNT }, () => createRow(defaultCategory)));
  }, [visible, defaultCategory]);

  const updateRow = (id: string, patch: Partial<BatchRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length <= 1 ? [createRow(defaultCategory)] : prev.filter((r) => r.id !== id)));

  const validRows = rows.filter((r) => parseFloat(r.amount) > 0);
  const sumOf = (type: BatchRow["type"]) =>
    validRows.filter((r) => r.type === type).reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const totalExpense = sumOf("expense");
  const totalIncome = sumOf("income");

  async function submitAll() {
    if (validRows.length === 0) {
      setError("กรุณาระบุจำนวนเงินอย่างน้อย 1 รายการ");
      return;
    }
    setSubmitting(true);
    setError(null);

    const results = await Promise.allSettled(
      validRows.map((row) =>
        onSave(
          { type: row.type, amount: parseFloat(row.amount), category: row.category, note: row.note },
          currentDate,
        ),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected").length;

    setSubmitting(false);
    if (failed > 0) {
      setError(`บันทึกสำเร็จ ${validRows.length - failed} รายการ (เกิดข้อผิดพลาด ${failed} รายการ)`);
      return;
    }
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={submitting ? () => undefined : onClose} style={styles.sheet}>
      <View style={styles.flex}>
        <SheetHeader
          icon={
            <View style={styles.headerIcon}>
              <Layers size={18} color={colors.emerald400} />
            </View>
          }
          title="เพิ่มหลายรายการพร้อมกัน"
          subtitle={`บันทึกลง: ${formatDayTH(currentDate)}`}
          onClose={onClose}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.rows}
          keyboardShouldPersistTaps="handled"
        >
          {rows.map((row, index) => (
            <View key={row.id} style={[styles.row, parseFloat(row.amount) > 0 && styles.rowFilled]}>
              <View style={styles.rowHead}>
                <View style={styles.headLeft}>
                  <Text style={styles.index}>{index + 1}</Text>
                  <View style={styles.typeSwitch}>
                    <TouchableOpacity
                      style={[styles.typeBtn, row.type === "expense" && styles.typeExpense]}
                      onPress={() => updateRow(row.id, { type: "expense" })}
                    >
                      <TrendingDown size={11} color={row.type === "expense" ? colors.rose300 : colors.slate400} />
                      <Text style={[styles.typeText, row.type === "expense" && { color: colors.rose300 }]}>จ่าย</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeBtn, row.type === "income" && styles.typeIncome]}
                      onPress={() => updateRow(row.id, { type: "income" })}
                    >
                      <TrendingUp size={11} color={row.type === "income" ? colors.emerald300 : colors.slate400} />
                      <Text style={[styles.typeText, row.type === "income" && { color: colors.emerald300 }]}>รับ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeRow(row.id)} disabled={submitting}>
                  <Trash2 size={13} color={colors.slate500} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.amountInput}
                value={row.amount}
                onChangeText={(amount) => updateRow(row.id, { amount })}
                placeholder="฿ 0.00"
                placeholderTextColor={colors.slate600}
                keyboardType="decimal-pad"
                editable={!submitting}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {categories.map((cat) => {
                  const selected = row.category === cat.slug;
                  return (
                    <TouchableOpacity
                      key={cat.slug}
                      style={[styles.cat, selected && styles.catSelected]}
                      onPress={() => updateRow(row.id, { category: cat.slug })}
                    >
                      <Text style={[styles.catText, selected && { color: colors.emerald300 }]}>
                        {cat.icon || "📦"} {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TextInput
                style={styles.noteInput}
                value={row.note}
                onChangeText={(note) => updateRow(row.id, { note })}
                placeholder="หมายเหตุ (เช่น กาแฟ, ข้าวเที่ยง)"
                placeholderTextColor={colors.slate600}
                editable={!submitting}
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.addRow}
            onPress={() => setRows((prev) => [...prev, createRow(defaultCategory)])}
            disabled={submitting}
          >
            <Plus size={14} color={colors.slate400} />
            <Text style={styles.addRowText}>เพิ่มรายการถัดไป</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.total}>
            รวมทั้งหมด <Text style={styles.totalStrong}>{validRows.length}</Text> รายการ:{" "}
            {totalExpense > 0 && <Text style={styles.expense}>-฿{formatBaht(totalExpense)} </Text>}
            {totalIncome > 0 && <Text style={styles.income}>+฿{formatBaht(totalIncome)}</Text>}
            {totalExpense === 0 && totalIncome === 0 && <Text style={styles.zero}>฿0.00</Text>}
          </Text>
          <TouchableOpacity
            style={[styles.submit, (submitting || validRows.length === 0) && styles.disabled]}
            onPress={submitAll}
            disabled={submitting || validRows.length === 0}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <CheckCheck size={16} color={colors.white} />
            )}
            <Text style={styles.submitText}>
              {submitting ? "กำลังบันทึก..." : `บันทึกทั้งหมด (${validRows.length} รายการ)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flexShrink: 1 },
  sheet: { height: "92%", backgroundColor: colors.slate950, paddingHorizontal: 16 },
  headerIcon: {
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: tints.emerald20,
    backgroundColor: tints.emerald10,
  },
  error: {
    color: colors.rose300,
    fontSize: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: tints.rose30,
    backgroundColor: tints.roseBg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rows: { gap: 12, paddingVertical: 14 },
  row: {
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(30,41,59,0.6)",
    backgroundColor: "rgba(15,23,42,0.3)",
  },
  rowFilled: { borderColor: colors.slate800, backgroundColor: "rgba(15,23,42,0.7)" },
  rowHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  index: {
    width: 20,
    textAlign: "center",
    color: colors.slate300,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: colors.slate800,
    borderRadius: 6,
    overflow: "hidden",
    paddingVertical: 2,
  },
  typeSwitch: {
    flexDirection: "row",
    padding: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeExpense: { backgroundColor: tints.rose20, borderColor: "rgba(244,63,94,0.4)" },
  typeIncome: { backgroundColor: tints.emerald20, borderColor: tints.emerald40 },
  typeText: { color: colors.slate400, fontSize: 11, fontWeight: "500" },
  deleteBtn: {
    height: 28,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.slate800,
  },
  amountInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  catRow: { gap: 6 },
  cat: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  catSelected: { borderColor: tints.emerald60, backgroundColor: tints.emerald20 },
  catText: { color: colors.slate400, fontSize: 11, fontWeight: "500" },
  noteInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.slate200,
    fontSize: 12,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.slate800,
    backgroundColor: "rgba(15,23,42,0.3)",
  },
  addRowText: { color: colors.slate400, fontSize: 12, fontWeight: "600" },
  footer: {
    gap: 10,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(30,41,59,0.8)",
  },
  total: { color: colors.slate400, fontSize: 12 },
  totalStrong: { color: colors.white, fontWeight: "700" },
  expense: { color: colors.rose400, fontWeight: "700" },
  income: { color: colors.emerald400, fontWeight: "700" },
  zero: { color: colors.slate500 },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.emerald600,
  },
  submitText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  disabled: { opacity: 0.4 },
});
