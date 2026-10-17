import { requireOptionalNativeModule } from "expo-modules-core";

interface SlipOcrNativeModule {
  recognizeTextAsync(fileUri: string): Promise<string[]>;
  getHandledAssetIds(): string[];
  markAssetHandled(assetId: string): void;
  requestAlertPermissionAsync(): Promise<boolean>;
}

// iOS only; null on platforms without the native module (e.g. Android, web).
const SlipOcr = requireOptionalNativeModule<SlipOcrNativeModule>("SlipOcr");

export const isSlipOcrAvailable = SlipOcr !== null;

/** Returns recognized text (Thai + English) of a local image, one line per row. */
export async function recognizeText(fileUri: string): Promise<string> {
  if (!SlipOcr) throw new Error("SlipOcr native module is not available on this platform");
  const lines = await SlipOcr.recognizeTextAsync(fileUri);
  return lines.join("\n");
}

/**
 * Photo ids already offered as slips. Shared with the native Shortcuts intent
 * (ios/ExpenseTracker/Slip/SlipInbox.swift) so each slip is offered only once.
 */
export function isAssetHandled(assetId: string): boolean {
  return SlipOcr?.getHandledAssetIds().includes(assetId) ?? false;
}

export function markAssetHandled(assetId: string): void {
  SlipOcr?.markAssetHandled(assetId);
}

/** Asks for banner permission (used when Live Activities are disabled). */
export async function requestAlertPermission(): Promise<boolean> {
  return (await SlipOcr?.requestAlertPermissionAsync()) ?? false;
}
