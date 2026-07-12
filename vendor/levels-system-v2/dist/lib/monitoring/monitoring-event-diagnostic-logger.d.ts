import type { MonitoringEventDiagnosticListener } from "./monitoring-types.js";
type MonitoringEventDiagnosticLoggerOptions = {
    suppressionCooldownMs?: number;
    maxSuppressedNearestDistancePct?: number;
    writer?: (line: string) => void;
};
export declare function createMonitoringEventDiagnosticListener(options?: MonitoringEventDiagnosticLoggerOptions): MonitoringEventDiagnosticListener;
export {};
//# sourceMappingURL=monitoring-event-diagnostic-logger.d.ts.map