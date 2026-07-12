import { type MarketStructureReplayAuditOptions, type MarketStructureReplayAuditReport } from "./market-structure-replay-audit.js";
import { type StableStructureDiscordAlignmentOptions, type StableStructureDiscordAlignmentReport } from "./stable-structure-discord-alignment.js";
export type MarketStructureCalibrationVerdict = "trusted_for_suppression" | "watch_structure_chop" | "operator_only" | "insufficient_evidence";
export type MarketStructureCalibrationSymbol = {
    symbol: string;
    verdict: MarketStructureCalibrationVerdict;
    reasons: string[];
    replayCases: number;
    latestStates: string[];
    lowConfidenceCases: number;
    rangeBoundCases: number;
    rawTransitions: number;
    stableTransitions: number;
    suppressedTransitions: number;
    immaterialTransitions: number;
    stableTransitionReductionPct: number;
    postedRows: number;
    alignedRows: number;
    stableTransitionPosts: number;
    sameStructureRepeats: number;
    sameStructureRefreshes: number;
    rawChopSuppressedRows: number;
    representativeReplayFindings: string[];
    representativeRepeatedPosts: string[];
};
export type MarketStructureCalibrationReport = {
    generatedAt: string;
    replay: Pick<MarketStructureReplayAuditReport, "cacheDirectory" | "filesScanned" | "symbolsScanned" | "summary">;
    discordAlignment: Pick<StableStructureDiscordAlignmentReport, "auditRoot" | "cacheDirectory" | "auditFilesScanned" | "summary">;
    totals: {
        symbols: number;
        trustedForSuppression: number;
        watchStructureChop: number;
        operatorOnly: number;
        insufficientEvidence: number;
        rawTransitions: number;
        stableTransitions: number;
        suppressedTransitions: number;
        sameStructureRepeats: number;
        alignedPostRows: number;
    };
    symbols: MarketStructureCalibrationSymbol[];
};
export type BuildMarketStructureCalibrationReportOptions = {
    replay?: MarketStructureReplayAuditOptions;
    alignment?: StableStructureDiscordAlignmentOptions;
};
export type WriteMarketStructureCalibrationReportOptions = BuildMarketStructureCalibrationReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildMarketStructureCalibrationReport(options?: BuildMarketStructureCalibrationReportOptions): MarketStructureCalibrationReport;
export declare function formatMarketStructureCalibrationMarkdown(report: MarketStructureCalibrationReport): string;
export declare function writeMarketStructureCalibrationReport(options: WriteMarketStructureCalibrationReportOptions): MarketStructureCalibrationReport;
//# sourceMappingURL=market-structure-calibration-report.d.ts.map