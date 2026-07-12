import type { Candle, CandleProviderResponse } from "../market-data/candle-types.js";
export type FiveMinuteConfirmationOutcome = "target_hit" | "partial_progress" | "invalidated" | "no_progress";
export type FiveMinuteConfirmationRead = {
    present: boolean;
    volumeRatio: number | null;
    latestRangePct: number | null;
    priorRangePct: number | null;
    closeExtensionPct: number | null;
    triggerPrice: number | null;
    invalidationPrice: number | null;
    qualityRejectReasons: string[];
    summary: string;
};
export type FiveMinuteConfirmationSample = {
    symbol: string;
    cutoffTimestamp: number;
    cutoffIso: string;
    currentPrice: number;
    read: FiveMinuteConfirmationRead;
    outcome: FiveMinuteConfirmationOutcome;
    bestForwardPct: number;
    worstForwardPct: number;
    forwardBars: number;
    barsToTarget: number | null;
    invalidatedBeforeTarget: boolean;
    summary: string;
};
export type FiveMinuteConfirmationAuditSymbolInput = {
    symbol: string;
    fiveMinuteResponse: CandleProviderResponse | undefined;
};
export type BuildFiveMinuteConfirmationAuditOptions = {
    symbols: FiveMinuteConfirmationAuditSymbolInput[];
    source?: string;
    horizonBars?: number;
    targetMovePct?: number;
    partialMovePct?: number;
    maxExamples?: number;
};
export type FiveMinuteConfirmationAuditReport = {
    generatedAt: string;
    source: string;
    settings: {
        horizonBars: number;
        targetMovePct: number;
        partialMovePct: number;
    };
    totals: {
        symbols: number;
        symbolsWithUsable5m: number;
        evaluatedCutoffs: number;
        confirmationSamples: number;
        targetHit: number;
        partialProgress: number;
        invalidated: number;
        noProgress: number;
        avgBestForwardPct: number | null;
        avgWorstForwardPct: number | null;
    };
    samples: FiveMinuteConfirmationSample[];
    bestExamples: FiveMinuteConfirmationSample[];
    failedExamples: FiveMinuteConfirmationSample[];
};
export type WriteFiveMinuteConfirmationAuditOptions = BuildFiveMinuteConfirmationAuditOptions & {
    outputDirectory: string;
};
export declare function buildFiveMinuteConfirmationRead(candles: Candle[], cutoffIndex: number): FiveMinuteConfirmationRead;
export declare function buildFiveMinuteConfirmationAudit(options: BuildFiveMinuteConfirmationAuditOptions): FiveMinuteConfirmationAuditReport;
export declare function writeFiveMinuteConfirmationAudit(options: WriteFiveMinuteConfirmationAuditOptions): FiveMinuteConfirmationAuditReport;
//# sourceMappingURL=five-minute-confirmation-audit.d.ts.map