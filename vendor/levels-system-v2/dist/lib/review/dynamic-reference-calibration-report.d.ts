import { type CandleProviderName } from "../support-resistance/index.js";
export type DynamicReferenceCalibrationSample = {
    symbol: string;
    timestamp: number;
    timestampIso: string;
    price: number | null;
    title?: string;
    operation?: string;
    openingRange: {
        high: number | null;
        low: number | null;
        state: "above" | "inside" | "below" | "unavailable";
    };
    dynamicLevels: {
        vwap: number | null;
        ema9: number | null;
        ema20: number | null;
        priceVsVwapPct: number | null;
        priceVsEma9Pct: number | null;
        priceVsEma20Pct: number | null;
    };
    diagnostics: string[];
};
export type DynamicReferenceTrust = "trusted" | "watch" | "unproven" | "broken";
export type DynamicReferenceCalibrationSymbolReport = {
    symbol: string;
    postsReviewed: number;
    dailyCandles: number;
    fiveMinuteCandles: number;
    openingRangeAvailableCount: number;
    dynamicAvailableCount: number;
    aboveOpeningRangeCount: number;
    insideOpeningRangeCount: number;
    belowOpeningRangeCount: number;
    aboveVwapCount: number;
    belowVwapCount: number;
    stretchedFromVwapCount: number;
    openingRangeTrust: DynamicReferenceTrust;
    dynamicLevelTrust: DynamicReferenceTrust;
    overallTrust: DynamicReferenceTrust;
    trustReasons: string[];
    diagnosticReasons: string[];
    samples: DynamicReferenceCalibrationSample[];
};
export type DynamicReferenceCalibrationReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    cacheDirectoryPath: string;
    provider: CandleProviderName;
    totals: {
        symbols: number;
        postsReviewed: number;
        openingRangeAvailable: number;
        dynamicAvailable: number;
        stretchedFromVwap: number;
        symbolsWithoutDynamicEvidence: number;
        symbolsWithoutOpeningRangeEvidence: number;
        trustedSymbols: number;
        watchSymbols: number;
        unprovenSymbols: number;
        brokenSymbols: number;
    };
    symbols: DynamicReferenceCalibrationSymbolReport[];
    examples: {
        openingRangeAvailable: DynamicReferenceCalibrationSample[];
        dynamicAvailable: DynamicReferenceCalibrationSample[];
        stretchedFromVwap: DynamicReferenceCalibrationSample[];
        missingEvidence: DynamicReferenceCalibrationSample[];
    };
};
export type DynamicReferenceCalibrationGateResult = {
    status: "pass" | "review" | "fail";
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    thresholds: {
        maxBrokenSymbols: number;
        maxUnprovenSymbols: number;
        minTrustedSymbolPct: number;
    };
    totals: DynamicReferenceCalibrationReport["totals"];
    reasons: string[];
    traderFacingUse: "allowed" | "operator_only";
};
export type GenerateDynamicReferenceCalibrationReportOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    provider?: CandleProviderName;
    maxSymbols?: number;
};
export type WriteDynamicReferenceCalibrationReportOptions = GenerateDynamicReferenceCalibrationReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function generateDynamicReferenceCalibrationReport(options: GenerateDynamicReferenceCalibrationReportOptions): DynamicReferenceCalibrationReport;
export declare function formatDynamicReferenceCalibrationReport(report: DynamicReferenceCalibrationReport): string;
export declare function evaluateDynamicReferenceCalibrationGate(report: DynamicReferenceCalibrationReport, thresholds?: Partial<DynamicReferenceCalibrationGateResult["thresholds"]>): DynamicReferenceCalibrationGateResult;
export declare function formatDynamicReferenceCalibrationGate(result: DynamicReferenceCalibrationGateResult): string;
export declare function writeDynamicReferenceCalibrationReport(options: WriteDynamicReferenceCalibrationReportOptions): DynamicReferenceCalibrationReport;
//# sourceMappingURL=dynamic-reference-calibration-report.d.ts.map