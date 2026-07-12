import type { Candle } from "../../market-data/candle-types.js";
export type DynamicLevelDiagnostics = {
    code: "missing_intraday_candles" | "insufficient_ema_bars" | "missing_volume_for_vwap";
    message: string;
};
export type DynamicLevelsFromCandlesOptions = {
    sessionDate?: string;
    emaPeriods?: number[];
    currentPrice?: number;
};
export type DynamicLevelPriceContext = {
    currentPrice: number;
    priceVsVwapPct: number | null;
    priceVsEma9Pct: number | null;
    priceVsEma20Pct: number | null;
    aboveVwap: boolean | null;
    aboveEma9: boolean | null;
    aboveEma20: boolean | null;
    dynamicSupportCandidate: "vwap" | "ema9" | "ema20" | null;
    dynamicResistanceCandidate: "vwap" | "ema9" | "ema20" | null;
};
export type DynamicLevelsFromCandles = {
    vwap: number | null;
    emaByPeriod: Record<number, number | null>;
    ema9: number | null;
    ema20: number | null;
    priceContext?: DynamicLevelPriceContext | null;
    diagnostics: DynamicLevelDiagnostics[];
};
export declare function buildDynamicLevelsFromCandles(candles: Candle[] | undefined, options?: DynamicLevelsFromCandlesOptions): DynamicLevelsFromCandles;
//# sourceMappingURL=dynamic-levels.d.ts.map