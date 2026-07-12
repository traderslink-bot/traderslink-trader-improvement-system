import type { Candle } from "../market-data/candle-types.js";
import type { LivePriceUpdate, StableMarketStructureRuntimeContext } from "./monitoring-types.js";
export type LiveStableMarketStructureTrackerOptions = {
    bucketMs?: number;
    minCandles?: number;
    maxCandles?: number;
    persistenceBars?: number;
    materialityThreshold?: number;
    highMaterialityThreshold?: number;
};
export declare class LiveStableMarketStructureTracker {
    private readonly options;
    private readonly bucketMs;
    private readonly minCandles;
    private readonly maxCandles;
    private readonly states;
    constructor(options?: LiveStableMarketStructureTrackerOptions);
    reset(symbol: string): void;
    getContext(symbol: string): StableMarketStructureRuntimeContext | undefined;
    seed(symbolInput: string, candles: Candle[], asOfTimestamp?: number): StableMarketStructureRuntimeContext | undefined;
    update(update: LivePriceUpdate): StableMarketStructureRuntimeContext | undefined;
    private recompute;
    private buildNewCandle;
    private ensureState;
}
//# sourceMappingURL=live-stable-market-structure.d.ts.map