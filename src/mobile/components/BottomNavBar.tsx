import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { CalendarDays, Plus, User } from "lucide-react-native";
import { colors, tints } from "../theme";

export type NavTab = "calendar" | "main" | "profile";

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Optional badge or indicator on profile */
  hasUnsavedProfile?: boolean;
}

// Native iOS Minimal Ergonomics (44pt Apple Touch Target Standard)
const BAR_HEIGHT = 50;
const FAB_SIZE = 44;
const CORNER_RADIUS = 24;
const NOTCH_WIDTH = 86;
const NOTCH_DEPTH = 20;

/** Bottom padding a scrollable screen needs so its last item clears the bottom bar */
export const NAV_BAR_CLEARANCE = 80;

export function BottomNavBar({ activeTab, onTabChange }: Props) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const bottomPadding = Math.max(insets.bottom, 8);
  const totalHeight = BAR_HEIGHT + bottomPadding;

  const cx = screenWidth / 2;
  const nw = NOTCH_WIDTH / 2;
  const k = 0.4477; // Quarter-circle cubic bezier approximation constant

  // Smooth S-curve control offsets for organic fluid notch (C1 continuous)
  const c1x = (cx - nw) + nw * 0.40;
  const c2x = cx - nw * 0.40;
  const c3x = cx + nw * 0.40;
  const c4x = (cx + nw) - nw * 0.40;

  // Precision path with rounded top shoulders (CORNER_RADIUS) and organic curved notch
  const d = `
    M 0,${totalHeight}
    L 0,${CORNER_RADIUS}
    C 0,${(CORNER_RADIUS * k).toFixed(2)} ${(CORNER_RADIUS * k).toFixed(2)},0 ${CORNER_RADIUS},0
    L ${(cx - nw).toFixed(2)},0
    C ${c1x.toFixed(2)},0 ${c2x.toFixed(2)},${NOTCH_DEPTH} ${cx},${NOTCH_DEPTH}
    C ${c3x.toFixed(2)},${NOTCH_DEPTH} ${c4x.toFixed(2)},0 ${(cx + nw).toFixed(2)},0
    L ${(screenWidth - CORNER_RADIUS).toFixed(2)},0
    C ${(screenWidth - CORNER_RADIUS * k).toFixed(2)},0 ${screenWidth},${(CORNER_RADIUS * k).toFixed(2)} ${screenWidth},${CORNER_RADIUS}
    L ${screenWidth},${totalHeight}
    Z
  `;

  return (
    <View style={[styles.wrapper, { height: totalHeight }]} pointerEvents="box-none">
      {/* Precision curved SVG background with rounded shoulders & notch */}
      <View style={[StyleSheet.absoluteFill, styles.svgContainer]} pointerEvents="none">
        <Svg width={screenWidth} height={totalHeight} style={StyleSheet.absoluteFill}>
          <Path
            d={d}
            fill="#080c15"
            stroke="rgba(255, 255, 255, 0.09)"
            strokeWidth={1}
          />
        </Svg>
      </View>

      <View style={[styles.barContent, { height: BAR_HEIGHT }]}>
        {/* Left Tab: Calendar (Second Priority) */}
        <TouchableOpacity
          style={styles.sideTab}
          activeOpacity={0.65}
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
        <View style={{ width: NOTCH_WIDTH }} pointerEvents="none" />

        {/* Right Tab: Profile (Second Priority) */}
        <TouchableOpacity
          style={styles.sideTab}
          activeOpacity={0.65}
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
            <Plus size={20} color="#ffffff" strokeWidth={2.6} />
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
    shadowRadius: 10,
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
    width: 36,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.slate400,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.emerald400,
    fontWeight: "600",
  },
  fabContainer: {
    position: "absolute",
    top: -10,
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
    borderWidth: 2,
    borderColor: "#080c15",
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
