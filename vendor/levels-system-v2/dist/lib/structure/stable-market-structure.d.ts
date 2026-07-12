import type { Candle } from "../market-data/candle-types.js";
import { type CandleMarketStructureContext, type CandleMarketStructureState } from "./candle-market-structure.js";
export type StableMarketStructureDecisionReason = "initial_state" | "same_state" | "persistent_material_change" | "high_materiality_change" | "low_confidence" | "not_persistent" | "immaterial_change" | "range_chop_continuation";
export type StableMarketStructureDecision = {
    timestamp: number;
    rawState: CandleMarketStructureState;
    stableState: CandleMarketStructureState;
    previousStableState: CandleMarketStructureState | null;
    accepted: boolean;
    materialityScore: number;
    rawRunLength: number;
    reason: StableMarketStructureDecisionReason;
    context: CandleMarketStructureContext;
};
export type StableMarketStructureContext = {
    symbol: string;
    current: StableMarketStructureDecision | null;
    rawTransitionCount: number;
    stableTransitionCount: number;
    suppressedTransitionCount: number;
    decisions: StableMarketStructureDecision[];
    stateCounts: Partial<Record<CandleMarketStructureState, number>>;
    stableStateCounts: Partial<Record<CandleMarketStructureState, number>>;
};
export type BuildStableMarketStructureRequest = {
    symbol: string;
    candles: Candle[];
    minCandles?: number;
    stepBars?: number;
    persistenceBars?: number;
    materialityThreshold?: number;
    highMaterialityThreshold?: number;
};
export declare function scoreMarketStructureMateriality(params: {
    context: CandleMarketStructureContext;
    previousStableState: CandleMarketStructureState | null;
    rawRunLength: number;
}): number;
export declare function buildStableMarketStructureContext(request: BuildStableMarketStructureRequest): StableMarketStructureContext;
//# sourceMappingURL=stable-market-structure.d.ts.map