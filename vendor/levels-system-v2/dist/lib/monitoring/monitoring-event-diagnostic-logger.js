const DEFAULT_SUPPRESSION_COOLDOWN_MS = 15_000;
const DEFAULT_MAX_SUPPRESSED_NEAREST_DISTANCE_PCT = 0.01;
function buildDiagnosticKey(diagnostic) {
    return [
        diagnostic.symbol,
        diagnostic.zoneId,
        diagnostic.eventType,
        diagnostic.decision,
    ].join("|");
}
function buildSuppressedSignature(diagnostic) {
    return JSON.stringify({
        reasons: diagnostic.reasons,
        phaseBefore: diagnostic.phaseBefore,
        phaseAfter: diagnostic.phaseAfter,
        updatesNearZone: diagnostic.updatesNearZone,
        breakAttemptAgeMs: diagnostic.breakAttemptAgeMs,
    });
}
function hasMeaningfulContext(diagnostic) {
    return (diagnostic.updatesNearZone > 0 ||
        diagnostic.phaseBefore !== "idle" ||
        diagnostic.phaseAfter !== "idle" ||
        diagnostic.breakAttemptAgeMs !== null);
}
function isNearDecisionBoundary(diagnostic, maxSuppressedNearestDistancePct) {
    return diagnostic.nearestDistancePct <= maxSuppressedNearestDistancePct;
}
function shouldLogSuppressedDiagnostic(diagnostic, previous, options) {
    const interesting = hasMeaningfulContext(diagnostic) ||
        isNearDecisionBoundary(diagnostic, options.maxSuppressedNearestDistancePct);
    if (!interesting) {
        return false;
    }
    const signature = buildSuppressedSignature(diagnostic);
    if (!previous) {
        return true;
    }
    if (previous.signature !== signature) {
        return true;
    }
    return (diagnostic.timestamp - previous.loggedAt >= options.suppressionCooldownMs);
}
export function createMonitoringEventDiagnosticListener(options = {}) {
    const suppressedSnapshots = new Map();
    const writer = options.writer ?? ((line) => console.log(line));
    const normalizedOptions = {
        suppressionCooldownMs: options.suppressionCooldownMs ?? DEFAULT_SUPPRESSION_COOLDOWN_MS,
        maxSuppressedNearestDistancePct: options.maxSuppressedNearestDistancePct ??
            DEFAULT_MAX_SUPPRESSED_NEAREST_DISTANCE_PCT,
    };
    return (diagnostic) => {
        if (diagnostic.decision === "emitted") {
            writer(JSON.stringify(diagnostic));
            return;
        }
        const key = buildDiagnosticKey(diagnostic);
        const previous = suppressedSnapshots.get(key);
        if (!shouldLogSuppressedDiagnostic(diagnostic, previous, normalizedOptions)) {
            return;
        }
        suppressedSnapshots.set(key, {
            signature: buildSuppressedSignature(diagnostic),
            loggedAt: diagnostic.timestamp,
        });
        writer(JSON.stringify(diagnostic));
    };
}
