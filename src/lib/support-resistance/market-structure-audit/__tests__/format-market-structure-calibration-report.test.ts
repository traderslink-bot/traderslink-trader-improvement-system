import { describe, expect, it } from "vitest";
import { sampleCreateRawTradeTimelineInput } from "../../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../__fixtures__/sample-levels-system-fetch-service";
import {
  buildExperimentalMarketStructureAuditFromLevelsSystemCandles,
  type ExperimentalMarketStructureAudit,
} from "../build-experimental-market-structure-audit";
import { formatMarketStructureCalibrationReport } from "../format-market-structure-calibration-report";

describe("formatMarketStructureCalibrationReport", () => {
  it("formats a durable markdown calibration summary", async () => {
    const audit =
      await buildExperimentalMarketStructureAuditFromLevelsSystemCandles({
        trades: [
          {
            symbol: sampleCreateRawTradeTimelineInput.symbol,
            tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
            executions: sampleCreateRawTradeTimelineInput.executions,
            sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
          },
        ],
        levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      });

    const markdown = formatMarketStructureCalibrationReport({
      audit,
      sourceLabel: "sample fixture",
      providerLabel: "stub",
    });

    expect(markdown).toContain(
      "# Experimental Market Structure Calibration Report",
    );
    expect(markdown).toContain("- source: sample fixture");
    expect(markdown).toContain("- provider: stub");
    expect(markdown).toContain("- trades: 1");
    expect(markdown).toContain("- overall status: PASS");
    expect(markdown).toContain(
      "- recommendation action: continue_observational_validation",
    );
    expect(markdown).toContain("- missing market structure: 0");
    expect(markdown).toContain("- none");
    expect(markdown).toContain("levels_system_trade_window");
    expect(markdown).toContain("PatternInput leaks: 0");
    expect(markdown).toContain("## Calibration Gates");
    expect(markdown).toContain("PatternInput isolation: PASS");
    expect(markdown).toContain("Analysis completion: PASS");
    expect(markdown).toContain(
      "Market-structure presence: PASS - 0 missing read(s)",
    );
    expect(markdown).toContain("No blocking calibration failures");
  });

  it("flags low-confidence or insufficient market-structure reads for review", () => {
    const audit: ExperimentalMarketStructureAudit = {
      generatedAt: "2026-05-02T00:00:00.000Z",
      observationalOnly: true,
      totals: {
        totalTrades: 1,
        successfulTrades: 1,
        failedTrades: 0,
        missingMarketStructureCount: 0,
        stateCounts: {
          insufficient_data: 1,
        },
        trendDirectionCounts: {
          unknown: 1,
        },
        confidenceCounts: {
          low: 1,
        },
        diagnosticCodeCounts: {
          insufficient_candles: 1,
        },
        patternInputLeakCount: 0,
        tradesWithWarningsCount: 1,
        totalSupportLevels: 0,
        totalResistanceLevels: 0,
      },
      records: [
        {
          tradeIndex: 0,
          symbol: "WEAK",
          sessionDate: "2026-05-01",
          tradeDirection: "long",
          candleSource: "levels_system_trade_window",
          analysisStatus: "ok",
          supportResistanceMode: "levels_system",
          errorMessage: null,
          marketStructure: {
            symbol: "WEAK",
            timeframe: "5m",
            asOfTimestamp: 1_777_653_000_000,
            state: "insufficient_data",
            trendDirection: "unknown",
            trendCounts: {
              higherLowCount: 0,
              lowerHighCount: 0,
              higherHighCount: 0,
              lowerLowCount: 0,
            },
            confidence: {
              label: "low",
              score: 0.1,
              reasons: ["not enough candles"],
            },
            range: null,
            pivotEvent: null,
            pivotCounts: {
              confirmedHighs: 0,
              confirmedLows: 0,
            },
            latestSwingHigh: null,
            latestSwingLow: null,
            traderLine: null,
            diagnostics: [
              {
                code: "insufficient_candles",
                severity: "warning",
                message: "Not enough 5m candles were available.",
              },
            ],
          },
          levelCounts: {
            support: 0,
            resistance: 0,
          },
          detectedPatternIds: [],
          normalizedPatternIds: [],
          patternInputContainsExperimentalMarketStructure: false,
          warnings: [
            "levels-system warning: Missing required higher timeframe candles.",
          ],
        },
      ],
    };

    const markdown = formatMarketStructureCalibrationReport({
      audit,
      sourceLabel: "synthetic",
      providerLabel: "ibkr",
    });

    expect(markdown).toContain("Confidence: REVIEW - 1 low-confidence read(s)");
    expect(markdown).toContain(
      "Unknown / insufficient structure: REVIEW - 1 read(s)",
    );
    expect(markdown).toContain(
      "Market-structure diagnostics: REVIEW - 1 read(s) with diagnostic(s)",
    );
    expect(markdown).toContain(
      "Provider / engine warnings: REVIEW - 1 trade(s) with warning/error messages",
    );
    expect(markdown).toContain("Keep market structure observational");
  });
});
