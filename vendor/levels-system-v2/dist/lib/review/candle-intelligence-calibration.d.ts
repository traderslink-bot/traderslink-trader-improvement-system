import type { CandleProviderName } from "../market-data/candle-types.js";
import { type ExecutionLevelRelations, type SharedGapStructure, type SharedReferenceLevels } from "../support-resistance/index.js";
export type CandleIntelligenceTrust = "trusted" | "watch" | "experimental" | "broken";
export type CandleIntelligenceCalibrationEvidence = {
    referenceSummary: string[];
    gapSummary: string[];
    relationSummary: string[];
    knownProblemFlags: string[];
};
export type CandleIntelligenceCalibrationSymbol = {
    symbol: string;
    postCount: number;
    snapshotCount: number;
    firstPostAt: number | null;
    lastPostAt: number | null;
    sessionDate: string | null;
    currentPrice: number | null;
    candles: {
        daily: number;
        fourHour: number;
        fiveMinute: number;
    };
    referenceLevels: {
        trust: CandleIntelligenceTrust;
        levels: SharedReferenceLevels | null;
        reasons: string[];
    };
    gapStructure: {
        trust: CandleIntelligenceTrust;
        structure: SharedGapStructure | null;
        reasons: string[];
    };
    executionRelations: {
        trust: CandleIntelligenceTrust;
        relations: ExecutionLevelRelations | null;
        reasons: string[];
    };
    evidence: CandleIntelligenceCalibrationEvidence;
    examples: string[];
};
export type CandleIntelligenceCalibrationReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    cacheDirectoryPath: string;
    provider: CandleProviderName;
    symbolsReviewed: number;
    totals: {
        trustedReferenceLevels: number;
        watchReferenceLevels: number;
        brokenReferenceLevels: number;
        trustedGapStructures: number;
        watchGapStructures: number;
        experimentalGapStructures: number;
        brokenGapStructures: number;
        trustedRelations: number;
        relationWarnings: number;
        relationBroken: number;
        missingCandleSymbols: number;
        knownProblemSymbolsReviewed: number;
    };
    symbols: CandleIntelligenceCalibrationSymbol[];
};
export type BuildCandleIntelligenceCalibrationReportOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    provider?: CandleProviderName;
    maxSymbols?: number;
};
export type WriteCandleIntelligenceCalibrationReportOptions = BuildCandleIntelligenceCalibrationReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildCandleIntelligenceCalibrationReport(options: BuildCandleIntelligenceCalibrationReportOptions): Promise<CandleIntelligenceCalibrationReport>;
export declare function formatCandleIntelligenceCalibrationReport(report: CandleIntelligenceCalibrationReport): string;
export declare function writeCandleIntelligenceCalibrationReport(options: WriteCandleIntelligenceCalibrationReportOptions): Promise<CandleIntelligenceCalibrationReport>;
//# sourceMappingURL=candle-intelligence-calibration.d.ts.map