import type { CandleFetchTimeframe, CandleProviderName } from "../support-resistance/index.js";
export type WhyNoPostReplayVerdict = "quiet_supported_by_candles" | "quiet_preserved_meaningful_moves" | "quiet_may_hide_move" | "unproven_runtime_silence" | "unproven_missing_candles";
export type QuietRiskCause = "not_applicable" | "weakly_covered" | "policy_suppressed" | "nearby_non_matching_activity" | "runtime_or_feed_silence" | "candle_context_watch";
export type WhyNoPostReplayProofSymbol = {
    symbol: string;
    verdict: WhyNoPostReplayVerdict;
    postCount: number;
    candleCount: number;
    reviewedCandleCount: number;
    candidateCount: number;
    coveredCount: number;
    weakCoverageCount: number;
    missedCount: number;
    majorCount: number;
    largestReviewedMovePct: number | null;
    largestReviewedRangePct: number | null;
    candidateExamples: Array<{
        timestamp: number;
        timestampIso: string;
        kind: string;
        coverage: string;
        severity: string;
        closeMovePct: number;
        rangePct: number;
        open: number;
        high: number;
        low: number;
        close: number;
        reason: string;
        nearestPostTitles: string[];
        quietRiskCause: QuietRiskCause;
        quietRiskReason: string;
    }>;
    replayEvidence: {
        originalPosted: number;
        simulatedPosted: number;
        suppressed: number;
        threadStorySuppressions: number;
        suppressedByReason: Record<string, number>;
        sampleSuppressions: Array<{
            timestamp: number;
            timestampIso: string;
            messageKind: string;
            reason: string;
            title?: string;
        }>;
    } | null;
    reason: string;
};
export type WhyNoPostReplayProofReport = {
    generatedAt: string;
    sourceAuditPath: string;
    cacheDirectoryPath: string;
    warehouseDirectoryPath: string | null;
    provider: CandleProviderName;
    timeframe: CandleFetchTimeframe;
    totals: {
        symbols: number;
        quietSupported: number;
        quietPreservedMeaningfulMoves: number;
        quietMayHideMove: number;
        unprovenRuntimeSilence: number;
        unprovenMissingCandles: number;
        missedCandidates: number;
        actionableMissedCandidates: number;
        runtimeSilenceCandidates: number;
        contextWatchCandidates: number;
        policySuppressedCandidates: number;
        majorMissedCandidates: number;
        coveredCandidates: number;
        replaySuppressed: number;
        replayThreadStorySuppressions: number;
        symbolsWithReplaySuppression: number;
    };
    symbols: WhyNoPostReplayProofSymbol[];
};
export type GenerateWhyNoPostReplayProofOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    warehouseDirectoryPath?: string;
    provider?: CandleProviderName;
    timeframe?: CandleFetchTimeframe;
    coverageWindowMs?: number;
    auditWindowPaddingMs?: number;
    includeReplayEvidence?: boolean;
    replayProfile?: "quiet" | "balanced" | "active";
    maxAuditFiles?: number;
};
export type WriteWhyNoPostReplayProofOptions = GenerateWhyNoPostReplayProofOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function generateWhyNoPostReplayProof(options: GenerateWhyNoPostReplayProofOptions): WhyNoPostReplayProofReport;
export declare function formatWhyNoPostReplayProof(report: WhyNoPostReplayProofReport): string;
export declare function writeWhyNoPostReplayProof(options: WriteWhyNoPostReplayProofOptions): WhyNoPostReplayProofReport;
//# sourceMappingURL=why-no-post-replay-proof.d.ts.map