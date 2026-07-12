import type { Candle } from "../market-data/candle-types.js";
export type SharedGapDirection = "up" | "down";
export type SharedGapZone = {
    direction: SharedGapDirection;
    start: number;
    end: number;
    fromClose: number;
    toOpen: number;
    timestamp: number;
    sizePct: number;
    filled: boolean;
    fillTimestamp: number | null;
    distancePctFromPrice: number | null;
};
export type SharedGapStructureDiagnostic = {
    code: "missing_candles" | "no_meaningful_gaps";
    message: string;
};
export type SharedGapStructure = {
    nearestGapAbove: SharedGapZone | null;
    nearestGapBelow: SharedGapZone | null;
    recentGaps: SharedGapZone[];
    diagnostics: SharedGapStructureDiagnostic[];
};
export type BuildGapStructureRequest = {
    candles: Candle[];
    currentPrice?: number;
    minimumGapPct?: number;
    maxRecentGaps?: number;
};
export declare function buildGapStructure(request: BuildGapStructureRequest): SharedGapStructure;
//# sourceMappingURL=gap-structure.d.ts.map