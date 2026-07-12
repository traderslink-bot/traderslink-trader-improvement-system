import type { EvaluatedOpportunity } from "./opportunity-evaluator.js";
import type { OpportunityRuntimeAdaptiveDiagnostics, OpportunityRuntimeSnapshot } from "./opportunity-runtime-controller.js";
export type OpportunityDiagnosticsEntryType = "opportunity_snapshot" | "evaluation_update";
export type OpportunityDiagnosticsLogEntry = {
    type: OpportunityDiagnosticsEntryType;
    symbol: string;
    timestamp: number;
    evaluationSummary: {
        totalEvaluated: number;
        expectancy: number;
        rollingExpectancy: number;
        driftDeclining: boolean;
    };
    adaptiveDiagnostics: OpportunityRuntimeAdaptiveDiagnostics;
    topOpportunities: Array<{
        symbol: string;
        type: string;
        adaptiveScore: number;
        adaptiveMultiplier: number;
        classification: string;
        nextBarrierDistancePct?: number;
        clearanceLabel?: string;
        barrierClutterLabel?: string;
        nearbyBarrierCount?: number;
        pathQualityLabel?: string;
        pathBarrierCount?: number;
        tacticalRead?: string;
        exhaustionLabel?: string;
    }>;
    opportunity?: {
        symbol: string;
        type: string;
        adaptiveScore: number;
        adaptiveMultiplier: number;
        classification: string;
        nextBarrierDistancePct?: number;
        clearanceLabel?: string;
        barrierClutterLabel?: string;
        nearbyBarrierCount?: number;
        pathQualityLabel?: string;
        pathBarrierCount?: number;
        tacticalRead?: string;
        exhaustionLabel?: string;
    };
    completedEvaluations?: EvaluatedOpportunity[];
};
export type OpportunityDiagnosticsSummary = {
    entryCount: number;
    snapshotCount: number;
    evaluationUpdateCount: number;
    symbols: string[];
    maxAppliedGlobalMultiplier: number;
    minAppliedGlobalMultiplier: number;
    lastExpectancy: number;
    lastRollingExpectancy: number;
    disabledEventTypes: string[];
};
export type OpportunityDiagnosticsRun = {
    source: string;
    entries: OpportunityDiagnosticsLogEntry[];
};
export type OpportunityDiagnosticsAggregateSymbolSummary = {
    symbol: string;
    entryCount: number;
    snapshotCount: number;
    evaluationUpdateCount: number;
    eventTypesSeen: string[];
    maxTargetAppliedGap: number;
    maxConfidence: number;
    maxWeakStreak: number;
    disableIntentCount: number;
    disabledCount: number;
    driftActivationCount: number;
    maxAppliedGlobalMultiplier: number;
    minAppliedGlobalMultiplier: number;
    lastExpectancy: number;
    lastRollingExpectancy: number;
};
export type OpportunityDiagnosticsAggregateReport = {
    runCount: number;
    totalEntries: number;
    symbols: string[];
    eventTypesSeen: string[];
    runsWithDisableIntent: string[];
    runsWithDisabledEventTypes: string[];
    runsWithDriftActivation: string[];
    maxTargetAppliedGap: number;
    maxWeakStreak: number;
    perSymbol: OpportunityDiagnosticsAggregateSymbolSummary[];
};
export type OpportunityDiagnosticsRecoverySummary = {
    disabledEventTypesEver: string[];
    recoveredEventTypes: string[];
    weakRecoveryEventTypes: string[];
};
export declare function buildOpportunityDiagnosticsLogEntry(entryType: OpportunityDiagnosticsEntryType, snapshot: OpportunityRuntimeSnapshot, params: {
    symbol: string;
    timestamp: number;
}): OpportunityDiagnosticsLogEntry;
export declare function summarizeOpportunityDiagnostics(entries: OpportunityDiagnosticsLogEntry[]): OpportunityDiagnosticsSummary;
export declare function aggregateOpportunityDiagnosticsRuns(runs: OpportunityDiagnosticsRun[]): OpportunityDiagnosticsAggregateReport;
export declare function analyzeOpportunityDiagnosticsRecovery(entries: OpportunityDiagnosticsLogEntry[]): OpportunityDiagnosticsRecoverySummary;
//# sourceMappingURL=opportunity-diagnostics.d.ts.map