import { compareDailyStopDecimals } from "./daily-stop-exact-math";

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
    left.finalExitAt < right.finalExitAt ? -1 : left.finalExitAt > right.finalExitAt ? 1 : byEntry(left, right));
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
    const outcomes = new Set(group.map((row) => compareDailyStopDecimals(row.netPnl, "0")));
    if (group.length > 1 && outcomes.size > 1) {
      ambiguous = true;
      break;
    }
    for (const row of group.sort(byEntry)) {
      const outcome = compareDailyStopDecimals(row.netPnl, "0");
      if (outcome < 0) lossStreak += BigInt(1);
      else lossStreak = BigInt(0);
      if (lossStreak >= BigInt(threshold)) {
        if (group.length > 1 && outcomes.size === 1 && lossStreak - BigInt(1) < BigInt(threshold)) {
          ambiguous = true;
          break;
        }
        trigger = row;
        break;
      }
    }
  }
  if (ambiguous) return Object.freeze({ retainedKeys: [], removedKeys: [], thresholdReached: false, triggerKey: null, stopAt: null, ambiguous: true });
  const removed = trigger === null ? [] : ordered.filter((row) => row.firstEntryAt > trigger.finalExitAt);
  const removedSet = new Set(removed.map((row) => row.key));
  return Object.freeze({
    retainedKeys: ordered.filter((row) => !removedSet.has(row.key)).map((row) => row.key),
    removedKeys: removed.map((row) => row.key),
    thresholdReached: trigger !== null,
    triggerKey: trigger?.key ?? null,
    stopAt: trigger?.finalExitAt ?? null,
    ambiguous: false,
  });
}
