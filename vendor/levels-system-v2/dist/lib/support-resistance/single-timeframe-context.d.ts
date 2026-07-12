import { CandleFetchService, type CandleFetchServiceOptions, type HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import type { Candle } from "../market-data/candle-types.js";
import { type CandleMarketStructureContext } from "../structure/index.js";
import { type DynamicLevelsFromCandles } from "./indicators/index.js";
import { type SharedCandleTimestamp, type SharedSupportResistanceCandle } from "./build-support-resistance-context.js";
export type SingleTimeframeSupportResistanceDiagnosticCode = "single_timeframe_partial_context" | "missing_higher_timeframe_candles" | "aggregated_1m_to_5m" | "no_support_resistance_levels_generated";
export type SingleTimeframeSupportResistanceDiagnostic = {
    code: SingleTimeframeSupportResistanceDiagnosticCode;
    severity: "info" | "warning";
    message: string;
};
export type SharedSingleTimeframe = "1m" | "5m";
export type SingleTimeframeSupportResistanceContext = {
    symbol: string;
    mode: "single_timeframe";
    completeness: "partial";
    sourceTimeframe: SharedSingleTimeframe;
    candles: Candle[];
    aggregatedCandles: {
        "5m": Candle[];
    };
    dynamicLevels: DynamicLevelsFromCandles;
    marketStructure: CandleMarketStructureContext;
    levels: null;
    diagnostics: SingleTimeframeSupportResistanceDiagnostic[];
};
export type BuildSingleTimeframeSupportResistanceContextRequest = {
    symbol: string;
    timeframe: SharedSingleTimeframe;
    candles: SharedSupportResistanceCandle[];
    asOfTimestamp?: SharedCandleTimestamp;
    sessionDate?: string;
};
export type FetchSingleTimeframeSupportResistanceContextRequest = {
    symbol: string;
    timeframe?: SharedSingleTimeframe;
    lookbackBars: number;
    endTimeMs?: number;
    asOfTimestamp?: SharedCandleTimestamp;
    sessionDate?: string;
    fetchService?: CandleFetchService;
    fetchServiceOptions?: CandleFetchServiceOptions;
    preferredProvider?: HistoricalFetchRequest["preferredProvider"];
};
export declare function aggregateCandlesToFiveMinutes(candles: Candle[]): Candle[];
export declare function buildSupportResistanceContextFromSingleTimeframeCandles(request: BuildSingleTimeframeSupportResistanceContextRequest): SingleTimeframeSupportResistanceContext;
export declare function fetchSupportResistanceContextFromSingleTimeframeCandles(request: FetchSingleTimeframeSupportResistanceContextRequest): Promise<SingleTimeframeSupportResistanceContext>;
//# sourceMappingURL=single-timeframe-context.d.ts.map