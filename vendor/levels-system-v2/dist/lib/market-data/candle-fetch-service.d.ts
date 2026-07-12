import type { BaseCandleProviderResponse, CandleProviderResponse, CandleProviderName } from "./candle-types.js";
import { type HistoricalProviderFactoryOptions } from "./provider-factory.js";
import type { HistoricalCandleProvider, HistoricalFetchRequest } from "./provider-types.js";
export type { HistoricalCandleProvider, HistoricalFetchRequest } from "./provider-types.js";
export type CandleFetchServiceOptions = Omit<HistoricalProviderFactoryOptions, "provider"> & {
    provider?: HistoricalCandleProvider;
    providerName?: CandleProviderName;
};
export declare class StubHistoricalCandleProvider implements HistoricalCandleProvider {
    readonly providerName: "stub";
    fetchCandles(request: HistoricalFetchRequest): Promise<BaseCandleProviderResponse>;
}
export declare class CandleFetchService {
    private provider;
    constructor(providerOrOptions: HistoricalCandleProvider | CandleFetchServiceOptions);
    getProviderName(): CandleProviderName;
    setProvider(provider: HistoricalCandleProvider): void;
    fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
}
//# sourceMappingURL=candle-fetch-service.d.ts.map