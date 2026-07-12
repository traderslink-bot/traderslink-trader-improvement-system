import type { Candle } from "../../market-data/candle-types.js";
export type EmaPoint = {
    timestamp: number;
    value: number;
};
export type EmaOptions = {
    priceSelector?: (candle: Candle) => number;
};
export declare function calculateEmaSeries(candles: Candle[], period: number, options?: EmaOptions): EmaPoint[];
export declare function calculateLatestEma(candles: Candle[], period: number, options?: EmaOptions): number | null;
//# sourceMappingURL=ema.d.ts.map