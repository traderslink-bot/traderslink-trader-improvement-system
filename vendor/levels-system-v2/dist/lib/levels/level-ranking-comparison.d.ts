import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import { type LevelEngineConfig } from "./level-config.js";
import type { SurfacedSelectionResult } from "./level-surfaced-selection.js";
import type { LevelScoreConfig } from "./level-score-config.js";
import type { LevelDurabilityLabel, LevelEngineOutput, LevelState, RankedLevelsOutput, RawLevelCandidate, SourceTimeframe } from "./level-types.js";
export type ComparableLevelSummary = {
    sourcePath: "old" | "new" | "surfaced_adapter";
    side: "support" | "resistance";
    price: number;
    zoneLow: number;
    zoneHigh: number;
    rank: number;
    nearestRank: number;
    score?: number;
    strengthLabel?: string;
    confidence?: number;
    state?: LevelState;
    durabilityLabel?: LevelDurabilityLabel;
    explanation?: string;
    bucket?: "major" | "intermediate" | "intraday";
    clusterRepresentative?: boolean;
    clusterId?: string | null;
    sourceTimeframes?: SourceTimeframe[];
};
export type ComparablePathOutput = {
    symbol: string;
    currentPrice: number;
    topSupport?: ComparableLevelSummary;
    nearestSupport?: ComparableLevelSummary;
    topResistance?: ComparableLevelSummary;
    nearestResistance?: ComparableLevelSummary;
    supports: ComparableLevelSummary[];
    resistances: ComparableLevelSummary[];
    visibleSupportCount: number;
    visibleResistanceCount: number;
    nearbyDuplicateCount: number;
    outputShape: string;
};
export type LevelRankingDifference = {
    changedTopSupport: boolean;
    changedTopResistance: boolean;
    changedNearestSupport: boolean;
    changedNearestResistance: boolean;
    supportRankChanges: Array<{
        price: number;
        oldRank: number | null;
        newRank: number | null;
    }>;
    resistanceRankChanges: Array<{
        price: number;
        oldRank: number | null;
        newRank: number | null;
    }>;
    duplicateSuppressionImproved: boolean;
    oldNearbyDuplicateCount: number;
    newNearbyDuplicateCount: number;
    noteworthyDisagreements: string[];
    incompatibilities: string[];
};
export type MigrationReadinessCategory = "ready_for_shadow_mode" | "ready_for_optional_runtime_flag" | "needs_more_calibration" | "blocked_by_output_compatibility" | "blocked_by_candidate_input_mismatch";
export type MigrationReadinessSummary = {
    category: MigrationReadinessCategory;
    improvements: string[];
    regressions: string[];
    acceptableDifferences: string[];
    blockers: string[];
    downstreamDependencies: string[];
    limitations: string[];
    recommendation: string;
};
export type LevelRankingComparisonInput = {
    symbol: string;
    currentPrice: number;
    candlesByTimeframe: Partial<Record<CandleTimeframe, Candle[]>>;
    latestTimestamp?: number;
    currentTimeframe?: SourceTimeframe;
    currentSessionVolumeRatio?: number;
    rawCandidates?: RawLevelCandidate[];
    specialLevels?: LevelEngineOutput["specialLevels"];
    maxComparableLevels?: number;
    oldConfig?: LevelEngineConfig;
    newConfig?: LevelScoreConfig;
};
export type LevelRankingComparisonResult = {
    symbol: string;
    currentPrice: number;
    rawCandidateCount: number;
    specialCandidateCount: number;
    timeframesUsed: CandleTimeframe[];
    oldPath: ComparablePathOutput;
    newPath: ComparablePathOutput;
    differences: LevelRankingDifference;
    migrationReadiness: MigrationReadinessSummary;
};
export declare const CURRENT_OLD_LEVEL_RUNTIME_PATH: {
    readonly producer: {
        readonly file: "src/lib/levels/level-engine.ts";
        readonly functionName: "LevelEngine.generateLevels";
        readonly invocationChain: readonly ["detectSwingPoints", "buildRawLevelCandidates", "buildSpecialLevelCandidates", "clusterRawLevelCandidates", "scoreLevelZones", "rankLevelZones"];
        readonly inputShape: "symbol + historical candle requests -> raw candidates per timeframe -> clustered FinalLevelZone[] per side";
        readonly outputShape: "LevelEngineOutput with bucketed surfaced fields: majorSupport, majorResistance, intermediateSupport, intermediateResistance, intradaySupport, intradayResistance, extensionLevels, metadata, specialLevels";
    };
    readonly runtimeEntrypoints: readonly [{
        readonly file: "src/runtime/main.ts";
        readonly functionName: "seedLevels";
        readonly details: "Calls engine.generateLevels(...) and stores the LevelEngineOutput in LevelStore.";
    }, {
        readonly file: "src/lib/monitoring/manual-watchlist-runtime-manager.ts";
        readonly functionName: "seedLevelsForSymbol";
        readonly details: "Calls levelEngine.generateLevels(...) during activation/startup refresh and pushes output into LevelStore.";
    }];
    readonly downstreamConsumers: readonly [{
        readonly file: "src/lib/monitoring/level-store.ts";
        readonly dependency: "Flattens output.majorSupport/intermediateSupport/intradaySupport and the resistance equivalents into monitored active zones, and reads output.extensionLevels for promoted extensions.";
    }, {
        readonly file: "src/lib/monitoring/manual-watchlist-runtime-manager.ts";
        readonly dependency: "Builds Discord snapshot payloads from surfaced support/resistance buckets and extensionLevels using representativePrice/strengthScore/freshness/timeframeBias.";
    }, {
        readonly file: "src/lib/alerts/alert-intelligence-engine.ts";
        readonly dependency: "Scans all zones from LevelEngineOutput including surfaced buckets and extensionLevels when enriching monitoring events.";
    }];
};
export declare function normalizeOldPathOutput(output: LevelEngineOutput, currentPrice: number, maxComparableLevels?: number): ComparablePathOutput;
export declare function normalizeNewPathOutput(output: RankedLevelsOutput, maxComparableLevels?: number): ComparablePathOutput;
export declare function normalizeSurfacedSelectionOutput(output: SurfacedSelectionResult, maxComparableLevels?: number): ComparablePathOutput;
export declare function summarizeMigrationReadiness(params: {
    oldPath: ComparablePathOutput;
    newPath: ComparablePathOutput;
    differences: LevelRankingDifference;
    limitations: string[];
}): MigrationReadinessSummary;
export declare function computeComparisonDifferences(params: {
    oldPath: ComparablePathOutput;
    newPath: ComparablePathOutput;
    limitations: string[];
}): LevelRankingDifference;
export declare function compareLevelRankingPaths(input: LevelRankingComparisonInput): LevelRankingComparisonResult;
//# sourceMappingURL=level-ranking-comparison.d.ts.map