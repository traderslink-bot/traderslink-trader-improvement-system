import type { LiveWatchlistCardContent, LiveWatchlistLevelMap, LiveWatchlistMarketDataStatus } from "../live-watchlist/live-watchlist-types.js";
type WatchlistQualitySymbolState = {
    symbol: string;
    status?: string;
    updatedAt?: number;
    latestPrice?: number | null;
    nearestSupport?: number | null;
    nearestResistance?: number | null;
    nearestSupportLabel?: string | null;
    nearestResistanceLabel?: string | null;
    latestTraderReadHeadline?: string | null;
    levelMap?: LiveWatchlistLevelMap | null;
    cards?: Partial<Record<string, LiveWatchlistCardContent | null>>;
};
export type WatchlistQualityStatePayload = {
    generatedAt?: number;
    marketDataStatus?: LiveWatchlistMarketDataStatus | string;
    marketDataUpdatedAt?: number | null;
    symbols: WatchlistQualitySymbolState[];
};
export type LiveWatchlistLevelQualityFindingKind = "missing_level_map" | "same_boundary_both_sides" | "nearest_label_mismatch" | "label_vocabulary_mismatch" | "stronger_nearby_hidden" | "strong_structural_anchor_hidden" | "weak_ladder_before_structural_anchor";
export type LiveWatchlistLevelQualityFinding = {
    kind: LiveWatchlistLevelQualityFindingKind;
    severity: "major" | "watch" | "info";
    symbol: string;
    side?: "support" | "resistance";
    price?: number;
    score: number;
    summary: string;
    evidence: string[];
};
export type LiveWatchlistLevelQualityReport = {
    generatedAt: string;
    source: string;
    marketDataStatus: string | null;
    totals: {
        symbols: number;
        liveSymbols: number;
        deactivatedSymbols: number;
        symbolsWithLevelMap: number;
        findings: number;
        majorFindings: number;
        watchFindings: number;
        infoFindings: number;
    };
    findings: LiveWatchlistLevelQualityFinding[];
};
export type WriteLiveWatchlistLevelQualityReportOptions = {
    payload: WatchlistQualityStatePayload;
    source: string;
    outputDirectory: string;
    maxFindings?: number;
};
export declare function buildLiveWatchlistLevelQualityReport(payload: WatchlistQualityStatePayload, source?: string, maxFindings?: number): LiveWatchlistLevelQualityReport;
export declare function writeLiveWatchlistLevelQualityReport(options: WriteLiveWatchlistLevelQualityReportOptions): LiveWatchlistLevelQualityReport;
export {};
//# sourceMappingURL=live-watchlist-level-quality-report.d.ts.map