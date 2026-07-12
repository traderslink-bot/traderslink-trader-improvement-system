export type TraderPostQualitySeverity = "blocker" | "major" | "watch" | "historical_only" | "data_quality_only";
export type TraderPostQualityCategory = "system_language" | "direct_advice" | "overcertain_prediction" | "tiny_move_risk_language" | "generic_balanced_language" | "missing_level_claim" | "repeat_overlap" | "clean_example";
export type TraderPostQualityFinding = {
    symbol: string;
    timestamp: number;
    title?: string;
    messageKind?: string;
    eventType?: string;
    category: TraderPostQualityCategory;
    severity: TraderPostQualitySeverity;
    reason: string;
    excerpt: string;
};
export type TraderPostQualitySymbolSummary = {
    symbol: string;
    posted: number;
    findings: number;
    blocker: number;
    major: number;
    watch: number;
    historicalOnly: number;
    dataQualityOnly: number;
    cleanExamples: number;
    topCategories: Record<TraderPostQualityCategory, number>;
    representativeFindings: TraderPostQualityFinding[];
};
export type TraderPostQualityReport = {
    generatedAt: string;
    sourceAuditPath: string;
    totals: {
        posted: number;
        findings: number;
        blocker: number;
        major: number;
        watch: number;
        historicalOnly: number;
        dataQualityOnly: number;
        cleanExamples: number;
        repeatedStoryClusters: number;
        missingLevelClaims: number;
        tinyMoveRiskWarnings: number;
    };
    perSymbol: TraderPostQualitySymbolSummary[];
    findings: TraderPostQualityFinding[];
    repeatedStoryClusters: Array<{
        symbol: string;
        storyKey: string;
        count: number;
        firstTimestamp: number;
        lastTimestamp: number;
        sampleTitle?: string;
        sampleExcerpt: string;
    }>;
};
export declare function buildTraderPostQualityReport(auditPath: string): TraderPostQualityReport;
export declare function renderTraderPostQualityMarkdown(report: TraderPostQualityReport): string;
export declare function writeTraderPostQualityReport(params: {
    report: TraderPostQualityReport;
    jsonPath: string;
    markdownPath: string;
}): void;
//# sourceMappingURL=trader-post-quality-grader.d.ts.map