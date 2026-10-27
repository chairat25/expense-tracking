import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LogOut, Moon, Smartphone, Sun, User, Wallet } from "lucide-react-native";
import { formatBaht } from "../../lib/shared";
import { colors, radius, tints, useTheme, type ThemeMode } from "../theme";
import type { Budgets, UserProfile } from "../types";
import { BottomSheet } from "../ui/BottomSheet";
import { SheetHeader } from "../ui/SheetHeader";

interface Props {
  visible: boolean;
  profile: UserProfile | null;
  budgets: Budgets | null;
  onSaveName: (name: string) => Promise<void>;
  onLogout: () => void;
  onClose: () => void;
}

export function ProfileSheet({ visible, profile, budgets, onSaveName, onLogout, onClose }: Props) {
  const [name, setName] = useState(profile?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const { mode, setMode } = useTheme();

  useEffect(() => {
    setName(profile?.displayName ?? "");
  }, [profile?.displayName]);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSaveName(name.trim());
    } catch (err) {
      console.warn("Save profile failed:", err);
    } finally {
      setSaving(false);
    }
  }

  const avatar = profile?.avatarUrl ? (
    <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
  ) : profile?.displayName ? (
    <Text style={styles.avatarLetter}>{profile.displayName.slice(0, 1).toUpperCase()}</Text>
  ) : (
    <User size={20} color={colors.emerald400} />
  );

  const quotas = [
    { label: "งบรายวัน", value: budgets?.daily, icon: <Sun size={16} color={colors.amber400} /> },
    { label: "งบรายสัปดาห์", value: budgets?.weekly, icon: <Calendar size={16} color={colors.indigo400} /> },
    { label: "งบประจำเดือน", value: budgets?.monthly, icon: <Wallet size={16} color={colors.emerald400} /> },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader
        icon={<View style={styles.avatar}>{avatar}</View>}
        title={profile?.displayName || "โปรไฟล์ผู้ใช้"}
        subtitle={profile?.email || ""}
        onClose={onClose}
      />

      <View style={styles.body}>
        <Text style={styles.quotaTitle}>โควต้างบประมาณ (กำหนดจากหลังบ้าน)</Text>
        <View style={styles.quotaRow}>
          {quotas.map((q) => (
            <View key={q.label} style={styles.quota}>
              {q.icon}
              <Text style={styles.quotaLabel}>{q.label}</Text>
              <Text style={styles.quotaValue}>฿{formatBaht(q.value || 0)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.quotaHint}>
          กำหนดและปรับเปลี่ยนตัวเลขงบประมาณได้ที่ระบบ Expense Dashboard หลังบ้าน
        </Text>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>ธีมการแสดงผล</Text>
          <View style={styles.themeSelector}>
            {(
              [
                { id: "system" as ThemeMode, label: "ตามระบบ", icon: Smartphone },
                { id: "light" as ThemeMode, label: "สว่าง", icon: Sun },
                { id: "dark" as ThemeMode, label: "มืด", icon: Moon },
              ] as const
            ).map((opt) => {
              const active = mode === opt.id;
              const IconComp = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.themeOption, active && styles.themeOptionActive]}
                  onPress={() => setMode(opt.id)}
                  activeOpacity={0.7}
                >
                  <IconComp
                    size={14}
                    color={active ? colors.emerald400 : colors.slate400}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      active && styles.themeOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>ชื่อที่แสดง</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.slate600}
            />
            <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={save} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.slate200} />
              ) : (
                <Text style={styles.saveText}>บันทึกชื่อ</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logout} onPress={onLogout} activeOpacity={0.8}>
            <LogOut size={16} color={colors.rose400} />
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  avatar: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    backgroundColor: tints.emerald10,
  },
  avatarImg: { height: 44, width: 44 },
  avatarLetter: { color: colors.emerald400, fontSize: 16, fontWeight: "700" },
  body: { paddingTop: 20, paddingBottom: 16, gap: 8 },
  quotaTitle: { color: colors.emerald400, fontSize: 11, fontWeight: "600", letterSpacing: 0.6 },
  quotaRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  quota: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
  },
  quotaLabel: { color: colors.slate400, fontSize: 10 },
  quotaValue: { color: colors.white, fontSize: 12, fontWeight: "700" },
  quotaHint: { color: colors.slate500, fontSize: 11 },
  section: { borderTopWidth: 1, borderTopColor: "rgba(30,41,59,0.8)", paddingTop: 16, marginTop: 8 },
  fieldLabel: { color: colors.slate300, fontSize: 12, fontWeight: "500", marginBottom: 6 },
  nameRow: { flexDirection: "row", gap: 8 },
  nameInput: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate950,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.slate200,
    fontSize: 12,
  },
  saveBtn: {
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.slate800,
  },
  saveText: { color: colors.slate200, fontSize: 12, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: tints.rose30,
    backgroundColor: "rgba(76,5,25,0.2)",
  },
  logoutText: { color: colors.rose400, fontSize: 12, fontWeight: "700" },
  themeSelector: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.slate950,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.slate800,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  themeOptionActive: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
  },
  themeOptionText: {
    color: colors.slate400,
    fontSize: 12,
    fontWeight: "500",
  },
  themeOptionTextActive: {
    color: colors.emerald400,
    fontWeight: "600",
  },
});
