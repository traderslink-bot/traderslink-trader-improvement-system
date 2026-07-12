import type { BaseCandleProviderResponse } from "../candle-types.js";
import type { HistoricalCandleProvider, HistoricalFetchPlan, HistoricalFetchRequest } from "../provider-types.js";
export declare class TwelveDataHistoricalCandleProvider implements HistoricalCandleProvider {
    private readonly apiKey;
    private readonly baseUrl;
    readonly providerName: "twelve_data";
    constructor(apiKey: string, baseUrl?: string);
    fetchCandles(request: HistoricalFetchRequest, plan: HistoricalFetchPlan): Promise<BaseCandleProviderResponse>;
    private mapInterval;
}
//# sourceMappingURL=twelve-data-historical-candle-provider.d.ts.map