type FetchLike = typeof fetch;
export type FinnhubQuote = {
    c: number;
    d: number;
    dp: number;
    h: number;
    l: number;
    o: number;
    pc: number;
    t: number;
};
export type FinnhubCompanyProfile = {
    country?: string;
    currency?: string;
    exchange?: string;
    finnhubIndustry?: string;
    ipo?: string;
    logo?: string;
    marketCapitalization?: number;
    name?: string;
    shareOutstanding?: number;
    ticker?: string;
    weburl?: string;
};
export type FinnhubThreadPreview = {
    symbol: string;
    quote: FinnhubQuote;
    profile: FinnhubCompanyProfile;
};
export type FinnhubClientOptions = {
    apiKey: string;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
    baseUrl?: string;
};
export declare class FinnhubClient {
    private readonly options;
    private readonly fetchImpl;
    private readonly timeoutMs;
    private readonly baseUrl;
    constructor(options: FinnhubClientOptions);
    private requestJson;
    getQuote(symbol: string): Promise<FinnhubQuote>;
    getCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile>;
    getThreadPreview(symbolInput: string): Promise<FinnhubThreadPreview>;
}
export declare function createFinnhubClientFromEnv(env?: NodeJS.ProcessEnv, fetchImpl?: FetchLike): FinnhubClient | null;
export {};
//# sourceMappingURL=finnhub-client.d.ts.map