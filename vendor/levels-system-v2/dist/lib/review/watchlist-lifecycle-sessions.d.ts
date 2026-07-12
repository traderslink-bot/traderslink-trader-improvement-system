import type { LiveWatchlistAuditArchive } from "../live-watchlist/live-watchlist-audit-archive.js";
import type { ManualWatchlistLifecycleEvent } from "../monitoring/manual-watchlist-runtime-events.js";
import type { WatchlistEntry, WatchlistLifecycleState } from "../monitoring/monitoring-types.js";
export type WatchlistLifecycleSampleScope = "active_window" | "restart_restore_window" | "archive_only" | "outside_active_window" | "unknown_lifecycle";
export type WatchlistLifecycleSessionSource = "archive" | "state" | "event_log";
export type WatchlistLifecycleSession = {
    symbol: string;
    startedAt: number;
    endedAt: number | null;
    source: WatchlistLifecycleSessionSource;
    status: string;
    lifecycle?: WatchlistLifecycleState;
    firstPostedAt?: number | null;
};
export declare function buildWatchlistLifecycleSessionsFromArchive(archive: LiveWatchlistAuditArchive | null | undefined): WatchlistLifecycleSession[];
export declare function buildWatchlistLifecycleSessionsFromState(entries: WatchlistEntry[] | null | undefined): WatchlistLifecycleSession[];
export declare function buildWatchlistLifecycleSessionsFromEvents(events: ManualWatchlistLifecycleEvent[] | null | undefined): WatchlistLifecycleSession[];
export declare function groupWatchlistLifecycleSessionsBySymbol(sessions: WatchlistLifecycleSession[]): Record<string, WatchlistLifecycleSession[]>;
export declare function classifyWatchlistLifecycleScope(params: {
    symbol: string;
    timestamp: number;
    sessionsBySymbol?: Record<string, WatchlistLifecycleSession[]>;
}): WatchlistLifecycleSampleScope;
export declare function readWatchlistLifecycleSessionsFromFiles(options: {
    archivePath?: string | null;
    statePath?: string | null;
    eventLogPath?: string | null;
}): WatchlistLifecycleSession[];
export declare function emptyLifecycleScopeCounts(): Record<WatchlistLifecycleSampleScope, number>;
//# sourceMappingURL=watchlist-lifecycle-sessions.d.ts.map