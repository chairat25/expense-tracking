import { useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as MediaLibrary from "expo-media-library/legacy";
import { isAssetHandled, isSlipOcrAvailable, markAssetHandled } from "../../../modules/slip-ocr";

const MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes, same window as ios/ExpenseTracker/Slip/SlipInbox.swift

export interface DetectedReceipt {
  id: string;
  uri: string;
  creationTime: number;
}

export function useRecentReceiptSniffer(onNewReceiptDetected: (receipt: DetectedReceipt) => void) {
  const checkLatestPhoto = useCallback(async () => {
    // Slip detection needs on-device OCR (iOS only).
    if (!isSlipOcrAvailable) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;

      const assets = await MediaLibrary.getAssetsAsync({
        first: 1,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.photo],
      });

      if (!assets || assets.assets.length === 0) return;
      const latest = assets.assets[0];

      const now = Date.now();
      const age = now - (latest.creationTime || now);
      if (age > MAX_AGE_MS) return;

      // Shared with the Shortcuts intent, so a slip announced on the Dynamic Island is not offered again.
      if (isAssetHandled(latest.id)) return;
      markAssetHandled(latest.id);

      onNewReceiptDetected({
        id: latest.id,
        uri: latest.uri,
        creationTime: latest.creationTime,
      });
    } catch (err) {
      console.warn("[ReceiptSniffer Error]", err);
    }
  }, [onNewReceiptDetected]);

  useEffect(() => {
    checkLatestPhoto();

    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        checkLatestPhoto();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkLatestPhoto]);
}
