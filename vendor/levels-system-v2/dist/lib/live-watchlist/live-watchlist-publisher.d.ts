import { formatLevelExtensionMessage } from "../alerts/alert-router.js";
import type { AlertPayload, LevelSnapshotDisplayZone, LevelSnapshotPayload } from "../alerts/alert-types.js";
import type { TechnicalContext } from "../technical-context/technical-context-types.js";
import { type LiveWatchlistPullbackVolumeRead } from "./pullback-read.js";
import type { LiveWatchlistExtendedQuote, LiveWatchlistCardPatch, LiveWatchlistHealthPatch, LiveWatchlistLevelMap, LiveWatchlistHttpPublisherOptions, LiveWatchlistPublisher, LiveWatchlistStatus, LiveWatchlistTickerDataPatch } from "./live-watchlist-types.js";
export declare function buildLiveWatchlistLevelMap(args: {
    currentPrice: number;
    supportZones: Array<Pick<LevelSnapshotDisplayZone, "representativePrice" | "strengthLabel" | "sourceLabel" | "freshness">>;
    resistanceZones: Array<Pick<LevelSnapshotDisplayZone, "representativePrice" | "strengthLabel" | "sourceLabel" | "freshness">>;
    preferStructuralLevels?: boolean;
}): LiveWatchlistLevelMap | null;
export declare function buildLiveWatchlistTechnicalContextPatch(args: {
    symbol: string;
    timestamp: number;
    currentPrice: number;
    technicalContext: TechnicalContext | null | undefined;
}): LiveWatchlistCardPatch | null;
export declare function buildLiveWatchlistSnapshotPatch(payload: LevelSnapshotPayload, options?: {
    pullbackReadEnabled?: boolean;
}): LiveWatchlistCardPatch;
export declare function buildLiveWatchlistPullbackReadPatch(args: {
    symbol: string;
    timestamp: number;
    currentPrice: number;
    supportZones: Array<Pick<LevelSnapshotDisplayZone, "representativePrice" | "strengthLabel" | "sourceLabel" | "freshness">>;
    resistanceZones: Array<Pick<LevelSnapshotDisplayZone, "representativePrice" | "strengthLabel" | "sourceLabel" | "freshness">>;
    technicalContext: TechnicalContext | null | undefined;
    volumeRead?: LiveWatchlistPullbackVolumeRead | null;
}): LiveWatchlistCardPatch | null;
export declare function buildLiveWatchlistExtensionPatch(payload: Parameters<typeof formatLevelExtensionMessage>[0]): LiveWatchlistCardPatch;
export declare function buildLiveWatchlistAlertPatch(payload: AlertPayload): LiveWatchlistCardPatch | null;
export declare function buildLiveWatchlistTickerDataPatch(args: {
    symbol: string;
    lastPrice: number;
    timestamp: number;
    supportZones: Array<Pick<LevelSnapshotDisplayZone, "representativePrice" | "strengthLabel" | "sourceLabel" | "freshness">>;
    resistanceZones: Array<Pick<LevelSnapshotDisplayZone, "representativePrice" | "strengthLabel" | "sourceLabel" | "freshness">>;
    volume?: number | null;
    extendedQuote?: LiveWatchlistExtendedQuote | null;
}): LiveWatchlistTickerDataPatch | null;
export declare function buildLiveWatchlistStatusPatch(args: {
    symbol: string;
    status: LiveWatchlistStatus;
    updatedAt?: number;
    firstPostedAt?: number | null;
}): LiveWatchlistCardPatch;
export declare class LiveWatchlistHttpPublisher implements LiveWatchlistPublisher {
    private readonly options;
    private readonly fetchImpl;
    private readonly timeoutMs;
    private readonly retryAttempts;
    private readonly retryDelayMs;
    constructor(options: LiveWatchlistHttpPublisherOptions);
    publish(patch: LiveWatchlistCardPatch): Promise<void>;
    publishHealth(patch: LiveWatchlistHealthPatch): Promise<void>;
    publishTickerData(patch: LiveWatchlistTickerDataPatch): Promise<void>;
    private publishPayload;
}
export declare function createLiveWatchlistPublisherFromEnv(env?: NodeJS.ProcessEnv): LiveWatchlistPublisher | null;
//# sourceMappingURL=live-watchlist-publisher.d.ts.map