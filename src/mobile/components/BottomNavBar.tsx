import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, Plus, User } from "lucide-react-native";
import { colors, tints } from "../theme";

export type NavTab = "calendar" | "main" | "profile";

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Optional badge or indicator on profile */
  hasUnsavedProfile?: boolean;
}

const BAR_HEIGHT = 52;
const BAR_SIDE_INSET = 32;
const FAB_SIZE = 40;
const MIN_BOTTOM_GAP = 12;
// Sits the pill inside the home-indicator zone so its curve follows the screen corners
const HOME_INDICATOR_OVERLAP = 14;

/** Bottom padding a scrollable screen needs so its last item clears the floating bar */
export const NAV_BAR_CLEARANCE = 88;

export function BottomNavBar({ activeTab, onTabChange }: Props) {
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom - HOME_INDICATOR_OVERLAP, MIN_BOTTOM_GAP);

  return (
    <View style={[styles.wrapper, { bottom: bottomGap }]} pointerEvents="box-none">
      <View style={styles.pill}>
        {/* Left Tab: Calendar (Second Priority) */}
        <TouchableOpacity
          style={styles.sideTab}
          activeOpacity={0.7}
          onPress={() => onTabChange("calendar")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "calendar" }}
          accessibilityLabel="ปฏิทินยอดใช้จ่าย"
        >
          <View style={[styles.iconWrapper, activeTab === "calendar" && styles.iconWrapperActive]}>
            <CalendarDays
              size={18}
              color={activeTab === "calendar" ? colors.emerald400 : colors.slate400}
              strokeWidth={activeTab === "calendar" ? 2.2 : 1.8}
            />
          </View>
          <Text style={[styles.tabLabel, activeTab === "calendar" && styles.tabLabelActive]}>
            ปฏิทิน
          </Text>
        </TouchableOpacity>

        {/* Center FAB - Primary Action & Default Home Anchor */}
        <TouchableOpacity
          style={[styles.fabButton, activeTab === "main" && styles.fabButtonActive]}
          activeOpacity={0.85}
          onPress={() => onTabChange("main")}
          accessibilityRole="button"
          accessibilityLabel="หน้าหลัก บันทึกรายรับรายจ่าย"
        >
          <Plus size={20} color={colors.white} strokeWidth={2.6} />
        </TouchableOpacity>

        {/* Right Tab: Profile (Second Priority) */}
        <TouchableOpacity
          style={styles.sideTab}
          activeOpacity={0.7}
          onPress={() => onTabChange("profile")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "profile" }}
          accessibilityLabel="โปรไฟล์และงบประมาณ"
        >
          <View style={[styles.iconWrapper, activeTab === "profile" && styles.iconWrapperActive]}>
            <User
              size={18}
              color={activeTab === "profile" ? colors.emerald400 : colors.slate400}
              strokeWidth={activeTab === "profile" ? 2.2 : 1.8}
            />
          </View>
          <Text style={[styles.tabLabel, activeTab === "profile" && styles.tabLabelActive]}>
            โปรไฟล์
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: BAR_SIDE_INSET,
    right: BAR_SIDE_INSET,
    zIndex: 99,
  },
  pill: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  sideTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconWrapper: {
    width: 40,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    backgroundColor: tints.emerald20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.slate400,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.emerald400,
    fontWeight: "700",
  },
  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    marginHorizontal: 12,
    backgroundColor: colors.emerald600,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.emerald500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  fabButtonActive: {
    backgroundColor: colors.emerald500,
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
});
