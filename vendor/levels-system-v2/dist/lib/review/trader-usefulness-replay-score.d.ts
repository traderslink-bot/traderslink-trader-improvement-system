export type PostUsefulnessLabel = "useful_change" | "early_but_relevant" | "repeat_noise" | "late" | "missing_context";
export type TickerPersonalityLabel = "clean_runner" | "low_volume_chop" | "wide_spread_messy" | "steady_trend" | "halt_prone_microfloat" | "mixed_unknown";
export type LadderConfidenceLabel = "strong" | "usable" | "thin" | "degraded" | "unknown";
export type MaterialChangeLabel = "material_change" | "same_story" | "unclear";
export type TraderUsefulnessReplayPost = {
    symbol: string;
    timestamp: number;
    title?: string;
    messageKind?: string;
    eventType?: string;
    triggerPrice?: number;
    usefulness: PostUsefulnessLabel;
    materialChange: MaterialChangeLabel;
    reasons: string[];
    excerpt: string;
};
export type TraderUsefulnessSymbolScore = {
    symbol: string;
    replayScore: number;
    personality: TickerPersonalityLabel;
    ladderConfidence: LadderConfidenceLabel;
    postCount: number;
    usefulChangeCount: number;
    repeatNoiseCount: number;
    lateCount: number;
    missingContextCount: number;
    materialChangeCount: number;
    sameStoryCount: number;
    reasons: string[];
    evidence: TraderUsefulnessReplayPost[];
};
export type TraderUsefulnessReplayReport = {
    generatedAt: string;
    sourceAuditPath: string;
    totals: {
        symbols: number;
        posts: number;
        usefulChange: number;
        earlyButRelevant: number;
        repeatNoise: number;
        late: number;
        missingContext: number;
        materialChange: number;
        sameStory: number;
    };
    symbols: TraderUsefulnessSymbolScore[];
};
export declare function buildTraderUsefulnessReplayReport(auditPath: string): TraderUsefulnessReplayReport;
export declare function formatTraderUsefulnessReplayMarkdown(report: TraderUsefulnessReplayReport): string;
export declare function writeTraderUsefulnessReplayReport(params: {
    auditPath: string;
    jsonPath: string;
    markdownPath: string;
}): TraderUsefulnessReplayReport;
//# sourceMappingURL=trader-usefulness-replay-score.d.ts.map