export type VisualAuditReplayPoint = {
    timestamp: number;
    title: string;
    messageKind: string;
    eventType: string;
    price: number | null;
    rangeBoxLabel?: string;
    acceptanceLabel?: string;
    behaviorBudgetLabel?: string;
    issueFlags: string[];
    excerpt: string;
};
export type VisualAuditReplaySymbol = {
    symbol: string;
    postCount: number;
    priceLow: number | null;
    priceHigh: number | null;
    issueCount: number;
    points: VisualAuditReplayPoint[];
};
export type VisualAuditReplayReport = {
    generatedAt: string;
    sourceAuditPath: string;
    symbols: VisualAuditReplaySymbol[];
};
export declare function buildVisualAuditReplayReport(auditPath: string): VisualAuditReplayReport;
export declare function formatVisualAuditReplayHtml(report: VisualAuditReplayReport): string;
export declare function writeVisualAuditReplay(params: {
    auditPath: string;
    jsonPath: string;
    htmlPath: string;
}): VisualAuditReplayReport;
//# sourceMappingURL=visual-audit-replay.d.ts.map