import { type FormalBosChochGateExplanation, type FormalBosChochGateReason } from "../monitoring/market-structure-story-memory.js";
import type { FormalMarketStructureRuntimeContext, RuntimeMarketStructureTimeframeSnapshot } from "../monitoring/monitoring-types.js";
import type { FormalStructureTimeframe } from "../structure/index.js";
export type FormalMarketStructureGateDecision = "actionable" | "metadata_only";
export type FormalMarketStructureGateEvent = {
    timestamp: number;
    isoTimestamp: string;
    symbol: string;
    title: string | null;
    operation: string | null;
    messageKind: string | null;
    timeframe: FormalStructureTimeframe;
    eventType: FormalMarketStructureRuntimeContext["eventType"];
    confidence: FormalMarketStructureRuntimeContext["confidence"];
    confirmation: FormalMarketStructureRuntimeContext["confirmation"];
    materialChange: boolean;
    stableState: RuntimeMarketStructureTimeframeSnapshot["stable"] extends infer Stable ? Stable extends {
        state: infer State;
    } ? State : string | null : string | null;
    stableConfidence: RuntimeMarketStructureTimeframeSnapshot["stable"] extends infer Stable ? Stable extends {
        confidence: infer Confidence;
    } ? Confidence : string | null : string | null;
    stableMaterialChange: boolean;
    storyKey: string;
    oldVisible: boolean;
    decision: FormalMarketStructureGateDecision;
    gateReason: FormalBosChochGateReason;
    gateSummary: string;
    gateChecks: FormalBosChochGateExplanation["checks"];
};
export type FormalMarketStructureGateSymbolSummary = {
    symbol: string;
    events: number;
    actionable: number;
    metadataOnly: number;
    oldVisible: number;
    newlyQuieted: number;
};
export type FormalMarketStructureGateAuditReport = {
    generatedAt: string;
    sourceAuditPath: string;
    totals: {
        rowsScanned: number;
        formalBosChochEvents: number;
        actionable: number;
        metadataOnly: number;
        oldVisible: number;
        newlyQuieted: number;
        symbols: number;
    };
    symbols: FormalMarketStructureGateSymbolSummary[];
    events: FormalMarketStructureGateEvent[];
};
export type WriteFormalMarketStructureGateAuditOptions = {
    report: FormalMarketStructureGateAuditReport;
    jsonPath: string;
    markdownPath: string;
};
export declare function buildFormalMarketStructureGateAuditReport(auditPath: string): FormalMarketStructureGateAuditReport;
export declare function formatFormalMarketStructureGateAuditMarkdown(report: FormalMarketStructureGateAuditReport): string;
export declare function writeFormalMarketStructureGateAuditReport(options: WriteFormalMarketStructureGateAuditOptions): void;
//# sourceMappingURL=formal-market-structure-gate-audit.d.ts.map