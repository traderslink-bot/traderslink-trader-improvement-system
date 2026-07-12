function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function buildEvaluationSummary(summary) {
    return {
        totalEvaluated: summary.totalEvaluated,
        expectancy: summary.expectancy,
        rollingExpectancy: summary.rollingExpectancy.expectancy,
        driftDeclining: summary.performanceDrift.declining,
    };
}
function targetAppliedGap(entry) {
    return Math.max(0, ...Object.values(entry.adaptiveDiagnostics.eventTypes).map((diagnostics) => Math.abs(diagnostics.targetMultiplier - diagnostics.appliedMultiplier)));
}
export function buildOpportunityDiagnosticsLogEntry(entryType, snapshot, params) {
    return {
        type: entryType,
        symbol: params.symbol,
        timestamp: params.timestamp,
        evaluationSummary: buildEvaluationSummary(snapshot.summary),
        adaptiveDiagnostics: snapshot.adaptiveDiagnostics,
        topOpportunities: snapshot.top.slice(0, 3).map((opportunity) => ({
            symbol: opportunity.symbol,
            type: opportunity.type,
            adaptiveScore: opportunity.adaptiveScore,
            adaptiveMultiplier: opportunity.adaptiveMultiplier,
            classification: opportunity.classification,
            nextBarrierDistancePct: opportunity.nextBarrierDistancePct,
            clearanceLabel: opportunity.clearanceLabel,
            barrierClutterLabel: opportunity.barrierClutterLabel,
            nearbyBarrierCount: opportunity.nearbyBarrierCount,
            pathQualityLabel: opportunity.pathQualityLabel,
            pathBarrierCount: opportunity.pathBarrierCount,
            tacticalRead: opportunity.tacticalRead,
            exhaustionLabel: opportunity.exhaustionLabel,
        })),
        opportunity: snapshot.newOpportunity
            ? {
                symbol: snapshot.newOpportunity.symbol,
                type: snapshot.newOpportunity.type,
                adaptiveScore: snapshot.newOpportunity.adaptiveScore,
                adaptiveMultiplier: snapshot.newOpportunity.adaptiveMultiplier,
                classification: snapshot.newOpportunity.classification,
                nextBarrierDistancePct: snapshot.newOpportunity.nextBarrierDistancePct,
                clearanceLabel: snapshot.newOpportunity.clearanceLabel,
                barrierClutterLabel: snapshot.newOpportunity.barrierClutterLabel,
                nearbyBarrierCount: snapshot.newOpportunity.nearbyBarrierCount,
                pathQualityLabel: snapshot.newOpportunity.pathQualityLabel,
                pathBarrierCount: snapshot.newOpportunity.pathBarrierCount,
                tacticalRead: snapshot.newOpportunity.tacticalRead,
                exhaustionLabel: snapshot.newOpportunity.exhaustionLabel,
            }
            : undefined,
        completedEvaluations: snapshot.completedEvaluations.length > 0
            ? snapshot.completedEvaluations
            : undefined,
    };
}
export function summarizeOpportunityDiagnostics(entries) {
    const snapshotCount = entries.filter((entry) => entry.type === "opportunity_snapshot").length;
    const evaluationUpdateCount = entries.filter((entry) => entry.type === "evaluation_update").length;
    const symbols = [...new Set(entries.map((entry) => entry.symbol))].sort();
    const appliedGlobalMultipliers = entries.map((entry) => entry.adaptiveDiagnostics.appliedGlobalMultiplier);
    const disabledEventTypes = [...new Set(entries.flatMap((entry) => Object.entries(entry.adaptiveDiagnostics.eventTypes)
            .filter(([, diagnostics]) => diagnostics.disabled)
            .map(([eventType]) => eventType)))].sort();
    const lastEntry = entries.at(-1);
    return {
        entryCount: entries.length,
        snapshotCount,
        evaluationUpdateCount,
        symbols,
        maxAppliedGlobalMultiplier: appliedGlobalMultipliers.length > 0
            ? round(Math.max(...appliedGlobalMultipliers))
            : 0,
        minAppliedGlobalMultiplier: appliedGlobalMultipliers.length > 0
            ? round(Math.min(...appliedGlobalMultipliers))
            : 0,
        lastExpectancy: lastEntry?.evaluationSummary.expectancy ?? 0,
        lastRollingExpectancy: lastEntry?.evaluationSummary.rollingExpectancy ?? 0,
        disabledEventTypes,
    };
}
export function aggregateOpportunityDiagnosticsRuns(runs) {
    const entries = runs.flatMap((run) => run.entries);
    const symbols = [...new Set(entries.map((entry) => entry.symbol))].sort();
    const eventTypesSeen = [...new Set(entries.flatMap((entry) => Object.keys(entry.adaptiveDiagnostics.eventTypes)))].sort();
    const perSymbol = symbols.map((symbol) => {
        const symbolEntries = entries.filter((entry) => entry.symbol === symbol);
        const eventTypeDiagnostics = symbolEntries.flatMap((entry) => Object.values(entry.adaptiveDiagnostics.eventTypes));
        const eventTypesForSymbol = [...new Set(symbolEntries.flatMap((entry) => Object.keys(entry.adaptiveDiagnostics.eventTypes)))].sort();
        const summary = summarizeOpportunityDiagnostics(symbolEntries);
        return {
            symbol,
            entryCount: symbolEntries.length,
            snapshotCount: summary.snapshotCount,
            evaluationUpdateCount: summary.evaluationUpdateCount,
            eventTypesSeen: eventTypesForSymbol,
            maxTargetAppliedGap: round(Math.max(...symbolEntries.map(targetAppliedGap), 0)),
            maxConfidence: round(Math.max(...eventTypeDiagnostics.map((item) => item.confidence), 0)),
            maxWeakStreak: Math.max(...eventTypeDiagnostics.map((item) => item.weakUpdateStreak), 0),
            disableIntentCount: eventTypeDiagnostics.filter((item) => item.disableIntent).length,
            disabledCount: eventTypeDiagnostics.filter((item) => item.disabled).length,
            driftActivationCount: symbolEntries.filter((entry) => entry.adaptiveDiagnostics.driftDampeningActive).length,
            maxAppliedGlobalMultiplier: summary.maxAppliedGlobalMultiplier,
            minAppliedGlobalMultiplier: summary.minAppliedGlobalMultiplier,
            lastExpectancy: summary.lastExpectancy,
            lastRollingExpectancy: summary.lastRollingExpectancy,
        };
    });
    return {
        runCount: runs.length,
        totalEntries: entries.length,
        symbols,
        eventTypesSeen,
        runsWithDisableIntent: runs
            .filter((run) => run.entries.some((entry) => Object.values(entry.adaptiveDiagnostics.eventTypes).some((item) => item.disableIntent)))
            .map((run) => run.source),
        runsWithDisabledEventTypes: runs
            .filter((run) => run.entries.some((entry) => Object.values(entry.adaptiveDiagnostics.eventTypes).some((item) => item.disabled)))
            .map((run) => run.source),
        runsWithDriftActivation: runs
            .filter((run) => run.entries.some((entry) => entry.adaptiveDiagnostics.driftDampeningActive))
            .map((run) => run.source),
        maxTargetAppliedGap: round(Math.max(...entries.map(targetAppliedGap), 0)),
        maxWeakStreak: Math.max(...entries.flatMap((entry) => Object.values(entry.adaptiveDiagnostics.eventTypes).map((item) => item.weakUpdateStreak)), 0),
        perSymbol,
    };
}
export function analyzeOpportunityDiagnosticsRecovery(entries) {
    const eventTypeState = new Map();
    for (const entry of entries) {
        for (const [eventType, diagnostics] of Object.entries(entry.adaptiveDiagnostics.eventTypes)) {
            const state = eventTypeState.get(eventType) ?? {
                wasDisabled: false,
                recovered: false,
                hadWeakPhase: false,
                weakRecovered: false,
                lowestAppliedMultiplier: diagnostics.appliedMultiplier,
                lastAppliedMultiplier: diagnostics.appliedMultiplier,
                lastWeakStreak: diagnostics.weakUpdateStreak,
            };
            state.lowestAppliedMultiplier = Math.min(state.lowestAppliedMultiplier, diagnostics.appliedMultiplier);
            if (diagnostics.disabled) {
                state.wasDisabled = true;
            }
            else if (state.wasDisabled) {
                state.recovered = true;
            }
            if (diagnostics.disableIntent || diagnostics.weakUpdateStreak > 0) {
                state.hadWeakPhase = true;
            }
            else if (state.hadWeakPhase &&
                state.lastWeakStreak > 0 &&
                diagnostics.weakUpdateStreak === 0 &&
                diagnostics.appliedMultiplier > state.lowestAppliedMultiplier) {
                state.weakRecovered = true;
            }
            state.lastAppliedMultiplier = diagnostics.appliedMultiplier;
            state.lastWeakStreak = diagnostics.weakUpdateStreak;
            eventTypeState.set(eventType, state);
        }
    }
    return {
        disabledEventTypesEver: [...eventTypeState.entries()]
            .filter(([, state]) => state.wasDisabled)
            .map(([eventType]) => eventType)
            .sort(),
        recoveredEventTypes: [...eventTypeState.entries()]
            .filter(([, state]) => state.recovered)
            .map(([eventType]) => eventType)
            .sort(),
        weakRecoveryEventTypes: [...eventTypeState.entries()]
            .filter(([, state]) => state.weakRecovered)
            .map(([eventType]) => eventType)
            .sort(),
    };
}
