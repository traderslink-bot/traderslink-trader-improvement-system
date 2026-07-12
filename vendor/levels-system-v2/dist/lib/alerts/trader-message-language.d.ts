import type { FinalLevelZone } from "../levels/level-types.js";
import type { MonitoringEvent } from "../monitoring/monitoring-types.js";
import type { TraderDipBuyQualityContext, TraderExhaustionContext, TraderFailureRiskContext, TraderFollowThroughContext, TraderMarketStructureContext, TraderMovementContext, TraderNextBarrierContext, TraderPathQualityContext, TraderPressureContext, TraderSetupStateContext, TraderTriggerQualityContext, TraderTargetContext, TraderTradeMapContext, TraderVolumeActivityContext, TraderZoneTacticalRead } from "./alert-types.js";
export declare function describeZoneStrength(strengthLabel: FinalLevelZone["strengthLabel"]): "light" | "moderate" | "heavy" | "major";
export declare function describeZoneStrengthWithKind(strengthLabel: FinalLevelZone["strengthLabel"], zoneKind: "support" | "resistance"): string;
export declare function deriveTraderZoneTacticalRead(zone?: FinalLevelZone, freshnessOverride?: FinalLevelZone["freshness"]): TraderZoneTacticalRead | undefined;
export declare function deriveTraderPressureContext(event: MonitoringEvent): TraderPressureContext;
export declare function deriveTraderTriggerQualityContext(params: {
    event: MonitoringEvent;
    movement?: TraderMovementContext | null;
    pressure: TraderPressureContext;
    nextBarrier?: TraderNextBarrierContext | null;
}): TraderTriggerQualityContext | null;
export declare function deriveTraderSetupStateContext(params: {
    event: MonitoringEvent;
    movement?: TraderMovementContext | null;
}): TraderSetupStateContext | null;
export declare function deriveTraderMarketStructureContext(event: MonitoringEvent, zone?: FinalLevelZone): TraderMarketStructureContext | null;
export declare function deriveTraderVolumeActivityContext(event: MonitoringEvent, zone?: FinalLevelZone): TraderVolumeActivityContext | null;
export declare function deriveTraderFailureRiskContext(params: {
    event: MonitoringEvent;
    zone?: FinalLevelZone;
    pressure: TraderPressureContext;
    triggerQuality?: TraderTriggerQualityContext | null;
    nextBarrier?: TraderNextBarrierContext | null;
}): TraderFailureRiskContext | null;
export declare function deriveTraderDipBuyQualityContext(params: {
    event: MonitoringEvent;
    zone?: FinalLevelZone;
    pressure: TraderPressureContext;
    nextBarrier?: TraderNextBarrierContext | null;
}): TraderDipBuyQualityContext | null;
export declare function deriveTraderPathQualityContext(nextBarrier?: TraderNextBarrierContext | null): TraderPathQualityContext | null;
export declare function deriveTraderExhaustionContext(event: MonitoringEvent, zone?: FinalLevelZone): TraderExhaustionContext | null;
export declare function deriveTraderFollowThroughContext(params: {
    eventType: string;
    returnPct: number | null;
    directionalReturnPct: number | null;
    followThroughLabel: TraderFollowThroughContext["label"];
}): TraderFollowThroughContext;
export declare function deriveTraderMovementContext(event: MonitoringEvent, zone?: FinalLevelZone): TraderMovementContext | null;
export declare function deriveTraderTradeMapContext(event: MonitoringEvent, zone?: FinalLevelZone, nextBarrier?: TraderNextBarrierContext | null): TraderTradeMapContext | null;
export declare function deriveTraderTargetContext(event: MonitoringEvent, zone?: FinalLevelZone, nextBarrier?: TraderNextBarrierContext | null): TraderTargetContext | null;
export declare function buildTraderAlertBody(event: MonitoringEvent, zone?: FinalLevelZone, nextBarrier?: TraderNextBarrierContext | null): string;
//# sourceMappingURL=trader-message-language.d.ts.map