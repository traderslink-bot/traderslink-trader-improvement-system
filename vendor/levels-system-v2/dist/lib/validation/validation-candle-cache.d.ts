import { CandleFetchService, type HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import type { CandleProviderName, CandleProviderResponse } from "../market-data/candle-types.js";
export type ValidationCandleCacheMode = "off" | "read_write" | "refresh" | "replay";
type CandleFetchClient = {
    getProviderName(): CandleProviderName;
    fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
};
export type ValidationCachedCandleFetchServiceOptions = {
    cacheDirectoryPath: string;
    mode?: ValidationCandleCacheMode;
};
export type ValidationCandleCacheRuntimeInfo = {
    mode: ValidationCandleCacheMode;
    cacheDirectoryPath: string;
    exactHits: number;
    reusableHits: number;
    misses: number;
    writes: number;
};
export declare function resolveValidationCandleCacheMode(rawValue: string | undefined): ValidationCandleCacheMode;
export declare class ValidationCachedCandleFetchService extends CandleFetchService {
    private readonly delegate;
    private readonly mode;
    private exactHits;
    private reusableHits;
    private misses;
    private writes;
    constructor(delegate: CandleFetchClient, options: ValidationCachedCandleFetchServiceOptions);
    readonly cacheDirectoryPath: string;
    getProviderName(): CandleProviderName;
    getCacheRuntimeInfo(): ValidationCandleCacheRuntimeInfo;
    fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
}
export {};
//# sourceMappingURL=validation-candle-cache.d.ts.map