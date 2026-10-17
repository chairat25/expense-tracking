import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { shiftDate, todayKey, type Tx } from "../../lib/shared";
import { BatchAddSheet } from "../components/BatchAddSheet";
import { DatePickerSheet } from "../components/DatePickerSheet";
import { HistorySheet } from "../components/HistorySheet";
import { HomeHeader } from "../components/HomeHeader";
import { ProfileSheet } from "../components/ProfileSheet";
import { QuickAddCard } from "../components/QuickAddCard";
import { SummaryCard } from "../components/SummaryCard";
import { TransactionList } from "../components/TransactionList";
import { AutoReceiptModal } from "../components/AutoReceiptModal";
import { useDayData } from "../hooks/useDayData";
import { useRecentReceiptSniffer, type DetectedReceipt } from "../hooks/useRecentReceiptSniffer";
import { parseSlipImage } from "../lib/slipParser";
import type { CategorySlug } from "../lib/shared";
import { useUserMeta } from "../hooks/useUserMeta";
import { supabase } from "../lib/supabase";
import { colors, MAX_CONTENT_WIDTH } from "../theme";

/** หน้าหลักเหมือน HomeView ของเว็บ PWA */
export function HomeScreen() {
  const today = todayKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  const day = useDayData(selectedDate);
  const { categories, profile, budgets, saveDisplayName } = useUserMeta();

  const dailyBudget = day.dailyBudget ?? budgets?.daily ?? 0;

  // Zero-click ingestion: สลิปใหม่ในอัลบั้ม → เสนอบันทึกอัตโนมัติ
  const [pendingReceipt, setPendingReceipt] = useState<DetectedReceipt | null>(null);
  const [parsedSlip, setParsedSlip] = useState<{ amount: number; note: string; category: CategorySlug }>({
    amount: 0,
    note: "",
    category: "food",
  });

  useRecentReceiptSniffer(async (receipt) => {
    const parsed = await parseSlipImage(receipt.uri);
    setParsedSlip({
      amount: parsed.amount ?? 0,
      note: parsed.receiver ?? "สแกนสลิปโอนเงิน",
      category: parsed.category,
    });
    setPendingReceipt(receipt);
  });

  async function acceptReceipt() {
    setPendingReceipt(null);
    try {
      await day.addTransaction({ type: "expense", ...parsedSlip }, todayKey());
    } catch {
      Alert.alert("บันทึกสลิปไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง");
    }
  }

  function confirmDelete(tx: Tx) {
    day.removeTransaction(tx).catch(() => {
      Alert.alert("ไม่สามารถลบรายการได้", "กรุณาลองใหม่อีกครั้ง");
    });
  }

  async function logout() {
    setProfileOpen(false);
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <HomeHeader
        selectedDate={selectedDate}
        today={today}
        avatarUrl={profile?.avatarUrl}
        onSelectDate={setSelectedDate}
        onOpenDatePicker={() => setDatePickerOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <SummaryCard
              isToday={selectedDate === today}
              selectedDate={selectedDate}
              loading={day.loading}
              spent={day.spent}
              income={day.income}
              dailyBudget={dailyBudget}
            />
            <QuickAddCard
              selectedDate={selectedDate}
              isToday={selectedDate === today}
              isYesterday={selectedDate === shiftDate(today, -1)}
              categories={categories}
              onSubmit={async (input) => {
                await day.addTransaction(input, selectedDate);
              }}
              onOpenDatePicker={() => setDatePickerOpen(true)}
              onOpenBatchAdd={() => setBatchOpen(true)}
            />
            <TransactionList
              selectedDate={selectedDate}
              loading={day.loading}
              transactions={day.transactions}
              categories={categories}
              onDelete={confirmDelete}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerSheet
        key={datePickerOpen ? selectedDate : "closed"}
        visible={datePickerOpen}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setDatePickerOpen(false)}
      />
      <HistorySheet
        visible={historyOpen}
        today={today}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setHistoryOpen(false)}
      />
      <ProfileSheet
        visible={profileOpen}
        profile={profile}
        budgets={budgets}
        onSaveName={saveDisplayName}
        onLogout={logout}
        onClose={() => setProfileOpen(false)}
      />
      <AutoReceiptModal
        visible={pendingReceipt !== null}
        receiptUri={pendingReceipt?.uri ?? null}
        amount={parsedSlip.amount}
        note={parsedSlip.note}
        category={parsedSlip.category}
        onAccept={acceptReceipt}
        onReject={() => setPendingReceipt(null)}
      />
      <BatchAddSheet
        visible={batchOpen}
        currentDate={selectedDate}
        categories={categories}
        onSave={day.addTransaction}
        onClose={() => setBatchOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate950 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 48 },
  content: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", gap: 16 },
});
