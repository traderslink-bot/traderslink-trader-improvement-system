import type { CandleFetchTimeframe, CandleProviderName } from "../market-data/candle-types.js";
export type CandleFreshnessStatus = "fresh" | "usable" | "stale" | "missing";
export type CandleReadinessStatus = "ready" | "partial" | "blocked";
export type FirstPostScoreLabel = "strong" | "usable" | "weak" | "missing";
export type ThreadBalanceVerdict = "balanced" | "too_noisy" | "possibly_too_quiet" | "mixed_review" | "data_unproven";
export type SessionBehaviorProfile = "range_chop" | "clean_runner" | "volatile_runner" | "thin_low_activity" | "failed_runner" | "accumulating_under_resistance" | "mixed_unknown";
export type CandleTimeframeFreshness = {
    timeframe: CandleFetchTimeframe;
    candleCount: number;
    latestCandleTimestamp: number | null;
    latestCandleIso: string | null;
    latestCacheAt: number | null;
    lagToLastPostMinutes: number | null;
    status: CandleFreshnessStatus;
};
export type FirstPostTradeMapScore = {
    label: FirstPostScoreLabel;
    score: number;
    title?: string;
    timestamp: number | null;
    strengths: string[];
    issues: string[];
    excerpt: string | null;
};
export type ScoreFirstPostTradeMapTextInput = {
    title?: string;
    body: string;
    timestamp?: number | null;
};
export type CandleSyncedTimelineItem = {
    timestamp: number;
    timestampIso: string;
    kind: "post" | "candle_move";
    title: string;
    detail: string;
};
export type SessionBehaviorAuditSymbol = {
    symbol: string;
    firstPostAt: number | null;
    lastPostAt: number | null;
    postCount: number;
    alertCount: number;
    candleReadiness: CandleReadinessStatus;
    candleFreshness: CandleTimeframeFreshness[];
    firstPostScore: FirstPostTradeMapScore;
    threadBalance: {
        verdict: ThreadBalanceVerdict;
        expectedMaxPosts: number;
        missedCandidates: number;
        majorMissedCandidates: number;
        repeatedStorySignals: number;
        reasons: string[];
    };
    behaviorProfile: {
        label: SessionBehaviorProfile;
        priceRangePct: number | null;
        maxFiveMinuteMovePct: number | null;
        reviewedCandleCount: number;
        reasons: string[];
    };
    operatorRecapPreview: string[];
    timeline: CandleSyncedTimelineItem[];
};
export type SessionBehaviorAuditReport = {
    generatedAt: string;
    sourceAuditPath: string;
    cacheDirectoryPath: string;
    provider: CandleProviderName;
    totals: {
        symbols: number;
        ready: number;
        partial: number;
        blocked: number;
        tooNoisy: number;
        possiblyTooQuiet: number;
        mixedReview: number;
        dataUnproven: number;
        weakFirstPosts: number;
        missingRuntimeMarkers: number;
    };
    runtimeMarkers: Array<{
        runtimeVersion?: string;
        runtimeStartedAt?: string;
        runtimePid?: number;
        rowCount: number;
    }>;
    symbols: SessionBehaviorAuditSymbol[];
};
export type GenerateSessionBehaviorAuditOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    provider?: CandleProviderName;
};
export type WriteSessionBehaviorAuditOptions = GenerateSessionBehaviorAuditOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function scoreFirstPostTradeMapText(input: ScoreFirstPostTradeMapTextInput | null | undefined): FirstPostTradeMapScore;
export declare function generateSessionBehaviorAudit(options: GenerateSessionBehaviorAuditOptions): SessionBehaviorAuditReport;
export declare function renderSessionBehaviorAuditMarkdown(report: SessionBehaviorAuditReport): string;
export declare function writeSessionBehaviorAudit(options: WriteSessionBehaviorAuditOptions): SessionBehaviorAuditReport;
//# sourceMappingURL=session-behavior-audit.d.ts.map