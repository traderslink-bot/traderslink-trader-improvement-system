import type { CandleFetchTimeframe, CandleProviderName } from "../market-data/candle-types.js";
export type MissedMoveKind = "upside_break" | "downside_loss" | "large_range";
export type MissedMoveCoverage = "covered" | "weak_coverage" | "missed";
export type MissedMoveSeverity = "major" | "watch" | "data_quality_only";
export type MissedMeaningfulMoveCandidate = {
    symbol: string;
    kind: MissedMoveKind;
    timestamp: number;
    timestampIso: string;
    open: number;
    high: number;
    low: number;
    close: number;
    previousClose: number;
    closeMovePct: number;
    rangePct: number;
    rollingHigh: number | null;
    rollingLow: number | null;
    breakDistancePct: number | null;
    coverage: MissedMoveCoverage;
    severity: MissedMoveSeverity;
    reason: string;
    nearestPosts: Array<{
        timestamp: number;
        timestampIso: string;
        title?: string;
        operation?: string;
        eventType?: string;
        excerpt: string;
        distanceMinutes: number;
    }>;
};
export type ReviewedCandleMove = {
    timestamp: number;
    timestampIso: string;
    open: number;
    high: number;
    low: number;
    close: number;
    previousClose: number;
    closeMovePct: number;
    rangePct: number;
};
export type MissedMeaningfulMoveSymbolReport = {
    symbol: string;
    candleCount: number;
    reviewedCandleCount: number;
    postCount: number;
    firstPostAt: number | null;
    lastPostAt: number | null;
    candidateCount: number;
    coveredCount: number;
    weakCoverageCount: number;
    missedCount: number;
    majorCount: number;
    candidates: MissedMeaningfulMoveCandidate[];
    largestReviewedMoves: ReviewedCandleMove[];
};
export type MissedMeaningfulMoveAuditReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    cacheDirectoryPath: string;
    warehouseDirectoryPath: string | null;
    provider: CandleProviderName;
    timeframe: CandleFetchTimeframe;
    auditWindow: {
        startTimestamp: number | null;
        endTimestamp: number | null;
    };
    totals: {
        symbols: number;
        candles: number;
        posts: number;
        candidates: number;
        covered: number;
        weakCoverage: number;
        missed: number;
        major: number;
        symbolsWithoutCandles: number;
        symbolsWithoutAuditWindowCandles: number;
    };
    symbolsWithoutCandles: string[];
    symbolsWithoutAuditWindowCandles: string[];
    symbols: MissedMeaningfulMoveSymbolReport[];
};
export type GenerateMissedMeaningfulMoveAuditOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    warehouseDirectoryPath?: string;
    provider?: CandleProviderName;
    timeframe?: CandleFetchTimeframe;
    coverageWindowMs?: number;
    auditWindowPaddingMs?: number;
    maxAuditFiles?: number;
};
export type WriteMissedMeaningfulMoveAuditOptions = GenerateMissedMeaningfulMoveAuditOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function generateMissedMeaningfulMoveAudit(options: GenerateMissedMeaningfulMoveAuditOptions): MissedMeaningfulMoveAuditReport;
export declare function renderMissedMeaningfulMoveAuditMarkdown(report: MissedMeaningfulMoveAuditReport): string;
export declare function writeMissedMeaningfulMoveAudit(options: WriteMissedMeaningfulMoveAuditOptions): MissedMeaningfulMoveAuditReport;
//# sourceMappingURL=missed-meaningful-move-audit.d.ts.map