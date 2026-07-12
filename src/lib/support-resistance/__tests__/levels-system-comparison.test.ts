import { describe, expect, it } from "vitest";
import { analyzeTrade, analyzeTradeWithLevelsSystem } from "../../trade-analysis-engine";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../__fixtures__/sample-levels-system-fetch-service";
import { buildLevelsSystemAnalysisComparison } from "../comparison/build-levels-system-analysis-comparison";

describe("levels-system analysis comparison", () => {
  it("shows the sample trade fields and pattern IDs affected by the shared engine", async () => {
    const local = analyzeTrade(sampleCreateRawTradeTimelineInput);
    const shared = await analyzeTradeWithLevelsSystem(
      sampleCreateRawTradeTimelineInput,
      buildSampleLevelsSystemSupportResistanceOptions(),
    );

    const comparison = buildLevelsSystemAnalysisComparison({ local, shared });
    const changedFieldNames = comparison.changedSupportResistanceFields.map(
      (field) => field.field,
    );

    expect(comparison.levelCounts.sharedSupportLevels).toBeGreaterThan(0);
    expect(comparison.levelCounts.sharedResistanceLevels).toBeGreaterThan(0);
    expect(comparison.dynamicLevels.shared).toEqual({
      vwap: expect.any(Number),
      ema9: expect.any(Number),
      ema20: expect.any(Number),
    });
    expect(comparison.experimentalMarketStructure.local).toBeUndefined();
    expect(comparison.experimentalMarketStructure.shared).toMatchObject({
      state: "base_building",
      trend: {
        direction: "uptrend",
      },
      confidence: {
        label: "high",
      },
    });
    expect(changedFieldNames).toContain("firstEntryNearestSupportBelowPrice");
    expect(changedFieldNames).toContain("firstEntryNearestResistanceAbovePrice");
    expect(changedFieldNames).not.toContain("firstEntryDistanceFromVwapPct");
    expect(comparison.detectedPatternIds.sharedIds.length).toBeGreaterThan(0);
    expect(comparison.normalizedPatternIds.sharedIds.length).toBeGreaterThan(0);
  });
});
