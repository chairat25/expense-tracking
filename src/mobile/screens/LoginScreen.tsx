import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors, radius } from "../theme";

type Mode = "signin" | "signup";

const ERROR_TH: Record<string, string> = {
  "Invalid login credentials": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "Email not confirmed": "ยังไม่ได้ยืนยันอีเมล — เช็กกล่องจดหมายก่อน",
  "User already registered": "อีเมลนี้สมัครไว้แล้ว ลองเข้าสู่ระบบแทน",
  "Password should be at least 6 characters": "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร",
};

const MIN_PASSWORD_LENGTH = 6;

/** หน้าล็อกอินเหมือน /login ของเว็บ (อีเมล+รหัสผ่าน; Google OAuth ยังไม่รองรับบน native) */
export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || password.length < MIN_PASSWORD_LENGTH) {
      setError("กรอกอีเมลและรหัสผ่าน (อย่างน้อย 6 ตัว)");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);

    const credentials = { email: email.trim(), password };
    const { error: authError } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    setBusy(false);
    if (authError) {
      setError(ERROR_TH[authError.message] ?? authError.message);
      return;
    }
    if (mode === "signup") setInfo("สมัครแล้ว! เช็กอีเมลเพื่อกดยืนยันก่อนเข้าใช้งาน");
  }

  function toggleMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setInfo(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.hero}>
          <Text style={styles.emoji}>💰</Text>
          <Text style={styles.title}>บันทึกรายรับรายจ่าย</Text>
          <Text style={styles.subtitle}>
            {mode === "signin" ? "เข้าสู่ระบบเพื่อดูข้อมูลของคุณ" : "สร้างบัญชีใหม่"}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="อีเมล"
            placeholderTextColor={colors.slate500}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
            placeholderTextColor={colors.slate500}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {info && <Text style={styles.info}>{info}</Text>}

          <TouchableOpacity style={[styles.submit, busy && styles.disabled]} onPress={submit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>{mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={toggleMode}>
          <Text style={styles.toggle}>
            {mode === "signin" ? "ยังไม่มีบัญชี? " : "มีบัญชีอยู่แล้ว? "}
            <Text style={styles.toggleLink}>{mode === "signin" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate950 },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 24, maxWidth: 384, width: "100%", alignSelf: "center" },
  hero: { alignItems: "center", gap: 4 },
  emoji: { fontSize: 40 },
  title: { color: colors.white, fontSize: 20, fontWeight: "700", marginTop: 8 },
  subtitle: { color: colors.slate400, fontSize: 13 },
  form: { gap: 10 },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate800,
    backgroundColor: colors.slate900,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.white,
    fontSize: 14,
  },
  error: {
    color: colors.rose300,
    fontSize: 13,
    backgroundColor: "rgba(76,5,25,0.5)",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  info: {
    color: colors.emerald300,
    fontSize: 13,
    backgroundColor: "rgba(2,44,34,0.5)",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  submit: {
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.indigo600,
  },
  submitText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  toggle: { color: colors.slate400, fontSize: 13, textAlign: "center" },
  toggleLink: { color: colors.indigo400, textDecorationLine: "underline" },
});
