import { describe, expect, it } from "vitest";
import {
  executeCoachCapability,
  executeCoachIntent,
} from "../../analytics/coach";
import {
  buildSyntheticQueryFixture,
  compileGa1BPreset,
  openReadOnlyTradeQueryGateway,
} from "../../analytics/query";

describe("GA1-D Coach Trading Intelligence Foundation", () => {
  it("routes the first flexible-question inventory through approved deterministic capabilities", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const result = executeCoachIntent({
      intentKey: "rank_negative_performance_drivers",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.map((item) => item.capabilityKey)).toEqual([
      "time_window_performance",
      "session_performance",
      "price_range_performance",
      "position_size_performance",
      "hold_time_performance",
      "profit_giveback_analysis",
      "intraday_drawdown_analysis",
    ]);
    for (const item of result.value) {
      expect(item.authorityStatus).not.toBe("unsupported");
      expect(item.digestReplayIdentity.queryPlanDigest).toMatch(/^ti_v3:trade_query_plan:v1:sha256:/);
      expect(item.evidenceTradeReferences.length).toBeGreaterThan(0);
      expect(item.metricTables).toHaveLength(1);
    }
  });

  it("uses exact GA1-A daily-path metrics and accepted session facts without creating a second calculator", () => {
    const fixture = buildSyntheticQueryFixture(20);
    const result = executeCoachCapability({
      intentKey: "profit_giveback_analysis",
      capabilityKey: "profit_giveback_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    const metrics = result.value.metricTables[0].rows[0].metrics;
    expect(metrics.find((metric) => metric.metricKey === "maximum_intraday_drawdown")?.kind).toBe("exact_decimal");
    expect(metrics.find((metric) => metric.metricKey === "maximum_peak_profit_giveback")?.kind).toBe("exact_decimal");
    expect(result.value.primaryFinding?.ruleCandidateKey).toBe("stop_after_profit_giveback");

    const session = executeCoachIntent({
      intentKey: "session_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(session).toMatchObject({ ok: true });
    if (!session.ok) return;
    expect(session.value[0].metricTables[0].rows.map((row) => row.groupIdentity)).toEqual(
      expect.arrayContaining(["session:not_applicable"]),
    );
  });

  it("routes the Time, Price, Size, Hold-Time, and Giveback pack through existing query and preset authority", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const result = executeCoachIntent({
      intentKey: "rank_positive_performance_drivers",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.map((item) => item.capabilityKey)).toEqual([
      "time_window_performance",
      "session_performance",
      "price_range_performance",
      "position_size_performance",
      "hold_time_performance",
    ]);
    for (const item of result.value) {
      expect(item.authorityStatus).not.toBe("unsupported");
      expect(item.primaryFinding).not.toBeNull();
      expect(item.metricTables).toHaveLength(1);
      expect(item.evidenceTradeReferences.length).toBeGreaterThan(0);
    }
  });

  it("uses $1, $2, $5, and $10 boundaries from the existing price-bucket authority", () => {
    const fixture = buildSyntheticQueryFixture(12);
    const gateway = openReadOnlyTradeQueryGateway(fixture.source, fixture.partition);
    expect(gateway).toMatchObject({ ok: true });
    if (!gateway.ok) return;
    const preset = compileGa1BPreset({
      presetKey: "analyze_performance_by_price_range",
      authority: gateway.value.authority,
    });
    expect(preset).toMatchObject({ ok: true });
    if (!preset.ok) return;
    expect(preset.value.primaryPlan.grouping).toEqual({
      kind: "entry_price_range",
      boundaries: ["1", "2", "5", "10"],
    });
  });

  it("uses exact daily giveback, drawdown, and day-outcome metrics without claiming a new calculator", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const giveback = executeCoachIntent({
      intentKey: "profit_giveback_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    const drawdown = executeCoachIntent({
      intentKey: "intraday_drawdown_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    const consistency = executeCoachIntent({
      intentKey: "day_outcome_consistency",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(giveback).toMatchObject({ ok: true });
    expect(drawdown).toMatchObject({ ok: true });
    expect(consistency).toMatchObject({ ok: true });
    if (!giveback.ok || !drawdown.ok || !consistency.ok) return;
    expect(giveback.value[0].primaryFinding).toMatchObject({
      findingCode: "giveback_detected",
      metric: { metricKey: "maximum_peak_profit_giveback" },
      ruleCandidateKey: "stop_after_profit_giveback",
    });
    expect(drawdown.value[0].primaryFinding).toMatchObject({
      findingCode: "intraday_drawdown_detected",
      metric: { metricKey: "maximum_intraday_drawdown" },
    });
    expect(consistency.value[0].primaryFinding).toMatchObject({
      findingCode: "day_outcome_consistency",
      metric: { metricKey: "profitable_day_percentage" },
    });
    expect(consistency.value[0].metricTables[0].rows[0].metrics.map((metric) => metric.metricKey)).toEqual(
      expect.arrayContaining(["profitable_day_percentage", "losing_day_percentage"]),
    );
  });

  it("returns explicit unsupported responses rather than calling realised hold-time exit quality", () => {
    const fixture = buildSyntheticQueryFixture(12);
    const losers = executeCoachIntent({
      intentKey: "losers_held_too_long",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    const winners = executeCoachIntent({
      intentKey: "winners_cut_too_early",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(losers).toMatchObject({ ok: true });
    expect(winners).toMatchObject({ ok: true });
    if (!losers.ok || !winners.ok) return;
    for (const result of [losers.value[0], winners.value[0]]) {
      expect(result).toMatchObject({
        authorityStatus: "unsupported",
        primaryFinding: null,
        unsupportedData: { code: "exit_quality_or_alternative_outcome_authority_required" },
      });
    }
  });

  it("maps rule candidates to GA1-C presets as rules to test, never claimed improvements", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const result = executeCoachIntent({
      intentKey: "rule_candidate_ranking",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    const candidates = result.value.flatMap((item) => item.rankedFindingList)
      .filter((finding) => finding.ruleCandidateStatus === "rule_to_test");
    expect(candidates.map((finding) => finding.ruleCandidateKey)).toEqual(
      expect.arrayContaining([
        "stop_after_consecutive_losses",
        "wait_after_loss",
        "stop_after_profit_giveback",
        "skip_repeat_attempts",
      ]),
    );
  });

  it("returns an explicit unsupported-data result for tag capabilities instead of inventing a tag", () => {
    const fixture = buildSyntheticQueryFixture(10);
    const result = executeCoachIntent({
      intentKey: "setup_tag_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]).toMatchObject({
      authorityStatus: "unsupported",
      unsupportedData: { code: "setup_tags_required" },
      metricTables: [],
    });
  });

  it("returns a trend finding only from the verified current-versus-prior comparison", () => {
    const fixture = buildSyntheticQueryFixture(28);
    const result = executeCoachIntent({
      intentKey: "habit_trend_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
      filters: [{ kind: "date_range", startDate: "2026-07-04", endDate: "2026-07-07" }],
      baselineFilters: [{ kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" }],
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    const coach = result.value[0];
    expect(coach).toMatchObject({
      capabilityKey: "habit_trend_analysis",
      comparisonType: "current_period_vs_prior_period",
      primaryFinding: { findingCode: "period_trend" },
    });
    expect(coach.comparison?.comparisonDigest).toMatch(/^ti_v3:trade_query_comparison:v1:sha256:/);
    expect(coach.digestReplayIdentity.comparisonDigest).toBe(coach.comparison?.comparisonDigest);
    expect(coach.metricTables).toHaveLength(2);
  });

  it("does not fabricate a trend when no verified prior-period request is supplied", () => {
    const fixture = buildSyntheticQueryFixture(10);
    const result = executeCoachIntent({
      intentKey: "habit_trend_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      authorityStatus: "unsupported",
      primaryFinding: null,
      comparison: null,
      unsupportedData: { code: "period_comparison_required" },
    });
  });

  it("routes after-win and after-loss behaviour through their distinct accepted GA1-B presets", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const afterWin = executeCoachIntent({
      intentKey: "after_win_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    const afterLoss = executeCoachIntent({
      intentKey: "prior_outcome_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(afterWin).toMatchObject({ ok: true });
    expect(afterLoss).toMatchObject({ ok: true });
    if (!afterWin.ok || !afterLoss.ok) return;
    expect(afterWin.value[0]).toMatchObject({
      capabilityKey: "after_win_performance",
      normalizedFilters: [{ kind: "previous_completed_outcome", values: ["gain"] }],
    });
    expect(afterLoss.value[0]).toMatchObject({
      capabilityKey: "prior_outcome_performance",
      normalizedFilters: [{ kind: "previous_completed_outcome", values: ["loss"] }],
    });
  });

  it("returns explicit unsupported results for consecutive-loss and daily-state behaviour that verified authority cannot filter", () => {
    const fixture = buildSyntheticQueryFixture(12);
    const result = executeCoachIntent({
      intentKey: "after_two_losses_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    const dailyState = executeCoachIntent({
      intentKey: "trades_after_daily_green",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    expect(dailyState).toMatchObject({ ok: true });
    if (!result.ok || !dailyState.ok) return;
    expect(result.value[0]).toMatchObject({
      authorityStatus: "unsupported",
      unsupportedData: { code: "consecutive_loss_streak_filter_required" },
      primaryFinding: null,
    });
    expect(dailyState.value[0]).toMatchObject({
      authorityStatus: "unsupported",
      unsupportedData: { code: "pre_entry_daily_realized_state_filter_required" },
      primaryFinding: null,
    });
  });

  it("composes the behaviour-leak route from bounded sequence, prior-outcome, and repeat-attempt evidence", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const result = executeCoachIntent({
      intentKey: "behaviour_leak_ranking",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.map((item) => item.capabilityKey)).toEqual([
      "prior_outcome_performance",
      "after_win_performance",
      "trade_sequence_performance",
      "repeat_ticker_attempts",
      "overtrading_analysis",
    ]);
    for (const item of result.value) {
      expect(item.sampleSizeStatus).toBe("meets_minimum_sample");
      expect(item.metricTables).toHaveLength(1);
      expect(item.evidenceTradeReferences.length).toBeGreaterThan(0);
    }
  });

  it("exposes first-versus-later and fourth-and-later through the verified sequence preset", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const firstVsLater = executeCoachIntent({
      intentKey: "first_vs_later_trade_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    const fourthAndLater = executeCoachIntent({
      intentKey: "fourth_and_later_trade_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(firstVsLater).toMatchObject({ ok: true });
    expect(fourthAndLater).toMatchObject({ ok: true });
    if (!firstVsLater.ok || !fourthAndLater.ok) return;
    expect(firstVsLater.value[0]).toMatchObject({
      capabilityKey: "first_vs_later_trade_performance",
      comparisonType: "first_n_vs_later",
    });
    expect(fourthAndLater.value[0]).toMatchObject({
      capabilityKey: "fourth_and_later_trade_performance",
      primaryFinding: { ruleCandidateKey: "skip_fourth_and_later_trades" },
    });
  });

  it("makes behaviour-rule candidates only from existing deterministic rule keys", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const result = executeCoachIntent({
      intentKey: "behaviour_rule_candidate_ranking",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    const candidates = result.value.flatMap((item) => item.rankedFindingList)
      .filter((finding) => finding.ruleCandidateStatus === "rule_to_test")
      .map((finding) => finding.ruleCandidateKey);
    expect(candidates).toEqual(expect.arrayContaining([
      "wait_after_loss",
      "maximum_trades_per_day",
      "stop_after_profit_giveback",
      "skip_repeat_attempts",
    ]));
  });

  it("withholds behaviour findings below the capability minimum while retaining the query result and limitation", () => {
    const fixture = buildSyntheticQueryFixture(2);
    const result = executeCoachIntent({
      intentKey: "trade_sequence_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      sampleSizeStatus: "insufficient_sample_size",
      primaryFinding: null,
      rankedFindingList: [],
      unsupportedData: { code: "insufficient_sample_size" },
    });
    expect(result.value[0].metricTables).toHaveLength(1);
  });

  it("withholds a trend finding when either verified period is below the minimum sample", () => {
    const fixture = buildSyntheticQueryFixture(5);
    const result = executeCoachIntent({
      intentKey: "habit_trend_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
      filters: [{ kind: "date_range", startDate: "2026-07-05", endDate: "2026-07-05" }],
      baselineFilters: [{ kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" }],
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      comparison: { comparisonKey: "ti_v3_exact_trade_query_comparison" },
      primaryFinding: null,
      rankedFindingList: [],
      sampleSizeStatus: "insufficient_sample_size",
      unsupportedData: { code: "insufficient_sample_size" },
    });
  });
});
