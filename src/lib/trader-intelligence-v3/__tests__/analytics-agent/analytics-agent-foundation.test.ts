import { describe, expect, it } from "vitest";
import {
  buildAnalyticsAgentPlan,
  buildAnalyticsAgentScorecard,
  executeAnalyticsAgent,
  ANALYTICS_AGENT_QUESTION_TEMPLATES,
  resolveAnalyticsAgentIntent,
} from "../../analytics/agent";
import { buildSyntheticQueryFixture } from "../../analytics/query";

function request(question: string, count = 12) {
  const fixture = buildSyntheticQueryFixture(count);
  return {
    fixture,
    request: {
      source: fixture.source,
      partitionReceipt: fixture.partition,
      ownerScope: fixture.partition.ownerScope,
      accountScope: fixture.partition.accountScope,
      question,
    },
  };
}

describe("Analytics Agent v1 Foundation", () => {
  it("routes its initial plain-English inventory deterministically without a model", () => {
    expect(resolveAnalyticsAgentIntent("What times of day am I least profitable?").intent).toBe("time_of_day_performance");
    expect(resolveAnalyticsAgentIntent("What market session am I most profitable?")).toMatchObject({ intent: "session_performance", session: null, ranking: "descending" });
    expect(resolveAnalyticsAgentIntent("What market session am I least profitable?")).toMatchObject({ intent: "session_performance", session: null, ranking: "ascending" });
    expect(resolveAnalyticsAgentIntent("How do I perform in pre market?")).toMatchObject({ intent: "session_performance", session: "premarket" });
    expect(resolveAnalyticsAgentIntent("How do I perform during regular market hours?")).toMatchObject({ intent: "session_performance", session: "regular" });
    expect(resolveAnalyticsAgentIntent("How do I perform post market?")).toMatchObject({ intent: "session_performance", session: "after_hours" });
    expect(resolveAnalyticsAgentIntent("How do I trade after a loss?")).toMatchObject({ intent: "prior_outcome_behavior", previousOutcome: "loss" });
    expect(resolveAnalyticsAgentIntent("Show my results in stocks under $5.")).toMatchObject({
      intent: "price_range_performance",
      priceRange: { minimum: null, maximum: "5" },
    });
    expect(resolveAnalyticsAgentIntent("Did I buy the VWAP reclaim?").intent).toBe("unsupported_market_or_setup");
  });

  it("routes Stage 2 preset-backed execution questions deterministically without a model", () => {
    expect(resolveAnalyticsAgentIntent("Does hold time affect my performance?").intent).toBe("holding_time_performance");
    expect(resolveAnalyticsAgentIntent("Show long vs short performance.").intent).toBe("direction_performance");
    expect(resolveAnalyticsAgentIntent("Does position size affect my results?").intent).toBe("position_size_performance");
    for (const question of [
      "Compare this period with last period.",
      "Compare this month with last month.",
      "Compare this week with last week.",
      "Compare this month to last month.",
      "Compare this week to last week.",
      "This month compared with last month.",
      "This week compared with last week.",
    ]) {
      expect(resolveAnalyticsAgentIntent(question).intent).toBe("period_comparison");
    }
  });

  it("routes Pack B execution questions deterministically", () => {
    const expected = [
      ["How did I do today?", "daily_review"], ["Review this week.", "weekly_review"], ["How was my trading month?", "monthly_review"],
      ["What happens after two losses?", "prior_streak_behavior"], ["What happens after three losses?", "prior_streak_behavior"],
      ["What happens after two wins?", "prior_streak_behavior"], ["What happens after three wins?", "prior_streak_behavior"],
      ["What is my longest losing streak?", "streak_summary"], ["Do I trade worse when already red?", "pre_entry_daily_state_behavior"],
      ["How do I trade when I am already green?", "pre_entry_daily_state_behavior"], ["How do I trade after first win?", "pre_entry_daily_path_behavior"],
      ["How do I trade after first loss?", "pre_entry_daily_path_behavior"], ["Do I go green then red?", "daily_transition_summary"],
      ["Do I go red then green?", "daily_transition_summary"], ["What was my best day?", "best_worst_day"],
      ["What was my worst day?", "best_worst_day"], ["What price range is best for me?", "best_worst_price_range"],
      ["What price range is worst for me?", "best_worst_price_range"], ["What is my biggest weakness?", "limited_category_summary"],
      ["What is my biggest strength?", "limited_category_summary"],
    ] as const;
    for (const [question, intent] of expected) expect(resolveAnalyticsAgentIntent(question).intent).toBe(intent);
    expect(resolveAnalyticsAgentIntent("What happens after three losses?").priorStreak).toEqual({ outcome: "loss", minimum: "3" });
    expect(resolveAnalyticsAgentIntent("How do I trade when I am already red?").preEntryDailyState).toBe("red");
  });

  it("requires explicit dates for Pack B reviews and retains verified execution identities for supported Pack B questions", () => {
    const input = request("How did I do today?");
    const missing = executeAnalyticsAgent(input.request);
    expect(missing).toMatchObject({ ok: true, value: { status: "needs_clarification", clarification: { code: "date_range_required", requiredContext: ["dateRange"] }, enginePlanDigest: null } });
    for (const question of ["How did I do today?", "Review this week.", "How was my trading month?", "What happens after two losses?", "What is my longest winning streak?", "Do I trade worse when already red?", "How do I trade after first loss?", "Do I go green then red?", "What was my best day?", "What price range is worst for me?", "What is my biggest weakness?"]) {
      const requestWithRange = { ...input.request, question, dateRange: { startDate: "2026-07-01", endDate: "2026-07-07" } };
      const result = executeAnalyticsAgent(requestWithRange);
      expect(result.ok, question).toBe(true);
      if (!result.ok) continue;
      expect(result.value.enginePlanDigest).toMatch(/^ti_v3:trade_query_plan:v1:sha256:/);
      expect(result.value.resultDigest).toMatch(/^ti_v3:trade_query_result:v1:sha256:/);
      expect(result.value.executionReceiptDigest).toMatch(/^ti_v3:trade_query_execution_receipt:v1:sha256:/);
    }
  });

  it("builds the exact engine plans for Pack B streak, pre-entry, ranking, and limited-summary intents", () => {
    const planFor = (question: string) => {
      const input = request(question);
      const planned = buildAnalyticsAgentPlan(input.request, resolveAnalyticsAgentIntent(question));
      expect(planned).toMatchObject({ ok: true });
      if (!planned.ok || planned.value.plan === null) throw new Error(`missing direct plan for ${question}`);
      return { capabilityKey: planned.value.capabilityKey, plan: planned.value.plan };
    };
    for (const [question, filter] of [
      ["What happens after two losses?", { kind: "prior_completed_streak", outcome: "loss", minimum: "2", maximum: null }],
      ["What happens after three losses?", { kind: "prior_completed_streak", outcome: "loss", minimum: "3", maximum: null }],
      ["What happens after two wins?", { kind: "prior_completed_streak", outcome: "gain", minimum: "2", maximum: null }],
      ["What happens after three wins?", { kind: "prior_completed_streak", outcome: "gain", minimum: "3", maximum: null }],
      ["Do I trade worse when already red?", { kind: "pre_entry_daily_state", values: ["red"] }],
      ["How do I trade when I am already green?", { kind: "pre_entry_daily_state", values: ["green"] }],
      ["How do I trade after first win?", { kind: "pre_entry_daily_path", values: ["after_first_win"] }],
      ["How do I trade after first loss?", { kind: "pre_entry_daily_path", values: ["after_first_loss"] }],
      ["How do I trade after giving back profit?", { kind: "pre_entry_daily_path", values: ["after_peak_profit_giveback"] }],
    ] as const) expect(planFor(question).plan.filters).toContainEqual(filter);

    for (const [question, grouping, direction] of [
      ["What was my best day?", { kind: "day" }, "descending"],
      ["What was my worst day?", { kind: "day" }, "ascending"],
      ["What price range is best for me?", { kind: "entry_price_range", boundaries: ["1", "2", "5", "10"] }, "descending"],
      ["What price range is worst for me?", { kind: "entry_price_range", boundaries: ["1", "2", "5", "10"] }, "ascending"],
    ] as const) {
      const built = planFor(question).plan;
      expect(built.grouping).toEqual(grouping);
      expect(built.ordering).toEqual([{ by: "metric", metricKey: "net_pnl", direction }]);
    }

    for (const [question, direction] of [["What is my biggest weakness?", "ascending"], ["Show my top leaks.", "ascending"], ["What is my biggest strength?", "descending"], ["Show my top strengths.", "descending"]] as const) {
      const built = planFor(question);
      expect(built.capabilityKey).toBe("limited_ticker_pnl_summary");
      expect(built.plan.grouping).toEqual({ kind: "symbol" });
      expect(built.plan.ordering).toEqual([{ by: "metric", metricKey: "net_pnl", direction }]);
    }
  });

  it("builds an engine-backed core-performance answer with bounded evidence and replay identity", () => {
    const input = request("How am I doing overall?");
    const result = executeAnalyticsAgent(input.request);
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      status: "answered",
      resolvedIntent: "core_performance",
      capabilityKeys: ["core_performance"],
      sampleSize: "12",
      enginePlanDigest: expect.stringMatching(/^ti_v3:trade_query_plan:v1:sha256:/),
      resultDigest: expect.stringMatching(/^ti_v3:trade_query_result:v1:sha256:/),
      executionReceiptDigest: expect.stringMatching(/^ti_v3:trade_query_execution_receipt:v1:sha256:/),
      answerDigest: expect.stringMatching(/^ti_v3:analytics_agent_answer:v1:sha256:/),
    });
    expect(result.value.evidenceTradeReferences.length).toBeGreaterThan(0);
    expect(result.value.headline).toContain("completed trade execution data");
  });

  it("uses verified filters and engine grouping for time, ticker, price, behavior, sequence, repeat, drawdown, fees, and data quality", () => {
    const questions = [
      "What times of day am I least profitable?",
      "What tickers hurt me most?",
      "Show my results in stocks under $5.",
      "How do I trade after a loss?",
      "Do fourth-and-later trades perform worse?",
      "Do repeat attempts on the same ticker hurt me?",
      "Am I giving back profits?",
      "Are fees hurting my small trades?",
      "Can this result be trusted?",
    ];
    for (const question of questions) {
      const input = request(question);
      const result = executeAnalyticsAgent(input.request);
      const detail = result.ok ? "ok" : `${result.error.code}:${result.error.path}`;
      expect(result.ok, `${question}: ${detail}`).toBe(true);
      if (!result.ok) continue;
      expect(result.value.enginePlanDigest).toMatch(/^ti_v3:trade_query_plan:v1:sha256:/);
      expect(result.value.resultDigest).toMatch(/^ti_v3:trade_query_result:v1:sha256:/);
      expect(result.value.rankedRows.length).toBeGreaterThan(0);
    }
  });

  it("builds exact session comparison and specific-session plans using the existing engine authority", () => {
    const planFor = (question: string) => {
      const input = request(question);
      const planned = buildAnalyticsAgentPlan(input.request, resolveAnalyticsAgentIntent(question));
      expect(planned).toMatchObject({ ok: true });
      if (!planned.ok || planned.value.plan === null) throw new Error(`missing direct plan for ${question}`);
      return planned.value.plan;
    };
    const allSessions = planFor("What market session am I most profitable?");
    expect(allSessions.grouping).toEqual({ kind: "session" });
    expect(allSessions.filters.some((filter) => filter.kind === "session")).toBe(false);
    expect(allSessions.ordering).toEqual([{ by: "metric", metricKey: "net_pnl", direction: "descending" }]);
    for (const [question, session] of [
      ["How do I perform in pre market?", "premarket"],
      ["How do I perform during regular market hours?", "regular"],
      ["How do I perform after hours?", "after_hours"],
      ["How do I perform post market?", "after_hours"],
    ] as const) {
      const plan = planFor(question);
      expect(plan.grouping).toEqual({ kind: "aggregate" });
      expect(plan.filters).toContainEqual({ kind: "session", values: [session] });
      const input = request(question);
      const executed = executeAnalyticsAgent(input.request);
      expect(executed.ok, question).toBe(true);
      if (executed.ok) expect(executed.value.enginePlanDigest).toMatch(/^ti_v3:trade_query_plan:v1:sha256:/);
    }
  });

  it("uses governed presets for holding time, direction, and position-size performance", () => {
    for (const [question, presetKey] of [
      ["Does hold time affect my performance?", "analyze_holding_time"],
      ["Show long vs short performance.", "analyze_long_vs_short"],
      ["Does position size affect my results?", "analyze_position_size_performance"],
    ] as const) {
      const input = request(question);
      const planned = buildAnalyticsAgentPlan(input.request, resolveAnalyticsAgentIntent(question));
      expect(planned).toMatchObject({ ok: true });
      if (!planned.ok) continue;
      expect(planned.value).toMatchObject({ plan: null, preset: { presetKey } });
      const result = executeAnalyticsAgent(input.request);
      expect(result).toMatchObject({ ok: true });
      if (!result.ok) continue;
      expect(result.value).toMatchObject({
        resolvedIntent: resolveAnalyticsAgentIntent(question).intent,
        presetDigest: expect.stringMatching(/^ti_v3:trade_query_preset:v1:sha256:/),
        presetExecutionDigest: expect.stringMatching(/^ti_v3:trade_query_preset_execution:v1:sha256:/),
        baselinePlanDigest: null,
        baselineResultDigest: null,
        comparisonDigest: null,
      });
      expect(result.value.enginePlanDigest).toMatch(/^ti_v3:trade_query_plan:v1:sha256:/);
      expect(result.value.resultDigest).toMatch(/^ti_v3:trade_query_result:v1:sha256:/);
    }
  });

  it("executes a period comparison only with explicit primary and baseline date ranges", () => {
    const input = request("Compare this period with last period.");
    const requestWithRanges = {
      ...input.request,
      dateRange: { startDate: "2026-07-01", endDate: "2026-07-03" },
      comparisonDateRange: { startDate: "2026-07-04", endDate: "2026-07-06" },
    };
    const planned = buildAnalyticsAgentPlan(requestWithRanges, resolveAnalyticsAgentIntent(input.request.question));
    expect(planned).toMatchObject({ ok: true, value: { plan: null, preset: { presetKey: "compare_periods" } } });
    if (planned.ok) {
      expect(planned.value.preset?.primaryPlan.filters).toEqual(expect.arrayContaining([
        { kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" },
      ]));
      expect(planned.value.preset?.baselinePlan?.filters).toEqual(expect.arrayContaining([
        { kind: "date_range", startDate: "2026-07-04", endDate: "2026-07-06" },
      ]));
    }
    const result = executeAnalyticsAgent(requestWithRanges);
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      resolvedIntent: "period_comparison",
      presetDigest: expect.stringMatching(/^ti_v3:trade_query_preset:v1:sha256:/),
      presetExecutionDigest: expect.stringMatching(/^ti_v3:trade_query_preset_execution:v1:sha256:/),
      baselinePlanDigest: expect.stringMatching(/^ti_v3:trade_query_plan:v1:sha256:/),
      baselineResultDigest: expect.stringMatching(/^ti_v3:trade_query_result:v1:sha256:/),
      comparisonDigest: expect.stringMatching(/^ti_v3:trade_query_comparison:v1:sha256:/),
    });
  });

  it("fails closed when a period-comparison baseline is not explicitly supplied", () => {
    const input = request("Compare this period with last period.");
    const result = executeAnalyticsAgent({
      ...input.request,
      dateRange: { startDate: "2026-07-01", endDate: "2026-07-03" },
    });
    expect(result).toMatchObject({ ok: true, value: { status: "needs_clarification", clarification: { code: "comparison_date_range_required", requiredContext: ["dateRange", "comparisonDateRange"] }, enginePlanDigest: null } });
  });

  it("builds one bounded, engine-validated composed execution plan without changing partition scope", () => {
    const input = request("How were my shorts after two losses?");
    const composed = {
      ...input.request,
      dateRange: { startDate: "2026-07-01", endDate: "2026-07-07" },
      composition: {
        filters: [
          { kind: "direction" as const, values: ["short" as const] },
          { kind: "prior_completed_streak" as const, outcome: "loss" as const, minimum: "2", maximum: null },
        ],
        grouping: { kind: "symbol" as const },
        metrics: ["candidate_count", "included_count", "net_pnl", "win_rate"] as const,
        ranking: "ascending" as const,
      },
    };
    const planned = buildAnalyticsAgentPlan(composed, resolveAnalyticsAgentIntent(composed.question));
    expect(planned).toMatchObject({ ok: true, value: { capabilityKey: "composed_execution_query" } });
    if (!planned.ok || planned.value.plan === null) return;
    expect(planned.value.plan.grouping).toEqual({ kind: "symbol" });
    expect(planned.value.plan.metrics).toEqual(["candidate_count", "included_count", "net_pnl", "win_rate"]);
    expect(planned.value.plan.ordering).toEqual([{ by: "metric", metricKey: "net_pnl", direction: "ascending" }]);
    expect(planned.value.plan.filters).toEqual(expect.arrayContaining([
      { kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-07" },
      { kind: "direction", values: ["short"] },
      { kind: "prior_completed_streak", outcome: "loss", minimum: "2", maximum: null },
    ]));
    expect(planned.value.plan.filters.some((filter) => filter.kind === "account")).toBe(false);
    const executed = executeAnalyticsAgent(composed);
    expect(executed).toMatchObject({ ok: true, value: { resolvedIntent: "composed_execution_query", capabilityKeys: ["composed_execution_query"] } });
  });

  it("fails closed when a composition attempts to change the exact partition or date authority", () => {
    const input = request("How were my shorts?");
    for (const filter of [
      { kind: "account" as const, values: input.fixture.partition.accountScope },
      { kind: "date_range" as const, startDate: "2026-07-01", endDate: "2026-07-07" },
      { kind: "currency" as const, value: input.fixture.partition.currency },
    ]) {
      const result = executeAnalyticsAgent({
        ...input.request,
        composition: { filters: [filter], grouping: { kind: "aggregate" } },
      });
      expect(result).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: "$.analyticsAgent.composition.filters" } });
    }
  });

  it("preserves supporting and counterexample evidence, explicit boundaries, and a replay-bound scorecard", () => {
    const input = request("What tickers hurt me most?");
    const result = executeAnalyticsAgent(input.request);
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.evidenceSummary.supportingTradeReferences.every((item) => item.role === "supporting")).toBe(true);
    expect(result.value.evidenceSummary.counterexampleTradeReferences.every((item) => item.role === "counterexample")).toBe(true);
    expect(result.value.notProven).toContain("market_or_candle_setup_quality");
    expect(result.value.drillDowns).toEqual(expect.arrayContaining([
      expect.objectContaining({ purpose: "evidence_review" }),
      expect.objectContaining({ purpose: "data_quality" }),
    ]));
    const first = buildAnalyticsAgentScorecard(result.value);
    const second = buildAnalyticsAgentScorecard(result.value);
    expect(first).toMatchObject({ answerDigest: result.value.answerDigest, resultDigest: result.value.resultDigest, readiness: "review_ready" });
    expect(first.scorecardDigest).toBe(second.scorecardDigest);
  });

  it("keeps representative golden questions deterministic and exposes explicit-context templates", () => {
    for (const [question, intent] of [
      ["How did I trade after two losses?", "prior_streak_behavior"],
      ["How did longs compare with shorts?", "direction_performance"],
      ["What was my best price range?", "best_worst_price_range"],
      ["Show my top leaks.", "limited_category_summary"],
      ["Compare this month with last month.", "period_comparison"],
    ] as const) expect(resolveAnalyticsAgentIntent(question).intent).toBe(intent);
    expect(ANALYTICS_AGENT_QUESTION_TEMPLATES).toEqual(expect.arrayContaining([
      expect.objectContaining({ templateKey: "period_comparison", requiredContext: ["dateRange", "comparisonDateRange"] }),
      expect.objectContaining({ templateKey: "execution_review", requiredContext: ["dateRange"] }),
    ]));
  });

  it("returns structured unsupported boundaries for market, exit-quality, and planned-risk claims", () => {
    for (const [question, code] of [
      ["Did I buy the VWAP reclaim?", "market_or_setup_data_required"],
      ["Did I cut winners too early?", "exit_quality_or_alternative_outcome_authority_required"],
      ["Did I follow my daily max loss rule?", "planned_risk_authority_required"],
    ] as const) {
      const input = request(question);
      const result = executeAnalyticsAgent(input.request);
      expect(result).toMatchObject({ ok: true });
      if (!result.ok) continue;
      expect(result.value).toMatchObject({
        status: "unsupported",
        enginePlanDigest: null,
        resultDigest: null,
        unsupportedReason: { code },
      });
    }
  });

  it("withholds a pattern below the minimum sample while retaining the verified engine result", () => {
    const input = request("Do later trades hurt me?", 2);
    const result = executeAnalyticsAgent(input.request);
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      status: "insufficient_sample",
      sampleSize: "2",
      enginePlanDigest: expect.stringMatching(/^ti_v3:trade_query_plan:v1:sha256:/),
      unsupportedReason: { code: "insufficient_sample_size" },
    });
  });

  it("fails closed when the caller owner scope does not match the engine partition", () => {
    const input = request("How am I doing overall?");
    const result = executeAnalyticsAgent({ ...input.request, ownerScope: ["another-owner"] });
    expect(result).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.analyticsAgent.scope" } });
  });

  it("requires exact owner and account scope while preserving explicit date and symbol filters without an account-narrowing filter", () => {
    const input = request("How am I doing overall?");
    const planned = buildAnalyticsAgentPlan({
      ...input.request,
      dateRange: { startDate: "2026-07-01", endDate: "2026-07-03" },
      symbol: "SYN1",
    }, resolveAnalyticsAgentIntent(input.request.question));
    expect(planned).toMatchObject({ ok: true });
    if (!planned.ok || planned.value.plan === null) return;
    expect(planned.value.plan.filters).toEqual(expect.arrayContaining([
      { kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" },
      { kind: "symbol", values: ["SYN1"] },
    ]));
    expect(planned.value.plan.filters.some((filter) => filter.kind === "account")).toBe(false);
  });

  it("fails closed for an account-scope subset instead of narrowing the partition", () => {
    const input = request("How am I doing overall?");
    const result = executeAnalyticsAgent({ ...input.request, accountScope: input.fixture.partition.accountScope.slice(0, -1) });
    expect(result).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.analyticsAgent.scope" } });
  });

  it("fails closed for an account-scope superset", () => {
    const input = request("How am I doing overall?");
    const result = executeAnalyticsAgent({ ...input.request, accountScope: [...input.fixture.partition.accountScope, "extra-account"] });
    expect(result).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.analyticsAgent.scope" } });
  });

  it("fails closed for a nonmatching account scope", () => {
    const input = request("How am I doing overall?");
    const result = executeAnalyticsAgent({ ...input.request, accountScope: ["different-account"] });
    expect(result).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.analyticsAgent.scope" } });
  });

  it("preserves deterministic answer identity for the same verified request", () => {
    const input = request("What tickers hurt me most?");
    const first = executeAnalyticsAgent(input.request);
    const second = executeAnalyticsAgent(input.request);
    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({ ok: true });
    if (!first.ok || !second.ok) return;
    expect(first.value.answerDigest).toBe(second.value.answerDigest);
  });
});
