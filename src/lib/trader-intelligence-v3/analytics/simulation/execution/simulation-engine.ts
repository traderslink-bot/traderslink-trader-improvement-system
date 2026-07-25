import {
  compareUnicodeCodePoints,
  parseCanonicalUtcTimestamp,
  timestampEpochNanoseconds,
} from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  addExactDecimals,
  compareExactDecimals,
  subtractExactDecimals,
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactResult,
} from "../../../domain/exact";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import type { AnalyticalPartitionReceipt, AnalyticalRow } from "../../dataset";
import type { TradeQueryResult } from "../../query/contracts";
import { applyTradeQueryFilters } from "../../query/filters";
import {
  buildQueryRowSemantics,
  compareRatioToDecimal,
  isVerifiedTradeQueryExecution,
} from "../../query/execution";
import {
  openReadOnlyTradeQueryGateway,
  type VerifiedTradeQueryDatasetSource,
} from "../../query/gateway";
import { calculateTradeQueryMetrics } from "../../query/metrics";
import {
  buildCounterfactualSimulationPlan,
  verifyCounterfactualSimulationPlan,
  type CounterfactualRule,
  type CounterfactualSimulationPlan,
  type RuleStateDependencies,
} from "../contracts";

export const COUNTERFACTUAL_SIMULATION_RESULT_VERSION =
  "ti_v3_counterfactual_simulation_result_v2" as const;

export type SimulationClassification =
  | "executed_unchanged"
  | "skipped_by_rule"
  | "skipped_session_stopped"
  | "skipped_ticker_stopped"
  | "skipped_during_cooldown"
  | "excluded_source_filter"
  | "unavailable_required_authority";

export type EvaluatedSimulationState<T> =
  | Readonly<{ readonly state: "evaluated"; readonly value: T }>
  | Readonly<{ readonly state: "not_evaluated"; readonly value: null }>;

export interface SimulationSessionStateSnapshot {
  readonly dependencyPolicyVersion:
    RuleStateDependencies["policyVersion"];
  readonly executedTradeCount: EvaluatedSimulationState<string>;
  readonly completedLossStreak: EvaluatedSimulationState<string>;
  readonly realizedDailyNetPnl: EvaluatedSimulationState<string>;
  readonly peakRealizedDailyNetPnl: EvaluatedSimulationState<string>;
  readonly stoppedByRuleId: EvaluatedSimulationState<string | null>;
  readonly cooldownUntil: EvaluatedSimulationState<string | null>;
  readonly instrumentAttemptCount: EvaluatedSimulationState<string>;
  readonly instrumentLosingAttemptCount: EvaluatedSimulationState<string>;
  readonly tickerStoppedByRuleId: EvaluatedSimulationState<string | null>;
  readonly priorCompletedOutcome: EvaluatedSimulationState<
    "none" | "loss" | "gain" | "flat"
  >;
  readonly pendingAfterOutcomeRuleIds: EvaluatedSimulationState<
    readonly string[]
  >;
}

export interface SimulationTradeOutcome {
  readonly sourceTradeKey: string;
  readonly classification: SimulationClassification;
  readonly responsibleRuleId: string | null;
  readonly reasonCode: string;
  readonly actualNetPnl: string;
  readonly simulatedNetPnl: string | null;
  readonly actualSizeAuthority: "accepted_observed_execution";
  readonly simulatedSizeAuthority:
    | "accepted_observed_execution"
    | "not_executed"
    | "unavailable";
  readonly supportingExecutionDigests: readonly CanonicalContentDigest[];
  readonly supportingOccurrenceKeys: readonly string[];
  readonly sessionStateBefore: SimulationSessionStateSnapshot;
  readonly sessionStateAfter: SimulationSessionStateSnapshot;
  readonly triggeredRuleIds: readonly string[];
  readonly limitationCodes: readonly string[];
}

export interface SimulationAffectedSummary {
  readonly tradesHelped: string;
  readonly tradesHarmed: string;
  readonly daysHelped: string;
  readonly daysHarmed: string;
  readonly losingTradesAvoided: string;
  readonly profitableTradesRemoved: string;
  readonly lossesRetained: string;
  readonly winnersRetained: string;
  readonly neutralAffectedTrades: string;
  readonly sessionStopEvents: string;
  readonly tickerStopEvents: string;
  readonly cooldownExclusions: string;
  readonly ruleSpecificAffectedCounts: readonly Readonly<{
    readonly ruleId: string;
    readonly affectedCount: string;
  }>[];
}

export type SimulationEvidenceCategory =
  | "representative_helped_trades"
  | "representative_harmed_trades"
  | "losing_trades_avoided"
  | "profitable_trades_removed"
  | "rule_triggering_trades"
  | "counterexamples_rule_made_results_worse";

export interface SimulationEvidenceBucket {
  readonly category: SimulationEvidenceCategory;
  readonly totalQualifyingCount: string;
  readonly emittedCount: string;
  readonly truncated: boolean;
  readonly sourceTradeKeys: readonly string[];
  readonly trades: readonly Readonly<{
    readonly sourceTradeKey: string;
    readonly classification: SimulationClassification;
    readonly responsibleRuleId: string | null;
    readonly supportingExecutionDigests: readonly CanonicalContentDigest[];
    readonly supportingOccurrenceKeys: readonly string[];
  }>[];
  readonly limitationCodes: readonly string[];
}

