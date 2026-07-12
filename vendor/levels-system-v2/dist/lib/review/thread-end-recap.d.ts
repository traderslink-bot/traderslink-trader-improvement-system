export type ThreadEndRecap = {
    symbol: string;
    postCount: number;
    firstPostAt: number;
    lastPostAt: number;
    firstTitle?: string;
    lastTitle?: string;
    eventCounts: Record<string, number>;
    messageKindCounts: Record<string, number>;
    mentionedLevels: number[];
    storyStates: Record<string, number>;
    rangeBoxPosts: number;
    weakProbePosts: number;
    behaviorBudgetLabels: Record<string, number>;
    recapLines: string[];
};
export type ThreadEndRecapReport = {
    generatedAt: string;
    sourceAuditPath: string;
    symbols: ThreadEndRecap[];
};
export declare function buildThreadEndRecapReport(auditPath: string): ThreadEndRecapReport;
export declare function formatThreadEndRecapMarkdown(report: ThreadEndRecapReport): string;
export declare function writeThreadEndRecapReport(params: {
    auditPath: string;
    jsonPath: string;
    markdownPath: string;
}): ThreadEndRecapReport;
//# sourceMappingURL=thread-end-recap.d.ts.map