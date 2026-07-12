export type TradeLifecycleFinalState = "still_valid" | "range_bound" | "breakout_working" | "breakout_failed" | "support_damaged" | "extended_runner" | "dead_thread" | "insufficient_data";
export type TradeLifecycleSymbolSummary = {
    symbol: string;
    finalState: TradeLifecycleFinalState;
    postCount: number;
    firstPostAt: number | null;
    lastPostAt: number | null;
    startingPrice: number | null;
    endingPrice: number | null;
    mainSupport: string | null;
    mainResistance: string | null;
    bestBreakoutAttempt: string | null;
    bestSupportEvent: string | null;
    recap: string[];
};
export type TradeLifecycleSummaryReport = {
    generatedAt: string;
    sourceAuditPath: string;
    symbols: TradeLifecycleSymbolSummary[];
};
export declare function buildTradeLifecycleSummaryReport(auditPath: string): TradeLifecycleSummaryReport;
export declare function formatTradeLifecycleSummaryMarkdown(report: TradeLifecycleSummaryReport): string;
export declare function writeTradeLifecycleSummaryReport(params: {
    auditPath: string;
    jsonPath: string;
    markdownPath: string;
}): TradeLifecycleSummaryReport;
//# sourceMappingURL=trade-lifecycle-summary.d.ts.map