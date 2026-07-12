import type { AdaptedOpportunity } from "./adaptive-scoring.js";
export type InterpretationType = "pre_zone" | "in_zone" | "confirmation" | "weakening" | "breakout_context" | "neutral";
export type OpportunityInterpretationContext = {
    opportunity: AdaptedOpportunity;
    levels: {
        referenceLevel: number;
        zoneLabel: "support" | "resistance" | "level";
    };
    structure: {
        type: string | null;
        strength: number;
    };
    adaptiveState: {
        adaptiveMultiplier: number;
        weakStreak: number;
    };
};
export type OpportunityInterpretation = {
    symbol: string;
    message: string;
    type: InterpretationType;
    eventType: string;
    level?: number;
    zoneKind?: "support" | "resistance";
    confidence: number;
    tags: string[];
    timestamp: number;
};
type InterpretationProgressState = {
    stageRank: number;
};
export declare const APPROVED_INTERPRETATION_MESSAGE_TEMPLATES: Record<InterpretationType, string>;
export declare function formatInterpretationLevel(value: number): string;
export declare function interpretOpportunity(context: OpportunityInterpretationContext, previous?: InterpretationProgressState): OpportunityInterpretation;
export declare function formatInterpretationForConsole(interpretation: OpportunityInterpretation): string;
export declare class OpportunityInterpretationLayer {
    private readonly progressByOpportunity;
    private readonly lastBySignature;
    private readonly lastBySymbolType;
    private buildOpportunityKey;
    private buildContext;
    private shouldEmit;
    interpret(opportunity: AdaptedOpportunity, weakStreak: number): OpportunityInterpretation | null;
    formatForConsole(interpretation: OpportunityInterpretation): string;
}
export {};
//# sourceMappingURL=opportunity-interpretation.d.ts.map