export interface CounterfactualSimulationResult {
  readonly schemaVersion: typeof COUNTERFACTUAL_SIMULATION_RESULT_VERSION;
  readonly historicalBasis: "historical_in_sample_counterfactual_v1";
  readonly plan: CounterfactualSimulationPlan;
  readonly sourceQueryResultDigest: CanonicalContentDigest;
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly executedCount: string;
  readonly resizedCount: "0";
  readonly skippedCount: string;
  readonly unavailableCount: string;
  readonly actualTradeKeys: readonly string[];
  readonly simulatedTradeKeys: readonly string[];
  readonly actualMetrics: readonly ExactMetricValue[];
  readonly simulatedMetrics: readonly ExactMetricValue[];
  readonly actualNetPnl: string;
  readonly simulatedNetPnl: string;
  readonly netPnlDifference: string;
  readonly effect: "helped" | "harmed" | "unchanged";
  readonly affectedSummary: SimulationAffectedSummary;
  readonly evidence: readonly SimulationEvidenceBucket[];
  readonly tradeOutcomes: readonly SimulationTradeOutcome[];
  readonly limitationCodes: readonly string[];
  readonly resultDigest: CanonicalContentDigest;
}

export interface CounterfactualSimulationRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly sourceQueryResult: TradeQueryResult;
  readonly simulationPlan: unknown;
}

interface MutableSessionState {
  executedTradeCount: bigint | null;
  completedLossStreak: bigint | null;
  realizedDailyPnl: CanonicalDecimal | null;
  peakRealizedDailyPnl: CanonicalDecimal | null;
  stoppedByRuleId: string | null;
  cooldownUntil: string | null;
  cooldownRuleId: string | null;
  instrumentAttemptCounts: Map<string, bigint> | null;
  instrumentLosingAttemptCounts: Map<string, bigint> | null;
  stoppedInstruments: Map<string, string> | null;
  priorCompletedOutcome: "none" | "loss" | "gain" | "flat" | null;
  pendingAfterOutcomeRules: Set<string> | null;
  executedRows: AnalyticalRow[];
  processedCompletionKeys: Set<string>;
}

