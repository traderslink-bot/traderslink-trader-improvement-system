import type { TechnicalContext } from "../technical-context/technical-context-types.js";
import type { LiveWatchlistLevelMap } from "./live-watchlist-types.js";
export declare const LIVE_WATCHLIST_PULLBACK_READ_ENABLED_ENV = "LIVE_WATCHLIST_PULLBACK_READ_ENABLED";
export type LiveWatchlistPullbackReadPhase = "extended" | "pullback_forming" | "continuation_watch" | "failed_move_risk";
export type LiveWatchlistPullbackVolumeLabel = "strong" | "expanding" | "normal" | "thin" | "fading" | "unknown";
export type LiveWatchlistPullbackVolumeRead = {
    label: LiveWatchlistPullbackVolumeLabel;
    currentVolume: number | null;
    averageVolume: number | null;
    relativeVolumeRatio: number | null;
    rawRelativeVolumeRatio?: number | null;
    projectedVolume?: number | null;
    partial?: boolean;
    reason: string;
};
export type LiveWatchlistPullbackRead = {
    phase: LiveWatchlistPullbackReadPhase;
    confidence: TechnicalContext["confidence"];
    body: string;
    metadata: Record<string, string | number | boolean | null>;
};
export type LiveWatchlistPullbackReadInput = {
    symbol: string;
    currentPrice: number;
    levelMap: LiveWatchlistLevelMap | null;
    technicalContext: TechnicalContext | null | undefined;
    volumeRead?: LiveWatchlistPullbackVolumeRead | null;
};
export declare function resolveLiveWatchlistPullbackReadEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare function buildLiveWatchlistPullbackRead(input: LiveWatchlistPullbackReadInput): LiveWatchlistPullbackRead | null;
//# sourceMappingURL=pullback-read.d.ts.map