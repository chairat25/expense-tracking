import { requireOptionalNativeModule } from "expo-modules-core";

interface SlipOcrNativeModule {
  recognizeTextAsync(fileUri: string): Promise<string[]>;
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
