import { type LiveThreadPostingProfile } from "../monitoring/live-thread-post-policy.js";
import type { MonitoringEvent, PracticalTradeStructureState } from "../monitoring/monitoring-types.js";
import type { CandleMarketStructureState } from "../structure/index.js";
export type OfflineSmallCapScenarioName = "range_chop" | "boring_consolidation" | "base_to_breakout" | "runner_structure_change" | "fake_breakout" | "support_area_loss" | "reclaim_after_flush";
export type OfflineSmallCapScenarioDefinition = {
    name: OfflineSmallCapScenarioName;
    symbol: string;
    description: string;
    updates: number[];
};
export type OfflineScenarioSuppressionReason = "engine_filtered" | "post_policy_suppressed";
export type OfflineScenarioSuppressedAlert = {
    timestamp: number;
    eventType: MonitoringEvent["eventType"];
    level: number;
    triggerPrice: number;
    reason: OfflineScenarioSuppressionReason;
    detail: string;
    practicalStructureState?: PracticalTradeStructureState;
    stableMarketStructureState?: CandleMarketStructureState;
};
export type OfflineScenarioPostedAlert = {
    timestamp: number;
    eventType: MonitoringEvent["eventType"];
    title: string;
    body: string;
    level: number;
    triggerPrice: number;
    severity?: string;
    score?: number;
    practicalStructureState?: PracticalTradeStructureState;
    practicalZoneKey?: string;
    stableMarketStructureState?: CandleMarketStructureState;
    stableMarketStructureKey?: string;
    stableMarketStructureMaterialChange?: boolean;
};
export type OfflineSmallCapScenarioResult = {
    name: OfflineSmallCapScenarioName;
    symbol: string;
    description: string;
    updateCount: number;
    eventCount: number;
    postedCount: number;
    suppressedCount: number;
    events: Array<{
        timestamp: number;
        eventType: MonitoringEvent["eventType"];
        zoneKind: MonitoringEvent["zoneKind"];
        level: number;
        triggerPrice: number;
        practicalStructureState?: PracticalTradeStructureState;
        practicalZoneKey?: string;
        stableMarketStructureState?: CandleMarketStructureState;
        stableMarketStructureKey?: string;
        stableMarketStructureMaterialChange?: boolean;
    }>;
    postedAlerts: OfflineScenarioPostedAlert[];
    suppressedAlerts: OfflineScenarioSuppressedAlert[];
    practicalStates: PracticalTradeStructureState[];
    stableStates: CandleMarketStructureState[];
    stableMaterialChangeCount: number;
};
export declare function defaultOfflineSmallCapScenarios(): OfflineSmallCapScenarioDefinition[];
export declare function runOfflineSmallCapScenario(scenario: OfflineSmallCapScenarioDefinition, options?: {
    startTimestamp?: number;
    intervalMs?: number;
    postingProfile?: LiveThreadPostingProfile;
}): Promise<OfflineSmallCapScenarioResult>;
export declare function runOfflineSmallCapScenarios(options?: {
    postingProfile?: LiveThreadPostingProfile;
}): Promise<OfflineSmallCapScenarioResult[]>;
export declare function renderOfflineSmallCapScenarioMarkdown(results: OfflineSmallCapScenarioResult[]): string;
//# sourceMappingURL=offline-small-cap-scenario-simulator.d.ts.map