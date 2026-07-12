import { describe, expect, it } from "vitest";
import { sampleCreateRawTradeTimelineInput } from "../../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../__fixtures__/sample-levels-system-fetch-service";
import {
  buildExperimentalMarketStructureAudit,
  buildExperimentalMarketStructureAuditFromLevelsSystemCandles,
} from "../build-experimental-market-structure-audit";

describe("buildExperimentalMarketStructureAudit", () => {
  it("summarizes shared market structure without leaking it into PatternInput", async () => {
    const audit = await buildExperimentalMarketStructureAudit({
      trades: [sampleCreateRawTradeTimelineInput],
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    });

    expect(audit.observationalOnly).toBe(true);
    expect(audit.totals).toMatchObject({
      totalTrades: 1,
      successfulTrades: 1,
      failedTrades: 0,
      missingMarketStructureCount: 0,
      patternInputLeakCount: 0,
      totalSupportLevels: 7,
      totalResistanceLevels: 3,
    });
    expect(audit.totals.stateCounts).toEqual({ base_building: 1 });
    expect(audit.totals.trendDirectionCounts).toEqual({ uptrend: 1 });
    expect(audit.totals.confidenceCounts).toEqual({ high: 1 });

    const record = audit.records[0];

    expect(record).toMatchObject({
      tradeIndex: 0,
      symbol: "ABCD",
      sessionDate: "2024-04-12",
      tradeDirection: "long",
      candleSource: "provided_trade_candles",
      analysisStatus: "ok",
      supportResistanceMode: "levels_system",
      patternInputContainsExperimentalMarketStructure: false,
      levelCounts: {
        support: 7,
        resistance: 3,
      },
      marketStructure: {
        state: "base_building",
        trendDirection: "uptrend",
        confidence: {
          label: "high",
        },
      },
    });
    expect(record.detectedPatternIds).toContain(
      "entry_far_from_support_structure",
    );
    expect(record.normalizedPatternIds.length).toBeGreaterThan(0);
    expect(record).not.toHaveProperty("grade");
    expect(record).not.toHaveProperty("coaching");
    expect(record).not.toHaveProperty("finalConclusion");
  });

  it("keeps one failing saved trade from stopping the whole audit batch", async () => {
    const invalidTrade = {
      ...sampleCreateRawTradeTimelineInput,
      symbol: "   ",
    };

    const audit = await buildExperimentalMarketStructureAudit({
      trades: [sampleCreateRawTradeTimelineInput, invalidTrade],
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    });

    expect(audit.totals).toMatchObject({
      totalTrades: 2,
      successfulTrades: 1,
      failedTrades: 1,
      missingMarketStructureCount: 1,
      patternInputLeakCount: 0,
    });
    expect(audit.records[1]).toMatchObject({
      tradeIndex: 1,
      candleSource: "provided_trade_candles",
      analysisStatus: "error",
      supportResistanceMode: "levels_system",
      marketStructure: null,
      detectedPatternIds: [],
      normalizedPatternIds: [],
    });
    expect(audit.records[1].errorMessage).toMatch(/symbol cannot be empty/i);
  });

  it("can audit trades whose candles are fetched by levels-system", async () => {
    const audit =
      await buildExperimentalMarketStructureAuditFromLevelsSystemCandles({
        trades: [
          {
            symbol: sampleCreateRawTradeTimelineInput.symbol,
            tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
            executions: sampleCreateRawTradeTimelineInput.executions,
            sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
            tradeWindow: {
              timeframe: "1m",
              preTradeMinutes: 60,
              postTradeMinutes: 60,
            },
          },
        ],
        levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      });

    expect(audit.totals).toMatchObject({
      totalTrades: 1,
      successfulTrades: 1,
      failedTrades: 0,
      missingMarketStructureCount: 0,
      patternInputLeakCount: 0,
      totalSupportLevels: 7,
      totalResistanceLevels: 3,
    });
    expect(audit.records[0]).toMatchObject({
      candleSource: "levels_system_trade_window",
      analysisStatus: "ok",
      marketStructure: {
        state: "base_building",
        trendDirection: "uptrend",
        confidence: {
          label: "high",
        },
      },
    });
    expect(audit.records[0].warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Trade-window candle basis status"),
      ]),
    );
  });
});
