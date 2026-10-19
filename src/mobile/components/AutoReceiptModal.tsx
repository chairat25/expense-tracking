import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Check, X, ScanText, Tag } from "lucide-react-native";
import { formatBaht, CategorySlug, CATEGORIES } from "../lib/shared";

const NOTE_MAX_LENGTH = 100;

export type ReceiptSaveStatus = "idle" | "saving" | "saved";

interface Props {
  visible: boolean;
  receiptUri: string | null;
  amount: number;
  /** หมายเหตุเริ่มต้นจาก OCR (ชื่อผู้รับ) ผู้ใช้แก้ได้ก่อนบันทึก */
  initialNote: string;
  category?: CategorySlug;
  status: ReceiptSaveStatus;
  onAccept: (note: string) => void;
  onReject: () => void;
}

export const AutoReceiptModal: React.FC<Props> = ({
  visible,
  receiptUri,
  amount,
  initialNote,
  category = "food",
  status,
  onAccept,
  onReject,
}) => {
  const [note, setNote] = useState(initialNote);
  const catItem = CATEGORIES.find((c) => c.slug === category);
  const isBusy = status !== "idle";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isBusy ? undefined : onReject}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <ScanText size={20} color="#10b981" />
            <Text style={styles.title}>ตรวจพบสลิปธนาคารล่าสุด</Text>
          </View>

          {receiptUri && (
            <Image source={{ uri: receiptUri }} style={styles.imagePreview} resizeMode="contain" />
          )}

          <View style={styles.infoBox}>
            <Text style={styles.amountText}>{formatBaht(amount)} ฿</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="หมายเหตุ (เช่น ค่ากาแฟ)"
              placeholderTextColor="#64748b"
              maxLength={NOTE_MAX_LENGTH}
              editable={!isBusy}
              returnKeyType="done"
              selectTextOnFocus
            />
            <View style={styles.catBadge}>
              <Tag size={12} color="#10b981" />
              <Text style={styles.catBadgeText}>{catItem ? catItem.name : "ทั่วไป"}</Text>
            </View>
          </View>

          {status === "saved" ? (
            <View style={styles.savedBanner}>
              <Check size={20} color="#ffffff" />
              <Text style={styles.acceptText}>บันทึกแล้ว</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.rejectBtn, isBusy && styles.disabled]}
                onPress={onReject}
                disabled={isBusy}
              >
                <X size={18} color="#94a3b8" />
                <Text style={styles.rejectText}>ข้าม</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => onAccept(note)}
                disabled={isBusy}
              >
                {status === "saving" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Check size={18} color="#ffffff" />
                )}
                <Text style={styles.acceptText}>
                  {status === "saving" ? "กำลังบันทึก..." : "บันทึกรายการ"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    marginBottom: 16,
  },
  infoBox: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  noteInput: {
    width: "100%",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#e2e8f0",
    fontSize: 15,
    textAlign: "center",
  },
  amountText: {
    color: "#10b981",
    fontSize: 28,
    fontWeight: "800",
  },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  catBadgeText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#334155",
  },
  rejectText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#10b981",
  },
  savedBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#059669",
  },
  disabled: {
    opacity: 0.5,
  },
  acceptText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
