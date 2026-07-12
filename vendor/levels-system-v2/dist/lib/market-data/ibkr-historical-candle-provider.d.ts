import { IBApi } from "@stoqey/ib";
import type { BaseCandleProviderResponse } from "./candle-types.js";
import type { HistoricalCandleProvider, HistoricalFetchPlan, HistoricalFetchRequest } from "./provider-types.js";
export declare function ibkrHistoricalContractAliasMetadata(rawSymbol: string): Record<string, string | number | boolean | null>;
export declare class IbkrHistoricalCandleProvider implements HistoricalCandleProvider {
    private readonly ib;
    private readonly timeoutMs;
    static nextRequestId: number;
    readonly providerName: "ibkr";
    constructor(ib: IBApi, timeoutMs?: number);
    fetchCandles(request: HistoricalFetchRequest, plan: HistoricalFetchPlan): Promise<BaseCandleProviderResponse>;
    private get ibClient();
    private validateRequest;
    private requestHistoricalBars;
    private resolveContract;
    private mapBarToCandle;
    private parseIbkrTimestamp;
    private tryParseIbkrDailyTimestamp;
    private isValidIbkrDailyDate;
    private parseIbkrDailyDate;
    private getFallbackDuration;
    private toFiniteNumber;
}
//# sourceMappingURL=ibkr-historical-candle-provider.d.ts.map