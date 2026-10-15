import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Utensils, Coffee, Car, Receipt, ShoppingBag, Film, Package, Plus } from "lucide-react-native";
import { CATEGORIES, CategorySlug } from "../lib/shared";

interface Props {
  onAddTransaction: (data: { amount: number; type: "expense" | "income"; category: CategorySlug; note: string }) => void;
}

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Utensils,
  Coffee,
  Car,
  Receipt,
  ShoppingBag,
  Film,
  Package,
};

export const QuickAddForm: React.FC<Props> = ({ onAddTransaction }) => {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState<CategorySlug>("food");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    onAddTransaction({ amount: val, type, category, note: note.trim() });
    setAmount("");
    setNote("");
  };

  return (
    <View style={styles.card}>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "expense" && styles.activeExpenseBtn]}
          onPress={() => setType("expense")}
        >
          <Text style={[styles.typeText, type === "expense" && styles.activeTypeText]}>รายจ่าย</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "income" && styles.activeIncomeBtn]}
          onPress={() => setType("income")}
        >
          <Text style={[styles.typeText, type === "income" && styles.activeTypeText]}>รายรับ</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.amountInput}
        placeholder="0.00"
        placeholderTextColor="#64748b"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.iconName] || Package;
          const isSelected = category === cat.slug;
          return (
            <TouchableOpacity
              key={cat.slug}
              style={[styles.catBtn, isSelected && styles.activeCatBtn]}
              onPress={() => setCategory(cat.slug)}
            >
              <Icon size={18} color={isSelected ? "#10b981" : "#94a3b8"} />
              <Text style={[styles.catText, isSelected && styles.activeCatText]}>{cat.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.noteInput}
        placeholder="หมายเหตุ (เช่น กาแฟเช้า)"
        placeholderTextColor="#64748b"
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Plus size={18} color="#ffffff" />
        <Text style={styles.submitText}>บันทึกรายการ</Text>
      </TouchableOpacity>
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
  typeRow: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeExpenseBtn: {
    backgroundColor: "#f43f5e",
  },
  activeIncomeBtn: {
    backgroundColor: "#10b981",
  },
  typeText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTypeText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginVertical: 12,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeCatBtn: {
    borderWidth: 1,
    borderColor: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  catText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  activeCatText: {
    color: "#10b981",
    fontWeight: "600",
  },
  noteInput: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
