import { useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@last_processed_receipt_id";
const MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

export interface DetectedReceipt {
  id: string;
  uri: string;
  creationTime: number;
}

export function useRecentReceiptSniffer(onNewReceiptDetected: (receipt: DetectedReceipt) => void) {
  const checkLatestPhoto = useCallback(async () => {
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

      const lastProcessed = await AsyncStorage.getItem(STORAGE_KEY);
      if (lastProcessed === latest.id) return;

      // Mark as acknowledged and trigger callback
      await AsyncStorage.setItem(STORAGE_KEY, latest.id);
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
