import { describe, expect, it } from "vitest";
import { buildNativeConfig } from "./nativeConfig";

describe("buildNativeConfig", () => {
  it("bundles API + Supabase settings and the session keychain key for native code", () => {
    const config = buildNativeConfig({
      apiBaseUrl: "https://api.example.com",
      supabaseUrl: "https://abcdefgh.supabase.co",
      supabaseAnonKey: "anon",
    });

    expect(config).toEqual({
      apiBaseUrl: "https://api.example.com",
      supabaseUrl: "https://abcdefgh.supabase.co",
      supabaseAnonKey: "anon",
      sessionStorageKey: "sb-abcdefgh-auth-token",
    });
  });

  it("returns null when the API url is not configured", () => {
    const config = buildNativeConfig({
      apiBaseUrl: "",
      supabaseUrl: "https://abcdefgh.supabase.co",
      supabaseAnonKey: "anon",
    });

    expect(config).toBeNull();
  });
});
