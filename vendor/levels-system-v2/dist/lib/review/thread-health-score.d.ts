export type ThreadHealthLabel = "healthy" | "watch" | "major_review" | "broken";
export type ThreadHealthSymbolScore = {
    symbol: string;
    label: ThreadHealthLabel;
    score: number;
    postCount: number;
    failedDeliveryCount: number;
    repeatedStoryCount: number;
    weakProbeCount: number;
    noLevelCount: number;
    reasons: string[];
    evidence: string[];
};
export type ThreadHealthScoreReport = {
    generatedAt: string;
    sourceAuditPath: string;
    symbols: ThreadHealthSymbolScore[];
    summary: Record<ThreadHealthLabel, number>;
};
export declare function buildThreadHealthScoreReport(auditPath: string): ThreadHealthScoreReport;
export declare function formatThreadHealthScoreMarkdown(report: ThreadHealthScoreReport): string;
export declare function writeThreadHealthScoreReport(params: {
    auditPath: string;
    jsonPath: string;
    markdownPath: string;
}): ThreadHealthScoreReport;
//# sourceMappingURL=thread-health-score.d.ts.map