import type { FinalLevelZone } from "../levels/level-types.js";
import type { MarketStructureType, MonitoringEvent, SymbolBias, SymbolMonitoringState, ZoneInteractionState } from "./monitoring-types.js";
type StructureType = MarketStructureType | null;
export declare function deriveSymbolBias(events: MonitoringEvent[], referenceTimestamp: number): SymbolBias;
export declare function computePressureScore(params: {
    symbolState: SymbolMonitoringState;
    zone: FinalLevelZone;
    currentState: ZoneInteractionState;
    referenceTimestamp: number;
}): number;
export declare function buildSymbolContext(params: {
    symbolState: SymbolMonitoringState;
    zone: FinalLevelZone;
    currentState: ZoneInteractionState;
    referenceTimestamp: number;
}): {
    bias: SymbolBias;
    pressureScore: number;
    repeatedTests: number;
    failedBreakoutCount: number;
    failedBreakdownCount: number;
    rangeCompressionScore: number;
    structureType: StructureType;
    structureStrength: number;
};
export declare function recordMonitoringEvent(symbolState: SymbolMonitoringState, event: MonitoringEvent): void;
export {};
//# sourceMappingURL=symbol-state.d.ts.map