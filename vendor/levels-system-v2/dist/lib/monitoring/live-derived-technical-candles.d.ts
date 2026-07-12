import type { Candle } from "../market-data/candle-types.js";
import type { LivePriceUpdate } from "./monitoring-types.js";
export declare class LiveDerivedFiveMinuteCandleStore {
    private readonly candlesBySymbol;
    private readonly lastCumulativeVolumeBySymbol;
    private readonly bucketMs;
    private readonly maxCandles;
    constructor(options?: {
        bucketMs?: number;
        maxCandles?: number;
    });
    setHistoricalCandles(symbolInput: string, candles: Candle[]): Candle[];
    updateFromLivePrice(update: LivePriceUpdate): Candle[];
    getCandles(symbolInput: string): Candle[];
    clear(symbolInput: string): void;
    clearAll(): void;
    private liveVolumeDelta;
    private trim;
}
//# sourceMappingURL=live-derived-technical-candles.d.ts.map