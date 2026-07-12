import type { BaseCandleProviderResponse } from "./candle-types.js";
import type { HistoricalCandleProvider, HistoricalFetchPlan, HistoricalFetchRequest } from "./provider-types.js";
export type EodhdHistoricalCandleProviderOptions = {
    apiToken?: string;
    exchangeSuffix?: string;
    baseUrl?: string;
    fetchFn?: typeof fetch;
};
export declare class EodhdHistoricalCandleProvider implements HistoricalCandleProvider {
    readonly providerName: "eodhd";
    private readonly apiToken;
    private readonly exchangeSuffix;
    private readonly baseUrl;
    private readonly fetchFn;
    constructor(options?: EodhdHistoricalCandleProviderOptions);
    fetchCandles(request: HistoricalFetchRequest, plan: HistoricalFetchPlan): Promise<BaseCandleProviderResponse>;
    private fetchDailyBars;
    private fetchDailyCandles;
    private fetchDailyAdjustmentFactors;
    private intradayAdjustmentFactor;
    private fetchIntradayCandles;
    private mapIntradayBar;
    private parseEodhdUtcDatetime;
    private mapCandle;
    private buildUrl;
    private fetchJson;
    private extractErrorPayloadMessage;
}
//# sourceMappingURL=eodhd-historical-candle-provider.d.ts.map