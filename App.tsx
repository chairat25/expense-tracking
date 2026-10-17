import React, { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { Session } from "@supabase/supabase-js";
import { SecurityProvider } from "./src/mobile/context/SecurityContext";
import { PrivacyShield } from "./src/mobile/components/PrivacyShield";
import { supabase } from "./src/mobile/lib/supabase";
import { HomeScreen } from "./src/mobile/screens/HomeScreen";
import { LoginScreen } from "./src/mobile/screens/LoginScreen";
import { colors } from "./src/mobile/theme";

type AuthState = { status: "loading" } | { status: "ready"; session: Session | null };

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setAuth({ status: "ready", session: data.session }))
      .catch(() => setAuth({ status: "ready", session: null }));

    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setAuth({ status: "ready", session }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <SecurityProvider>
        <PrivacyShield>
          <StatusBar barStyle="light-content" backgroundColor={colors.slate950} />
          {auth.status === "loading" ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.emerald500} />
            </View>
          ) : auth.session ? (
            <HomeScreen />
          ) : (
            <LoginScreen />
          )}
        </PrivacyShield>
      </SecurityProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.slate950 },
});
