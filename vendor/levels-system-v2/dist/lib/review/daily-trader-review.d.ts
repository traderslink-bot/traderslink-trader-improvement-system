export type ExpectedPostBudgetStyle = "low_volume_chop" | "range_bound_small_cap" | "active_runner" | "extreme_runner" | "mixed_or_unknown";
export type DailyTraderReviewSymbol = {
    symbol: string;
    postCount: number;
    expectedBudgetStyle: ExpectedPostBudgetStyle;
    expectedPostBudgetMax: number;
    budgetStatus: "within_budget" | "watch" | "over_budget";
    firstPostAt: number;
    lastPostAt: number;
    firstTitle?: string;
    lastTitle?: string;
    eventCounts: Record<string, number>;
    messageKindCounts: Record<string, number>;
    priceLow: number | null;
    priceHigh: number | null;
    priceRangePct: number | null;
    mainSupport: number | null;
    mainResistance: number | null;
    usefulPostCount: number;
    weakProbeCount: number;
    noLevelCount: number;
    missingWhyPostedCount: number;
    latePostCount: number;
    sameMinuteBurstCount: number;
    noPostEvidenceCoverage: "good" | "partial" | "missing";
    recapLines: string[];
    bestExamples: Array<{
        title: string;
        reason: string;
        excerpt: string;
    }>;
    worstExamples: Array<{
        title: string;
        reason: string;
        excerpt: string;
    }>;
};
export type DailyTraderReviewReport = {
    generatedAt: string;
    sourceAuditPath: string;
    totals: {
        symbols: number;
        posts: number;
        overBudgetSymbols: number;
        missingNoPostEvidenceSymbols: number;
        latePosts: number;
        sameMinuteBursts: number;
    };
    symbols: DailyTraderReviewSymbol[];
};
export declare function buildDailyTraderReviewReport(auditPath: string): DailyTraderReviewReport;
export declare function formatDailyTraderReviewMarkdown(report: DailyTraderReviewReport): string;
export declare function formatDailyTraderReviewHtml(report: DailyTraderReviewReport): string;
export declare function writeDailyTraderReview(params: {
    auditPath: string;
    jsonPath: string;
    markdownPath: string;
    htmlPath: string;
}): DailyTraderReviewReport;
//# sourceMappingURL=daily-trader-review.d.ts.map