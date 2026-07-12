import type { MonitoringEvent } from "../monitoring/monitoring-types.js";
import type { OpportunityInterpretation } from "../monitoring/opportunity-interpretation.js";
import type { AlertPayload, DiscordThread, TraderFollowThroughContext, LevelExtensionPayload, LevelSnapshotPayload, DiscordThreadRoutingResult, IntelligentAlert } from "./alert-types.js";
type MarketStructureStoryVisibility = "auto" | "always" | "material_only" | "metadata_only";
type MarketStructureStoryFormatOptions = {
    marketStructureStoryVisibility?: MarketStructureStoryVisibility;
    marketStructureStoryKeys?: string[];
};
export declare const WATCHLIST_TRADER_READ_AI_ENABLED_ENV = "WATCHLIST_TRADER_READ_AI_ENABLED";
export declare function isWatchlistTraderReadAiEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare function formatMonitoringEventAsAlert(event: MonitoringEvent): AlertPayload;
export declare function buildMarketStructureDiscordLines(marketStructure: LevelSnapshotPayload["marketStructure"]): string[];
export declare function buildVisibleMarketStructureDiscordLines(marketStructure: LevelSnapshotPayload["marketStructure"], options?: {
    includeWaitingPlaceholders?: boolean;
    storyKeys?: string[];
}): string[];
export declare function formatIntelligentAlertAsPayload(alert: IntelligentAlert, options?: MarketStructureStoryFormatOptions): AlertPayload;
export declare function formatFollowThroughUpdateAsPayload(params: {
    symbol: string;
    timestamp: number;
    followThrough: TraderFollowThroughContext;
    entryPrice: number;
    outcomePrice: number;
    repeatedOutcomeUpdate?: boolean;
    marketStructure?: LevelSnapshotPayload["marketStructure"];
    includeMarketStructureStory?: boolean;
    marketStructureStoryKeys?: string[];
}): AlertPayload;
export declare function formatFollowThroughStateUpdateAsPayload(params: {
    symbol: string;
    timestamp: number;
    eventType: string;
    progressLabel: "improving" | "stalling" | "degrading";
    directionalReturnPct: number | null;
    entryPrice: number;
    currentPrice: number;
    marketStructure?: LevelSnapshotPayload["marketStructure"];
    includeMarketStructureStory?: boolean;
    marketStructureStoryKeys?: string[];
}): AlertPayload;
export declare function formatMarketStructureUpdateAsPayload(params: {
    symbol: string;
    timestamp: number;
    marketStructure: LevelSnapshotPayload["marketStructure"];
    storyReason?: string;
    storyKeys?: string[];
    storySource?: string;
}): AlertPayload;
export declare function formatContinuityUpdateAsPayload(params: {
    interpretation?: OpportunityInterpretation;
    update?: {
        symbol: string;
        timestamp: number;
        continuityType: string;
        message: string;
        confidence?: number;
        eventType?: string | null;
        level?: number;
    };
}): AlertPayload;
export declare function formatSymbolRecapAsPayload(params: {
    symbol: string;
    timestamp: number;
    body: string;
    aiGenerated?: boolean;
}): AlertPayload;
export interface DiscordThreadGateway {
    getThreadById(threadId: string): Promise<DiscordThread | null>;
    findThreadByName(name: string): Promise<DiscordThread | null>;
    createThread(name: string): Promise<DiscordThread>;
    sendMessage(threadId: string, payload: AlertPayload): Promise<void>;
    sendLevelSnapshot(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelLadder?(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelExtension(threadId: string, payload: LevelExtensionPayload): Promise<void>;
}
export declare function formatLevelSnapshotMessage(payload: LevelSnapshotPayload): string;
export declare function formatLevelLadderMessage(payload: LevelSnapshotPayload): string | null;
export declare function formatLevelExtensionMessage(payload: LevelExtensionPayload): string;
export declare class DiscordAlertRouter {
    private readonly gateway;
    constructor(gateway: DiscordThreadGateway);
    ensureThread(symbol: string, storedThreadId?: string | null): Promise<DiscordThreadRoutingResult>;
    routeAlert(threadId: string, payload: AlertPayload): Promise<void>;
    routeLevelSnapshot(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    routeLevelExtension(threadId: string, payload: LevelExtensionPayload): Promise<void>;
}
export {};
//# sourceMappingURL=alert-router.d.ts.map