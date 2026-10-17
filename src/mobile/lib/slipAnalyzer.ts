import type { CategorySlug } from "./shared";
import { isLikelySlip, parseSlipText } from "./slipParser";

/**
 * Single entry point for "is this OCR text a slip, and what does it say?".
 * Used by the RN app and, bundled via scripts/build-slip-analyzer.mjs,
 * by native Swift code (App Intent, share extension) through JavaScriptCore,
 * so slip rules live in one place.
 */

export const DEFAULT_SLIP_NOTE = "สแกนสลิปโอนเงิน";

export type SlipAnalysis =
  | { isSlip: false }
  | { isSlip: true; amount: number; note: string; category: CategorySlug };

export function analyzeSlip(text: string): SlipAnalysis {
  if (!isLikelySlip(text)) return { isSlip: false };

  const parsed = parseSlipText(text);
  if (parsed.amount === null) return { isSlip: false };

  return {
    isSlip: true,
    amount: parsed.amount,
    note: parsed.receiver ?? DEFAULT_SLIP_NOTE,
    category: parsed.category,
  };
}

/** Keychain key supabase-js uses for the session when no storageKey is configured. */
export function supabaseStorageKey(supabaseUrl: string): string {
  return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
}
