import type { AlertPayload, LevelExtensionPayload, LevelSnapshotDisplayZone, LevelSnapshotPayload } from "../alerts/alert-types.js";
export type LiveWatchlistCardKind = "companyInfo" | "levelMap" | "fullLadder" | "nearestSupportResistance" | "liveTraderRead" | "marketStructure" | "technicalContext" | "recentNewsFilings" | "extendedQuote";
export type LiveWatchlistStatus = "live" | "stale" | "deactivated";
export type LiveWatchlistMarketDataStatus = "live" | "stale" | "offline" | "starting";
export type LiveWatchlistCardContent = {
    title: string;
    body: string;
    updatedAt: number;
    priceWhenPosted: number | null;
    source: string;
    metadata?: Record<string, string | number | boolean | null>;
};
export type LiveWatchlistCardPatch = {
    symbol: string;
    status?: LiveWatchlistStatus;
    updatedAt: number;
    firstPostedAt?: number | null;
    levelMap?: LiveWatchlistLevelMap | null;
    cards: Partial<Record<LiveWatchlistCardKind, LiveWatchlistCardContent | null>>;
};
export type LiveWatchlistHealthPatch = {
    type: "health";
    marketDataStatus: LiveWatchlistMarketDataStatus;
    marketDataUpdatedAt: number;
};
export type LiveWatchlistTickerDataPatch = {
    type: "tickerData";
    symbol: string;
    status?: LiveWatchlistStatus;
    updatedAt: number;
    latestPrice: number;
    nearestSupport: number | null;
    nearestResistance: number | null;
    nearestSupportLabel?: string | null;
    nearestResistanceLabel?: string | null;
    levelMap?: LiveWatchlistLevelMap | null;
    volume?: number | null;
    extendedQuote?: LiveWatchlistExtendedQuote | null;
};
export type LiveWatchlistExtendedQuote = {
    source: "eodhd_live_v2";
    symbol: string;
    providerSymbol: string;
    updatedAt: number;
    fetchedAt: number;
    name: string | null;
    exchange: string | null;
    currency: string | null;
    open: number | null;
    high: number | null;
    low: number | null;
    lastTradePrice: number | null;
    lastTradeSize: number | null;
    lastTradeTime: number | null;
    bidPrice: number | null;
    bidSize: number | null;
    bidTime: number | null;
    askPrice: number | null;
    askSize: number | null;
    askTime: number | null;
    volume: number | null;
    change: number | null;
    changePercent: number | null;
    previousClosePrice: number | null;
    ethPrice: number | null;
    ethVolume: number | null;
    ethTime: number | null;
    marketCap: number | null;
    sharesOutstanding: number | null;
    sharesFloat: number | null;
    timestamp: number | null;
};
export type LiveWatchlistExtendedQuoteProvider = {
    getExtendedQuote(symbol: string): Promise<LiveWatchlistExtendedQuote | null>;
};
export type LiveWatchlistPublisher = {
    publish(patch: LiveWatchlistCardPatch): Promise<void>;
    publishHealth?(patch: LiveWatchlistHealthPatch): Promise<void>;
    publishTickerData?(patch: LiveWatchlistTickerDataPatch): Promise<void>;
};
export type LiveWatchlistHttpPublisherOptions = {
    ingestUrl: string;
    token: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
    onError?: (error: unknown, patch: LiveWatchlistCardPatch | LiveWatchlistHealthPatch | LiveWatchlistTickerDataPatch) => void;
};
export type LiveWatchlistNearestLevel = {
    price: number;
    distancePct: number;
    strengthLabel?: LevelSnapshotDisplayZone["strengthLabel"];
    sourceLabel?: string;
};
export type LiveWatchlistLevelMapRangeState = "tight" | "normal" | "wide";
export type LiveWatchlistLevelMapLevel = {
    side: "support" | "resistance";
    price: number;
    distancePct: number;
    strengthLabel?: LevelSnapshotDisplayZone["strengthLabel"];
    freshness?: LevelSnapshotDisplayZone["freshness"];
    sourceLabel?: string | null;
    roleFlipFromSide?: "support" | "resistance" | null;
    label: string;
};
export type LiveWatchlistLevelMap = {
    currentPrice: number;
    rangeState: LiveWatchlistLevelMapRangeState;
    nearestSupport: LiveWatchlistLevelMapLevel | null;
    nearestResistance: LiveWatchlistLevelMapLevel | null;
    nextStrongSupport: LiveWatchlistLevelMapLevel | null;
    nextStrongResistance: LiveWatchlistLevelMapLevel | null;
    supportLevels: LiveWatchlistLevelMapLevel[];
    resistanceLevels: LiveWatchlistLevelMapLevel[];
};
export type LiveWatchlistSnapshotSource = {
    kind: "level_snapshot";
    payload: LevelSnapshotPayload;
} | {
    kind: "level_extension";
    payload: LevelExtensionPayload;
} | {
    kind: "alert";
    payload: AlertPayload;
};
//# sourceMappingURL=live-watchlist-types.d.ts.map