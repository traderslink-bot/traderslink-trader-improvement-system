import type { FinalLevelZone } from "../levels/level-types.js";
import { type MonitoringConfig } from "./monitoring-config.js";
import type { LivePriceUpdate, ZoneInteractionState } from "./monitoring-types.js";
export declare function createInitialInteractionState(symbol: string, zone: FinalLevelZone): ZoneInteractionState;
export declare function updateInteractionState(params: {
    previousState: ZoneInteractionState;
    zone: FinalLevelZone;
    update: LivePriceUpdate;
    previousPrice?: number;
    config: MonitoringConfig;
}): ZoneInteractionState;
//# sourceMappingURL=interaction-state-machine.d.ts.map