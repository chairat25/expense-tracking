import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, AppState, AppStateStatus } from "react-native";
import { ShieldCheck } from "lucide-react-native";

interface Props {
  children: React.ReactNode;
}

/**
 * Privacy Shield: ปิดบังหน้าจอแสดงยอดเงินและข้อมูลการเงินเมื่อสลับไปหน้า App Switcher (Multitasking)
 */
export const PrivacyShield: React.FC<Props> = ({ children }) => {
  const [isInBackground, setIsInBackground] = useState(false);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      // เมื่อหลุดออกจาก active (เช่น กำลังปัดสลับแอป หรืออยู่บน background)
      if (nextState === "inactive" || nextState === "background") {
        setIsInBackground(true);
      } else if (nextState === "active") {
        setIsInBackground(false);
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.container}>
      {children}
      {isInBackground && (
        <View style={styles.shieldOverlay}>
          <ShieldCheck size={48} color="#10b981" />
          <Text style={styles.shieldTitle}>Expense Tracker</Text>
          <Text style={styles.shieldSub}>ข้อมูลการเงินได้รับการปกป้อง</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shieldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999999,
  },
  shieldTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },
  shieldSub: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
  },
});
