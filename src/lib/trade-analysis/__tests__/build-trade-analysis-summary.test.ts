import { describe, expect, it } from "vitest";
import repeatedAddsBeforeReduction from "../../../docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import {
  toLevelsSystemCandleTradeRequest,
  validateTradeAnalysisRequest,
} from "../request/trade-analysis-request-contract";
import {
  runTradeAnalysis,
  runTradeAnalysisFromLevelsSystemCandles,
  runTradeAnalysisWithProvidedCandlesOnly,
} from "../run-trade-analysis";
import { buildTradeAnalysisSummary } from "../summary/build-trade-analysis-summary";

describe("buildTradeAnalysisSummary", () => {
  it("builds a stable app-facing summary for v2 support/resistance analysis", async () => {
    const result = await runTradeAnalysis({
      trade: sampleCreateRawTradeTimelineInput,
      supportResistance: {
        levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      },
    });

    const summary = buildTradeAnalysisSummary(result);

    expect(summary).toMatchObject({
      contractVersion: "trade_analysis_summary_v1",
      symbol: "ABCD",
      candleSource: "provided_trade_candles",
      supportResistanceMode: "levels_system",
      supportResistance: {
        supportCount: expect.any(Number),
        resistanceCount: expect.any(Number),
      },
      marketStructure: {
        observed: true,
        observationalOnly: true,
        usedForScoring: false,
        state: "base_building",
        trendDirection: "uptrend",
        confidenceLabel: "high",
      },
      executionFeedback: {
        contractVersion: "execution_feedback_summary_v1",
        dataSource: "executions_only",
        marketContextUsed: false,
        separatedFromMarketContext: true,
        lifecycle: {
          closedToFlat: true,
          finalPositionSize: 0,
        },
      },
    });
    expect(summary.patterns.detectedCount).toBeGreaterThan(0);
    expect(summary.patterns.normalizedCount).toBeGreaterThan(0);
    expect(summary.patterns.topAnchorPattern?.patternId).toBeTruthy();
    expect(summary.executionFeedback.points.primaryFocus?.id).toBeTruthy();
    expect(summary.decisionReview).toMatchObject({
      contractVersion: "trade_decision_review_v1",
      generatedFrom: {
        patternScoring: true,
        behaviorCoaching: true,
        dailyFourHourLevelsOnly: true,
        vwapEmaFeedbackUsed: false,
      },
      marketContext: {
        source: "levels_system_daily_4h",
        nearestSupportStrengthBucket: expect.stringMatching(
          /^(strong|medium|weak)$/,
        ),
        nearestResistanceStrengthBucket: expect.stringMatching(
          /^(strong|medium|weak)$/,
        ),
        nearestSupportSourceStrengthLabel: expect.stringMatching(
          /^(major|strong|moderate|weak)$/,
        ),
        nearestResistanceSourceStrengthLabel: expect.stringMatching(
          /^(major|strong|moderate|weak)$/,
        ),
        nearestSupportImportance: expect.stringMatching(
          /^(major|actionable|secondary|weak|synthetic_extension)$/,
        ),
        nearestResistanceImportance: expect.stringMatching(
          /^(major|actionable|secondary|weak|synthetic_extension)$/,
        ),
      },
    });
    expect(summary.supportResistance.supportCount).toBeGreaterThan(0);
    expect(summary.supportResistance.resistanceCount).toBeGreaterThan(0);
    expect(summary.decisionReview.insights.length).toBeGreaterThan(0);
    expect(summary.warnings).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("levels-system trade-window info"),
      ]),
    );
  });

  it("keeps market structure absent on the explicit provided-candles-only path", async () => {
    const result = await runTradeAnalysisWithProvidedCandlesOnly(
      sampleCreateRawTradeTimelineInput,
    );
    const summary = buildTradeAnalysisSummary(result);

    expect(summary.candleSource).toBe("provided_trade_candles");
    expect(summary.marketStructure).toMatchObject({
      observed: false,
      observationalOnly: true,
      usedForScoring: false,
      state: null,
      trendDirection: null,
    });
    expect(summary.executionFeedback).toMatchObject({
      contractVersion: "execution_feedback_summary_v1",
      marketContextUsed: false,
      separatedFromMarketContext: true,
    });
  });

  it("keeps execution feedback facts separate from market-context enrichment", async () => {
    const result = await runTradeAnalysis({
      trade: sampleCreateRawTradeTimelineInput,
      supportResistance: {
        levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      },
    });

    const summary = buildTradeAnalysisSummary(result);

    expect(summary.supportResistance.supportCount).toBeGreaterThan(0);
    expect(summary.marketStructure.observed).toBe(true);
    expect(summary.marketStructure.usedForScoring).toBe(false);
    expect(summary.executionFeedback.marketContextUsed).toBe(false);
    expect(summary.executionFeedback.lifecycle.maxPositionSize).toBe(
      Math.max(
        ...result.rawTradeTimeline.timeline.tradeStateSeries.snapshots.map(
          (snapshot) => snapshot.positionSize,
        ),
      ),
    );
    expect(summary.executionFeedback.riskFacts.openPositionShares).toBe(
      result.rawTradeTimeline.timeline.tradeStateSeries.snapshots.at(-1)
        ?.positionSize,
    );
  });

  it("keeps repeated-add provider fixture honest when market context is unavailable", async () => {
    const validation = validateTradeAnalysisRequest(repeatedAddsBeforeReduction);

    expect(validation.valid).toBe(true);
    expect(validation.request).toBeDefined();

    const result = await runTradeAnalysisFromLevelsSystemCandles({
      trade: toLevelsSystemCandleTradeRequest(validation.request!),
      levelsSystem: validation.request!.levelsSystem,
    });
    const summary = buildTradeAnalysisSummary(result);

    expect(summary.decisionReview.coaching.fixFirstBehaviorId).toBeNull();
    expect(summary.decisionReview.generatedFrom.vwapEmaFeedbackUsed).toBe(false);
    expect(summary.decisionReview.marketContext.source).toBe("none");
    expect(summary.decisionReview.insights.map((insight) => insight.id)).toEqual(
      expect.arrayContaining([
        "trade_window_excursion_measured",
      ]),
    );
  }, 15_000);
});
