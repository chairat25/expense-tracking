import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { buildSlipAnalyzer, SLIP_ANALYZER_BUNDLE_PATH } from "../../../scripts/build-slip-analyzer.mjs";

describe("native slip-analyzer bundle", () => {
  it("is up to date with slipAnalyzer.ts (run npm run build:slip-analyzer)", async () => {
    const fresh: string = await buildSlipAnalyzer();
    const committed = readFileSync(SLIP_ANALYZER_BUNDLE_PATH, "utf8");

    expect(committed).toBe(fresh);
  });

  it("exposes analyzeSlip on the SlipAnalyzer global for JavaScriptCore", () => {
    const sandbox: { SlipAnalyzer?: { analyzeSlip(text: string): unknown } } = {};
    runInNewContext(readFileSync(SLIP_ANALYZER_BUNDLE_PATH, "utf8"), sandbox);

    const result = sandbox.SlipAnalyzer?.analyzeSlip("โอนเงินสำเร็จ\nไปยัง Café Amazon\nจำนวนเงิน 85.00 บาท");

    expect(result).toEqual({ isSlip: true, amount: 85, note: "Café Amazon", category: "drink" });
  });
});
