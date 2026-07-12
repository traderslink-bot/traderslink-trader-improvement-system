import type { BaseCandleProviderResponse } from "./candle-types.js";
import type { HistoricalCandleProvider, HistoricalFetchPlan, HistoricalFetchRequest } from "./provider-types.js";
export type YahooHistoricalCandleProviderOptions = {
    baseUrl?: string;
    fetchFn?: typeof fetch;
    includePrePost?: boolean;
};
export declare class YahooHistoricalCandleProvider implements HistoricalCandleProvider {
    readonly providerName: "yahoo";
    private readonly baseUrl;
    private readonly fetchFn;
    private readonly includePrePost;
    constructor(options?: YahooHistoricalCandleProviderOptions);
    fetchCandles(request: HistoricalFetchRequest, plan: HistoricalFetchPlan): Promise<BaseCandleProviderResponse>;
    private fetchYahooCandles;
    private mapChartResult;
    private buildUrl;
    private fetchJson;
}
//# sourceMappingURL=yahoo-historical-candle-provider.d.ts.map