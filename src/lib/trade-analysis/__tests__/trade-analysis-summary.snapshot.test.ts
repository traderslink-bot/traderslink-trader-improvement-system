import { describe, expect, it } from "vitest";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { runTradeAnalysisFromLevelsSystemCandles } from "../run-trade-analysis";
import {
  buildTradeAnalysisSummary,
  type TradeAnalysisSummary,
} from "../summary/build-trade-analysis-summary";

function buildStableSummarySnapshot(summary: TradeAnalysisSummary) {
  return {
    contractVersion: summary.contractVersion,
    symbol: summary.symbol,
    sessionDate: summary.sessionDate,
    sessionBucket: summary.sessionBucket,
    tradeDirection: summary.tradeDirection,
    candleSource: summary.candleSource,
    candleCounts: summary.candleCounts,
    supportResistance: {
      supportCount: summary.supportResistance.supportCount,
      resistanceCount: summary.supportResistance.resistanceCount,
      strongestSupportPrice: summary.supportResistance.strongestSupportPrice,
      strongestResistancePrice:
        summary.supportResistance.strongestResistancePrice,
      nearestAtFirstExecution:
        summary.supportResistance.nearestAtFirstExecution,
    },
    marketStructure: summary.marketStructure,
    patterns: {
      detectedCount: summary.patterns.detectedCount,
      normalizedCount: summary.patterns.normalizedCount,
      topAnchorPattern: summary.patterns.topAnchorPattern,
      primaryPatternIds: summary.patterns.primaryPatterns.map(
        (pattern) => pattern.patternId,
      ),
    },
  };
}

describe("trade analysis summary snapshots", () => {
  it("keeps a stable snapshot of the shared candle analysis summary contract", async () => {
    const result = await runTradeAnalysisFromLevelsSystemCandles({
      trade: {
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
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    });
    const summary = buildTradeAnalysisSummary(result);

    expect(buildStableSummarySnapshot(summary)).toMatchInlineSnapshot(`
      {
        "candleCounts": {
          "postTrade": 2,
          "preTrade": 116,
          "trade": 2,
        },
        "candleSource": "levels_system_trade_window",
        "contractVersion": "trade_analysis_summary_v1",
        "marketStructure": {
          "confidenceLabel": "high",
          "confidenceScore": 0.95,
          "diagnosticCodes": [],
          "observationalOnly": true,
          "observed": true,
          "state": "base_building",
          "timeframe": "5m",
          "traderLine": "5m structure is building inside the 1.10-1.36 range.",
          "trendDirection": "uptrend",
          "usedForScoring": false,
        },
        "patterns": {
          "detectedCount": 28,
          "normalizedCount": 28,
          "primaryPatternIds": [
            "breakout_entry_structure",
            "balanced_management_with_defensive_final_exit_after_deterioration",
            "failed_profit_protection_structure",
            "moderate_capture_exit_structure",
            "multi_build_full_exit",
          ],
          "topAnchorPattern": {
            "family": "entry_quality",
            "patternId": "breakout_entry_structure",
            "patternName": "Breakout Entry Structure",
            "role": "primary_candidate",
          },
        },
        "sessionBucket": "market_open",
        "sessionDate": "2024-04-12",
        "supportResistance": {
          "nearestAtFirstExecution": {
            "executionIndex": 0,
            "executionPrice": 1.185,
            "nearestResistancePrice": 1.277,
            "nearestSupportPrice": 1.1753,
            "occurredInOpenAir": false,
            "roomToNearestResistancePct": null,
            "roomToNearestSupportPct": 0.818565,
          },
          "resistanceCount": 3,
          "strongestResistancePrice": 1.31,
          "strongestSupportPrice": 1.1753,
          "supportCount": 7,
        },
        "symbol": "ABCD",
        "tradeDirection": "long",
      }
    `);
  });
});
