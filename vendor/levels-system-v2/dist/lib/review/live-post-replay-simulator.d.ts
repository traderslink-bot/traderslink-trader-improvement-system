import { type LiveThreadPostingProfile } from "../monitoring/live-thread-post-policy.js";
export type LivePostReplaySimulationReport = {
    generatedAt: string;
    sourceAuditPath: string;
    profile: LiveThreadPostingProfile;
    totals: {
        originalPosted: number;
        simulatedPosted: number;
        suppressed: number;
        reductionPct: number;
        originalMaxPostsInFiveMinutes: number;
        simulatedMaxPostsInFiveMinutes: number;
        originalMaxPostsInTenMinutes: number;
        simulatedMaxPostsInTenMinutes: number;
        threadStorySuppressions: number;
    };
    perSymbol: Array<{
        symbol: string;
        originalPosted: number;
        simulatedPosted: number;
        suppressed: number;
        reductionPct: number;
        originalMaxPostsInFiveMinutes: number;
        simulatedMaxPostsInFiveMinutes: number;
        originalMaxPostsInTenMinutes: number;
        simulatedMaxPostsInTenMinutes: number;
        originalByKind: Record<string, number>;
        simulatedByKind: Record<string, number>;
        suppressedByReason: Record<string, number>;
        threadStorySuppressions: number;
        sampleSuppressions: Array<{
            timestamp: number;
            messageKind: string;
            reason: string;
            title?: string;
        }>;
    }>;
};
export type LivePostProfileComparisonReport = {
    generatedAt: string;
    sourceAuditPath: string;
    profiles: Array<{
        profile: LiveThreadPostingProfile;
        originalPosted: number;
        simulatedPosted: number;
        suppressed: number;
        reductionPct: number;
        maxPostsInFiveMinutes: number;
        maxPostsInTenMinutes: number;
    }>;
    topSymbols: Array<{
        symbol: string;
        originalPosted: number;
        quiet: number;
        balanced: number;
        active: number;
    }>;
};
export type RunnerStoryReport = {
    generatedAt: string;
    sourceAuditPath: string;
    symbols: Array<{
        symbol: string;
        firstTimestamp: number;
        lastTimestamp: number;
        postCount: number;
        firstPrice: number | null;
        lastPrice: number | null;
        lowPrice: number | null;
        highPrice: number | null;
        byKind: Record<string, number>;
        levelsMentioned: Array<{
            price: number;
            count: number;
        }>;
        qualitySummary: {
            traderCritical: number;
            helpfulContext: number;
            noisyRepeat: number;
            operatorOnly: number;
            unknown: number;
        };
        traderStory: string[];
        missingEventCandidates: Array<{
            timestamp: number;
            side: "support" | "resistance";
            level: number;
            fromPrice: number;
            toPrice: number;
            reason: string;
        }>;
        noisyPostSamples: Array<{
            timestamp: number;
            messageKind: string;
            reason: string;
            title?: string;
        }>;
        tuningSuggestions: string[];
        keyEvents: Array<{
            timestamp: number;
            messageKind: string;
            eventType?: string;
            title?: string;
            price?: number | null;
            level?: number | null;
        }>;
    }>;
};
export declare function buildLivePostReplaySimulationReport(auditPath: string, profileInput?: LiveThreadPostingProfile | string | null): LivePostReplaySimulationReport;
export declare function buildLivePostProfileComparisonReport(auditPath: string): LivePostProfileComparisonReport;
export declare function buildRunnerStoryReport(auditPath: string, symbolsInput?: string[]): RunnerStoryReport;
export declare function formatLivePostReplaySimulationMarkdown(report: LivePostReplaySimulationReport): string;
export declare function formatLivePostProfileComparisonMarkdown(report: LivePostProfileComparisonReport): string;
export declare function formatRunnerStoryMarkdown(report: RunnerStoryReport): string;
export declare function writeLivePostReplaySimulationReports(params: {
    jsonPath: string;
    markdownPath: string;
    report: LivePostReplaySimulationReport;
}): void;
export declare function writeLivePostProfileComparisonReports(params: {
    jsonPath: string;
    markdownPath: string;
    report: LivePostProfileComparisonReport;
}): void;
export declare function writeRunnerStoryReports(params: {
    jsonPath: string;
    markdownPath: string;
    report: RunnerStoryReport;
}): void;
//# sourceMappingURL=live-post-replay-simulator.d.ts.map