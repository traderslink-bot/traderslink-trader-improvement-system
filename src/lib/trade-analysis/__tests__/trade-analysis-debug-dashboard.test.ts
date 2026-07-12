import { describe, expect, it } from "vitest";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import {
  buildTradeAnalysisDebugDashboard,
  formatTradeAnalysisDebugDashboardMarkdown,
} from "../debug/trade-analysis-debug-dashboard";

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

describe("trade analysis debug dashboard", () => {
  it("builds a validate-only dashboard without running provider analysis", async () => {
    const dashboard = await buildTradeAnalysisDebugDashboard({
      source: "test",
      requests: [buildSampleRequest()],
      validateOnly: true,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(dashboard).toMatchObject({
      contractVersion: "trade_analysis_debug_dashboard_v1",
      requestCount: 1,
      completedCount: 0,
      failedCount: 0,
      items: [
        {
          status: "validated",
          symbol: "ABCD",
          summary: null,
          failure: null,
        },
      ],
    });
  });

  it("runs the shared candle path and formats a markdown dashboard", async () => {
    const dashboard = await buildTradeAnalysisDebugDashboard({
      source: "test",
      requests: [buildSampleRequest()],
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      generatedAt: "2026-05-02T00:00:00.000Z",
    });
    const markdown = formatTradeAnalysisDebugDashboardMarkdown(dashboard);

    expect(dashboard).toMatchObject({
      requestCount: 1,
      completedCount: 1,
      failedCount: 0,
      items: [
        {
          status: "analysis_completed",
          summary: {
            candleSource: "levels_system_trade_window",
            marketStructure: {
              observed: true,
              usedForScoring: false,
            },
          },
        },
      ],
    });
    expect(markdown).toContain("# Trade Analysis Debug Dashboard");
    expect(markdown).toContain("market structure used for scoring: false");
  });

  it("classifies invalid requests inside the dashboard", async () => {
    const dashboard = await buildTradeAnalysisDebugDashboard({
      source: "test",
      requests: [
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
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(dashboard).toMatchObject({
      requestCount: 1,
      completedCount: 0,
      failedCount: 1,
      items: [
        {
          status: "analysis_failed",
          failure: {
            code: "invalid_trade_request",
            source: "local_validation",
          },
        },
      ],
    });
  });
});
