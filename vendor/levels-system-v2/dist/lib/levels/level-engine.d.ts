import type { CandleProviderResponse, CandleTimeframe } from "../market-data/candle-types.js";
import { CandleFetchService, type HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import { type LevelEngineConfig } from "./level-config.js";
import { type LevelRuntimeComparisonLogEntry } from "./level-runtime-comparison-logger.js";
import type { LevelRuntimeCompareActivePath, LevelRuntimeMode } from "./level-runtime-mode.js";
import type { LevelEngineOutput } from "./level-types.js";
export type LevelEngineRequest = {
    symbol: string;
    historicalRequests: Record<CandleTimeframe, HistoricalFetchRequest>;
    referencePriceOverride?: number;
};
export type LevelEngineRuntimeOptions = {
    runtimeMode?: LevelRuntimeMode;
    compareActivePath?: LevelRuntimeCompareActivePath;
    onComparisonLog?: (entry: LevelRuntimeComparisonLogEntry) => void;
};
export type LevelEngineOutputWithCandleSeries = {
    output: LevelEngineOutput;
    seriesMap: Record<CandleTimeframe, CandleProviderResponse>;
};
export declare class LevelEngine {
    private readonly fetchService;
    private readonly config;
    private readonly runtimeOptions;
    constructor(fetchService: CandleFetchService, config?: LevelEngineConfig, runtimeOptions?: LevelEngineRuntimeOptions);
    private buildOptionalIntradayFallback;
    private loadSeries;
    private assertSeriesUsable;
    private deriveOutputMetadata;
    private deriveReferenceTimestamp;
    private buildOldOutput;
    private buildOutputFromSeries;
    generateLevelsWithCandleSeries(request: LevelEngineRequest): Promise<LevelEngineOutputWithCandleSeries>;
    generateLevels(request: LevelEngineRequest): Promise<LevelEngineOutput>;
}
//# sourceMappingURL=level-engine.d.ts.map