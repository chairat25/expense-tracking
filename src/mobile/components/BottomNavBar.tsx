import React from "react";
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { CalendarDays, Plus, User } from "lucide-react-native";
import { colors, radius, tints } from "../theme";

export type NavTab = "calendar" | "main" | "profile";

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Optional badge or indicator on profile */
  hasUnsavedProfile?: boolean;
}

const BAR_HEIGHT = 50;
const FAB_SIZE = 46;
const NOTCH_WIDTH = 72;
const NOTCH_DEPTH = 20;

export function BottomNavBar({ activeTab, onTabChange }: Props) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const bottomPadding = Math.max(insets.bottom, 8);
  const totalHeight = BAR_HEIGHT + bottomPadding;

  // Generate smooth cubic bezier SVG path for the center notch cutout
  const cx = screenWidth / 2;
  const nw2 = NOTCH_WIDTH / 2;
  const notchLeft = cx - nw2;
  const notchRight = cx + nw2;

  // Smooth curved dip around the center circular button
  const d = `
    M 0,0
    L ${notchLeft - 10},0
    C ${notchLeft + 2},0 ${cx - 24},${NOTCH_DEPTH} ${cx},${NOTCH_DEPTH}
    C ${cx + 24},${NOTCH_DEPTH} ${notchRight - 2},0 ${notchRight + 10},0
    L ${screenWidth},0
    L ${screenWidth},${totalHeight}
    L 0,${totalHeight}
    Z
  `;

  return (
    <View style={[styles.wrapper, { height: totalHeight }]} pointerEvents="box-none">
      {/* Background with precision curved SVG notch */}
      <View style={[StyleSheet.absoluteFill, styles.svgContainer]} pointerEvents="none">
        <Svg width={screenWidth} height={totalHeight} style={StyleSheet.absoluteFill}>
          <Path
            d={d}
            fill="#090d16"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={1}
          />
        </Svg>
      </View>

      <View style={[styles.barContent, { height: BAR_HEIGHT }]}>
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

        {/* Center Space for FAB */}
        <View style={styles.centerSpace} pointerEvents="none" />

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

      {/* Center FAB - Primary Action & Default Home Anchor */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.fabButton, activeTab === "main" && styles.fabButtonActive]}
          activeOpacity={0.85}
          onPress={() => onTabChange("main")}
          accessibilityRole="button"
          accessibilityLabel="หน้าหลัก บันทึกรายรับรายจ่าย"
        >
          <View style={styles.fabInner}>
            <Plus size={22} color="#ffffff" strokeWidth={2.8} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 99,
  },
  svgContainer: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 12,
  },
  barContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
  },
  sideTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 32,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    backgroundColor: tints.emerald20,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: "600",
    color: colors.slate400,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.emerald400,
    fontWeight: "700",
  },
  centerSpace: {
    width: NOTCH_WIDTH,
  },
  fabContainer: {
    position: "absolute",
    top: -12,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.emerald600,
    borderWidth: 2.5,
    borderColor: "#090d16",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButtonActive: {
    backgroundColor: colors.emerald500,
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  fabInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
