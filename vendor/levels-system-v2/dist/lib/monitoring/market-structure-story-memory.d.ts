import type { FormalStructureTimeframe } from "../structure/index.js";
import type { FormalMarketStructureRuntimeContext, RuntimeMarketStructureSnapshot, RuntimeMarketStructureTimeframeSnapshot, StableMarketStructureRuntimeContext } from "./monitoring-types.js";
export type MarketStructureStoryDecisionReason = "pending_fresh_structure" | "current_material_structure" | "quiet_structure";
export type MarketStructureStoryDecision = {
    snapshot: RuntimeMarketStructureSnapshot | null;
    includeStory: boolean;
    reason: MarketStructureStoryDecisionReason;
    keys: string[];
};
export type FormalBosChochGateReason = "not_fresh_bos_choch" | "low_confidence_formal" | "higher_timeframe_formal" | "tactical_5m_metadata_only" | "unsupported_timeframe";
export type FormalBosChochGateExplanation = {
    actionable: boolean;
    reason: FormalBosChochGateReason;
    summary: string;
    checks: {
        isFreshBosChoch: boolean;
        materialChange: boolean;
        confidence: FormalMarketStructureRuntimeContext["confidence"] | null;
        timeframe: FormalStructureTimeframe;
        isHigherTimeframe: boolean;
        stableState: StableMarketStructureRuntimeContext["state"] | null;
        stableConfidence: StableMarketStructureRuntimeContext["confidence"] | null;
        stableMaterialChange: boolean;
        stableSupportsDirection: boolean;
    };
};
export type MarketStructureStoryMemoryOptions = {
    pendingTtlMs?: number;
    postedWindowMs?: number;
};
export type ExpiredMarketStructureStory = {
    key: string;
    snapshot: RuntimeMarketStructureSnapshot;
    capturedAt: number;
    expiresAt: number;
    expiredAt: number;
};
export type MarketStructureStoryMemorySnapshot = {
    version: 1;
    generatedAt: number;
    pending: Array<{
        symbol: string;
        key: string;
        snapshot: RuntimeMarketStructureSnapshot;
        capturedAt: number;
        expiresAt: number;
    }>;
    posted: Array<{
        symbol: string;
        key: string;
        postedAt: number;
    }>;
};
export declare function explainFormalBosChochGate(timeframe: FormalStructureTimeframe, formal: FormalMarketStructureRuntimeContext | undefined, context?: RuntimeMarketStructureTimeframeSnapshot): FormalBosChochGateExplanation;
export declare function isActionableFormalBosChoch(timeframe: FormalStructureTimeframe, formal: FormalMarketStructureRuntimeContext | undefined, context?: RuntimeMarketStructureTimeframeSnapshot): boolean;
export declare function getMaterialMarketStructureStoryKeys(snapshot: RuntimeMarketStructureSnapshot | null | undefined): string[];
export declare function getFreshFormalBosChochMarketStructureStoryKeys(snapshot: RuntimeMarketStructureSnapshot | null | undefined): string[];
export declare class MarketStructureStoryMemory {
    private readonly pendingTtlMs;
    private readonly postedWindowMs;
    private readonly pendingBySymbol;
    private readonly postedBySymbol;
    constructor(options?: MarketStructureStoryMemoryOptions);
    capture(symbolInput: string, timestampInput: number, snapshot: RuntimeMarketStructureSnapshot | null | undefined): string[];
    decide(symbolInput: string, timestampInput: number, currentSnapshot: RuntimeMarketStructureSnapshot | null | undefined): MarketStructureStoryDecision;
    markPosted(symbolInput: string, timestampInput: number, snapshot: RuntimeMarketStructureSnapshot | null | undefined, keysInput?: string[]): string[];
    consumeExpired(symbolInput: string, timestampInput: number): ExpiredMarketStructureStory[];
    clear(symbolInput: string): void;
    clearAll(): void;
    toSnapshot(timestampInput?: number): MarketStructureStoryMemorySnapshot;
    hydrate(snapshot: unknown, timestampInput?: number): void;
    private prune;
    private wasPosted;
}
//# sourceMappingURL=market-structure-story-memory.d.ts.map