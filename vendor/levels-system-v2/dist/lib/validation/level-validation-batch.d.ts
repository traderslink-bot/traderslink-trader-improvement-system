import type { CandleSourceHealthReport } from "./candle-source-health.js";
import type { ForwardReactionDistanceBand, ForwardReactionSummary, ForwardReactionValidationReport } from "./forward-reaction-validator.js";
import type { LevelPersistenceValidationReport } from "./level-persistence-validator.js";
export type SymbolLevelValidationBatchResult = {
    symbol: string;
    healthReports: CandleSourceHealthReport[];
    persistenceReport?: LevelPersistenceValidationReport;
    forwardReactionReport?: ForwardReactionValidationReport;
    errorMessage?: string;
};
export type LevelValidationBatchSummary = {
    totalSymbols: number;
    healthySymbols: number;
    degradedSymbols: number;
    unavailableSymbols: number;
    completedSymbols: number;
    persistenceCompletedSymbols: number;
    forwardCompletedSymbols: number;
    failedSymbols: number;
    averageSurfacedSupportPersistenceRate: number;
    averageSurfacedResistancePersistenceRate: number;
    averageSupportBucketPersistenceRate: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    averageExtensionSupportPersistenceRate: number;
    averageExtensionResistancePersistenceRate: number;
    averageSupportLooseMatchRate: number;
    averageResistanceLooseMatchRate: number;
    averageSupportBucketLooseMatchRate: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    averageSurfacedSupportUsefulnessRate: number;
    averageSurfacedResistanceUsefulnessRate: number;
    averageExtensionSupportUsefulnessRate: number;
    averageExtensionResistanceUsefulnessRate: number;
    averageSurfacedSupportUsefulWhenTouchedRate: number;
    averageSurfacedResistanceUsefulWhenTouchedRate: number;
    averageExtensionSupportUsefulWhenTouchedRate: number;
    averageExtensionResistanceUsefulWhenTouchedRate: number;
    averageSupportBucketTouchRate: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    totalSupportBucketEvaluated: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    averageSupportBucketUsefulnessRate: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    averageSupportBucketUsefulWhenTouchedRate: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    averageSupportBucketClosestApproachPct: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    averageSurfacedSupportRespectRate: number;
    averageSurfacedResistanceRespectRate: number;
    averageExtensionSupportRespectRate: number;
    averageExtensionResistanceRespectRate: number;
    totalVolumeTouched: number;
    totalVolumeReliableTouched: number;
    totalHighVolumeTouches: number;
    averageHighVolumeUsefulWhenTouchedRate: number;
    averageHighVolumeRespectRate: number;
    averageHighVolumeBreakRate: number;
    byKindSource: {
        surfacedSupport: ForwardReactionSummary;
        surfacedResistance: ForwardReactionSummary;
        extensionSupport: ForwardReactionSummary;
        extensionResistance: ForwardReactionSummary;
    };
    byDistanceBand: Record<ForwardReactionDistanceBand, ForwardReactionSummary>;
    weakestUsefulnessAreas: Array<{
        label: string;
        usefulnessRate: number;
        evaluated: number;
    }>;
    symbolResults: SymbolLevelValidationBatchResult[];
};
export declare function summarizeLevelValidationBatch(symbolResults: SymbolLevelValidationBatchResult[]): LevelValidationBatchSummary;
export declare function formatLevelValidationBatchSummary(summary: LevelValidationBatchSummary): string[];
//# sourceMappingURL=level-validation-batch.d.ts.map