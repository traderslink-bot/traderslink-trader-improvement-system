import { createFinnhubClientFromEnv } from "./finnhub-client.js";
import { createYahooClientFromEnv } from "./yahoo-client.js";
const EMPTY_FINNHUB_QUOTE = {
    c: 0,
    d: 0,
    dp: 0,
    h: 0,
    l: 0,
    o: 0,
    pc: 0,
    t: 0,
};
function emptyFinnhubPreview(symbol) {
    return {
        symbol,
        quote: EMPTY_FINNHUB_QUOTE,
        profile: {
            ticker: symbol,
        },
    };
}
export class CombinedStockContextProvider {
    options;
    constructor(options) {
        this.options = options;
    }
    async getThreadPreview(symbolInput) {
        const symbol = symbolInput.trim().toUpperCase();
        if (!symbol) {
            throw new Error("A ticker symbol is required.");
        }
        const [finnhubResult, yahooResult] = await Promise.allSettled([
            this.options.finnhubClient?.getThreadPreview(symbol) ?? Promise.resolve(emptyFinnhubPreview(symbol)),
            this.options.yahooClient?.getStockContext(symbol) ?? Promise.resolve(null),
        ]);
        const finnhubPreview = finnhubResult.status === "fulfilled" ? finnhubResult.value : emptyFinnhubPreview(symbol);
        const yahoo = yahooResult.status === "fulfilled"
            ? yahooResult.value
            : this.options.yahooClient
                ? {
                    source: "Yahoo",
                    symbol,
                    fetchedAt: Date.now(),
                    errors: [yahooResult.reason instanceof Error ? yahooResult.reason.message : String(yahooResult.reason)],
                }
                : null;
        return {
            ...finnhubPreview,
            symbol,
            yahoo,
        };
    }
}
export function createStockContextProviderFromEnv(env = process.env, fetchImpl) {
    const finnhubClient = createFinnhubClientFromEnv(env, fetchImpl);
    const yahooClient = createYahooClientFromEnv(env, fetchImpl);
    if (!finnhubClient && !yahooClient) {
        return null;
    }
    return new CombinedStockContextProvider({
        finnhubClient,
        yahooClient,
    });
}
