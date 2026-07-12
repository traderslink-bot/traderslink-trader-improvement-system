import { describe, expect, it } from "vitest";
import { sampleCreateRawTradeTimelineInput } from "../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { analyzeTradeWithLevelsSystem } from "../trade-analysis-engine";

describe("analyzeTradeWithLevelsSystem integration", () => {
  it("runs Layer 1 through Layer 3 using the shared support/resistance engine", async () => {
    const result = await analyzeTradeWithLevelsSystem(
      sampleCreateRawTradeTimelineInput,
      buildSampleLevelsSystemSupportResistanceOptions(),
    );

    const detectedPatternIds = result.detectedPatterns.detectedPatterns.map(
      (pattern) => pattern.patternId,
    );
    const normalizedPatternIds =
      result.normalizedPatterns.prioritizedPatterns.map(
        (pattern) => pattern.patternId,
      );

    expect(result.rawTradeTimeline.supportLevels?.length).toBeGreaterThan(0);
    expect(result.rawTradeTimeline.resistanceLevels?.length).toBeGreaterThan(0);
    expect(result.rawTradeTimeline.experimentalMarketStructure).toMatchObject({
      state: "base_building",
      trend: {
        direction: "uptrend",
      },
      confidence: {
        label: "high",
      },
    });
    expect(
      "experimentalMarketStructure" in
        result.patternInput.supportResistanceContext,
    ).toBe(false);
    expect(
      result.patternInput.supportResistanceContext
        .hadSupportResistanceContextAvailable,
    ).toBe(true);
    expect(
      result.patternInput.supportResistanceContext
        .hadInsufficientCandleDataForStructuralContext,
    ).toBe(false);
    expect(detectedPatternIds).toContain("entry_far_from_support_structure");
    expect(detectedPatternIds).toContain("advantaged_entry_structure");
    expect(detectedPatternIds).toContain("balanced_position_management");
    expect(normalizedPatternIds[0]).toBeTruthy();
    expect(normalizedPatternIds).toContain("entry_far_from_support_structure");
  });
});
