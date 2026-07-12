import type { LiveWatchlistCardContent, LiveWatchlistCardPatch, LiveWatchlistExtendedQuote, LiveWatchlistHealthPatch, LiveWatchlistLevelMap, LiveWatchlistMarketDataStatus, LiveWatchlistPublisher, LiveWatchlistStatus, LiveWatchlistTickerDataPatch } from "./live-watchlist-types.js";
export declare const DEFAULT_LIVE_WATCHLIST_AUDIT_ARCHIVE_FILE: string;
export type LiveWatchlistAuditArchiveSymbol = {
    symbol: string;
    status?: LiveWatchlistStatus | string;
    updatedAt?: number;
    firstSeenAt: number;
    lastSeenAt: number;
    archivedAt: number;
    firstPostedAt?: number | null;
    companyName?: string | null;
    latestPrice?: number | null;
    nearestSupport?: number | null;
    nearestResistance?: number | null;
    nearestSupportLabel?: string | null;
    nearestResistanceLabel?: string | null;
    latestTraderReadHeadline?: string | null;
    levelMap?: LiveWatchlistLevelMap | null;
    cards?: Partial<Record<string, LiveWatchlistCardContent | null>>;
    volume?: number | null;
    extendedQuote?: LiveWatchlistExtendedQuote | null;
};
export type LiveWatchlistAuditArchive = {
    version: 1;
    updatedAt: number;
    marketDataStatus?: LiveWatchlistMarketDataStatus | string;
    marketDataUpdatedAt?: number | null;
    symbols: LiveWatchlistAuditArchiveSymbol[];
};
export type LiveWatchlistAuditArchivePayloadSymbol = Partial<LiveWatchlistAuditArchiveSymbol> & {
    symbol: string;
};
export type LiveWatchlistAuditArchivePayload = {
    generatedAt?: number;
    marketDataStatus?: LiveWatchlistMarketDataStatus | string;
    marketDataUpdatedAt?: number | null;
    symbols: LiveWatchlistAuditArchivePayloadSymbol[];
};
type LiveWatchlistPatch = LiveWatchlistCardPatch | LiveWatchlistHealthPatch | LiveWatchlistTickerDataPatch;
export declare function applyLiveWatchlistPatchToArchive(archive: LiveWatchlistAuditArchive, patch: LiveWatchlistPatch, now?: number): LiveWatchlistAuditArchive;
export declare function mergeLiveWatchlistPayloadWithArchive<T extends LiveWatchlistAuditArchivePayload>(payload: T, archive: LiveWatchlistAuditArchive): T;
export declare function payloadFromLiveWatchlistArchive(archive: LiveWatchlistAuditArchive): LiveWatchlistAuditArchivePayload;
export declare class LiveWatchlistAuditArchivePersistence {
    private readonly filePath;
    constructor(filePath?: string);
    getFilePath(): string;
    load(): LiveWatchlistAuditArchive;
    save(archive: LiveWatchlistAuditArchive): void;
    recordPatch(patch: LiveWatchlistPatch, now?: number): LiveWatchlistAuditArchive;
    recordPayload(payload: LiveWatchlistAuditArchivePayload, now?: number): LiveWatchlistAuditArchive;
}
export declare class ArchivedLiveWatchlistPublisher implements LiveWatchlistPublisher {
    private readonly delegate;
    private readonly archive;
    constructor(delegate: LiveWatchlistPublisher, archive?: LiveWatchlistAuditArchivePersistence);
    publish(patch: LiveWatchlistCardPatch): Promise<void>;
    publishHealth(patch: LiveWatchlistHealthPatch): Promise<void>;
    publishTickerData(patch: LiveWatchlistTickerDataPatch): Promise<void>;
    private recordPatch;
}
export {};
//# sourceMappingURL=live-watchlist-audit-archive.d.ts.map