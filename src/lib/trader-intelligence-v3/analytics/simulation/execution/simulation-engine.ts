import { compareUnicodeCodePoints } from "../../../domain/canonical";
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
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import type { AnalyticalPartitionReceipt, AnalyticalRow } from "../../dataset";
import type { TradeQueryResult } from "../../query/contracts";
import { applyTradeQueryFilters } from "../../query/filters";
import {
  buildQueryRowSemantics,
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
} from "../contracts";

export const COUNTERFACTUAL_SIMULATION_RESULT_VERSION =
  "ti_v3_counterfactual_simulation_result_v1" as const;

export type SimulationClassification =
  | "executed_unchanged"
  | "skipped_by_rule"
  | "skipped_session_stopped"
  | "excluded_source_filter"
  | "unavailable_required_authority";

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
  readonly sessionStateBefore: Readonly<{
    readonly executedTradeCount: string;
    readonly completedLossStreak: string;
    readonly stoppedByRuleId: string | null;
  }>;
  readonly sessionStateAfter: Readonly<{
    readonly executedTradeCount: string;
    readonly completedLossStreak: string;
    readonly stoppedByRuleId: string | null;
  }>;
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
  executedTradeCount: bigint;
  completedLossStreak: bigint;
  stoppedByRuleId: string | null;
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

function snapshot(state: MutableSessionState) {
  return Object.freeze({
    executedTradeCount: state.executedTradeCount.toString(),
    completedLossStreak: state.completedLossStreak.toString(),
    stoppedByRuleId: state.stoppedByRuleId,
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

function applyCompletions(
  state: MutableSessionState,
  entryAt: string,
  lossRule: Extract<
    CounterfactualRule,
    { kind: "stop_after_consecutive_losses" }
  > | undefined,
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
    const outcomes = new Set(group.map((row) => {
      const comparison = compareExactDecimals(exact(row.netPnl), exact("0"));
      return comparison < 0 ? "loss" : comparison > 0 ? "gain" : "flat";
    }));
    if (outcomes.size > 1) {
      return contractFailure(
        "ti_v3_simulation_ambiguous_completion_tie",
        "$.chronology",
      );
    }
    for (const row of group) {
      state.processedCompletionKeys.add(row.semanticRoundTripKey);
      if (outcomes.has("loss")) {
        state.completedLossStreak += BigInt(1);
      } else {
        state.completedLossStreak = BigInt(0);
      }
      if (
        lossRule !== undefined &&
        state.completedLossStreak >=
          BigInt(lossRule.consecutiveLossThreshold)
      ) state.stoppedByRuleId = lossRule.ruleId;
    }
  }
  return { ok: true, value: true };
}

function tradeOutcome(
  row: AnalyticalRow,
  classification: SimulationClassification,
  ruleId: string | null,
  reasonCode: string,
  before: ReturnType<typeof snapshot>,
  after: ReturnType<typeof snapshot>,
): SimulationTradeOutcome {
  const executed = classification === "executed_unchanged";
  return Object.freeze({
    sourceTradeKey: row.semanticRoundTripKey,
    classification,
    responsibleRuleId: ruleId,
    reasonCode,
    actualNetPnl: row.netPnl,
    simulatedNetPnl: executed ? row.netPnl : null,
    actualSizeAuthority: "accepted_observed_execution",
    simulatedSizeAuthority: executed
      ? "accepted_observed_execution"
      : classification === "unavailable_required_authority"
        ? "unavailable"
        : "not_executed",
    supportingExecutionDigests: row.supportingExecutionDigests,
    supportingOccurrenceKeys: row.supportingOccurrenceKeys,
    sessionStateBefore: before,
    sessionStateAfter: after,
    limitationCodes: Object.freeze([]),
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
  const lossRule = rules.find(
    (rule): rule is Extract<
      CounterfactualRule,
      { kind: "stop_after_consecutive_losses" }
    > => rule.kind === "stop_after_consecutive_losses",
  );
  for (const row of [...data.value.rows].sort(orderRows)) {
    const key = sessionKey(row);
    let state = sessions.get(key);
    if (state === undefined) {
      state = {
        executedTradeCount: BigInt(0),
        completedLossStreak: BigInt(0),
        stoppedByRuleId: null,
        executedRows: [],
        processedCompletionKeys: new Set(),
      };
      sessions.set(key, state);
    }
    if (!includedKeys.has(row.semanticRoundTripKey)) {
      const current = snapshot(state);
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
    const completions = applyCompletions(state, row.firstEntryAt, lossRule);
    if (!completions.ok) return completions;
    const before = snapshot(state);
    let classification: SimulationClassification = "executed_unchanged";
    let responsibleRuleId: string | null = null;
    let reasonCode = "ti_v3_simulation_executed_unchanged";
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
        rule.kind === "maximum_trades_per_day" &&
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
    }
    if (classification === "executed_unchanged") {
      state.executedTradeCount += BigInt(1);
      state.executedRows.push(row);
      simulatedRows.push(row);
    }
    outcomes.push(tradeOutcome(
      row,
      classification,
      responsibleRuleId,
      reasonCode,
      before,
      snapshot(state),
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
    skippedCount: String(actualRows.length - simulatedRows.length),
    unavailableCount: String(sourceExcludedCount),
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
    tradeOutcomes: Object.freeze(outcomes),
    limitationCodes: Object.freeze([
      "ti_v3_simulation_historical_in_sample_not_future_edge",
      "ti_v3_simulation_no_alternative_fills_or_market_path",
      ...(sourceExcludedCount > 0
        ? ["ti_v3_simulation_source_authority_unavailable"]
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
