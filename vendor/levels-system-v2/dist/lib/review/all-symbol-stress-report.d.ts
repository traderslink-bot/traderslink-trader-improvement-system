export type AllSymbolStressPattern = "overposting_original" | "still_noisy_after_policy" | "tight_range_chop" | "fast_runner_cascade" | "missed_event_candidate" | "language_boundary";
export type AllSymbolPostBudgetStatus = "within_budget" | "watch" | "excessive_chop" | "runner_review";
export type AllSymbolBudgetSymbolType = "low_priced_chop" | "range_bound_small_cap" | "active_runner" | "extreme_runner" | "mixed_or_unknown";
export type AllSymbolPostBudget = {
    status: AllSymbolPostBudgetStatus;
    reason: string;
};
export type AllSymbolStressSymbol = {
    symbol: string;
    sessions: number;
    originalPosted: number;
    simulatedPosted: number;
    quietSimulatedPosted: number;
    suppressed: number;
    reductionPct: number;
    maxOriginalPostsInSession: number;
    maxSimulatedPostsInSession: number;
    maxQuietSimulatedPostsInSession: number;
    maxOriginalPostsInTenMinutes: number;
    maxSimulatedPostsInTenMinutes: number;
    maxSessionRangePct: number | null;
    tightRangeSessionCount: number;
    fastRunnerSessionCount: number;
    missingEventCandidates: number;
    noisyPostSamples: number;
    threadStorySuppressions: number;
    languageBoundaryHits: number;
    budgetSymbolType: AllSymbolBudgetSymbolType;
    budgetSessionLimit: number;
    postBudget: AllSymbolPostBudget;
    patterns: AllSymbolStressPattern[];
    sampleSessions: Array<{
        session: string;
        auditPath: string;
        originalPosted: number;
        simulatedPosted: number;
        quietSimulatedPosted: number;
        rangePct: number | null;
        missingEventCandidates: number;
        noisyPostSamples: number;
    }>;
};
export type NoisySymbolRegressionPack = {
    description: string;
    symbols: Array<{
        symbol: string;
        priority: "critical" | "high" | "watch";
        reasons: string[];
        maxSimulatedPostsInSession: number;
        maxSimulatedPostsInTenMinutes: number;
        maxSessionRangePct: number | null;
        targetSessions: AllSymbolStressSymbol["sampleSessions"];
    }>;
};
export type BroadSavedDataReplayPack = {
    description: string;
    archetypes: Array<{
        name: "tight_range_chop" | "fast_runner_cascade" | "missed_event_candidate" | "language_boundary" | "high_activity_watch";
        symbols: Array<{
            symbol: string;
            sessions: AllSymbolStressSymbol["sampleSessions"];
            reason: string;
        }>;
    }>;
};
export type AllSymbolStressReport = {
    generatedAt: string;
    sourceRoot: string;
    auditFilesDiscovered: number;
    auditFilesScanned: number;
    duplicateAuditFilesSkipped: number;
    auditFilesFailed: Array<{
        auditPath: string;
        error: string;
    }>;
    totals: {
        symbols: number;
        originalPosted: number;
        simulatedPosted: number;
        quietSimulatedPosted: number;
        suppressed: number;
        reductionPct: number;
        overpostingOriginalSymbols: number;
        stillNoisyAfterPolicySymbols: number;
        tightRangeChopSymbols: number;
        fastRunnerCascadeSymbols: number;
        missedEventCandidateSymbols: number;
        languageBoundarySymbols: number;
        quietBudgetAttentionSymbols: number;
        postBudgetWatchSymbols: number;
        postBudgetExcessiveChopSymbols: number;
        postBudgetRunnerReviewSymbols: number;
        threadStorySuppressions: number;
    };
    symbols: AllSymbolStressSymbol[];
    regressionPack: NoisySymbolRegressionPack;
    broadReplayPack: BroadSavedDataReplayPack;
};
export declare function discoverDiscordAuditFiles(root: string): Promise<string[]>;
export declare function classifyAllSymbolStressPatterns(symbol: Omit<AllSymbolStressSymbol, "postBudget" | "patterns">): AllSymbolStressPattern[];
export declare function assessAllSymbolPostBudget(symbol: {
    maxSimulatedPostsInSession: number;
    budgetSessionLimit?: number;
    budgetSymbolType?: AllSymbolBudgetSymbolType;
    maxSessionRangePct: number | null;
    tightRangeSessionCount: number;
    fastRunnerSessionCount: number;
}): AllSymbolPostBudget;
export declare function buildNoisySymbolRegressionPack(symbols: AllSymbolStressSymbol[], limit?: number): NoisySymbolRegressionPack;
export declare function buildBroadSavedDataReplayPack(symbols: AllSymbolStressSymbol[], limitPerArchetype?: number): BroadSavedDataReplayPack;
export declare function buildAllSymbolStressReportFromAuditFiles(auditFiles: string[], sourceRoot: string): AllSymbolStressReport;
export type BuildAllSymbolStressReportOptions = {
    maxAuditFiles?: number;
};
export declare function buildAllSymbolStressReport(sourceRoot: string, options?: BuildAllSymbolStressReportOptions): Promise<AllSymbolStressReport>;
export declare function renderAllSymbolStressMarkdown(report: AllSymbolStressReport): string;
//# sourceMappingURL=all-symbol-stress-report.d.ts.map