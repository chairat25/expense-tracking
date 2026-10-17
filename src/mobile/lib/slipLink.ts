// Deep link opened from the Dynamic Island / notification (built in ios/SlipKit/SlipActivity.swift).
// Parsed by hand because React Native's URL polyfill lacks searchParams.
const SLIP_LINK = /^com\.expensetracker\.mobile:\/\/slip\/?\?(?:.*&)?asset=([^&#]+)/;

/** Photo asset id carried by a slip deep link, or null for any other URL. */
export function parseSlipLink(url: string | null): string | null {
  const match = url ? SLIP_LINK.exec(url) : null;
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
