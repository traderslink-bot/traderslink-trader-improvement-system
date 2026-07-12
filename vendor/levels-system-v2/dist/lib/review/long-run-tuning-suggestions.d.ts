import type { SnapshotAuditReport, ThreadPostPolicyReport } from "./discord-audit-reports.js";
export type TuningSuggestionSeverity = "info" | "watch" | "action";
export type TuningSuggestion = {
    id: string;
    severity: TuningSuggestionSeverity;
    symbol?: string;
    category: "follow_through_repeats" | "continuity_repeats" | "ai_repeats" | "post_burst" | "optional_density" | "delivery_failure" | "level_audit";
    title: string;
    rationale: string;
    suggestedAction: string;
    evidence: Record<string, unknown>;
};
export type LongRunTuningSuggestionsReport = {
    generatedAt: string;
    sourceAuditPath: string;
    summary: {
        actionCount: number;
        watchCount: number;
        infoCount: number;
        symbolsWithActionItems: string[];
    };
    suggestions: TuningSuggestion[];
};
export declare function buildLongRunTuningSuggestionsReport(params: {
    policyReport: ThreadPostPolicyReport;
    snapshotReport: SnapshotAuditReport;
}): LongRunTuningSuggestionsReport;
export declare function formatLongRunTuningSuggestionsMarkdown(report: LongRunTuningSuggestionsReport): string;
export declare function writeLongRunTuningSuggestionsReports(params: {
    jsonPath: string;
    markdownPath: string;
    report: LongRunTuningSuggestionsReport;
}): void;
//# sourceMappingURL=long-run-tuning-suggestions.d.ts.map