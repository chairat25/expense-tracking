import React from "react";
import { View, Text, Modal, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Check, X, ScanText } from "lucide-react-native";
import { formatBaht } from "../lib/shared";

interface Props {
  visible: boolean;
  receiptUri: string | null;
  amount: number;
  note: string;
  onAccept: () => void;
  onReject: () => void;
}

export const AutoReceiptModal: React.FC<Props> = ({
  visible,
  receiptUri,
  amount,
  note,
  onAccept,
  onReject,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
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
            {note ? <Text style={styles.noteText}>{note}</Text> : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
              <X size={18} color="#94a3b8" />
              <Text style={styles.rejectText}>ข้าม</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
              <Check size={18} color="#ffffff" />
              <Text style={styles.acceptText}>บันทึกรายการ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  },
  amountText: {
    color: "#10b981",
    fontSize: 28,
    fontWeight: "800",
  },
  noteText: {
    color: "#cbd5e1",
    fontSize: 14,
    marginTop: 4,
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
  acceptText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
