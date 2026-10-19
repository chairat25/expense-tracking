import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { ShieldCheck, Lock, Fingerprint } from "lucide-react-native";

interface SecurityContextType {
  isLocked: boolean;
  /** Unlocked, no Face ID prompt showing, and the app is in the foreground. */
  isReady: boolean;
  authenticate: () => Promise<boolean>;
  /** Lock now and ask for Face ID once the app is in the foreground, even if it was unlocked. */
  requireUnlock: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const AUTO_LOCK_TIMEOUT_MS = 60 * 1000; // ล็อกอัตโนมัติหากออกจากแอปเกิน 1 นาที

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active");
  const backgroundTime = useRef<number | null>(null);
  const authInFlight = useRef<Promise<boolean> | null>(null);
  // Face ID can only be shown while the app is active; defer the prompt until then.
  const shouldAuthOnActive = useRef(false);

  // Share one prompt between the launch check and the foreground re-lock.
  const authenticate = (): Promise<boolean> => {
    if (!authInFlight.current) {
      setIsAuthenticating(true);
      authInFlight.current = runAuthentication().finally(() => {
        authInFlight.current = null;
        setIsAuthenticating(false);
      });
    }
    return authInFlight.current;
  };

  const runAuthentication = async (): Promise<boolean> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        // หากอุปกรณ์ไม่มี Biometrics ให้ผ่านได้
        setIsLocked(false);
        return true;
      }

      setHasBiometrics(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "ยืนยันตัวตนเพื่อเข้าสู่ระบบ Expense Tracker",
        fallbackLabel: "ใช้รหัสผ่านอุปกรณ์",
        cancelLabel: "ยกเลิก",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[Biometric Error]", err);
      return false;
    }
  };

  const requireUnlock = () => {
    setIsLocked(true);
    // A prompt already on screen (e.g. the launch check) will unlock it.
    if (authInFlight.current) return;
    if (AppState.currentState === "active") authenticate();
    else shouldAuthOnActive.current = true;
  };

  useEffect(() => {
    authenticate();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      setIsAppActive(nextState === "active");
      // The Face ID sheet itself makes the app "inactive"; don't count that as leaving.
      if (nextState === "background" || (nextState === "inactive" && !authInFlight.current)) {
        backgroundTime.current = Date.now();
      }

      if (nextState === "active") {
        if (shouldAuthOnActive.current) {
          shouldAuthOnActive.current = false;
          authenticate();
        }
        if (backgroundTime.current) {
          const elapsed = Date.now() - backgroundTime.current;
          backgroundTime.current = null;
          if (elapsed > AUTO_LOCK_TIMEOUT_MS) {
            setIsLocked(true);
            authenticate();
          }
        }
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <SecurityContext.Provider
      value={{ isLocked, isReady: !isLocked && !isAuthenticating && isAppActive, authenticate, requireUnlock }}
    >
      {children}
      {isLocked && (
        <View style={styles.lockOverlay}>
          <View style={styles.iconCircle}>
            <Lock size={44} color="#10b981" />
          </View>
          <Text style={styles.lockTitle}>แอปพลิเคชันถูกล็อก</Text>
          <Text style={styles.lockSubtitle}>
            ยืนยันตัวตนด้วย Face ID, ลายนิ้วมือ หรือรหัสผ่าน เพื่อเข้าใช้งานข้อมูลการเงิน
          </Text>
          <TouchableOpacity style={styles.unlockBtn} onPress={authenticate}>
            <Fingerprint size={20} color="#ffffff" />
            <Text style={styles.unlockBtnText}>ปลดล็อกด้วย Biometrics</Text>
          </TouchableOpacity>
        </View>
      )}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within SecurityProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 99999,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    maxWidth: 280,
  },
  unlockBtn: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  unlockBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
