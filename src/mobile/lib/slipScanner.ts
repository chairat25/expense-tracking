import * as MediaLibrary from "expo-media-library/legacy";
import { isSlipOcrAvailable, recognizeText } from "../../../modules/slip-ocr";
import type { CategorySlug } from "./shared";
import { analyzeSlip } from "./slipAnalyzer";

export interface ScannedSlip {
  amount: number;
  note: string;
  category: CategorySlug;
  /** When the photo was taken (ms); the slip's transfer time for freshly saved slips. */
  creationTime: number;
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

    const analysis = analyzeSlip(await recognizeText(info.localUri));
    if (!analysis.isSlip) return null;

    return {
      amount: analysis.amount,
      note: analysis.note,
      category: analysis.category,
      creationTime: info.creationTime,
      imageUri: info.localUri,
    };
  } catch (err) {
    console.warn("[SlipScanner] failed to scan asset", assetId, err);
    return null;
  }
}
