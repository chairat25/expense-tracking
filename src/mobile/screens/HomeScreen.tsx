import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { bkkDateKey, shiftDate, todayKey, type Tx } from "../../lib/shared";
import { BatchAddSheet } from "../components/BatchAddSheet";
import { DatePickerSheet } from "../components/DatePickerSheet";
import { EditTransactionSheet } from "../components/EditTransactionSheet";
import { HistorySheet } from "../components/HistorySheet";
import { HomeHeader } from "../components/HomeHeader";
import { ProfileSheet } from "../components/ProfileSheet";
import { QuickAddCard } from "../components/QuickAddCard";
import { SummaryCard } from "../components/SummaryCard";
import { TransactionList } from "../components/TransactionList";
import { AutoReceiptModal, type ReceiptSaveStatus } from "../components/AutoReceiptModal";
import { useSecurity } from "../context/SecurityContext";
import { useDayData } from "../hooks/useDayData";
import { useSettledFlag } from "../hooks/useSettledFlag";
import { useRecentReceiptSniffer } from "../hooks/useRecentReceiptSniffer";
import { useSlipDeepLink } from "../hooks/useSlipDeepLink";
import { prepareNativeSlipFeatures } from "../lib/nativeBridge";
import { scanSlipAsset } from "../lib/slipScanner";
import type { SlipLink } from "../lib/slipLink";
import type { CategorySlug } from "../lib/shared";
import { useUserMeta } from "../hooks/useUserMeta";
import { supabase } from "../lib/supabase";
import { colors, MAX_CONTENT_WIDTH } from "../theme";

interface PendingSlip {
  amount: number;
  note: string;
  category: CategorySlug;
  date: string;
  imageUri: string;
  /** Came from the Live Activity "บันทึก" button: save as soon as Face ID passes. */
  shouldAutoSave: boolean;
}

/** Let the Face ID sheet finish closing before presenting the slip popup over it. */
const UNLOCK_SETTLE_MS = 400;
/** How long the "บันทึกแล้ว" confirmation stays before the popup closes. */
const SAVED_LINGER_MS = 900;

/** หน้าหลักเหมือน HomeView ของเว็บ PWA */
export function HomeScreen() {
  const today = todayKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Tx | null>(null);

  const { isReady, requireUnlock } = useSecurity();
  const canShowSlip = useSettledFlag(isReady, UNLOCK_SETTLE_MS);
  const day = useDayData(selectedDate);
  const { reload } = day;
  const { categories, profile, budgets, saveDisplayName } = useUserMeta();

  const dailyBudget = day.dailyBudget ?? budgets?.daily ?? 0;

  // Zero-click ingestion: สลิปใหม่ในอัลบั้ม → เสนอบันทึกอัตโนมัติ
  const [pendingSlip, setPendingSlip] = useState<PendingSlip | null>(null);
  const [slipStatus, setSlipStatus] = useState<ReceiptSaveStatus>("idle");

  const closeSlip = useCallback(() => {
    setPendingSlip(null);
    setSlipStatus("idle");
  }, []);

  const offerSlip = useCallback(async (assetId: string, shouldAutoSave = false) => {
    const scanned = await scanSlipAsset(assetId);
    if (!scanned) return;
    setSlipStatus("idle");
    setPendingSlip({
      amount: scanned.amount,
      note: scanned.note,
      category: scanned.category,
      // ใช้เวลาสร้างรูป (= เวลาโอน) แม่นกว่าปี พ.ศ. ย่อที่ OCR อ่านได้
      date: scanned.creationTime ? bkkDateKey(new Date(scanned.creationTime)) : todayKey(),
      imageUri: scanned.imageUri,
      shouldAutoSave,
    });
  }, []);

  useRecentReceiptSniffer(useCallback((receipt) => void offerSlip(receipt.id), [offerSlip]));
  // แตะ Dynamic Island / แจ้งเตือนสลิป → สแกนหน้าก่อนเสมอ แล้วค่อยเปิด popup (หรือบันทึกเลยถ้ากดปุ่มบันทึก)
  useSlipDeepLink(
    useCallback(
      (link: SlipLink) => {
        requireUnlock();
        void offerSlip(link.assetId, link.shouldAutoSave);
      },
      [offerSlip, requireUnlock],
    ),
  );

  useEffect(() => {
    void prepareNativeSlipFeatures();
  }, []);

  // Back from the Lock Screen / Dynamic Island: refetch so slips saved there show up.
  const wasReady = useRef(false);
  const hasBeenReady = useRef(false);
  useEffect(() => {
    if (canShowSlip && !wasReady.current && hasBeenReady.current) void reload(selectedDate);
    if (canShowSlip) hasBeenReady.current = true;
    wasReady.current = canShowSlip;
  }, [canShowSlip, reload, selectedDate]);

  // "บันทึก" on the Live Activity: once unlocked, save with the note read from the slip.
  useEffect(() => {
    if (!canShowSlip || !pendingSlip?.shouldAutoSave || slipStatus !== "idle") return;
    setPendingSlip({ ...pendingSlip, shouldAutoSave: false });
    void acceptReceipt(pendingSlip.note);
  });

  async function acceptReceipt(note: string) {
    if (!pendingSlip || slipStatus !== "idle") return;
    const { amount, category, date } = pendingSlip;
    setSlipStatus("saving");
    try {
      await day.addTransaction({ type: "expense", amount, category, note: note.trim() }, date);
    } catch {
      setSlipStatus("idle");
      Alert.alert("บันทึกสลิปไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง");
      return;
    }
    setSlipStatus("saved");
    setTimeout(() => {
      closeSlip();
      // Jump to the slip's day and refetch so the new row visibly lands.
      if (date === selectedDate) void reload(date);
      else setSelectedDate(date);
    }, SAVED_LINGER_MS);
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
              onEdit={setEditingTx}
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
        key={pendingSlip?.imageUri ?? "none"}
        // A Modal renders above the Face ID lock overlay, so wait until unlock has settled.
        visible={pendingSlip !== null && canShowSlip}
        receiptUri={pendingSlip?.imageUri ?? null}
        amount={pendingSlip?.amount ?? 0}
        initialNote={pendingSlip?.note ?? ""}
        category={pendingSlip?.category}
        status={slipStatus}
        onAccept={acceptReceipt}
        onReject={closeSlip}
      />
      <EditTransactionSheet
        key={editingTx?.id ?? "none"}
        tx={editingTx}
        categories={categories}
        onSave={day.updateTransaction}
        onClose={() => setEditingTx(null)}
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
