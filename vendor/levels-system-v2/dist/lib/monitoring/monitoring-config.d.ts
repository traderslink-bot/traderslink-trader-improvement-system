export type MonitoringConfig = {
    nearZonePct: number;
    nearestZonesToEvaluate: number;
    breakoutConfirmPct: number;
    maxConfirmDistancePct: number;
    tightClearancePct: number;
    limitedClearancePct: number;
    failureReturnPct: number;
    compressionMaxDistancePct: number;
    compressionMinUpdates: number;
    fakeoutWindowMs: number;
    eventCooldownMs: number;
    maxEventsPerSymbolPerUpdate: number;
};
export declare const DEFAULT_MONITORING_CONFIG: MonitoringConfig;
export declare function getSupportApproachPct(config: Pick<MonitoringConfig, "nearZonePct" | "maxConfirmDistancePct">): number;
//# sourceMappingURL=monitoring-config.d.ts.map