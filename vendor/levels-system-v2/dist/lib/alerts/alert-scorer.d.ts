import type { FinalLevelZone } from "../levels/level-types.js";
import type { MonitoringEvent } from "../monitoring/monitoring-types.js";
import type { IntelligentAlert, TraderNextBarrierContext } from "./alert-types.js";
import type { AlertIntelligenceConfig } from "./alert-config.js";
export declare function scoreMonitoringEventToAlert(params: {
    event: MonitoringEvent;
    zone?: FinalLevelZone;
    nextBarrier?: TraderNextBarrierContext | null;
    config: AlertIntelligenceConfig;
}): IntelligentAlert;
//# sourceMappingURL=alert-scorer.d.ts.map