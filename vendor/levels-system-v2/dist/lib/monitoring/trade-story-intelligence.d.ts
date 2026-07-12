import type { FinalLevelZone } from "../levels/level-types.js";
import type { MonitoringEvent, MonitoringEventType, PracticalTradeArea, PracticalTradeStructureContext, SymbolMonitoringState } from "./monitoring-types.js";
import { type FailedLevelMemoryContext } from "./failed-level-memory.js";
import { type PrimaryTradeAreaContext } from "./primary-trade-area.js";
export type TradeStoryState = "building" | "testing_resistance" | "breakout_attempt" | "breakout_accepted" | "breakout_failed" | "pullback" | "support_test" | "support_lost" | "reclaim_attempt" | "reset";
export type RangeBoxLabel = "active" | "wide" | "not_enough_structure";
export type RangeBoxContext = {
    label: RangeBoxLabel;
    low: number | null;
    high: number | null;
    widthPct: number | null;
    recentInsidePostCount: number;
    traderLine?: string;
};
export type AcceptanceLabel = "accepted" | "testing" | "weak_probe" | "rejected" | "failed" | "unknown";
export type AcceptanceContext = {
    label: AcceptanceLabel;
    beyondZonePct: number | null;
    reasons: string[];
    traderLine?: string;
};
export type SupportImportanceLabel = "noise_support" | "practical_support" | "must_hold_structure" | "deeper_failure_area" | "unknown";
export type SupportImportanceContext = {
    label: SupportImportanceLabel;
    supportArea: PracticalTradeArea | null;
    deeperSupportArea: PracticalTradeArea | null;
    distanceToSupportPct: number | null;
    traderLine?: string;
};
export type BehaviorBudgetLabel = "boring_range" | "normal_trade" | "active_runner" | "extreme_runner";
export type BehaviorBudgetContext = {
    label: BehaviorBudgetLabel;
    maxUsefulPostsPerDay: number;
    maxRangePosts: number;
    reasons: string[];
};
export type TradeStoryIntelligenceContext = {
    storyState: TradeStoryState;
    rangeBox: RangeBoxContext;
    acceptance: AcceptanceContext;
    supportImportance: SupportImportanceContext;
    behaviorBudget: BehaviorBudgetContext;
    primaryTradeArea: PrimaryTradeAreaContext;
    failedLevelMemory: FailedLevelMemoryContext;
    traderLine: string;
};
export declare function buildRangeBoxContext(params: {
    symbol: string;
    price: number;
    tradeStructure?: PracticalTradeStructureContext;
    recentEvents: MonitoringEvent[];
    timestamp: number;
}): RangeBoxContext;
export declare function buildAcceptanceContext(params: {
    eventType: MonitoringEventType;
    zone: FinalLevelZone;
    price: number;
    stableMaterialChange?: boolean;
}): AcceptanceContext;
export declare function buildSupportImportanceContext(params: {
    symbolState: SymbolMonitoringState;
    price: number;
    tradeStructure?: PracticalTradeStructureContext;
}): SupportImportanceContext;
export declare function buildBehaviorBudgetContext(params: {
    price: number;
    rangeBox: RangeBoxContext;
    recentEvents: MonitoringEvent[];
    timestamp: number;
}): BehaviorBudgetContext;
export declare function deriveTradeStoryState(params: {
    eventType: MonitoringEventType;
    tradeStructure?: PracticalTradeStructureContext;
    acceptance: AcceptanceContext;
    rangeBox: RangeBoxContext;
}): TradeStoryState;
export declare function buildTradeStoryIntelligenceContext(params: {
    symbolState: SymbolMonitoringState;
    zone: FinalLevelZone;
    eventType: MonitoringEventType;
    price: number;
    timestamp: number;
    tradeStructure?: PracticalTradeStructureContext;
    stableMaterialChange?: boolean;
}): TradeStoryIntelligenceContext;
//# sourceMappingURL=trade-story-intelligence.d.ts.map