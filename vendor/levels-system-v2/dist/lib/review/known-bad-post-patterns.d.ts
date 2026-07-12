type AuditRow = {
    type?: string;
    operation?: string;
    status?: string;
    timestamp?: number;
    symbol?: string;
    title?: string;
    body?: string;
    bodyPreview?: string;
    messageKind?: string;
    eventType?: string;
};
export type KnownBadPostPatternId = "surfaced_ladder_no_level" | "tiny_penny_risk" | "generic_balanced_after_pullback" | "system_alert_direction" | "predictive_next_level" | "direct_execution_advice" | "dip_buy_label";
export type KnownBadPostPattern = {
    id: KnownBadPostPatternId;
    label: string;
    severity: "blocker" | "major" | "watch";
    matcher: RegExp;
    badExample: string;
    preferred: string;
};
export type KnownBadPostPatternHit = {
    patternId: KnownBadPostPatternId;
    severity: KnownBadPostPattern["severity"];
    symbol: string;
    timestamp: number;
    title?: string;
    messageKind?: string;
    eventType?: string;
    excerpt: string;
};
export type KnownBadPostPatternReport = {
    generatedAt: string;
    sourceAuditPath: string | null;
    checkedRows: number;
    hitCount: number;
    byPattern: Array<{
        patternId: KnownBadPostPatternId;
        label: string;
        severity: KnownBadPostPattern["severity"];
        hits: number;
        preferred: string;
    }>;
    hits: KnownBadPostPatternHit[];
};
export declare const KNOWN_BAD_POST_PATTERNS: KnownBadPostPattern[];
export declare function evaluateKnownBadPostPatterns(text: string): KnownBadPostPattern[];
export declare function buildKnownBadPostPatternReportFromRows(rows: AuditRow[], sourceAuditPath?: string | null): KnownBadPostPatternReport;
export declare function buildKnownBadPostPatternReport(auditPath: string): KnownBadPostPatternReport;
export declare function renderKnownBadPostPatternMarkdown(report: KnownBadPostPatternReport): string;
export declare function writeKnownBadPostPatternReport(params: {
    report: KnownBadPostPatternReport;
    jsonPath: string;
    markdownPath: string;
}): void;
export {};
//# sourceMappingURL=known-bad-post-patterns.d.ts.map