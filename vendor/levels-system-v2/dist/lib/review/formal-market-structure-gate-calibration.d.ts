import { type FormalMarketStructureGateEvent } from "./formal-market-structure-gate-audit.js";
import { type MarketStructureOutcomeVerdict } from "./market-structure-outcome-calibration.js";
type OutcomeBucketKey = MarketStructureOutcomeVerdict | "not_found";
export type FormalMarketStructureGateCalibrationBucket = {
    key: string;
    events: number;
    actionable: number;
    metadataOnly: number;
    oldVisible: number;
    newlyQuieted: number;
    continued: number;
    failed: number;
    mixed: number;
    noFollowThrough: number;
    insufficientPriceEvidence: number;
    notFound: number;
    averageMaxFavorablePct: number | null;
    averageMaxAdversePct: number | null;
};
export type FormalMarketStructureGateCalibrationEvent = FormalMarketStructureGateEvent & {
    session: string;
    outcomeVerdict: OutcomeBucketKey;
    maxFavorablePct: number | null;
    maxAdversePct: number | null;
    evidenceRows: number | null;
};
export type FormalMarketStructureGateCalibrationReport = {
    generatedAt: string;
    sourceRoot: string;
    auditCount: number;
    limit: number | null;
    totals: {
        formalBosChochEvents: number;
        actionable: number;
        metadataOnly: number;
        oldVisible: number;
        newlyQuieted: number;
        continued: number;
        failed: number;
        mixed: number;
        noFollowThrough: number;
        insufficientPriceEvidence: number;
        notFound: number;
    };
    byDecision: FormalMarketStructureGateCalibrationBucket[];
    byReason: FormalMarketStructureGateCalibrationBucket[];
    byTimeframe: FormalMarketStructureGateCalibrationBucket[];
    byConfidence: FormalMarketStructureGateCalibrationBucket[];
    events: FormalMarketStructureGateCalibrationEvent[];
};
export type BuildFormalMarketStructureGateCalibrationOptions = {
    sourceRoot: string;
    limit?: number | null;
    forwardWindowMinutes?: number;
};
export declare function buildFormalMarketStructureGateCalibrationReport(options: BuildFormalMarketStructureGateCalibrationOptions): FormalMarketStructureGateCalibrationReport;
export declare function formatFormalMarketStructureGateCalibrationMarkdown(report: FormalMarketStructureGateCalibrationReport): string;
export declare function writeFormalMarketStructureGateCalibrationReport(params: {
    report: FormalMarketStructureGateCalibrationReport;
    jsonPath: string;
    markdownPath: string;
}): void;
export {};
//# sourceMappingURL=formal-market-structure-gate-calibration.d.ts.map