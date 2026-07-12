import type { FormalStructureTimeframe } from "../structure/index.js";
export type MarketStructureOutcomeVerdict = "continued" | "failed" | "mixed" | "no_follow_through" | "insufficient_price_evidence";
export type MarketStructureOutcomeEvent = {
    timestamp: number;
    isoTimestamp: string;
    symbol: string;
    timeframe: FormalStructureTimeframe | "unknown";
    eventType: string;
    direction: "bullish" | "bearish" | "unknown";
    storyKey: string;
    source: string;
    basePrice: number | null;
    basePriceSource: string | null;
    evidenceRows: number;
    maxFavorablePct: number | null;
    maxAdversePct: number | null;
    bestFavorablePrice: number | null;
    worstAdversePrice: number | null;
    verdict: MarketStructureOutcomeVerdict;
    title: string | null;
};
export type MarketStructureOutcomeSymbolSummary = {
    symbol: string;
    events: number;
    continued: number;
    failed: number;
    mixed: number;
    noFollowThrough: number;
    insufficientPriceEvidence: number;
    averageMaxFavorablePct: number | null;
    averageMaxAdversePct: number | null;
};
export type MarketStructureOutcomeFinding = {
    severity: "review" | "watch" | "info";
    symbol?: string;
    reason: string;
    detail: string;
};
export type MarketStructureOutcomeCalibrationReport = {
    generatedAt: string;
    sourceAuditPath: string;
    settings: {
        forwardWindowMinutes: number;
        continuationThresholdPct: number;
        failureThresholdPct: number;
    };
    totals: {
        rowsScanned: number;
        structureEvents: number;
        evaluatedWithPriceEvidence: number;
        continued: number;
        failed: number;
        mixed: number;
        noFollowThrough: number;
        insufficientPriceEvidence: number;
        symbols: number;
        findings: number;
    };
    symbols: MarketStructureOutcomeSymbolSummary[];
    events: MarketStructureOutcomeEvent[];
    findings: MarketStructureOutcomeFinding[];
};
export type BuildMarketStructureOutcomeCalibrationOptions = {
    auditPath: string;
    forwardWindowMinutes?: number;
    continuationThresholdPct?: number;
    failureThresholdPct?: number;
};
export declare function buildMarketStructureOutcomeCalibrationReport(options: BuildMarketStructureOutcomeCalibrationOptions): MarketStructureOutcomeCalibrationReport;
export declare function formatMarketStructureOutcomeCalibrationMarkdown(report: MarketStructureOutcomeCalibrationReport): string;
export declare function writeMarketStructureOutcomeCalibrationReport(params: {
    report: MarketStructureOutcomeCalibrationReport;
    jsonPath: string;
    markdownPath: string;
}): void;
//# sourceMappingURL=market-structure-outcome-calibration.d.ts.map