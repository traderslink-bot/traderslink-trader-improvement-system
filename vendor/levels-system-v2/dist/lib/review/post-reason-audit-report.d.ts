type AuditRow = {
    type?: string;
    operation?: string;
    status?: string;
    timestamp?: number;
    symbol?: string;
    title?: string;
    messageKind?: string;
    eventType?: string;
    whyPosted?: string;
    postBudgetSymbolType?: string;
    noLevelReason?: string;
};
export type PostReasonAuditReport = {
    generatedAt: string;
    sourceAuditPath: string;
    totals: {
        postedRows: number;
        rowsWithWhyPosted: number;
        rowsWithoutWhyPosted: number;
        rowsWithNoLevelReason: number;
    };
    reasons: Array<{
        reason: string;
        count: number;
        symbols: string[];
        messageKinds: Record<string, number>;
    }>;
    symbols: Array<{
        symbol: string;
        postedRows: number;
        rowsWithWhyPosted: number;
        rowsWithNoLevelReason: number;
        postBudgetSymbolTypes: Record<string, number>;
        topReasons: Array<{
            reason: string;
            count: number;
        }>;
    }>;
    noLevelExamples: Array<{
        symbol: string;
        timestamp: number;
        title?: string;
        noLevelReason: string;
    }>;
    missingWhyPostedExamples: Array<{
        symbol: string;
        timestamp: number;
        title?: string;
        messageKind?: string;
    }>;
};
export declare function buildPostReasonAuditReportFromRows(rows: AuditRow[], sourceAuditPath: string): PostReasonAuditReport;
export declare function buildPostReasonAuditReport(auditPath: string): PostReasonAuditReport;
export declare function renderPostReasonAuditMarkdown(report: PostReasonAuditReport): string;
export declare function writePostReasonAuditReport(params: {
    report: PostReasonAuditReport;
    jsonPath: string;
    markdownPath: string;
}): void;
export {};
//# sourceMappingURL=post-reason-audit-report.d.ts.map