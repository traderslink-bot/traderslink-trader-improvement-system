import { CandleFetchService, type CandleFetchServiceOptions, type HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import type { CandleProviderName, CandleProviderResponse, CandleTimeframe } from "../market-data/candle-types.js";
import type { StockContextPreview } from "../stock-context/stock-context-types.js";
import type { LevelEngineRuntimeOptions } from "../levels/level-engine.js";
import type { LevelEngineConfig } from "../levels/level-config.js";
import { type SharedCandleTimestamp, type SupportResistanceContext } from "./build-support-resistance-context.js";
export type SupportResistanceSymbolContextDiagnosticCode = "fetched_candle_group" | "missing_optional_5m_candles" | "missing_required_higher_timeframe" | "future_candles_filtered" | "partial_candles_filtered" | "provider_warning";
export type SupportResistanceSymbolContextDiagnostic = {
    code: SupportResistanceSymbolContextDiagnosticCode;
    severity: "info" | "warning" | "error";
    timeframe?: CandleTimeframe;
    message: string;
};
export type SupportResistanceSymbolFetchSummary = {
    timeframe: CandleTimeframe;
    provider: CandleProviderName;
    freshnessStatus: "fresh" | "usable" | "stale" | "partial" | "missing";
    requestedLookbackBars: number;
    actualBarsReturned: number;
    requestedStartTimestamp: number;
    requestedEndTimestamp: number;
    newestCandleTimestamp: number | null;
    completenessStatus: CandleProviderResponse["completenessStatus"];
    stale: boolean;
    validationIssues: CandleProviderResponse["validationIssues"];
};
export type BuildSupportResistanceContextForSymbolRequest = {
    symbol: string;
    sessionDate?: string;
    asOfTimestamp?: SharedCandleTimestamp;
    asOfTimestampByTimeframe?: Partial<Record<CandleTimeframe, SharedCandleTimestamp>>;
    lookbackBars?: Partial<Record<CandleTimeframe, number>>;
    fetchService?: CandleFetchService;
    fetchServiceOptions?: CandleFetchServiceOptions;
    preferredProvider?: HistoricalFetchRequest["preferredProvider"];
    currentPrice?: number;
    bid?: number;
    ask?: number;
    stockContext?: StockContextPreview | null;
    knownCatalyst?: boolean;
    config?: LevelEngineConfig;
    runtimeOptions?: LevelEngineRuntimeOptions;
};
export type SupportResistanceSymbolContext = SupportResistanceContext & {
    mode: "symbol";
    candleFetchingOwnedBy: "levels-system";
    requestedTimeframes: CandleTimeframe[];
    fetches: SupportResistanceSymbolFetchSummary[];
    diagnostics: SupportResistanceSymbolContextDiagnostic[];
};
export declare function buildSupportResistanceContextForSymbol(request: BuildSupportResistanceContextForSymbolRequest): Promise<SupportResistanceSymbolContext>;
//# sourceMappingURL=symbol-context.d.ts.map