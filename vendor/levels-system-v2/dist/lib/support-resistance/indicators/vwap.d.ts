import type { Candle } from "../../market-data/candle-types.js";
export type VwapPoint = {
    timestamp: number;
    value: number;
    cumulativeVolume: number;
};
export type VwapOptions = {
    sessionDate?: string;
    typicalPriceSelector?: (candle: Candle) => number;
};
export declare function calculateVwapSeries(candles: Candle[], options?: VwapOptions): VwapPoint[];
export declare function calculateLatestVwap(candles: Candle[], options?: VwapOptions): number | null;
//# sourceMappingURL=vwap.d.ts.map