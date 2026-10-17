import * as MediaLibrary from "expo-media-library/legacy";
import { isSlipOcrAvailable, recognizeText } from "../../../modules/slip-ocr";
import { isLikelySlip, parseSlipText, type ParsedSlipResult } from "./slipParser";

export interface ScannedSlip {
  parsed: ParsedSlipResult & { amount: number };
  /** file:// URI that <Image> can render (photo-library ph:// URIs cannot). */
  imageUri: string;
}

/**
 * OCR a photo-library asset and parse it as a payment slip.
 * Returns null when the photo is not a slip (selfie, chat screenshot, ...)
 * or when on-device OCR is unavailable, so callers can silently skip it.
 */
export async function scanSlipAsset(assetId: string): Promise<ScannedSlip | null> {
  if (!isSlipOcrAvailable) return null;

  try {
    const info = await MediaLibrary.getAssetInfoAsync(assetId, { shouldDownloadFromNetwork: false });
    if (!info.localUri) return null;

    const text = await recognizeText(info.localUri);
    if (!isLikelySlip(text)) return null;

    const parsed = parseSlipText(text);
    if (parsed.amount === null) return null;
    return { parsed: { ...parsed, amount: parsed.amount }, imageUri: info.localUri };
  } catch (err) {
    console.warn("[SlipScanner] failed to scan asset", assetId, err);
    return null;
  }
}
