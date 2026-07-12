import { type LevelRuntimeCompareActivePath } from "./level-runtime-mode.js";
export type RuntimeCompareLogEntry = {
    type?: string | null;
    symbol?: string | null;
    timestamp?: number | null;
    activePath?: string | null;
    alternatePath?: string | null;
    activeTopSupport?: string | null;
    alternateTopSupport?: string | null;
    activeTopResistance?: string | null;
    alternateTopResistance?: string | null;
    activeVisibleCounts?: {
        support?: number | null;
        resistance?: number | null;
    } | null;
    alternateVisibleCounts?: {
        support?: number | null;
        resistance?: number | null;
    } | null;
    notableDifferences?: string[] | null;
    newPathContext?: {
        topSupportState?: string | null;
        topSupportConfidence?: number | null;
        topSupportExplanation?: string | null;
        topResistanceState?: string | null;
        topResistanceConfidence?: number | null;
        topResistanceExplanation?: string | null;
    } | null;
};
export type RuntimeCompareDifferenceCategory = "top_support_changed" | "top_resistance_changed" | "both_tops_changed" | "ladder_count_changed" | "broken_level_handling" | "anchor_difference" | "bucket_approximation" | "strength_label_approximation" | "metadata_difference" | "clutter_difference" | "top_level_disagreement";
export type RuntimeCompareParseIssue = {
    sourceLabel: string;
    lineNumber?: number;
    reason: string;
    rawSnippet: string;
};
export type RuntimeCompareNormalizedEvent = {
    symbol: string;
    timestamp: number | null;
    sourceLabel: string;
    lineNumber?: number;
    activePath: LevelRuntimeCompareActivePath;
    alternatePath: LevelRuntimeCompareActivePath;
    activeTopSupport: string | null;
    alternateTopSupport: string | null;
    activeTopResistance: string | null;
    alternateTopResistance: string | null;
    activeVisibleCounts: {
        support: number;
        resistance: number;
    };
    alternateVisibleCounts: {
        support: number;
        resistance: number;
    };
    supportChanged: boolean;
    resistanceChanged: boolean;
    bothChanged: boolean;
    ladderCountChanged: boolean;
    notableDifferences: string[];
    categories: RuntimeCompareDifferenceCategory[];
    brokenLevelMentioned: boolean;
    approximationMentioned: boolean;
    newPathLooksCleaner: boolean;
    newPathLooksNoisier: boolean;
    newPathContext: {
        topSupportState: string | null;
        topSupportConfidence: number | null;
        topSupportExplanation: string | null;
        topResistanceState: string | null;
        topResistanceConfidence: number | null;
        topResistanceExplanation: string | null;
    };
};
export type RuntimeCompareSymbolSummary = {
    symbol: string;
    totalEvents: number;
    supportChangeCount: number;
    resistanceChangeCount: number;
    bothChangedCount: number;
    ladderCountChangedCount: number;
    brokenLevelDifferenceCount: number;
    approximationIssueCount: number;
    newPathCleanerCount: number;
    newPathNoisierCount: number;
    categoryCounts: Record<RuntimeCompareDifferenceCategory, number>;
    topRepresentativeDifference: string | null;
    flags: string[];
};
export type RuntimeCompareManualReviewAssessment = "likely_improvement" | "likely_regression" | "ambiguous" | "needs_human_inspection";
export type RuntimeCompareManualReviewItem = {
    symbol: string;
    reason: string;
    count: number;
    frequencyPct: number;
    representativeDifference: string | null;
    assessment: RuntimeCompareManualReviewAssessment;
    priorityScore: number;
};
export type RuntimeCompareAggregateSummary = {
    totalCompareEvents: number;
    validEvents: number;
    malformedEvents: number;
    supportChangedCount: number;
    resistanceChangedCount: number;
    bothChangedCount: number;
    ladderCountChangedCount: number;
    brokenLevelDifferenceCount: number;
    approximationRelatedDifferenceCount: number;
    topDifferenceCategories: Array<{
        category: RuntimeCompareDifferenceCategory;
        count: number;
    }>;
    recommendation: string;
};
export type RuntimeCompareReviewReport = {
    validEvents: RuntimeCompareNormalizedEvent[];
    parseIssues: RuntimeCompareParseIssue[];
    aggregateSummary: RuntimeCompareAggregateSummary;
    symbolSummaries: RuntimeCompareSymbolSummary[];
    manualReviewQueue: RuntimeCompareManualReviewItem[];
};
export declare function normalizeRuntimeCompareLogEntry(value: unknown, options?: {
    sourceLabel?: string;
    lineNumber?: number;
}): RuntimeCompareNormalizedEvent | RuntimeCompareParseIssue;
export declare function parseRuntimeCompareLogsFromText(text: string, sourceLabel?: string): {
    validEvents: RuntimeCompareNormalizedEvent[];
    parseIssues: RuntimeCompareParseIssue[];
};
export declare function reviewRuntimeCompareEvents(events: RuntimeCompareNormalizedEvent[], parseIssues?: RuntimeCompareParseIssue[], options?: {
    maxManualReviewItems?: number;
}): RuntimeCompareReviewReport;
//# sourceMappingURL=level-runtime-compare-review.d.ts.map