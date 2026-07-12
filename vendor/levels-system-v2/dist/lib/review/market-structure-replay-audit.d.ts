import { type CandleMarketStructureState } from "../structure/index.js";
export type MarketStructureReplayFinding = {
    severity: "review" | "watch" | "info";
    symbol: string;
    sourcePath: string;
    reason: string;
    detail: string;
};
export type MarketStructureReplayCase = {
    caseId: string;
    symbol: string;
    sourcePath: string;
    candleCount: number;
    startTimestamp: number;
    endTimestamp: number;
    latestClose: number;
    priceRangePct: number;
    state: CandleMarketStructureState;
    confidenceLabel: "low" | "medium" | "high";
    confidenceScore: number;
    confidenceReasons: string[];
    range: {
        active: boolean;
        low: number;
        high: number;
        widthPct: number;
        quality: "clean" | "loose" | "choppy";
        touchCountHigh: number;
        touchCountLow: number;
    } | null;
    trend: {
        direction: string;
        higherLowCount: number;
        lowerHighCount: number;
        higherHighCount: number;
        lowerLowCount: number;
    };
    pivotEvent: {
        type: string;
        triggerPrice: number | null;
        confirmation: string;
    } | null;
    pivotCounts: {
        swingHighs: number;
        swingLows: number;
    };
    traderLine: string | null;
    diagnosticCodes: string[];
    rolling: {
        evaluatedWindows: number;
        stateCounts: Partial<Record<CandleMarketStructureState, number>>;
        transitionCount: number;
        immaterialTransitionCount: number;
        immaterialTransitionRatio: number;
        rangeBoundRatio: number;
        lowConfidenceRatio: number;
        lastStates: CandleMarketStructureState[];
    };
    stable: {
        state: CandleMarketStructureState | null;
        materialityScore: number | null;
        rawTransitionCount: number;
        stableTransitionCount: number;
        suppressedTransitionCount: number;
        transitionReductionPct: number;
        latestReason: string | null;
        latestAccepted: boolean | null;
        lastStates: CandleMarketStructureState[];
    };
    findings: MarketStructureReplayFinding[];
};
export type MarketStructureReplayAuditReport = {
    generatedAt: string;
    cacheDirectory: string;
    symbolsRequested: string[] | null;
    symbolsDiscovered: number;
    symbolsScanned: number;
    filesScanned: number;
    skipped: Array<{
        symbol?: string;
        path?: string;
        reason: string;
    }>;
    summary: {
        stateCounts: Partial<Record<CandleMarketStructureState, number>>;
        confidenceCounts: Record<"low" | "medium" | "high", number>;
        findingCounts: Record<"review" | "watch" | "info", number>;
        rangeBoundCases: number;
        highTransitionCases: number;
        highStableTransitionCases: number;
        averageTransitionReductionPct: number;
        insufficientCases: number;
    };
    cases: MarketStructureReplayCase[];
    findings: MarketStructureReplayFinding[];
};
export type MarketStructureReplayAuditOptions = {
    cacheDirectory?: string;
    symbols?: string[];
    maxFilesPerSymbol?: number;
    minCandles?: number;
    rollingStepBars?: number;
};
export declare function buildMarketStructureReplayAuditReport(options?: MarketStructureReplayAuditOptions): MarketStructureReplayAuditReport;
export declare function formatMarketStructureReplayAuditMarkdown(report: MarketStructureReplayAuditReport): string;
//# sourceMappingURL=market-structure-replay-audit.d.ts.map