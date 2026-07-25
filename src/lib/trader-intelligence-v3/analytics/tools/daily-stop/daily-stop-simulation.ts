import type { AnalyticalRow } from "../../dataset";
import {
  addDailyStopDecimals,
  compareDailyStopDecimals,
  dailyStopDirection,
  subtractDailyStopDecimals,
} from "./daily-stop-exact-math";
import { DAILY_STOP_LIMITATION_CODES } from "./daily-stop-policy";

export interface DailyStopSessionKey {
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly currency: string;
  readonly sessionDate: string;
  readonly timezone: string;
  readonly dateBasis: "trade_close_date";
}

export interface DailyStopSessionDecision {
  readonly sessionKey: DailyStopSessionKey;
  readonly rows: readonly AnalyticalRow[];
  readonly retainedRows: readonly AnalyticalRow[];
  readonly removedRows: readonly AnalyticalRow[];
  readonly simulationState: "included" | "excluded_ambiguous";
  readonly thresholdReached: boolean;
  readonly thresholdState: "reached" | "not_reached" | "ambiguous";
  readonly triggerRow: AnalyticalRow | null;
  readonly stopAt: string | null;
  readonly ambiguous: boolean;
  readonly limitationCodes: readonly string[];
  readonly actualGrossPnl: string;
  readonly actualCharges: string;
  readonly actualNetPnl: string;
  readonly simulatedGrossPnl: string | null;
  readonly simulatedCharges: string | null;
  readonly simulatedNetPnl: string | null;
  readonly removedGrossPnl: string | null;
  readonly removedCharges: string | null;
  readonly removedNetPnl: string | null;
  readonly difference: string | null;
  readonly classification: "helped" | "harmed" | "unchanged" | null;
  readonly ambiguityReasonCode: string | null;
  readonly overlapDisclosure?: string;
}

export type DailyStopIncludedSessionDecision = DailyStopSessionDecision & {
  readonly simulationState: "included";
  readonly simulatedGrossPnl: string;
  readonly simulatedCharges: string;
  readonly simulatedNetPnl: string;
  readonly removedGrossPnl: string;
  readonly removedCharges: string;
  readonly removedNetPnl: string;
  readonly difference: string;
  readonly classification: "helped" | "harmed" | "unchanged";
};

export function isIncludedDailyStopSessionDecision(decision: DailyStopSessionDecision): decision is DailyStopIncludedSessionDecision {
  return decision.simulationState === "included";
}

function compareEntry(left: AnalyticalRow, right: AnalyticalRow): number {
  if (left.firstEntryAt !== right.firstEntryAt) return left.firstEntryAt < right.firstEntryAt ? -1 : 1;
  const leftSequence = BigInt(left.sequenceInPartition);
  const rightSequence = BigInt(right.sequenceInPartition);
  if (leftSequence !== rightSequence) return leftSequence < rightSequence ? -1 : 1;
  return left.semanticRoundTripKey < right.semanticRoundTripKey ? -1 : left.semanticRoundTripKey > right.semanticRoundTripKey ? 1 : 0;
}

function sum(rows: readonly AnalyticalRow[], field: "grossPnl" | "signedCharges" | "netPnl"): string {
  return addDailyStopDecimals(rows.map((row) => row[field]));
}

function keyFor(row: AnalyticalRow): DailyStopSessionKey {
  return Object.freeze({
    canonicalOwnerKey: row.canonicalOwnerKey,
    canonicalAccountKey: row.canonicalAccountKey,
    currency: row.currency,
    sessionDate: row.sessionDate,
    timezone: row.timezone,
    dateBasis: row.dateBasis,
  });
}

function sessionIdentity(key: DailyStopSessionKey): string {
  return [key.canonicalOwnerKey, key.canonicalAccountKey, key.currency, key.sessionDate, key.timezone, key.dateBasis].join("|");
}

function findTrigger(rows: readonly AnalyticalRow[], threshold: string): { readonly trigger: AnalyticalRow | null; readonly ambiguous: boolean } {
  const completions = [...rows].sort((left, right) =>
    left.finalExitAt < right.finalExitAt ? -1 : left.finalExitAt > right.finalExitAt ? 1 : 0);
  let lossStreak = BigInt(0);
  let index = 0;
  while (index < completions.length) {
    const timestamp = completions[index].finalExitAt;
    const group: AnalyticalRow[] = [];
    while (index < completions.length && completions[index].finalExitAt === timestamp) {
      group.push(completions[index]);
      index += 1;
    }
    const lossCount = group.filter((row) => compareDailyStopDecimals(row.netPnl, "0") < 0).length;
    const hasLoss = lossCount > 0;
    const hasNonLoss = group.some((row) => compareDailyStopDecimals(row.netPnl, "0") >= 0);
    // Completion order is not admissible when multiple same-time outcomes
    // mix losses and non-losses. Entry/semantic/hash order is not a semantic
    // tie-breaker; fail closed because the future streak/trigger can differ.
    if (group.length > 1 && hasLoss && (hasNonLoss || lossStreak + BigInt(lossCount) >= BigInt(threshold))) return { trigger: null, ambiguous: true };
    for (const row of group) {
      const outcome = compareDailyStopDecimals(row.netPnl, "0");
      lossStreak = outcome < 0 ? lossStreak + BigInt(1) : BigInt(0);
      if (lossStreak >= BigInt(threshold)) return { trigger: row, ambiguous: false };
    }
  }
  return { trigger: null, ambiguous: false };
}

