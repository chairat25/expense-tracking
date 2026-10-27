import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, tints, useTheme } from "../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

/** เทียบเท่า modal แบบ bottom sheet (fixed inset-0 items-end) ของเว็บ */
export function BottomSheet({ visible, onClose, children, style }: Props) {
  const { theme, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Wrap the whole sheet so the keyboard pushes it up, not just its contents. */}
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView edges={["bottom"]} style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
          {children}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end", backgroundColor: tints.overlay },
  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.slate900,
    borderTopLeftRadius: radius.xl + 8,
    borderTopRightRadius: radius.xl + 8,
    borderWidth: 1,
    borderColor: colors.slate800,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
