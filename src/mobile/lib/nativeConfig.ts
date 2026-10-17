import { supabaseStorageKey } from "./slipAnalyzer";

/**
 * Settings native code (Dynamic Island save button, share extension) needs to call
 * the API on the user's behalf. Decoded by NativeConfig in ios/SlipKit/SlipKitModels.swift.
 */
export interface NativeConfig {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  sessionStorageKey: string;
}

/** Keychain service/key read by NativeConfig.load() (expo-secure-store appends ":no-auth"). */
export const NATIVE_CONFIG_SERVICE = "expense-native";
export const NATIVE_CONFIG_KEY = "native-config";

export function buildNativeConfig(env: Omit<NativeConfig, "sessionStorageKey">): NativeConfig | null {
  if (!env.apiBaseUrl || !env.supabaseUrl || !env.supabaseAnonKey) return null;
  return { ...env, sessionStorageKey: supabaseStorageKey(env.supabaseUrl) };
}
