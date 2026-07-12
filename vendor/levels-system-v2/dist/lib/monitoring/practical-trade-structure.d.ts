import type { FinalLevelZone } from "../levels/level-types.js";
import type { MonitoringEventType, PracticalTradeStructureContext, SymbolMonitoringState } from "./monitoring-types.js";
export declare function derivePracticalTradeStructureContext(params: {
    symbolState: SymbolMonitoringState;
    zone: FinalLevelZone;
    eventType: MonitoringEventType;
    price: number;
    timestamp: number;
}): PracticalTradeStructureContext;
export declare function isPracticalStructureExpansion(params: {
    previousTrigger: number;
    nextTrigger: number;
    referencePrice: number;
}): boolean;
//# sourceMappingURL=practical-trade-structure.d.ts.map