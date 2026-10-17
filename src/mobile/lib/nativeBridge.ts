import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { requestAlertPermission } from "../../../modules/slip-ocr";
import { API_BASE_URL } from "./apiClient";
import { buildNativeConfig, NATIVE_CONFIG_KEY, NATIVE_CONFIG_SERVICE } from "./nativeConfig";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase";

/**
 * Lets the iOS Shortcuts intent, Dynamic Island buttons and share extension
 * save expenses without opening the app: publishes API/Supabase settings to the
 * shared keychain and asks for banner permission (fallback when Live Activities are off).
 */
export async function prepareNativeSlipFeatures(): Promise<void> {
  if (Platform.OS !== "ios") return;

  const config = buildNativeConfig({
    apiBaseUrl: API_BASE_URL,
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  });
  try {
    if (config) {
      await SecureStore.setItemAsync(NATIVE_CONFIG_KEY, JSON.stringify(config), {
        keychainService: NATIVE_CONFIG_SERVICE,
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    }
    await requestAlertPermission();
  } catch (err) {
    console.warn("[NativeBridge] failed to prepare native slip features", err);
  }
}
