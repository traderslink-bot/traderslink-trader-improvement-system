import type { FinalLevelZone } from "../levels/level-types.js";
import { deriveZoneTacticalRead } from "../levels/zone-tactical-read.js";
import { type MonitoringConfig } from "./monitoring-config.js";
import type { BarrierClutterLabel, BarrierClearanceLabel, LivePriceUpdate, MonitoringAlertType, MonitoringEventType, PathQualityLabel, SymbolMonitoringState, ZoneExhaustionLabel, ZoneInteractionState } from "./monitoring-types.js";
export declare function deriveBarrierClearanceLabel(distancePct: number | null, config: MonitoringConfig): BarrierClearanceLabel | undefined;
export declare function derivePathQuality(params: {
    eventType: MonitoringEventType;
    zone: FinalLevelZone;
    symbolState: SymbolMonitoringState;
    triggerPrice: number;
    config: MonitoringConfig;
}): {
    label: PathQualityLabel;
    barrierCount: number;
    constraintScore: number;
    pathWindowDistancePct: number;
} | null;
export declare function deriveZoneExhaustion(params: {
    zone: FinalLevelZone;
    zoneFreshness: FinalLevelZone["freshness"];
    tacticalRead: ReturnType<typeof deriveZoneTacticalRead>;
}): ZoneExhaustionLabel;
export declare function findNearestRelevantBarrier(params: {
    eventType: MonitoringEventType;
    zone: FinalLevelZone;
    symbolState: SymbolMonitoringState;
    triggerPrice: number;
}): {
    kind: "support" | "resistance";
    zone: FinalLevelZone;
    level: number;
    distancePct: number;
    roleFlipFromKind?: "support" | "resistance";
} | null;
export declare function deriveBarrierClutter(params: {
    eventType: MonitoringEventType;
    zone: FinalLevelZone;
    symbolState: SymbolMonitoringState;
    triggerPrice: number;
    config: MonitoringConfig;
}): {
    label: BarrierClutterLabel;
    nearbyBarrierCount: number;
} | null;
export declare function buildInteractionEpisodeId(symbol: string, zone: FinalLevelZone, currentState: ZoneInteractionState, update: LivePriceUpdate): string;
export declare function shouldFilterMonitoringEvent(params: {
    eventType: MonitoringEventType;
    currentState: ZoneInteractionState;
    update: LivePriceUpdate;
    previousPrice?: number;
    config: MonitoringConfig;
    zone: FinalLevelZone;
    symbolState: SymbolMonitoringState;
}): boolean;
export declare function scoreMonitoringEvent(params: {
    eventType: MonitoringEventType;
    zone: FinalLevelZone;
    update: LivePriceUpdate;
    previousPrice?: number;
    currentState: ZoneInteractionState;
    symbolState: SymbolMonitoringState;
    config: MonitoringConfig;
}): {
    type: MonitoringAlertType;
    level: number;
    strength: number;
    confidence: number;
    priority: number;
    bias: SymbolMonitoringState["bias"];
    pressureScore: number;
};
//# sourceMappingURL=monitoring-event-scoring.d.ts.map