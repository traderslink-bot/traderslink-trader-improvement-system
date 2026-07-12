import type { Candle, CandleFetchTimeframe, CandleProviderName, CandleProviderResponse } from "./candle-types.js";
import { type EodhdHistoricalCandleProviderOptions } from "./eodhd-historical-candle-provider.js";
import type { HistoricalCandleProvider } from "./provider-types.js";
import { type YahooHistoricalCandleProviderOptions } from "./yahoo-historical-candle-provider.js";
export type TradeCandleContextTimeframe = CandleFetchTimeframe;
export type TradeCandleContextProviderSelection = {
    provider: CandleProviderName;
    reason: "fresh_intraday_window" | "historical_or_daily_window" | "eodhd_unavailable_yahoo_fallback";
};
export type TradeCandleContextSeries = {
    timeframe: TradeCandleContextTimeframe;
    provider: CandleProviderName;
    selectionReason: TradeCandleContextProviderSelection["reason"];
    requestedStartTimestamp: number;
    requestedEndTimestamp: number;
    candles: Candle[];
    response: CandleProviderResponse;
};
export type TradeCandleContext = {
    symbol: string;
    fromTimeMs: number;
    toTimeMs: number;
    generatedAt: number;
    series: TradeCandleContextSeries[];
};
export type BuildTradeCandleContextRequest = {
    symbol: string;
    fromTimeMs: number;
    toTimeMs: number;
    timeframes?: TradeCandleContextTimeframe[];
    nowMs?: number;
    yahooRecentLimitsMs?: Partial<Record<TradeCandleContextTimeframe, number>>;
    eodhdIntradayReadyHourEastern?: number;
    recentProvider?: HistoricalCandleProvider;
    historicalProvider?: HistoricalCandleProvider;
    yahooOptions?: YahooHistoricalCandleProviderOptions;
    eodhdOptions?: EodhdHistoricalCandleProviderOptions;
};
export declare function buildTradeCandleContext(request: BuildTradeCandleContextRequest): Promise<TradeCandleContext>;
//# sourceMappingURL=trade-candle-context.d.ts.map