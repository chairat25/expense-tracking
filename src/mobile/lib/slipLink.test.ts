import { describe, expect, it } from "vitest";
import { parseSlipLink } from "./slipLink";

describe("parseSlipLink", () => {
  it("returns the decoded photo asset id from a Live Activity link", () => {
    const url = "com.expensetracker.mobile://slip?asset=ABC-123%2FL0%2F001";

    expect(parseSlipLink(url)).toBe("ABC-123/L0/001");
  });

  it("ignores links for other screens", () => {
    expect(parseSlipLink("com.expensetracker.mobile://login?asset=x")).toBeNull();
  });

  it("ignores slip links without an asset id", () => {
    expect(parseSlipLink("com.expensetracker.mobile://slip")).toBeNull();
  });

  it("ignores null and malformed urls", () => {
    expect(parseSlipLink(null)).toBeNull();
    expect(parseSlipLink("not a url")).toBeNull();
  });
});
