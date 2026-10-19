// Deep link opened from the Dynamic Island / notification (built in ios/SlipKit/SlipActivity.swift).
// Parsed by hand because React Native's URL polyfill lacks searchParams.
const SLIP_LINK = /^com\.expensetracker\.mobile:\/\/slip\/?\?([^#]*)/;

export interface SlipLink {
  assetId: string;
  /** Opened from the "บันทึก" button: save right after Face ID instead of waiting for a tap. */
  shouldAutoSave: boolean;
}

function readParam(query: string, name: string): string | null {
  const pair = query.split("&").find((part) => part.startsWith(`${name}=`));
  return pair ? pair.slice(name.length + 1) : null;
}

/** Slip carried by a deep link, or null for any other URL. */
export function parseSlipLink(url: string | null): SlipLink | null {
  const match = url ? SLIP_LINK.exec(url) : null;
  if (!match) return null;
  const rawAsset = readParam(match[1], "asset");
  if (!rawAsset) return null;
  try {
    return { assetId: decodeURIComponent(rawAsset), shouldAutoSave: readParam(match[1], "action") === "save" };
  } catch {
    return null;
  }
}
