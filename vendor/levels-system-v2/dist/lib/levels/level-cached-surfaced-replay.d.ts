import type { CandleTimeframe } from "../market-data/candle-types.js";
import { type LevelSurfacedValidationInput, type SurfacedValidationComparison, type SurfacedValidationSummary } from "./level-surfaced-validation.js";
export type CachedSurfacedReplaySymbolInventory = {
    symbol: string;
    timeframeFileCounts: Record<CandleTimeframe, number>;
    usableForReplay: boolean;
    notes: string[];
};
export type CachedSurfacedReplayCase = LevelSurfacedValidationInput & {
    cacheSource: {
        symbol: string;
        snapshot5mFilePath: string;
        fourHourFilePath: string;
        dailyFilePath: string;
        snapshotBars5m: number;
        forwardBars5m: number;
        snapshotLatestTimestamp: number;
    };
};
export type CachedSurfacedReplaySkippedCase = {
    symbol: string;
    reason: string;
    sourcePath?: string;
};
export type CachedSurfacedReplayPreparation = {
    cacheDirectoryPath: string;
    inventory: CachedSurfacedReplaySymbolInventory[];
    cases: CachedSurfacedReplayCase[];
    skipped: CachedSurfacedReplaySkippedCase[];
};
export type CachedSurfacedReplayManualReviewItem = {
    caseId: string;
    symbol: string;
    winner: SurfacedValidationComparison["winner"];
    reason: "old_win" | "mixed_result" | "close_score_delta" | "broken_handling_signal" | "first_interaction_alignment";
    scoreDelta: number;
};
export type CachedSurfacedReplayReport = CachedSurfacedReplayPreparation & {
    results: SurfacedValidationComparison[];
    summary: SurfacedValidationSummary;
    oldWinSymbols: string[];
    brokenHandlingSymbols: string[];
    firstInteractionAlignmentProblemSymbols: string[];
    manualReviewQueue: CachedSurfacedReplayManualReviewItem[];
};
export type CachedSurfacedReplayOptions = {
    cacheDirectoryPath?: string;
    symbols?: string[];
    maxCasesPerSymbol?: number;
    minSnapshotBars5m?: number;
    forwardBars5m?: number;
    minDailyBars?: number;
    minFourHourBars?: number;
    minSnapshotRangePct?: number;
    minForwardRangePct?: number;
};
export declare function discoverCachedSurfacedReplayInventory(options?: Pick<CachedSurfacedReplayOptions, "cacheDirectoryPath" | "symbols">): Promise<CachedSurfacedReplaySymbolInventory[]>;
export declare function buildCachedSurfacedReplayCases(options?: CachedSurfacedReplayOptions): Promise<CachedSurfacedReplayPreparation>;
export declare function runCachedSurfacedReplay(options?: CachedSurfacedReplayOptions): Promise<CachedSurfacedReplayReport>;
//# sourceMappingURL=level-cached-surfaced-replay.d.ts.map