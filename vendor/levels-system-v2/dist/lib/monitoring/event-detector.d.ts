import type { FinalLevelZone } from "../levels/level-types.js";
import { type MonitoringConfig } from "./monitoring-config.js";
import type { LivePriceUpdate, MonitoringEvent, MonitoringEventDiagnosticListener, SymbolMonitoringState, ZoneInteractionState } from "./monitoring-types.js";
export declare function detectMonitoringEvents(params: {
    previousState: ZoneInteractionState;
    currentState: ZoneInteractionState;
    zone: FinalLevelZone;
    update: LivePriceUpdate;
    previousPrice?: number;
    symbolState: SymbolMonitoringState;
    config: MonitoringConfig;
    diagnosticListener?: MonitoringEventDiagnosticListener;
}): MonitoringEvent[];
//# sourceMappingURL=event-detector.d.ts.map