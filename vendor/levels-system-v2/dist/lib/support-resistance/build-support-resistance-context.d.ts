import type { Candle, CandleProviderName, CandleTimeframe } from "../market-data/candle-types.js";
import { type CandleAsOfFilterDiagnostic } from "../market-data/candle-as-of-filter.js";
import { type LevelEngineRuntimeOptions } from "../levels/level-engine.js";
import type { LevelEngineConfig } from "../levels/level-config.js";
import type { LevelEngineOutput } from "../levels/level-types.js";
import { type CandleMarketStructureContext } from "../structure/index.js";
import { type DynamicLevelsFromCandles } from "./indicators/index.js";
import { type SharedGapStructure } from "./gap-structure.js";
import { type SharedReferenceLevels } from "./reference-levels.js";
import { type TraderIntelligenceContext } from "../trader-context/index.js";
import type { StockContextPreview } from "../stock-context/stock-context-types.js";
export type SharedCandleTimestamp = number | string | Date;
export type SharedSupportResistanceCandle = {
    symbol?: string;
    timestamp: SharedCandleTimestamp;
    timeframe?: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap?: number | null;
    tradeCount?: number | null;
    source?: string | null;
    sessionBucket?: string | null;
};
export type SupportResistanceCandleMap = {
    daily: SharedSupportResistanceCandle[];
    "4h": SharedSupportResistanceCandle[];
    "5m"?: SharedSupportResistanceCandle[];
};
export type NormalizedSupportResistanceCandleMap = {
    daily: Candle[];
    "4h": Candle[];
    "5m"?: Candle[];
};
export type SupportResistanceProviderByTimeframe = Partial<Record<CandleTimeframe, CandleProviderName>>;
export type BuildSupportResistanceContextRequest = {
    symbol: string;
    candlesByTimeframe: SupportResistanceCandleMap;
    asOfTimestamp?: SharedCandleTimestamp;
    sessionDate?: string;
    currentPrice?: number;
    bid?: number;
    ask?: number;
    stockContext?: StockContextPreview | null;
    knownCatalyst?: boolean;
    config?: LevelEngineConfig;
    runtimeOptions?: LevelEngineRuntimeOptions;
};
export type SupportResistanceContext = {
    symbol: string;
    levels: LevelEngineOutput;
    referenceLevels: SharedReferenceLevels;
    gapStructure: SharedGapStructure;
    dynamicLevels: DynamicLevelsFromCandles;
    marketStructure: CandleMarketStructureContext;
    traderContext: TraderIntelligenceContext;
    candleFilterDiagnostics?: CandleAsOfFilterDiagnostic[];
};
export declare function buildSupportResistanceContextFromNormalizedCandles(params: {
    symbol: string;
    candlesByTimeframe: NormalizedSupportResistanceCandleMap;
    sessionDate?: string;
    asOfTimestamp?: number;
    providerByTimeframe?: SupportResistanceProviderByTimeframe;
    currentPrice?: number;
    bid?: number;
    ask?: number;
    stockContext?: StockContextPreview | null;
    knownCatalyst?: boolean;
    config?: LevelEngineConfig;
    runtimeOptions?: LevelEngineRuntimeOptions;
}): Promise<SupportResistanceContext>;
export declare function parseSharedCandleTimestamp(timestamp: SharedCandleTimestamp): number;
export declare function sortSharedCandles(candles: Candle[] | undefined): Candle[];
export declare function normalizeSharedSupportResistanceCandles(candles: SharedSupportResistanceCandle[] | undefined, asOfTimestamp?: number, options?: {
    timeframe?: CandleTimeframe | "1m";
}): Candle[];
export declare function buildSupportResistanceContextFromCandles(request: BuildSupportResistanceContextRequest): Promise<SupportResistanceContext>;
//# sourceMappingURL=build-support-resistance-context.d.ts.map