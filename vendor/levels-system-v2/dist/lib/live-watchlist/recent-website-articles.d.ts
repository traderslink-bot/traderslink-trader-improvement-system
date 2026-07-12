import type { LiveWatchlistCardPatch, LiveWatchlistPublisher } from "./live-watchlist-types.js";
export type RecentWebsiteArticle = {
    ticker: string;
    url: string;
    articlePath?: string;
    title: string;
    publishedAt?: string;
    eventType?: string;
    filingType?: string;
    sourceUrl?: string;
    observedAt?: string;
};
export type RecentWebsiteArticleLookupResult = {
    ticker: string;
    businessDays: number;
    generatedAt?: string;
    cutoffPublishedAt?: string;
    count: number;
    articles: RecentWebsiteArticle[];
};
type ExecFileAsync = (file: string, args: string[], options: {
    maxBuffer: number;
    timeout: number;
    windowsHide: boolean;
}) => Promise<{
    stdout: string;
    stderr: string;
}>;
type RecentWebsiteArticlePublisherLogger = Pick<typeof console, "warn">;
export declare function normalizeRecentWebsiteArticleLookupResult(value: unknown, symbolInput: string): RecentWebsiteArticleLookupResult;
export declare function lookupRecentWebsiteArticlesForSymbol(args: {
    symbol: string;
    env?: NodeJS.ProcessEnv;
    execFileImpl?: ExecFileAsync;
}): Promise<RecentWebsiteArticleLookupResult>;
export declare function buildRecentWebsiteArticlesPatch(args: {
    result: RecentWebsiteArticleLookupResult;
    symbol: string;
    updatedAt?: number;
}): LiveWatchlistCardPatch | null;
export declare function publishRecentWebsiteArticlesForSymbol(args: {
    symbol: string;
    publisher: LiveWatchlistPublisher | null;
    env?: NodeJS.ProcessEnv;
    execFileImpl?: ExecFileAsync;
    logger?: RecentWebsiteArticlePublisherLogger;
}): Promise<void>;
export {};
//# sourceMappingURL=recent-website-articles.d.ts.map