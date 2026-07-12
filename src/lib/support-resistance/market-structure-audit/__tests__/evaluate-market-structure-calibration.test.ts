import { describe, expect, it } from "vitest";
import {
  type ExperimentalMarketStructureAudit,
  type ExperimentalMarketStructureAuditRecord,
} from "../build-experimental-market-structure-audit";
import { evaluateMarketStructureCalibration } from "../evaluate-market-structure-calibration";

function buildBaseRecord(
  overrides: Partial<ExperimentalMarketStructureAuditRecord> = {},
): ExperimentalMarketStructureAuditRecord {
  return {
    tradeIndex: 0,
    symbol: "ABCD",
    sessionDate: "2026-05-01",
    tradeDirection: "long",
    candleSource: "levels_system_trade_window",
    analysisStatus: "ok",
    supportResistanceMode: "levels_system",
    errorMessage: null,
    marketStructure: {
      symbol: "ABCD",
      timeframe: "5m",
      asOfTimestamp: 1_777_653_000_000,
      state: "base_building",
      trendDirection: "uptrend",
      trendCounts: {
        higherLowCount: 1,
        lowerHighCount: 0,
        higherHighCount: 1,
        lowerLowCount: 0,
      },
      confidence: {
        label: "high",
        score: 0.9,
        reasons: ["enough confirmed pivots"],
      },
      range: null,
      pivotEvent: null,
      pivotCounts: {
        confirmedHighs: 3,
        confirmedLows: 3,
      },
      latestSwingHigh: null,
      latestSwingLow: null,
      traderLine: "5m structure is building.",
      diagnostics: [],
    },
    levelCounts: {
      support: 2,
      resistance: 1,
    },
    detectedPatternIds: [],
    normalizedPatternIds: [],
    patternInputContainsExperimentalMarketStructure: false,
    warnings: [],
    ...overrides,
  };
}

function buildAudit(
  record: ExperimentalMarketStructureAuditRecord,
): ExperimentalMarketStructureAudit {
  return {
    generatedAt: "2026-05-02T00:00:00.000Z",
    observationalOnly: true,
    totals: {
      totalTrades: 1,
      successfulTrades: record.analysisStatus === "ok" ? 1 : 0,
      failedTrades: record.analysisStatus === "error" ? 1 : 0,
      missingMarketStructureCount: record.marketStructure ? 0 : 1,
      stateCounts: record.marketStructure
        ? { [record.marketStructure.state]: 1 }
        : {},
      trendDirectionCounts: record.marketStructure
        ? { [record.marketStructure.trendDirection]: 1 }
        : {},
      confidenceCounts: record.marketStructure
        ? { [record.marketStructure.confidence.label]: 1 }
        : {},
      diagnosticCodeCounts:
        record.marketStructure && record.marketStructure.diagnostics.length > 0
          ? {
              [record.marketStructure.diagnostics[0].code]: 1,
            }
          : {},
      patternInputLeakCount:
        record.patternInputContainsExperimentalMarketStructure ? 1 : 0,
      tradesWithWarningsCount: record.warnings.length > 0 ? 1 : 0,
      totalSupportLevels: record.levelCounts.support,
      totalResistanceLevels: record.levelCounts.resistance,
    },
    records: [record],
  };
}

describe("evaluateMarketStructureCalibration", () => {
  it("returns BLOCKER when v2 support/resistance evidence has no market-structure read", async () => {
    const audit = buildAudit(
      buildBaseRecord({
        marketStructure: null,
      }),
    );

    const evaluation = evaluateMarketStructureCalibration(audit);

    expect(evaluation.overallStatus).toBe("BLOCKER");
    expect(evaluation.recommendation.action).toBe(
      "resolve_failed_or_missing_context",
    );
    expect(evaluation.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "market_structure_presence",
          status: "BLOCKER",
          tradeIndexes: [0],
        }),
        expect.objectContaining({
          id: "provider_engine_warnings",
          status: "PASS",
          tradeIndexes: [],
        }),
      ]),
    );
    expect(evaluation.recordGroups.allEngineMessageRecords).toHaveLength(0);
    expect(evaluation.recordGroups.engineWarningRecords).toHaveLength(0);
  });

  it("returns REVIEW with trade indexes for weak market-structure reads", () => {
    const record = buildBaseRecord({
      marketStructure: {
        ...buildBaseRecord().marketStructure!,
        state: "insufficient_data",
        trendDirection: "unknown",
        confidence: {
          label: "low",
          score: 0.1,
          reasons: ["not enough candles"],
        },
        diagnostics: [
          {
            code: "insufficient_candles",
            severity: "warning",
            message: "Not enough 5m candles were available.",
          },
        ],
      },
      warnings: [
        "levels-system warning: Missing required higher timeframe candles.",
      ],
    });
    const evaluation = evaluateMarketStructureCalibration(buildAudit(record));

    expect(evaluation.overallStatus).toBe("REVIEW");
    expect(evaluation.recommendation.action).toBe("review_structure_quality");
    expect(evaluation.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "confidence",
          status: "REVIEW",
          tradeIndexes: [0],
        }),
        expect.objectContaining({
          id: "unknown_or_insufficient_structure",
          status: "REVIEW",
          tradeIndexes: [0],
        }),
        expect.objectContaining({
          id: "provider_engine_warnings",
          status: "REVIEW",
          tradeIndexes: [0],
        }),
      ]),
    );
  });

  it("returns BLOCKER when experimental structure leaks into PatternInput", () => {
    const record = buildBaseRecord({
      patternInputContainsExperimentalMarketStructure: true,
    });
    const evaluation = evaluateMarketStructureCalibration(buildAudit(record));

    expect(evaluation.overallStatus).toBe("BLOCKER");
    expect(evaluation.recommendation.action).toBe("fix_pattern_input_leak");
    expect(evaluation.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pattern_input_isolation",
          status: "BLOCKER",
          tradeIndexes: [0],
        }),
      ]),
    );
  });
});
