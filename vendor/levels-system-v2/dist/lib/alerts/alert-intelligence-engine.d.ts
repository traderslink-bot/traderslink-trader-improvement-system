import type { LevelEngineOutput } from "../levels/level-types.js";
import type { MonitoringEvent } from "../monitoring/monitoring-types.js";
import { type AlertIntelligenceConfig } from "./alert-config.js";
import { formatIntelligentAlert } from "./alert-formatter.js";
import type { AlertPostingDecision, IntelligentAlert } from "./alert-types.js";
export declare class AlertIntelligenceEngine {
    private readonly config;
    private postedAlertHistory;
    constructor(config?: AlertIntelligenceConfig);
    private findZoneForEvent;
    private resolveNextBarrierSide;
    private buildPlanningLevels;
    private appendSyntheticResistancePlanningLevels;
    private resolvePlanningTargetDistancePct;
    private findNextBarrier;
    private findContinuationBarrier;
    private findBarrierForSide;
    processEvent(event: MonitoringEvent, levels: LevelEngineOutput | undefined): {
        rawAlert: IntelligentAlert;
        formatted: ReturnType<typeof formatIntelligentAlert> | null;
        delivery: AlertPostingDecision;
    };
}
//# sourceMappingURL=alert-intelligence-engine.d.ts.map