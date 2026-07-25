import { compareDailyStopDecimals } from "./daily-stop-exact-math";
import { addDailyStopDecimals, subtractDailyStopDecimals } from "./daily-stop-exact-math";

export interface DailyStopReferenceRow {
  readonly key: string;
  readonly firstEntryAt: string;
  readonly finalExitAt: string;
  readonly netPnl: string;
}

export interface DailyStopReferenceResult {
  readonly retainedKeys: readonly string[];
  readonly removedKeys: readonly string[];
  readonly thresholdReached: boolean;
  readonly triggerKey: string | null;
  readonly stopAt: string | null;
  readonly ambiguous: boolean;
  readonly simulationState: "included" | "excluded_ambiguous";
  readonly ambiguityReasonCode: string | null;
  readonly actualTradeCount: string;
  readonly simulatedTradeCount: string;
  readonly removedTradeCount: string;
  readonly actualNetPnl: string;
  readonly simulatedNetPnl: string | null;
  readonly removedNetPnl: string | null;
  readonly difference: string | null;
}

function byEntry(left: DailyStopReferenceRow, right: DailyStopReferenceRow): number {
  return left.firstEntryAt < right.firstEntryAt ? -1 : left.firstEntryAt > right.firstEntryAt ? 1 : left.key < right.key ? -1 : left.key > right.key ? 1 : 0;
}

/**
 * Deliberately independent reference implementation. It uses a timestamp
 * completion sweep and never calls the production trigger or suffix loop.
 */
export function simulateDailyStopReference(
  rows: readonly DailyStopReferenceRow[],
  threshold: string,
): DailyStopReferenceResult {
  const ordered = [...rows].sort(byEntry);
  const completions = [...ordered].sort((left, right) =>
    left.finalExitAt < right.finalExitAt ? -1 : left.finalExitAt > right.finalExitAt ? 1 : 0);
  let lossStreak = BigInt(0);
  let trigger: DailyStopReferenceRow | null = null;
  let ambiguous = false;
  let index = 0;
  while (index < completions.length && trigger === null) {
    const timestamp = completions[index].finalExitAt;
    const group: DailyStopReferenceRow[] = [];
    while (index < completions.length && completions[index].finalExitAt === timestamp) {
      group.push(completions[index]);
      index += 1;
    }
    const lossCount = group.filter((row) => compareDailyStopDecimals(row.netPnl, "0") < 0).length;
    const hasLoss = lossCount > 0;
    const hasNonLoss = group.some((row) => compareDailyStopDecimals(row.netPnl, "0") >= 0);
    // Same-time mixed outcomes have no admissible completion order. Do not
    // use entry, semantic, or hash order to manufacture one.
    if (group.length > 1 && hasLoss && (hasNonLoss || lossStreak + BigInt(lossCount) >= BigInt(threshold))) {
      ambiguous = true;
      break;
    }
    for (const row of group) {
      const outcome = compareDailyStopDecimals(row.netPnl, "0");
      if (outcome < 0) lossStreak += BigInt(1);
      else lossStreak = BigInt(0);
      if (lossStreak >= BigInt(threshold)) {
        trigger = row;
        break;
      }
    }
  }
  const actualNetPnl = addDailyStopDecimals(ordered.map((row) => row.netPnl));
  if (ambiguous) return Object.freeze({ retainedKeys: [], removedKeys: [], thresholdReached: false, triggerKey: null, stopAt: null, ambiguous: true, simulationState: "excluded_ambiguous", ambiguityReasonCode: "ti_v3_daily_stop_completion_order_ambiguous", actualTradeCount: String(ordered.length), simulatedTradeCount: "0", removedTradeCount: "0", actualNetPnl, simulatedNetPnl: null, removedNetPnl: null, difference: null });
  const removed = trigger === null ? [] : ordered.filter((row) => row.firstEntryAt > trigger.finalExitAt);
  const removedSet = new Set(removed.map((row) => row.key));
  const removedNetPnl = addDailyStopDecimals(removed.map((row) => row.netPnl));
  const simulatedNetPnl = subtractDailyStopDecimals(actualNetPnl, removedNetPnl);
  return Object.freeze({
    retainedKeys: ordered.filter((row) => !removedSet.has(row.key)).map((row) => row.key),
    removedKeys: removed.map((row) => row.key),
    thresholdReached: trigger !== null,
    triggerKey: trigger?.key ?? null,
    stopAt: trigger?.finalExitAt ?? null,
    ambiguous: false,
    simulationState: "included",
    ambiguityReasonCode: null,
    actualTradeCount: String(ordered.length),
    simulatedTradeCount: String(ordered.length - removed.length),
    removedTradeCount: String(removed.length),
    actualNetPnl,
    simulatedNetPnl,
    removedNetPnl,
    difference: subtractDailyStopDecimals(simulatedNetPnl, actualNetPnl),
  });
}
