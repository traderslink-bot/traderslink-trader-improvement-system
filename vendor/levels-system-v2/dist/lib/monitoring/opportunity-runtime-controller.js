import { AdaptiveScoringEngine, } from "./adaptive-scoring.js";
import { OpportunityEngine } from "./opportunity-engine.js";
import { OpportunityEvaluator, } from "./opportunity-evaluator.js";
import { OpportunityInterpretationLayer, } from "./opportunity-interpretation.js";
const DEFAULT_TOP_LIMIT = 5;
const DEFAULT_EVENT_MEMORY_WINDOW_MS = 30 * 60 * 1000;
function buildOpportunityKey(input) {
    return `${input.symbol}|${input.type}|${input.timestamp}|${input.level}`;
}
export class OpportunityRuntimeController {
    recentEvents = [];
    trackedOpportunityKeys = new Set();
    topLimit;
    eventMemoryWindowMs;
    opportunityEngine;
    adaptiveScoringEngine;
    evaluator;
    adaptiveStatePersistence;
    interpretationLayer = new OpportunityInterpretationLayer();
    constructor(options = {}) {
        this.topLimit = options.topLimit ?? DEFAULT_TOP_LIMIT;
        this.eventMemoryWindowMs = options.eventMemoryWindowMs ?? DEFAULT_EVENT_MEMORY_WINDOW_MS;
        this.opportunityEngine = options.opportunityEngine ?? new OpportunityEngine();
        this.adaptiveScoringEngine = options.adaptiveScoringEngine ?? new AdaptiveScoringEngine();
        this.evaluator = options.evaluator ?? new OpportunityEvaluator();
        this.adaptiveStatePersistence = options.adaptiveStatePersistence;
    }
    pruneEvents(referenceTimestamp) {
        const minTimestamp = referenceTimestamp - this.eventMemoryWindowMs;
        for (let index = this.recentEvents.length - 1; index >= 0; index -= 1) {
            if (this.recentEvents[index].timestamp < minTimestamp) {
                this.recentEvents.splice(index, 1);
            }
        }
    }
    buildAdaptiveDiagnostics(diagnostics) {
        return {
            targetGlobalMultiplier: diagnostics.targetState.targetGlobalMultiplier,
            appliedGlobalMultiplier: diagnostics.stability.appliedGlobalMultiplier,
            globalConfidence: diagnostics.stability.diagnostics.globalConfidence,
            globalDeltaApplied: diagnostics.stability.diagnostics.globalDeltaApplied,
            driftDampeningActive: diagnostics.stability.diagnostics.driftDampeningActive,
            eventTypes: Object.fromEntries(Object.entries(diagnostics.targetState.eventTypeTargets).map(([eventType, target]) => {
                const appliedState = diagnostics.stability.state.eventTypes[eventType];
                const eventDiagnostics = diagnostics.stability.diagnostics.eventTypeDiagnostics[eventType];
                return [
                    eventType,
                    {
                        targetMultiplier: target.targetMultiplier,
                        appliedMultiplier: diagnostics.stability.appliedEventTypeMultipliers[eventType] ?? 1,
                        sampleSize: target.sampleSize,
                        confidence: eventDiagnostics?.confidence ?? appliedState?.lastConfidence ?? 0,
                        disableIntent: target.disableIntent,
                        disabled: diagnostics.stability.disabledEventTypes[eventType]?.disabled ?? false,
                        disableReason: diagnostics.stability.disabledEventTypes[eventType]?.disableReason ?? null,
                        weakUpdateStreak: appliedState?.weakUpdateStreak ?? 0,
                        deltaApplied: eventDiagnostics?.deltaApplied ?? 0,
                        disableProtected: eventDiagnostics?.disableProtected ?? false,
                    },
                ];
            })),
        };
    }
    buildSnapshot(completedEvaluations = []) {
        const ranked = this.opportunityEngine.rank(this.recentEvents);
        const summary = this.evaluator.getSummary();
        const adaptiveResult = this.adaptiveScoringEngine.adaptWithDiagnostics(ranked, summary);
        const top = this.opportunityEngine.selectTop(adaptiveResult.opportunities, this.topLimit);
        return {
            ranked,
            adapted: adaptiveResult.opportunities,
            top,
            interpretations: [],
            summary,
            adaptiveDiagnostics: this.buildAdaptiveDiagnostics(adaptiveResult.diagnostics),
            completedEvaluations,
            progressUpdates: [],
        };
    }
    emitInterpretations(snapshot) {
        const interpretations = [];
        for (const opportunity of snapshot.top) {
            const eventType = opportunity.eventType ?? opportunity.type;
            const weakStreak = snapshot.adaptiveDiagnostics.eventTypes[eventType]?.weakUpdateStreak ?? 0;
            const interpretation = this.interpretationLayer.interpret(opportunity, weakStreak);
            if (!interpretation) {
                continue;
            }
            interpretations.push(interpretation);
        }
        return interpretations;
    }
    processMonitoringEvent(event) {
        this.recentEvents.push(event);
        this.pruneEvents(event.timestamp);
        const snapshot = this.buildSnapshot();
        const opportunityKey = buildOpportunityKey({
            symbol: event.symbol,
            type: event.type,
            timestamp: event.timestamp,
            level: event.level,
        });
        const newOpportunity = snapshot.adapted.find((opportunity) => buildOpportunityKey(opportunity) === opportunityKey);
        if (newOpportunity && !this.trackedOpportunityKeys.has(opportunityKey)) {
            this.evaluator.track(newOpportunity, event.triggerPrice);
            this.trackedOpportunityKeys.add(opportunityKey);
        }
        const interpretations = this.emitInterpretations(snapshot);
        return {
            ...snapshot,
            interpretations,
            summary: this.evaluator.getSummary(),
            newOpportunity,
        };
    }
    processPriceUpdate(update) {
        const evaluationUpdate = this.evaluator.updatePrice(update.symbol, update.lastPrice, update.timestamp);
        if (evaluationUpdate.completed.length === 0 &&
            evaluationUpdate.progressUpdates.length === 0) {
            return null;
        }
        this.pruneEvents(update.timestamp);
        const snapshot = this.buildSnapshot(evaluationUpdate.completed);
        const interpretations = this.emitInterpretations(snapshot);
        this.adaptiveStatePersistence?.save(this.adaptiveScoringEngine.getState());
        return {
            ...snapshot,
            interpretations,
            progressUpdates: evaluationUpdate.progressUpdates,
        };
    }
    getSummary() {
        return this.evaluator.getSummary();
    }
}
