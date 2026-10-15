import React, { useState } from "react";
import { StyleSheet, View, SafeAreaView, ScrollView, Text, StatusBar } from "react-native";
import { DateCapsuleBar } from "./src/mobile/components/DateCapsuleBar";
import { StatusCard } from "./src/mobile/components/StatusCard";
import { QuickAddForm } from "./src/mobile/components/QuickAddForm";
import { AutoReceiptModal } from "./src/mobile/components/AutoReceiptModal";
import { useRecentReceiptSniffer, DetectedReceipt } from "./src/mobile/hooks/useRecentReceiptSniffer";
import { todayKey, CategorySlug } from "./src/mobile/lib/shared";
import { supabase } from "./src/mobile/lib/supabase";
import { SecurityProvider } from "./src/mobile/context/SecurityContext";
import { PrivacyShield } from "./src/mobile/components/PrivacyShield";

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [spent, setSpent] = useState<number>(0);
  const [income, setIncome] = useState<number>(0);
  const [dailyBudget, setDailyBudget] = useState<number | null>(500);

  // Auto Receipt Modal state
  const [autoReceiptVisible, setAutoReceiptVisible] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState<DetectedReceipt | null>(null);
  const [parsedSlip, setParsedSlip] = useState<{
    amount: number;
    category: CategorySlug;
    receiver: string;
    date: string;
  }>({
    amount: 0,
    category: "food",
    receiver: "",
    date: todayKey(),
  });

  // Zero-Click Ingestion Sniffer
  useRecentReceiptSniffer(async (receipt) => {
    setPendingReceipt(receipt);
    const parsed = await parseSlipImage(receipt.uri);
    setParsedSlip({
      amount: parsed.amount || 0,
      category: parsed.category || "food",
      receiver: parsed.receiver || "สแกนสลิปโอนเงิน",
      date: parsed.date || todayKey(),
    });
    setAutoReceiptVisible(true);
  });

  const handleAddTransaction = async (data: {
    amount: number;
    type: "expense" | "income";
    category: CategorySlug;
    note: string;
  }) => {
    if (data.type === "expense") {
      setSpent((prev) => prev + data.amount);
    } else {
      setIncome((prev) => prev + data.amount);
    }

    try {
      await supabase.from("transactions").insert({
        date: selectedDate,
        spent_at: new Date().toISOString(),
        type: data.type,
        amount: data.amount,
        category: data.category,
        note: data.note,
      });
    } catch (err) {
      console.warn("Offline or Supabase sync error:", err);
    }
  };

  return (
    <SecurityProvider>
      <PrivacyShield>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#020617" />
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
              <Text style={styles.appTitle}>Expense Tracker</Text>
            </View>

            <DateCapsuleBar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <StatusCard spent={spent} income={income} budget={dailyBudget} />
            <QuickAddForm onAddTransaction={handleAddTransaction} />
          </ScrollView>

          <AutoReceiptModal
            visible={autoReceiptVisible}
            receiptUri={pendingReceipt?.uri || null}
            amount={parsedSlip.amount}
            note={parsedSlip.receiver}
            category={parsedSlip.category}
            onAccept={() => {
              handleAddTransaction({
                amount: parsedSlip.amount,
                type: "expense",
                category: parsedSlip.category,
                note: parsedSlip.receiver,
              });
              setAutoReceiptVisible(false);
            }}
            onReject={() => setAutoReceiptVisible(false)}
          />
        </SafeAreaView>
      </PrivacyShield>
    </SecurityProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  appTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
});
