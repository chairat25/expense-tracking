import { useEffect, useRef } from "react";
import { Linking } from "react-native";
import { parseSlipLink, type SlipLink } from "../lib/slipLink";

/** Calls onSlip(link) when the app is opened from a slip Live Activity / notification. */
export function useSlipDeepLink(onSlip: (link: SlipLink) => void) {
  const onSlipRef = useRef(onSlip);
  onSlipRef.current = onSlip;

  useEffect(() => {
    const handle = (url: string | null) => {
      const link = parseSlipLink(url);
      if (link) onSlipRef.current(link);
    };

    Linking.getInitialURL()
      .then(handle)
      .catch((err) => console.warn("[SlipDeepLink] failed to read initial URL", err));
    const subscription = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => subscription.remove();
  }, []);
}
