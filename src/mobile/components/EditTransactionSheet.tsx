import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, Pencil, TrendingDown, TrendingUp } from "lucide-react-native";
import { formatDayTH, formatTimeTH, type Tx } from "../../lib/shared";
import type { NewTransaction } from "../hooks/useDayData";
import { colors, radius, tints } from "../theme";
import type { CategoryOption } from "../types";
import { BottomSheet } from "../ui/BottomSheet";
import { SheetHeader } from "../ui/SheetHeader";

interface Props {
  /** Mount with a `key` per transaction so the form starts from that row's values. */
  tx: Tx | null;
  categories: CategoryOption[];
  onSave: (tx: Tx, patch: NewTransaction) => Promise<unknown>;
  onClose: () => void;
}

export function EditTransactionSheet({ tx, categories, onSave, onClose }: Props) {
  const [type, setType] = useState<NewTransaction["type"]>(tx?.type ?? "expense");
  const [amount, setAmount] = useState(tx ? String(tx.amount) : "");
  const [category, setCategory] = useState<string>(tx?.category ?? "other");
  const [note, setNote] = useState(tx?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!tx) return;
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      setError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(tx, { type, amount: value, category, note });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "แก้ไขรายการไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  const close = submitting ? () => undefined : onClose;

  return (
    <BottomSheet visible={tx !== null} onClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SheetHeader
          icon={
            <View style={styles.headerIcon}>
              <Pencil size={16} color={colors.emerald400} />
            </View>
          }
          title="แก้ไขรายการ"
          subtitle={tx ? `${formatDayTH(tx.date)} • ${formatTimeTH(tx.spentAt)}` : undefined}
          onClose={close}
        />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.typeSwitch}>
            <TouchableOpacity
              style={[styles.typeBtn, type === "expense" && styles.typeExpense]}
              onPress={() => setType("expense")}
            >
              <TrendingDown size={14} color={type === "expense" ? colors.rose300 : colors.slate400} />
              <Text style={[styles.typeText, type === "expense" && { color: colors.rose300 }]}>รายจ่าย</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === "income" && styles.typeIncome]}
              onPress={() => setType("income")}
            >
              <TrendingUp size={14} color={type === "income" ? colors.emerald300 : colors.slate400} />
              <Text style={[styles.typeText, type === "income" && { color: colors.emerald300 }]}>รายรับ</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="฿ 0.00"
            placeholderTextColor={colors.slate600}
            keyboardType="decimal-pad"
            editable={!submitting}
          />

          <View style={styles.catWrap}>
            {categories.map((cat) => {
              const selected = category === cat.slug;
              return (
                <TouchableOpacity
                  key={cat.slug}
                  style={[styles.cat, selected && styles.catSelected]}
                  onPress={() => setCategory(cat.slug)}
                >
                  <Text style={[styles.catText, selected && { color: colors.emerald300 }]}>
                    {cat.icon || "📦"} {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="หมายเหตุ (เช่น กาแฟ, ข้าวเที่ยง)"
            placeholderTextColor={colors.slate600}
            editable={!submitting}
            maxLength={300}
          />

          <TouchableOpacity
            style={[styles.submit, submitting && styles.disabled]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Check size={16} color={colors.white} />
            )}
            <Text style={styles.submitText}>{submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
  body: { gap: 12, paddingVertical: 14 },
  error: {
    color: colors.rose300,
    fontSize: 12,
    borderWidth: 1,
    borderColor: tints.rose30,
    backgroundColor: tints.roseBg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeSwitch: {
    flexDirection: "row",
    padding: 3,
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeExpense: { backgroundColor: tints.rose20, borderColor: "rgba(244,63,94,0.4)" },
  typeIncome: { backgroundColor: tints.emerald20, borderColor: tints.emerald40 },
  typeText: { color: colors.slate400, fontSize: 13, fontWeight: "600" },
  amountInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  catWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cat: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  catSelected: { borderColor: tints.emerald60, backgroundColor: tints.emerald20 },
  catText: { color: colors.slate400, fontSize: 12, fontWeight: "500" },
  noteInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.slate200,
    fontSize: 14,
  },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.emerald600,
  },
  submitText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
