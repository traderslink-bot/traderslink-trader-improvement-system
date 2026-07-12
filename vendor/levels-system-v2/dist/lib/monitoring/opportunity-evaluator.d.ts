import type { RankedOpportunity } from "./opportunity-engine.js";
export type OpportunityFollowThroughLabel = "strong" | "working" | "stalled" | "failed" | "unknown";
export type OpportunityProgressLabel = "improving" | "stalling" | "degrading";
export type OpportunityProgressUpdate = {
    symbol: string;
    eventType: string;
    timestamp: number;
    entryPrice: number;
    currentPrice: number;
    directionalReturnPct: number | null;
    progressLabel: OpportunityProgressLabel;
};
export type EvaluatedOpportunity = {
    symbol: string;
    timestamp: number;
    evaluatedAt: number;
    entryPrice: number;
    outcomePrice: number;
    returnPct: number;
    directionalReturnPct: number | null;
    followThroughLabel: OpportunityFollowThroughLabel;
    success: boolean;
    eventType: string;
};
export type EventTypeExpectancySummary = {
    totalEvaluated: number;
    wins: number;
    losses: number;
    winRate: number;
    lossRate: number;
    averageWinPct: number;
    averageLossPct: number;
    expectancy: number;
};
export type RollingExpectancySummary = {
    windowSize: number;
    sampleSize: number;
    expectancy: number;
};
export type PerformanceDriftSummary = {
    declining: boolean;
    currentExpectancy: number;
    previousExpectancy: number;
    delta: number;
};
export type OpportunityEvaluationSummary = {
    totalEvaluated: number;
    wins: number;
    losses: number;
    winRate: number;
    lossRate: number;
    expectancy: number;
    averageReturnPct: number;
    averageWinPct: number;
    averageLossPct: number;
    maxDrawdownPct: number;
    signalAccuracy: number;
    expectancyByEventType: Record<string, EventTypeExpectancySummary>;
    rollingExpectancy: RollingExpectancySummary;
    performanceDrift: PerformanceDriftSummary;
};
export declare class OpportunityEvaluator {
    private readonly evaluationWindowMs;
    private readonly debug;
    private readonly summaryInterval;
    private readonly successThresholdPct;
    private readonly earlyExitThresholdPct;
    private readonly rollingWindowSize;
    private readonly pending;
    private readonly evaluated;
    private readonly drawdowns;
    constructor(evaluationWindowMs?: number, debug?: boolean, summaryInterval?: number, successThresholdPct?: number, earlyExitThresholdPct?: number, rollingWindowSize?: number);
    track(opportunity: RankedOpportunity, entryPrice: number): void;
    updatePrice(symbol: string, price: number, timestamp: number): {
        completed: EvaluatedOpportunity[];
        progressUpdates: OpportunityProgressUpdate[];
    };
    getPendingCount(): number;
    getEvaluated(): EvaluatedOpportunity[];
    getSummary(): OpportunityEvaluationSummary;
    logSummary(): void;
}
//# sourceMappingURL=opportunity-evaluator.d.ts.map