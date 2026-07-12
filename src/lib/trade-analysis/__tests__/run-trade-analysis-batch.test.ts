import { describe, expect, it } from "vitest";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { runBatchTradeAnalysis } from "../batch/run-trade-analysis-batch";

function buildSampleRequest() {
  return {
    symbol: sampleCreateRawTradeTimelineInput.symbol,
    tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
    executions: sampleCreateRawTradeTimelineInput.executions,
    sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
    provider: {
      preferredProvider: "stub",
    },
    tradeWindow: {
      timeframe: "1m",
      preTradeMinutes: 60,
      postTradeMinutes: 60,
    },
  };
}

describe("runBatchTradeAnalysis", () => {
  it("validates request batches without running shared candle analysis", async () => {
    const batch = await runBatchTradeAnalysis({
      source: "test",
      requests: [buildSampleRequest()],
      validateOnly: true,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(batch).toMatchObject({
      contractVersion: "batch_trade_analysis_v1",
      validateOnly: true,
      totals: {
        requests: 1,
        validated: 1,
        completed: 0,
        failed: 0,
      },
      items: [
        {
          status: "validated",
          symbol: "ABCD",
          failure: null,
          summary: null,
        },
      ],
    });
  });

  it("runs valid requests and aggregates summary-level debug counts", async () => {
    const batch = await runBatchTradeAnalysis({
      source: "test",
      requests: [buildSampleRequest()],
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(batch).toMatchObject({
      totals: {
        requests: 1,
        validated: 1,
        completed: 1,
        failed: 0,
      },
      failureCounts: {},
      marketStructureCounts: {
        observed: 1,
        missing: 0,
        scoringUses: 0,
      },
      items: [
        {
          status: "completed",
          summary: {
            candleSource: "levels_system_trade_window",
            supportResistance: {
              supportCount: expect.any(Number),
              resistanceCount: expect.any(Number),
            },
            marketStructure: {
              observed: true,
              usedForScoring: false,
            },
          },
        },
      ],
    });
    expect(batch.items[0].summary?.supportResistance.supportCount).toBeGreaterThan(0);
    expect(batch.items[0].summary?.supportResistance.resistanceCount).toBeGreaterThan(0);
    expect(batch.patternCounts.detectedTotal).toBeGreaterThan(0);
    expect(batch.patternCounts.normalizedTotal).toBeGreaterThan(0);
    expect(Object.keys(batch.patternCounts.topAnchorPatternIds).length).toBe(1);
  });

  it("keeps invalid requests in the batch result with classified failures", async () => {
    const batch = await runBatchTradeAnalysis({
      source: "test",
      requests: [
        buildSampleRequest(),
        {
          symbol: "",
          tradeDirection: "long",
          sessionContext: {
            sessionDate: "2026-05-01",
            sessionBucket: "market_open",
          },
          executions: [],
        },
      ],
      validateOnly: true,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(batch.totals).toMatchObject({
      requests: 2,
      validated: 1,
      completed: 0,
      failed: 1,
    });
    expect(batch.failureCounts).toEqual({
      invalid_trade_request: 1,
    });
    expect(batch.items[1]).toMatchObject({
      requestIndex: 1,
      status: "failed",
      failure: {
        code: "invalid_trade_request",
        source: "local_validation",
      },
    });
  });
});
