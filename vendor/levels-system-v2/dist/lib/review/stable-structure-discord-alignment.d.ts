import { type CandleMarketStructureState } from "../structure/index.js";
export type StableStructureDiscordAlignmentClassification = "aligned_context" | "structure_transition_post" | "same_structure_repeat" | "same_structure_refresh" | "raw_chop_suppressed" | "cache_unavailable" | "cache_stale" | "insufficient_candles";
export type StableStructureDiscordAlignmentFinding = {
    severity: "review" | "watch" | "info";
    symbol?: string;
    auditPath?: string;
    reason: string;
    detail: string;
};
export type StableStructureDiscordAlignedPost = {
    auditPath: string;
    session: string;
    symbol: string;
    timestamp: number;
    isoTimestamp: string;
    operation: string | null;
    title: string | null;
    messageKind: string | null;
    eventType: string | null;
    signalCategory: string | null;
    storyKey: string;
    classification: StableStructureDiscordAlignmentClassification;
    stableState: CandleMarketStructureState | null;
    rawState: CandleMarketStructureState | null;
    previousStableState: CandleMarketStructureState | null;
    stableChangedSincePreviousPost: boolean;
    rawChangedSincePreviousPost: boolean;
    minutesSincePreviousPost: number | null;
    materialityScore: number | null;
    decisionReason: string | null;
    cachePath: string | null;
    cacheLagMinutes: number | null;
    candleCountUsed: number;
    traderLine: string | null;
    excerpt: string;
};
export type StableStructureDiscordSymbolSummary = {
    symbol: string;
    postedRows: number;
    alignedRows: number;
    cacheUnavailableRows: number;
    staleCacheRows: number;
    insufficientRows: number;
    stableTransitionPosts: number;
    sameStructureRepeats: number;
    sameStructureRefreshes: number;
    rawChopSuppressedRows: number;
    dominantStableStates: Array<{
        state: CandleMarketStructureState;
        count: number;
    }>;
    repeatedStoryKeys: Array<{
        storyKey: string;
        count: number;
    }>;
    representativeRepeats: StableStructureDiscordAlignedPost[];
};
export type StableStructureDiscordAlignmentReport = {
    generatedAt: string;
    auditRoot: string;
    cacheDirectory: string;
    auditFilesDiscovered: number;
    auditFilesScanned: number;
    cacheSymbolsDiscovered: number;
    summary: {
        postedRows: number;
        alignedRows: number;
        cacheUnavailableRows: number;
        staleCacheRows: number;
        insufficientRows: number;
        stableTransitionPosts: number;
        sameStructureRepeats: number;
        sameStructureRefreshes: number;
        rawChopSuppressedRows: number;
        symbolsWithRepeatedStructure: number;
        reviewFindings: number;
        watchFindings: number;
        infoFindings: number;
    };
    perSymbol: StableStructureDiscordSymbolSummary[];
    posts: StableStructureDiscordAlignedPost[];
    findings: StableStructureDiscordAlignmentFinding[];
    skippedAuditFiles: Array<{
        auditPath: string;
        reason: string;
    }>;
};
export type StableStructureDiscordAlignmentOptions = {
    auditRoot?: string;
    cacheDirectory?: string;
    symbols?: string[];
    auditLimit?: number | null;
    minCandles?: number;
    maxCacheLagMinutes?: number;
    repeatWindowMinutes?: number;
};
export declare function buildStableStructureDiscordAlignmentReport(options?: StableStructureDiscordAlignmentOptions): StableStructureDiscordAlignmentReport;
export declare function formatStableStructureDiscordAlignmentMarkdown(report: StableStructureDiscordAlignmentReport): string;
//# sourceMappingURL=stable-structure-discord-alignment.d.ts.map