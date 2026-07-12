import type { LiveWatchlistExtendedQuote, LiveWatchlistExtendedQuoteProvider } from "./live-watchlist-types.js";
export type EodhdExtendedQuoteProviderOptions = {
    apiToken?: string;
    endpointUrl?: string;
    exchangeSuffix?: string;
    cacheTtlMs?: number;
    timeoutMs?: number;
    fetchFn?: typeof fetch;
    now?: () => number;
    onError?: (error: unknown, symbol: string) => void;
};
export declare class EodhdExtendedQuoteProvider implements LiveWatchlistExtendedQuoteProvider {
    private readonly options;
    private readonly apiToken;
    private readonly endpointUrl;
    private readonly exchangeSuffix;
    private readonly cacheTtlMs;
    private readonly timeoutMs;
    private readonly fetchFn;
    private readonly now;
    private readonly cache;
    constructor(options?: EodhdExtendedQuoteProviderOptions);
    getExtendedQuote(symbolInput: string): Promise<LiveWatchlistExtendedQuote | null>;
    private fetchQuote;
    private mapPayload;
}
export declare function createEodhdExtendedQuoteProviderFromEnv(env?: NodeJS.ProcessEnv): LiveWatchlistExtendedQuoteProvider | null;
//# sourceMappingURL=eodhd-extended-quote-provider.d.ts.map