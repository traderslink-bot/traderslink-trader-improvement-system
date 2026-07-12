import type { Candle } from "../market-data/candle-types.js";
import { type FormalMarketStructureOptions, type FormalStructureTimeframe } from "../structure/index.js";
import type { FormalMarketStructureRuntimeContext, LivePriceUpdate } from "./monitoring-types.js";
export type LiveFormalMarketStructureTrackerOptions = FormalMarketStructureOptions & {
    bucketMs?: number;
    maxCandles?: number;
    timeframe?: FormalStructureTimeframe;
};
export declare class LiveFormalMarketStructureTracker {
    private readonly options;
    private readonly bucketMs;
    private readonly minCandles;
    private readonly maxCandles;
    private readonly timeframe;
    private readonly states;
    constructor(options?: LiveFormalMarketStructureTrackerOptions);
    reset(symbol: string): void;
    getContext(symbol: string): FormalMarketStructureRuntimeContext | undefined;
    seed(symbolInput: string, candles: Candle[], asOfTimestamp?: number): FormalMarketStructureRuntimeContext | undefined;
    update(update: LivePriceUpdate): FormalMarketStructureRuntimeContext | undefined;
    private recomputeConfirmed;
    private buildNewCandle;
    private ensureState;
}
//# sourceMappingURL=live-formal-market-structure.d.ts.map