export function simulateDailyStopSession(
  rowsInput: readonly AnalyticalRow[],
  threshold: string,
): DailyStopSessionDecision {
  const rows = Object.freeze([...rowsInput].sort(compareEntry));
  if (rows.length === 0) throw new Error("ti_v3_daily_stop_empty_session");
  const sessionKey = keyFor(rows[0]);
  if (rows.some((row) => sessionIdentity(keyFor(row)) !== sessionIdentity(sessionKey))) throw new Error("ti_v3_daily_stop_mixed_session");
  const triggerResult = findTrigger(rows, threshold);
  const limitationCodes = triggerResult.ambiguous ? [DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder] : [];
  const removedRows = triggerResult.trigger === null || triggerResult.ambiguous
    ? []
    : rows.filter((row) => row.firstEntryAt > triggerResult.trigger!.finalExitAt);
  const removedKeys = new Set(removedRows.map((row) => row.semanticRoundTripKey));
  const retainedRows = rows.filter((row) => !removedKeys.has(row.semanticRoundTripKey));
  const actualGrossPnl = sum(rows, "grossPnl");
  const actualCharges = sum(rows, "signedCharges");
  const actualNetPnl = sum(rows, "netPnl");
  if (triggerResult.ambiguous) {
    return Object.freeze({
      sessionKey,
      rows,
      retainedRows: Object.freeze([]),
      removedRows: Object.freeze([]),
      simulationState: "excluded_ambiguous",
      thresholdReached: false,
      thresholdState: "ambiguous",
      triggerRow: null,
      stopAt: null,
      ambiguous: true,
      limitationCodes: Object.freeze([DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder]),
      ambiguityReasonCode: DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder,
      actualGrossPnl,
      actualCharges,
      actualNetPnl,
      simulatedGrossPnl: null,
      simulatedCharges: null,
      simulatedNetPnl: null,
      removedGrossPnl: null,
      removedCharges: null,
      removedNetPnl: null,
      difference: null,
      classification: null,
    });
  }
  const simulatedGrossPnl = sum(retainedRows, "grossPnl");
  const simulatedCharges = sum(retainedRows, "signedCharges");
  const simulatedNetPnl = sum(retainedRows, "netPnl");
  const removedGrossPnl = sum(removedRows, "grossPnl");
  const removedCharges = sum(removedRows, "signedCharges");
  const removedNetPnl = sum(removedRows, "netPnl");
  if (addDailyStopDecimals([simulatedNetPnl, removedNetPnl]) !== actualNetPnl) throw new Error("ti_v3_daily_stop_net_reconciliation_failed");
  const difference = subtractDailyStopDecimals(simulatedNetPnl, actualNetPnl);
  const overlapDisclosure = triggerResult.trigger !== null && rows.some((row) => row.firstEntryAt <= triggerResult.trigger!.finalExitAt && row.finalExitAt > triggerResult.trigger!.finalExitAt);
  const disclosures = overlapDisclosure ? ["ti_v3_daily_stop_future_entries_only_disclosure"] : [];
  return Object.freeze({
    sessionKey,
    rows,
    retainedRows,
    removedRows,
    simulationState: "included",
    thresholdReached: triggerResult.trigger !== null && !triggerResult.ambiguous,
    thresholdState: triggerResult.trigger === null ? "not_reached" : "reached",
    triggerRow: triggerResult.ambiguous ? null : triggerResult.trigger,
    stopAt: triggerResult.ambiguous ? null : triggerResult.trigger?.finalExitAt ?? null,
    ambiguous: triggerResult.ambiguous,
    limitationCodes: Object.freeze([...limitationCodes]),
    actualGrossPnl,
    actualCharges,
    actualNetPnl,
    simulatedGrossPnl,
    simulatedCharges,
    simulatedNetPnl,
    removedGrossPnl,
    removedCharges,
    removedNetPnl,
    difference,
    classification: dailyStopDirection(difference),
    ambiguityReasonCode: null,
    // The disclosure is intentionally retained in the session object for the
    // artifact builder; it is not a claim-blocking limitation.
    ...(disclosures.length > 0 ? { overlapDisclosure: disclosures[0] } : {}),
  }) as DailyStopSessionDecision;
}

export function groupDailyStopSessions(rows: readonly AnalyticalRow[]): readonly AnalyticalRow[][] {
  const groups = new Map<string, AnalyticalRow[]>();
  for (const row of rows) {
    const key = sessionIdentity(keyFor(row));
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return Object.freeze([...groups.values()].sort((left, right) => {
    const a = keyFor(left[0]);
    const b = keyFor(right[0]);
    const leftKey = sessionIdentity(a);
    const rightKey = sessionIdentity(b);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  }));
}
