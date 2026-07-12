import type { FinalLevelZone } from "../levels/level-types.js";
import type { MonitoringEvent, MonitoringEventType } from "./monitoring-types.js";
export type FailedLevelMemoryOutcome = "probe_only" | "testing" | "accepted" | "failed" | "reclaimed" | "none";
export type FailedLevelMemoryContext = {
    outcome: FailedLevelMemoryOutcome;
    failureCount: number;
    lastAttemptAt: number | null;
    maxExtensionPct: number | null;
    traderLine?: string;
};
export declare function buildFailedLevelMemoryContext(params: {
    zone: FinalLevelZone;
    eventType: MonitoringEventType;
    price: number;
    timestamp: number;
    recentEvents: MonitoringEvent[];
}): FailedLevelMemoryContext;
//# sourceMappingURL=failed-level-memory.d.ts.map