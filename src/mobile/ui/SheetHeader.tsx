import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { X } from "lucide-react-native";
import { colors, useTheme } from "../theme";

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function SheetHeader({ icon, title, subtitle, onClose }: Props) {
  const { theme } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.left}>
        {icon}
        <View style={styles.texts}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={8}>
        <X size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate800,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  texts: { flex: 1 },
  title: { color: colors.white, fontSize: 15, fontWeight: "700" },
  subtitle: { color: colors.slate400, fontSize: 11, marginTop: 1 },
  close: { height: 32, width: 32, alignItems: "center", justifyContent: "center" },
});
