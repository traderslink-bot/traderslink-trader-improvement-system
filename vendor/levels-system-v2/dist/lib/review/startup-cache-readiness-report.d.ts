import type { CandleFetchTimeframe, CandleProviderName } from "../support-resistance/index.js";
type StartupCacheTimeframe = Extract<CandleFetchTimeframe, "daily" | "4h" | "5m">;
export type StartupCacheReadinessStatus = "ready_for_fast_restore" | "usable_but_stale" | "partial_cache" | "blocked" | "inactive";
export type StartupCacheTimeframeReadiness = {
    timeframe: StartupCacheTimeframe;
    candleCount: number;
    requiredCount: number;
    earliestTimestamp: number | null;
    latestTimestamp: number | null;
    latestAgeMinutes: number | null;
    enoughCandles: boolean;
    stale: boolean;
};
export type StartupCacheSymbolReadiness = {
    symbol: string;
    active: boolean;
    lifecycle: string | null;
    hasDiscordThread: boolean;
    status: StartupCacheReadinessStatus;
    reason: string;
    timeframes: Record<StartupCacheTimeframe, StartupCacheTimeframeReadiness>;
    canRestoreLevelsFromCache: boolean;
    discordSnapshotPolicy: "wait_for_fresh_refresh" | "do_not_post_from_cache";
    freshRefreshRequiredBeforeDiscordSnapshot: true;
};
export type StartupCacheReadinessReport = {
    generatedAt: string;
    watchlistStatePath: string;
    cacheDirectoryPath: string;
    provider: CandleProviderName;
    requiredCandles: Record<StartupCacheTimeframe, number>;
    totals: {
        symbols: number;
        activeSymbols: number;
        readyForFastRestore: number;
        usableButStale: number;
        partialCache: number;
        blocked: number;
        inactive: number;
    };
    symbols: StartupCacheSymbolReadiness[];
};
export type BuildStartupCacheReadinessReportOptions = {
    watchlistStatePath?: string;
    cacheDirectoryPath?: string;
    provider?: CandleProviderName;
    activeOnly?: boolean;
    now?: number;
    requiredCandles?: Partial<Record<StartupCacheTimeframe, number>>;
    maxAgeMs?: Partial<Record<StartupCacheTimeframe, number>>;
};
export type WriteStartupCacheReadinessReportOptions = BuildStartupCacheReadinessReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildStartupCacheReadinessReport(options?: BuildStartupCacheReadinessReportOptions): StartupCacheReadinessReport;
export declare function formatStartupCacheReadinessMarkdown(report: StartupCacheReadinessReport): string;
export declare function writeStartupCacheReadinessReport(options: WriteStartupCacheReadinessReportOptions): StartupCacheReadinessReport;
export {};
//# sourceMappingURL=startup-cache-readiness-report.d.ts.map