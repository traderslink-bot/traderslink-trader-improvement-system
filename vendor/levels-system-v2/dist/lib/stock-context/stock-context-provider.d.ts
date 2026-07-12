import type { FinnhubClient } from "./finnhub-client.js";
import type { StockContextProvider, StockContextPreview } from "./stock-context-types.js";
import type { YahooClient } from "./yahoo-client.js";
type FetchLike = typeof fetch;
export declare class CombinedStockContextProvider implements StockContextProvider {
    private readonly options;
    constructor(options: {
        finnhubClient?: FinnhubClient | null;
        yahooClient?: YahooClient | null;
    });
    getThreadPreview(symbolInput: string): Promise<StockContextPreview>;
}
export declare function createStockContextProviderFromEnv(env?: NodeJS.ProcessEnv, fetchImpl?: FetchLike): StockContextProvider | null;
export {};
//# sourceMappingURL=stock-context-provider.d.ts.map