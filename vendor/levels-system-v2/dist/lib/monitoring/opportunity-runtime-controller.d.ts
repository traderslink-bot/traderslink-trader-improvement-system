import { AdaptiveScoringEngine, type AdaptedOpportunity } from "./adaptive-scoring.js";
import type { AdaptiveStatePersistence } from "./adaptive-state-persistence.js";
import type { LivePriceUpdate, MonitoringEvent } from "./monitoring-types.js";
import { OpportunityEngine, type RankedOpportunity } from "./opportunity-engine.js";
import { OpportunityEvaluator, type EvaluatedOpportunity, type OpportunityProgressUpdate, type OpportunityEvaluationSummary } from "./opportunity-evaluator.js";
import { type OpportunityInterpretation } from "./opportunity-interpretation.js";
export type OpportunityRuntimeSnapshot = {
    ranked: RankedOpportunity[];
    adapted: AdaptedOpportunity[];
    top: AdaptedOpportunity[];
    interpretations: OpportunityInterpretation[];
    summary: OpportunityEvaluationSummary;
    adaptiveDiagnostics: OpportunityRuntimeAdaptiveDiagnostics;
    newOpportunity?: AdaptedOpportunity;
    completedEvaluations: EvaluatedOpportunity[];
    progressUpdates: OpportunityProgressUpdate[];
};
export type OpportunityRuntimeAdaptiveDiagnostics = {
    targetGlobalMultiplier: number;
    appliedGlobalMultiplier: number;
    globalConfidence: number;
    globalDeltaApplied: number;
    driftDampeningActive: boolean;
    eventTypes: Record<string, {
        targetMultiplier: number;
        appliedMultiplier: number;
        sampleSize: number;
        confidence: number;
        disableIntent: boolean;
        disabled: boolean;
        disableReason: string | null;
        weakUpdateStreak: number;
        deltaApplied: number;
        disableProtected: boolean;
    }>;
};
export type OpportunityRuntimeControllerOptions = {
    topLimit?: number;
    eventMemoryWindowMs?: number;
    opportunityEngine?: OpportunityEngine;
    adaptiveScoringEngine?: AdaptiveScoringEngine;
    evaluator?: OpportunityEvaluator;
    adaptiveStatePersistence?: AdaptiveStatePersistence;
};
export declare class OpportunityRuntimeController {
    private readonly recentEvents;
    private readonly trackedOpportunityKeys;
    private readonly topLimit;
    private readonly eventMemoryWindowMs;
    private readonly opportunityEngine;
    private readonly adaptiveScoringEngine;
    private readonly evaluator;
    private readonly adaptiveStatePersistence?;
    private readonly interpretationLayer;
    constructor(options?: OpportunityRuntimeControllerOptions);
    private pruneEvents;
    private buildAdaptiveDiagnostics;
    private buildSnapshot;
    private emitInterpretations;
    processMonitoringEvent(event: MonitoringEvent): OpportunityRuntimeSnapshot;
    processPriceUpdate(update: LivePriceUpdate): OpportunityRuntimeSnapshot | null;
    getSummary(): OpportunityEvaluationSummary;
}
//# sourceMappingURL=opportunity-runtime-controller.d.ts.map