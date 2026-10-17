import { useEffect, useRef } from "react";
import { Linking } from "react-native";
import { parseSlipLink } from "../lib/slipLink";

/** Calls onSlip(assetId) when the app is opened from a slip Live Activity / notification. */
export function useSlipDeepLink(onSlip: (assetId: string) => void) {
  const onSlipRef = useRef(onSlip);
  onSlipRef.current = onSlip;

  useEffect(() => {
    const handle = (url: string | null) => {
      const assetId = parseSlipLink(url);
      if (assetId) onSlipRef.current(assetId);
    };

    Linking.getInitialURL()
      .then(handle)
      .catch((err) => console.warn("[SlipDeepLink] failed to read initial URL", err));
    const subscription = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => subscription.remove();
  }, []);
}
