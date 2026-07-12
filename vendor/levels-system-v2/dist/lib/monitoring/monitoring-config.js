// 2026-04-14 09:55 PM America/Toronto
// Config for watchlist monitoring and event detection with deduplication controls.
export const DEFAULT_MONITORING_CONFIG = {
    nearZonePct: 0.0035,
    nearestZonesToEvaluate: 3,
    breakoutConfirmPct: 0.0025,
    maxConfirmDistancePct: 0.01,
    tightClearancePct: 0.015,
    limitedClearancePct: 0.04,
    failureReturnPct: 0.0015,
    compressionMaxDistancePct: 0.0025,
    compressionMinUpdates: 4,
    fakeoutWindowMs: 3 * 60 * 1000,
    eventCooldownMs: 30 * 1000,
    maxEventsPerSymbolPerUpdate: 2,
};
export function getSupportApproachPct(config) {
    return Math.max(config.nearZonePct * 2, config.maxConfirmDistancePct * 0.7);
}