function exact(value: string): CanonicalDecimal {
  const result = validateExactDecimal(value);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

function sum(rows: readonly AnalyticalRow[]): string {
  let total = exact("0");
  for (const row of rows) {
    const next = addExactDecimals(total, exact(row.netPnl));
    if (!next.ok) throw new Error(next.error.code);
    total = next.value;
  }
  return total;
}

function evaluated<T>(
  active: boolean,
  value: T,
): EvaluatedSimulationState<T> {
  return active
    ? Object.freeze({ state: "evaluated", value })
    : Object.freeze({ state: "not_evaluated", value: null });
}

function snapshot(
  state: MutableSessionState,
  dependencies: RuleStateDependencies,
  stableInstrumentKey: string,
): SimulationSessionStateSnapshot {
  return Object.freeze({
    dependencyPolicyVersion: dependencies.policyVersion,
    executedTradeCount: evaluated(
      dependencies.executedEntryCount,
      state.executedTradeCount?.toString() ?? "0",
    ),
    completedLossStreak: evaluated(
      dependencies.completedLossStreak,
      state.completedLossStreak?.toString() ?? "0",
    ),
    realizedDailyNetPnl: evaluated(
      dependencies.realizedDailyPnl,
      state.realizedDailyPnl ?? "0",
    ),
    peakRealizedDailyNetPnl: evaluated(
      dependencies.peakRealizedDailyPnl,
      state.peakRealizedDailyPnl ?? "0",
    ),
    stoppedByRuleId: evaluated(
      dependencies.sessionStopState,
      state.stoppedByRuleId,
    ),
    cooldownUntil: evaluated(
      dependencies.cooldownUntilState,
      state.cooldownUntil,
    ),
    instrumentAttemptCount: evaluated(
      dependencies.tickerAttemptState,
      (state.instrumentAttemptCounts?.get(stableInstrumentKey) ??
        BigInt(0)).toString(),
    ),
    instrumentLosingAttemptCount: evaluated(
      dependencies.tickerLosingAttemptState,
      (state.instrumentLosingAttemptCounts?.get(stableInstrumentKey) ??
        BigInt(0)).toString(),
    ),
    tickerStoppedByRuleId: evaluated(
      dependencies.tickerStopState,
      state.stoppedInstruments?.get(stableInstrumentKey) ?? null,
    ),
    priorCompletedOutcome: evaluated(
      dependencies.priorCompletedOutcome,
      state.priorCompletedOutcome ?? "none",
    ),
    pendingAfterOutcomeRuleIds: evaluated(
      dependencies.afterOutcomeExclusionState,
      Object.freeze(
        [...(state.pendingAfterOutcomeRules ?? new Set<string>())]
          .sort(compareUnicodeCodePoints),
      ),
    ),
  });
}

function sessionKey(row: AnalyticalRow): string {
  return [
    row.canonicalOwnerKey,
    row.canonicalAccountKey,
    row.currency,
    row.sessionDate,
    row.timezone,
    row.dateBasis,
  ].join("|");
}

function orderRows(left: AnalyticalRow, right: AnalyticalRow): number {
  if (left.firstEntryAt !== right.firstEntryAt) {
    return left.firstEntryAt < right.firstEntryAt ? -1 : 1;
  }
  if (left.finalExitAt !== right.finalExitAt) {
    return left.finalExitAt < right.finalExitAt ? -1 : 1;
  }
  return compareUnicodeCodePoints(
    left.semanticRoundTripKey,
    right.semanticRoundTripKey,
  );
}

type RealizedOutcome = "loss" | "gain" | "flat";

function realizedOutcome(row: AnalyticalRow): RealizedOutcome {
  const comparison = compareExactDecimals(exact(row.netPnl), exact("0"));
  return comparison < 0 ? "loss" : comparison > 0 ? "gain" : "flat";
}

function addSecondsToTimestamp(timestamp: string, seconds: string): string {
  const parsed = parseCanonicalUtcTimestamp(timestamp, "nanosecond");
  if (!parsed.ok) throw new Error(parsed.error.code);
  const nanosPerSecond = BigInt("1000000000");
  const secondsPerDay = BigInt("86400");
  const nanosPerDay = nanosPerSecond * secondsPerDay;
  const epochNanos = timestampEpochNanoseconds(parsed.value) +
    BigInt(seconds) * nanosPerSecond;
  const day = epochNanos >= BigInt(0)
    ? epochNanos / nanosPerDay
    : (epochNanos - nanosPerDay + BigInt(1)) / nanosPerDay;
  const timeNanos = epochNanos - day * nanosPerDay;
  // timestampEpochNanoseconds counts from 0001-01-01. The civil-date inverse
  // below expects the shifted Unix-day basis, whose exact offset is 306 days.
  const shifted = day + BigInt("306");
  const era = shifted >= BigInt(0)
    ? shifted / BigInt("146097")
    : (shifted - BigInt("146096")) / BigInt("146097");
  const dayOfEra = shifted - era * BigInt("146097");
  const yearOfEra = (
    dayOfEra -
    dayOfEra / BigInt("1460") +
    dayOfEra / BigInt("36524") -
    dayOfEra / BigInt("146096")
  ) / BigInt("365");
  let year = yearOfEra + era * BigInt("400");
  const dayOfYear = dayOfEra - (
    BigInt("365") * yearOfEra +
    yearOfEra / BigInt("4") -
    yearOfEra / BigInt("100")
  );
  const monthPrime =
    (BigInt("5") * dayOfYear + BigInt("2")) / BigInt("153");
  const monthDay = dayOfYear -
    (BigInt("153") * monthPrime + BigInt("2")) / BigInt("5") +
    BigInt("1");
  const month = monthPrime +
    (monthPrime < BigInt("10") ? BigInt("3") : -BigInt("9"));
  year += month <= BigInt("2") ? BigInt("1") : BigInt("0");
  const wholeSeconds = timeNanos / nanosPerSecond;
  const hour = wholeSeconds / BigInt("3600");
  const minute = (wholeSeconds % BigInt("3600")) / BigInt("60");
  const second = wholeSeconds % BigInt("60");
  const nanosecond = timeNanos % nanosPerSecond;
  return [
    year.toString().padStart(4, "0"),
    "-",
    month.toString().padStart(2, "0"),
    "-",
    monthDay.toString().padStart(2, "0"),
    "T",
    hour.toString().padStart(2, "0"),
    ":",
    minute.toString().padStart(2, "0"),
    ":",
    second.toString().padStart(2, "0"),
    ".",
    nanosecond.toString().padStart(9, "0"),
    "Z",
  ].join("");
}

function wallClockTime(timestamp: string, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = new Map(
    formatter.formatToParts(new Date(`${timestamp.slice(0, 23)}Z`))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.get("hour")}:${parts.get("minute")}:${parts.get("second")}`;
}

function recordTriggers(
  target: Map<string, Set<string>>,
  ruleId: string,
  rows: readonly AnalyticalRow[],
): void {
  let keys = target.get(ruleId);
  if (keys === undefined) {
    keys = new Set<string>();
    target.set(ruleId, keys);
  }
  for (const row of rows) keys.add(row.semanticRoundTripKey);
}

function applyCompletions(
  state: MutableSessionState,
  entryAt: string,
  rules: readonly CounterfactualRule[],
  dependencies: RuleStateDependencies,
  triggeringTradeKeysByRule: Map<string, Set<string>>,
): ExactResult<true, AnalyticalContractFailure> {
  const eligible = state.executedRows
    .filter((row) =>
      row.finalExitAt < entryAt &&
      !state.processedCompletionKeys.has(row.semanticRoundTripKey))
    .sort((left, right) =>
      left.finalExitAt < right.finalExitAt ? -1 :
        left.finalExitAt > right.finalExitAt ? 1 :
          compareUnicodeCodePoints(
            left.semanticRoundTripKey,
            right.semanticRoundTripKey,
          ));
  let index = 0;
  while (index < eligible.length) {
    const completionAt = eligible[index].finalExitAt;
    const group: AnalyticalRow[] = [];
    while (
      index < eligible.length &&
      eligible[index].finalExitAt === completionAt
    ) {
      group.push(eligible[index]);
      index += 1;
    }
    const outcomes = new Set(group.map(realizedOutcome));
    const materiallyOrderedOutcomeState =
      dependencies.completedLossStreak ||
      dependencies.priorCompletedOutcome ||
      dependencies.afterOutcomeExclusionState;
    const materiallyOrderedPeakState =
      dependencies.peakRealizedDailyPnl &&
      outcomes.has("loss") &&
      outcomes.has("gain");
    if (
      outcomes.size > 1 &&
      (materiallyOrderedOutcomeState || materiallyOrderedPeakState)
    ) {
      return contractFailure(
        "ti_v3_simulation_ambiguous_completion_tie",
        "$.chronology",
      );
    }
    let groupPnl = exact("0");
    for (const row of group) {
      state.processedCompletionKeys.add(row.semanticRoundTripKey);
      const nextGroupPnl = addExactDecimals(groupPnl, exact(row.netPnl));
      if (!nextGroupPnl.ok) {
        return contractFailure(nextGroupPnl.error.code, "$.chronology.netPnl");
      }
      groupPnl = nextGroupPnl.value;
      if (state.completedLossStreak !== null && outcomes.has("loss")) {
        state.completedLossStreak += BigInt(1);
      } else if (state.completedLossStreak !== null) {
        state.completedLossStreak = BigInt(0);
      }
      if (
        state.instrumentLosingAttemptCounts !== null &&
        realizedOutcome(row) === "loss"
      ) {
        state.instrumentLosingAttemptCounts.set(
          row.stableInstrumentKey,
          (state.instrumentLosingAttemptCounts.get(row.stableInstrumentKey) ??
            BigInt(0)) + BigInt(1),
        );
      }
    }
    if (state.realizedDailyPnl !== null) {
      const next = addExactDecimals(state.realizedDailyPnl, groupPnl);
      if (!next.ok) {
        return contractFailure(next.error.code, "$.chronology.realizedDailyPnl");
      }
      state.realizedDailyPnl = next.value;
    }
    if (
      state.peakRealizedDailyPnl !== null &&
      state.realizedDailyPnl !== null &&
      compareExactDecimals(
        state.realizedDailyPnl,
        state.peakRealizedDailyPnl,
      ) > 0
    ) {
      state.peakRealizedDailyPnl = state.realizedDailyPnl;
    }
    const completedOutcome = outcomes.size === 1
      ? [...outcomes][0]
      : null;
    if (
      state.priorCompletedOutcome !== null &&
      completedOutcome !== null
    ) {
      state.priorCompletedOutcome = completedOutcome;
    }
    for (const rule of rules) {
      if (
        rule.kind === "wait_after_loss" &&
        outcomes.has("loss")
      ) {
        state.cooldownUntil = addSecondsToTimestamp(
          completionAt,
          rule.cooldownSeconds,
        );
        state.cooldownRuleId = rule.ruleId;
        recordTriggers(triggeringTradeKeysByRule, rule.ruleId, group);
      }
      if (
        rule.kind === "after_outcome_exclusion" &&
        completedOutcome === rule.triggerOutcome
      ) {
        state.pendingAfterOutcomeRules?.add(rule.ruleId);
        recordTriggers(triggeringTradeKeysByRule, rule.ruleId, group);
      }
      if (
        rule.kind === "stop_after_consecutive_losses" &&
        state.completedLossStreak !== null &&
        state.completedLossStreak >= BigInt(rule.consecutiveLossThreshold) &&
        state.stoppedByRuleId === null
      ) {
        state.stoppedByRuleId = rule.ruleId;
        recordTriggers(triggeringTradeKeysByRule, rule.ruleId, group);
      }
      if (
        rule.kind === "stop_after_daily_dollar_drawdown" &&
        state.realizedDailyPnl !== null &&
        compareExactDecimals(
          state.realizedDailyPnl,
          exact(`-${rule.maximumDailyDrawdown}`),
        ) <= 0 &&
        state.stoppedByRuleId === null
      ) {
        state.stoppedByRuleId = rule.ruleId;
        recordTriggers(triggeringTradeKeysByRule, rule.ruleId, group);
      }
      if (
        rule.kind === "stop_after_profit_giveback" &&
        state.realizedDailyPnl !== null &&
        state.peakRealizedDailyPnl !== null &&
        compareExactDecimals(state.peakRealizedDailyPnl, exact("0")) > 0 &&
        state.stoppedByRuleId === null
      ) {
        const giveback = subtractExactDecimals(
          state.peakRealizedDailyPnl,
          state.realizedDailyPnl,
        );
        if (!giveback.ok) {
          return contractFailure(giveback.error.code, "$.chronology.giveback");
        }
        if (
          compareExactDecimals(
            giveback.value,
            exact(rule.maximumProfitGiveback),
          ) >= 0
        ) {
          state.stoppedByRuleId = rule.ruleId;
          recordTriggers(triggeringTradeKeysByRule, rule.ruleId, group);
        }
      }
      if (
        rule.kind === "stop_after_losing_ticker_attempts" &&
        state.instrumentLosingAttemptCounts !== null &&
        state.stoppedInstruments !== null
      ) {
        for (const row of group) {
          if (
            (state.instrumentLosingAttemptCounts.get(
              row.stableInstrumentKey,
            ) ?? BigInt(0)) >= BigInt(rule.losingAttemptThreshold) &&
            !state.stoppedInstruments.has(row.stableInstrumentKey)
          ) {
            state.stoppedInstruments.set(row.stableInstrumentKey, rule.ruleId);
            recordTriggers(triggeringTradeKeysByRule, rule.ruleId, [row]);
          }
        }
      }
    }
  }
  return { ok: true, value: true };
}

function tradeOutcome(
  row: AnalyticalRow,
  classification: SimulationClassification,
  ruleId: string | null,
  reasonCode: string,
  before: SimulationSessionStateSnapshot,
  after: SimulationSessionStateSnapshot,
): SimulationTradeOutcome {
  const executed = classification === "executed_unchanged";
  const conservativelyRetained =
    classification === "unavailable_required_authority";
  return Object.freeze({
    sourceTradeKey: row.semanticRoundTripKey,
    classification,
    responsibleRuleId: ruleId,
    reasonCode,
    actualNetPnl: row.netPnl,
    simulatedNetPnl: executed || conservativelyRetained ? row.netPnl : null,
    actualSizeAuthority: "accepted_observed_execution",
    simulatedSizeAuthority: executed || conservativelyRetained
      ? "accepted_observed_execution"
      : "not_executed",
    supportingExecutionDigests: row.supportingExecutionDigests,
    supportingOccurrenceKeys: row.supportingOccurrenceKeys,
    sessionStateBefore: before,
    sessionStateAfter: after,
    triggeredRuleIds: Object.freeze([]),
    limitationCodes: Object.freeze(conservativelyRetained
      ? [
          reasonCode,
          "ti_v3_simulation_required_rule_authority_unavailable",
        ].sort(compareUnicodeCodePoints)
      : []),
  });
}

function isRuleExcluded(outcome: SimulationTradeOutcome): boolean {
  return outcome.classification !== "executed_unchanged" &&
    outcome.classification !== "excluded_source_filter" &&
    outcome.classification !== "unavailable_required_authority";
}

function countString(value: number): string {
  return String(value);
}

function buildEvidenceBucket(
  category: SimulationEvidenceCategory,
  qualifyingOutcomes: readonly SimulationTradeOutcome[],
  maximum: bigint,
): SimulationEvidenceBucket {
  const emitted: SimulationTradeOutcome[] = [];
  for (const outcome of qualifyingOutcomes) {
    if (BigInt(emitted.length) >= maximum) break;
    emitted.push(outcome);
  }
  const truncated = emitted.length < qualifyingOutcomes.length;
  return Object.freeze({
    category,
    totalQualifyingCount: countString(qualifyingOutcomes.length),
    emittedCount: countString(emitted.length),
    truncated,
    sourceTradeKeys: Object.freeze(
      emitted.map((outcome) => outcome.sourceTradeKey),
    ),
    trades: Object.freeze(emitted.map((outcome) => Object.freeze({
      sourceTradeKey: outcome.sourceTradeKey,
      classification: outcome.classification,
      responsibleRuleId: outcome.responsibleRuleId,
      supportingExecutionDigests: outcome.supportingExecutionDigests,
      supportingOccurrenceKeys: outcome.supportingOccurrenceKeys,
    }))),
    limitationCodes: Object.freeze([
      "ti_v3_simulation_evidence_exact_classification_derived",
      ...(truncated
        ? ["ti_v3_simulation_evidence_truncated_at_declared_limit"]
        : []),
    ]),
  });
}

export function executeCounterfactualSimulation(
  request: CounterfactualSimulationRequest,
): ExactResult<CounterfactualSimulationResult, AnalyticalContractFailure> {
  const gateway = openReadOnlyTradeQueryGateway(
    request.source,
    request.partitionReceipt,
  );
  if (!gateway.ok) return gateway;
  if (!isVerifiedTradeQueryExecution(request.sourceQueryResult)) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.sourceQueryResult",
    );
  }
  const rawPlan = request.simulationPlan as {
    readonly planDigest?: unknown;
  } | null;
  const plan = rawPlan !== null && typeof rawPlan === "object" &&
    typeof rawPlan.planDigest === "string"
    ? verifyCounterfactualSimulationPlan(
        request.simulationPlan,
        gateway.value.authority,
      )
    : buildCounterfactualSimulationPlan(
        request.simulationPlan,
        gateway.value.authority,
      );
  if (!plan.ok) return plan;
  if (
    request.sourceQueryResult.normalizedQueryPlan.queryPlanDigest !==
      plan.value.sourceQueryPlan.queryPlanDigest
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.sourceQueryResult.normalizedQueryPlan",
    );
  }
  const data = gateway.value.readBoundedRows(plan.value.sourceQueryPlan);
  if (!data.ok) return data;
  if (
    BigInt(data.value.rows.length) > BigInt(plan.value.limits.sourceRowLimit)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_oversized",
      "$.sourceRows",
    );
  }
  const semantics = buildQueryRowSemantics(data.value.rows);
  const filtered = applyTradeQueryFilters(
    semantics,
    plan.value.sourceQueryPlan.filters,
  );
  const includedKeys = new Set(
    filtered.included.map((item) => item.row.semanticRoundTripKey),
  );
  const includedSemantics = new Map(
    filtered.included.map((item) => [item.row.semanticRoundTripKey, item]),
  );
  const outcomes: SimulationTradeOutcome[] = [];
  const simulatedRows: AnalyticalRow[] = [];
  const sessions = new Map<string, MutableSessionState>();
  const rules = [...plan.value.rules];
  const stateDependencies = plan.value.stateDependencies;
  const triggeringTradeKeysByRule = new Map<string, Set<string>>();
  for (const row of [...data.value.rows].sort(orderRows)) {
    const key = sessionKey(row);
    let state = sessions.get(key);
    if (state === undefined) {
      state = {
        executedTradeCount: stateDependencies.executedEntryCount
          ? BigInt(0)
          : null,
        completedLossStreak: stateDependencies.completedLossStreak
          ? BigInt(0)
          : null,
        realizedDailyPnl: stateDependencies.realizedDailyPnl
          ? exact("0")
          : null,
        peakRealizedDailyPnl: stateDependencies.peakRealizedDailyPnl
          ? exact("0")
          : null,
        stoppedByRuleId: null,
        cooldownUntil: null,
        cooldownRuleId: null,
        instrumentAttemptCounts: stateDependencies.tickerAttemptState
          ? new Map()
          : null,
        instrumentLosingAttemptCounts:
          stateDependencies.tickerLosingAttemptState
            ? new Map()
            : null,
        stoppedInstruments: stateDependencies.tickerStopState
          ? new Map()
          : null,
        priorCompletedOutcome: stateDependencies.priorCompletedOutcome
          ? "none"
          : null,
        pendingAfterOutcomeRules:
          stateDependencies.afterOutcomeExclusionState
            ? new Set()
            : null,
        executedRows: [],
        processedCompletionKeys: new Set(),
      };
      sessions.set(key, state);
    }
    if (!includedKeys.has(row.semanticRoundTripKey)) {
      const current = snapshot(
        state,
        stateDependencies,
        row.stableInstrumentKey,
      );
      outcomes.push(tradeOutcome(
        row,
        "excluded_source_filter",
        null,
        "ti_v3_simulation_excluded_source_filter",
        current,
        current,
      ));
      continue;
    }
    if (stateDependencies.completedRealizedOutcome) {
      const completions = applyCompletions(
        state,
        row.firstEntryAt,
        rules,
        stateDependencies,
        triggeringTradeKeysByRule,
      );
      if (!completions.ok) return completions;
    }
    const before = snapshot(
      state,
      stateDependencies,
      row.stableInstrumentKey,
    );
    let classification: SimulationClassification = "executed_unchanged";
    let responsibleRuleId: string | null = null;
    let reasonCode = "ti_v3_simulation_executed_unchanged";
    const rowSemantics = includedSemantics.get(row.semanticRoundTripKey);
    if (rowSemantics === undefined) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.sourceRows",
      );
    }
    for (const rule of rules) {
      if (
        rule.kind === "stop_after_consecutive_losses" &&
        state.stoppedByRuleId === rule.ruleId
      ) {
        classification = "skipped_session_stopped";
        responsibleRuleId = rule.ruleId;
        reasonCode = "ti_v3_simulation_session_stopped";
        break;
      }
      if (
        rule.kind === "stop_after_daily_dollar_drawdown" &&
        state.stoppedByRuleId === rule.ruleId
      ) {
        classification = "skipped_session_stopped";
        responsibleRuleId = rule.ruleId;
        reasonCode = "ti_v3_simulation_daily_drawdown_session_stopped";
        break;
      }
      if (
        rule.kind === "stop_after_profit_giveback" &&
        state.stoppedByRuleId === rule.ruleId
      ) {
        classification = "skipped_session_stopped";
        responsibleRuleId = rule.ruleId;
        reasonCode = "ti_v3_simulation_profit_giveback_session_stopped";
        break;
      }
      if (
        rule.kind === "maximum_trades_per_day" &&
        state.executedTradeCount !== null &&
        state.executedTradeCount >= BigInt(rule.maximumTrades)
      ) {
        classification = "skipped_by_rule";
        responsibleRuleId = rule.ruleId;
        reasonCode = "ti_v3_simulation_maximum_trades_reached";
        break;
      }
      if (
        rule.kind === "direction_only" &&
        row.direction !== rule.allowedDirection
      ) {
        classification = "skipped_by_rule";
        responsibleRuleId = rule.ruleId;
        reasonCode = "ti_v3_simulation_direction_excluded";
        break;
      }
      if (
        rule.kind === "wait_after_loss" &&
        state.cooldownUntil !== null &&
        row.firstEntryAt < state.cooldownUntil
      ) {
        classification = "skipped_during_cooldown";
        responsibleRuleId = rule.ruleId;
        reasonCode = "ti_v3_simulation_loss_cooldown_active";
        break;
      }
      if (
        rule.kind === "maximum_attempts_per_ticker" &&
        state.instrumentAttemptCounts !== null &&
        (state.instrumentAttemptCounts.get(row.stableInstrumentKey) ??
          BigInt(0)) >= BigInt(rule.maximumAttempts)
      ) {
        classification = "skipped_by_rule";
        responsibleRuleId = rule.ruleId;
        reasonCode = "ti_v3_simulation_ticker_attempt_limit_reached";
        break;
      }
      if (
        rule.kind === "stop_after_losing_ticker_attempts" &&
        state.stoppedInstruments?.get(row.stableInstrumentKey) === rule.ruleId
      ) {
        classification = "skipped_ticker_stopped";
        responsibleRuleId = rule.ruleId;
        reasonCode = "ti_v3_simulation_ticker_losing_attempt_stop";
        break;
      }
      if (rule.kind === "no_new_trades_after_time") {
        if (row.session === "overnight") {
          return contractFailure(
            "ti_v3_analytics_contract_invalid",
            "$.chronology.overnightSession",
          );
        }
        if (wallClockTime(row.firstEntryAt, row.timezone) >= rule.cutoffTime) {
          classification = "skipped_by_rule";
          responsibleRuleId = rule.ruleId;
          reasonCode = "ti_v3_simulation_entry_at_or_after_cutoff";
          break;
        }
      }
      if (rule.kind === "exclude_entry_price_range") {
        if (rowSemantics.entryPrice === null) {
          classification = "unavailable_required_authority";
          responsibleRuleId = rule.ruleId;
          reasonCode = "ti_v3_simulation_entry_price_unavailable";
          break;
        }
        if (
          compareRatioToDecimal(
            rowSemantics.entryPrice,
            rule.lowerEntryPrice,
          ) >= 0 &&
          compareRatioToDecimal(
            rowSemantics.entryPrice,
            rule.upperEntryPrice,
          ) <= 0
        ) {
          classification = "skipped_by_rule";
          responsibleRuleId = rule.ruleId;
          reasonCode = "ti_v3_simulation_entry_price_inside_excluded_range";
          break;
        }
      }
      if (
        rule.kind === "after_outcome_exclusion" &&
        state.pendingAfterOutcomeRules?.has(rule.ruleId)
      ) {
        classification = "skipped_by_rule";
        responsibleRuleId = rule.ruleId;
        reasonCode = `ti_v3_simulation_skip_after_${rule.triggerOutcome}`;
        state.pendingAfterOutcomeRules.delete(rule.ruleId);
        break;
      }
    }
    if (
      classification === "executed_unchanged" ||
      classification === "unavailable_required_authority"
    ) {
      if (state.executedTradeCount !== null) {
        state.executedTradeCount += BigInt(1);
      }
      if (state.instrumentAttemptCounts !== null) {
        state.instrumentAttemptCounts.set(
          row.stableInstrumentKey,
          (state.instrumentAttemptCounts.get(row.stableInstrumentKey) ??
            BigInt(0)) + BigInt(1),
        );
      }
      if (stateDependencies.completedRealizedOutcome) {
        state.executedRows.push(row);
      }
      simulatedRows.push(row);
    }
    outcomes.push(tradeOutcome(
      row,
      classification,
      responsibleRuleId,
      reasonCode,
      before,
      snapshot(state, stateDependencies, row.stableInstrumentKey),
    ));
  }
  if (
    BigInt(outcomes.length) > BigInt(plan.value.limits.affectedTradeLimit) ||
    BigInt(sessions.size) > BigInt(plan.value.limits.sessionSummaryLimit)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_oversized",
      "$.simulationOutput",
    );
  }
  const actualRows = filtered.included.map((item) => item.row);
  const actualNetPnl = sum(actualRows);
  const simulatedNetPnl = sum(simulatedRows);
  const difference = subtractExactDecimals(
    exact(simulatedNetPnl),
    exact(actualNetPnl),
  );
  if (!difference.ok) {
    return contractFailure(difference.error.code, "$.netPnlDifference");
  }
  const sourceExcludedCount = data.value.excludedCandidates.length;
  const actualCounts = Object.freeze({
    candidateCount: request.sourceQueryResult.candidateCount,
    includedCount: String(actualRows.length),
    excludedCount: String(
      filtered.excluded.length + sourceExcludedCount,
    ),
  });
  const simulatedCounts = Object.freeze({
    candidateCount: request.sourceQueryResult.candidateCount,
    includedCount: String(simulatedRows.length),
    excludedCount: String(
      filtered.excluded.length +
      sourceExcludedCount +
      actualRows.length -
      simulatedRows.length,
    ),
  });
  const simulatedKeys = new Set(
    simulatedRows.map((row) => row.semanticRoundTripKey),
  );
  const simulatedSemantics = [...simulatedKeys]
    .map((key) => includedSemantics.get(key))
    .filter((item): item is NonNullable<typeof item> => item !== undefined);
  const triggeringRulesByTrade = new Map<string, string[]>();
  for (const [ruleId, keys] of triggeringTradeKeysByRule) {
    for (const key of keys) {
      const existing = triggeringRulesByTrade.get(key);
      if (existing === undefined) triggeringRulesByTrade.set(key, [ruleId]);
      else existing.push(ruleId);
    }
  }
  const finalOutcomes = Object.freeze(outcomes.map((outcome) =>
    Object.freeze({
      ...outcome,
      triggeredRuleIds: Object.freeze(
        [...(triggeringRulesByTrade.get(outcome.sourceTradeKey) ?? [])]
          .sort(compareUnicodeCodePoints),
      ),
    })));
  const removedLossOutcomes = finalOutcomes
    .filter((outcome) =>
      isRuleExcluded(outcome) &&
      compareExactDecimals(exact(outcome.actualNetPnl), exact("0")) < 0);
  const removedLossKeys = removedLossOutcomes
    .map((outcome) => outcome.sourceTradeKey);
  const removedGainOutcomes = finalOutcomes
    .filter((outcome) =>
      isRuleExcluded(outcome) &&
      compareExactDecimals(exact(outcome.actualNetPnl), exact("0")) > 0);
  const removedGainKeys = removedGainOutcomes
    .map((outcome) => outcome.sourceTradeKey);
  const neutralAffectedCount = finalOutcomes.filter((outcome) =>
    isRuleExcluded(outcome) &&
    compareExactDecimals(exact(outcome.actualNetPnl), exact("0")) === 0
  ).length;
  const ruleAffectedCounts = new Map<string, number>();
  for (const outcome of finalOutcomes) {
    if (
      outcome.responsibleRuleId !== null &&
      isRuleExcluded(outcome)
    ) {
      ruleAffectedCounts.set(
        outcome.responsibleRuleId,
        (ruleAffectedCounts.get(outcome.responsibleRuleId) ?? 0) + 1,
      );
    }
  }
  const actualPnlBySession = new Map<string, CanonicalDecimal>();
  const simulatedPnlBySession = new Map<string, CanonicalDecimal>();
  for (const row of actualRows) {
    const key = sessionKey(row);
    const next = addExactDecimals(
      actualPnlBySession.get(key) ?? exact("0"),
      exact(row.netPnl),
    );
    if (!next.ok) {
      return contractFailure(next.error.code, "$.actualSessionPnl");
    }
    actualPnlBySession.set(key, next.value);
  }
  for (const row of simulatedRows) {
    const key = sessionKey(row);
    const next = addExactDecimals(
      simulatedPnlBySession.get(key) ?? exact("0"),
      exact(row.netPnl),
    );
    if (!next.ok) {
      return contractFailure(next.error.code, "$.simulatedSessionPnl");
    }
    simulatedPnlBySession.set(key, next.value);
  }
  let daysHelped = 0;
  let daysHarmed = 0;
  for (const [key, actualPnl] of actualPnlBySession) {
    const sessionDifference = subtractExactDecimals(
      simulatedPnlBySession.get(key) ?? exact("0"),
      actualPnl,
    );
    if (!sessionDifference.ok) {
      return contractFailure(sessionDifference.error.code, "$.sessionPnl");
    }
    const comparison = compareExactDecimals(
      sessionDifference.value,
      exact("0"),
    );
    if (comparison > 0) daysHelped += 1;
    if (comparison < 0) daysHarmed += 1;
  }
  const ruleById = new Map(rules.map((rule) => [rule.ruleId, rule]));
  const rowByKey = new Map(
    actualRows.map((row) => [row.semanticRoundTripKey, row]),
  );
  const sessionStopEvents = new Set<string>();
  const tickerStopEvents = new Set<string>();
  for (const [ruleId, keys] of triggeringTradeKeysByRule) {
    const rule = ruleById.get(ruleId);
    if (rule === undefined) continue;
    for (const key of keys) {
      const row = rowByKey.get(key);
      if (row === undefined) continue;
      if (
        rule.kind === "stop_after_consecutive_losses" ||
        rule.kind === "stop_after_daily_dollar_drawdown" ||
        rule.kind === "stop_after_profit_giveback"
      ) {
        sessionStopEvents.add(`${sessionKey(row)}|${ruleId}`);
      }
      if (rule.kind === "stop_after_losing_ticker_attempts") {
        tickerStopEvents.add(
          `${sessionKey(row)}|${row.stableInstrumentKey}|${ruleId}`,
        );
      }
    }
  }
  const triggeringOutcomes = finalOutcomes
    .filter((outcome) => outcome.triggeredRuleIds.length > 0);
  const evidenceLimit = BigInt(plan.value.limits.evidenceTradeLimit);
  const affectedSummary = Object.freeze({
    tradesHelped: countString(removedLossKeys.length),
    tradesHarmed: countString(removedGainKeys.length),
    daysHelped: countString(daysHelped),
    daysHarmed: countString(daysHarmed),
    losingTradesAvoided: countString(removedLossKeys.length),
    profitableTradesRemoved: countString(removedGainKeys.length),
    lossesRetained: countString(finalOutcomes.filter((outcome) =>
      simulatedKeys.has(outcome.sourceTradeKey) &&
      compareExactDecimals(exact(outcome.actualNetPnl), exact("0")) < 0
    ).length),
    winnersRetained: countString(finalOutcomes.filter((outcome) =>
      simulatedKeys.has(outcome.sourceTradeKey) &&
      compareExactDecimals(exact(outcome.actualNetPnl), exact("0")) > 0
    ).length),
    neutralAffectedTrades: countString(neutralAffectedCount),
    sessionStopEvents: countString(sessionStopEvents.size),
    tickerStopEvents: countString(tickerStopEvents.size),
    cooldownExclusions: countString(finalOutcomes.filter((outcome) =>
      outcome.classification === "skipped_during_cooldown"
    ).length),
    ruleSpecificAffectedCounts: Object.freeze(
      [...ruleAffectedCounts]
        .sort(([left], [right]) => compareUnicodeCodePoints(left, right))
        .map(([ruleId, affectedCount]) =>
          Object.freeze({ ruleId, affectedCount: countString(affectedCount) })),
    ),
  });
  const evidence = Object.freeze([
    buildEvidenceBucket(
      "representative_helped_trades",
      removedLossOutcomes,
      evidenceLimit,
    ),
    buildEvidenceBucket(
      "representative_harmed_trades",
      removedGainOutcomes,
      evidenceLimit,
    ),
    buildEvidenceBucket(
      "losing_trades_avoided",
      removedLossOutcomes,
      evidenceLimit,
    ),
    buildEvidenceBucket(
      "profitable_trades_removed",
      removedGainOutcomes,
      evidenceLimit,
    ),
    buildEvidenceBucket(
      "rule_triggering_trades",
      triggeringOutcomes,
      evidenceLimit,
    ),
    buildEvidenceBucket(
      "counterexamples_rule_made_results_worse",
      removedGainOutcomes,
      evidenceLimit,
    ),
  ]);
  const ruleUnavailableCount = finalOutcomes.filter((outcome) =>
    outcome.classification === "unavailable_required_authority"
  ).length;
  const ruleSkippedCount = finalOutcomes.filter(isRuleExcluded).length;
  const body = {
    schemaVersion: COUNTERFACTUAL_SIMULATION_RESULT_VERSION,
    historicalBasis: "historical_in_sample_counterfactual_v1" as const,
    plan: plan.value,
    sourceQueryResultDigest: request.sourceQueryResult.resultDigest,
    candidateCount: request.sourceQueryResult.candidateCount,
    includedCount: String(actualRows.length),
    excludedCount: String(
      filtered.excluded.length + sourceExcludedCount,
    ),
    executedCount: String(simulatedRows.length),
    resizedCount: "0" as const,
    skippedCount: String(ruleSkippedCount),
    unavailableCount: String(sourceExcludedCount + ruleUnavailableCount),
    actualTradeKeys: Object.freeze(
      actualRows.map((row) => row.semanticRoundTripKey),
    ),
    simulatedTradeKeys: Object.freeze(
      simulatedRows.map((row) => row.semanticRoundTripKey),
    ),
    actualMetrics: calculateTradeQueryMetrics(
      plan.value.sourceQueryPlan.metrics,
      filtered.included,
      actualCounts,
      plan.value.sourceQueryPlan.authority.currency,
    ),
    simulatedMetrics: calculateTradeQueryMetrics(
      plan.value.sourceQueryPlan.metrics,
      simulatedSemantics,
      simulatedCounts,
      plan.value.sourceQueryPlan.authority.currency,
    ),
    actualNetPnl,
    simulatedNetPnl,
    netPnlDifference: difference.value,
    effect: compareExactDecimals(difference.value, exact("0")) > 0
      ? "helped" as const
      : compareExactDecimals(difference.value, exact("0")) < 0
        ? "harmed" as const
        : "unchanged" as const,
    affectedSummary,
    evidence,
    tradeOutcomes: finalOutcomes,
    limitationCodes: Object.freeze([
      "ti_v3_simulation_historical_in_sample_not_future_edge",
      "ti_v3_simulation_no_alternative_fills_or_market_path",
      ...(sourceExcludedCount > 0
        ? ["ti_v3_simulation_source_authority_unavailable"]
        : []),
      ...(ruleUnavailableCount > 0
        ? ["ti_v3_simulation_required_rule_authority_unavailable"]
        : []),
    ].sort(compareUnicodeCodePoints)),
  };
  const addressed = finalizeContentAddressedAuthority(
    "counterfactual_simulation_result",
    body,
    "resultDigest",
  );
  return addressed.ok
    ? {
        ok: true,
        value: addressed.value as CounterfactualSimulationResult,
      }
    : addressed;
}

export interface CounterfactualSimulationReplayRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly sourceQueryResult: TradeQueryResult;
  readonly persistedResult: unknown;
}

export function verifyAndReplayCounterfactualSimulationResult(
  request: CounterfactualSimulationReplayRequest,
): ExactResult<CounterfactualSimulationResult, AnalyticalContractFailure> {
  const record = validateContractRecord(request.persistedResult, [
    "schemaVersion", "historicalBasis", "plan", "sourceQueryResultDigest",
    "candidateCount", "includedCount", "excludedCount", "executedCount",
    "resizedCount", "skippedCount", "unavailableCount", "actualTradeKeys",
    "simulatedTradeKeys", "actualMetrics", "simulatedMetrics", "actualNetPnl",
    "simulatedNetPnl", "netPnlDifference", "effect", "affectedSummary",
    "evidence", "tradeOutcomes", "limitationCodes", "resultDigest",
  ]);
  if (!record.ok) return record;
  if (
    record.value.schemaVersion !== COUNTERFACTUAL_SIMULATION_RESULT_VERSION ||
    record.value.historicalBasis !==
      "historical_in_sample_counterfactual_v1"
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.schemaVersion",
    );
  }
  const digest = validateClaimedDigest(
    record.value.resultDigest,
    "$.resultDigest",
    "counterfactual_simulation_result",
  );
  if (!digest.ok) return digest;
  const replayed = executeCounterfactualSimulation({
    source: request.source,
    partitionReceipt: request.partitionReceipt,
    sourceQueryResult: request.sourceQueryResult,
    simulationPlan: record.value.plan,
  });
  if (!replayed.ok) return replayed;
  if (replayed.value.resultDigest !== digest.value) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.resultDigest",
    );
  }
  return replayed;
}
