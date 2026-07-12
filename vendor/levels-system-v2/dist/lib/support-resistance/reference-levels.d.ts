import type { Candle } from "../market-data/candle-types.js";
export type SharedReferenceLevelsDiagnostic = {
    code: "missing_daily_candles" | "missing_intraday_candles" | "missing_previous_day" | "missing_premarket" | "missing_opening_range" | "missing_current_session";
    message: string;
};
export type SharedReferenceLevels = {
    sessionDate: string | null;
    previousDayHigh: number | null;
    previousDayLow: number | null;
    previousDayClose: number | null;
    premarketHigh: number | null;
    premarketLow: number | null;
    premarketBase: number | null;
    openingRangeHigh: number | null;
    openingRangeLow: number | null;
    currentSessionHigh: number | null;
    currentSessionLow: number | null;
    diagnostics: SharedReferenceLevelsDiagnostic[];
};
export type BuildReferenceLevelsRequest = {
    dailyCandles: Candle[];
    intradayCandles?: Candle[];
    sessionDate?: string;
};
export declare function buildReferenceLevels(request: BuildReferenceLevelsRequest): SharedReferenceLevels;
//# sourceMappingURL=reference-levels.d.ts.map