import type { MonitoringEvent } from "./monitoring-types.js";
export type OpportunityClassification = "high_conviction" | "medium" | "low";
export type RankedOpportunity = {
    symbol: string;
    type: string;
    eventType?: string;
    zoneKind?: "support" | "resistance";
    level: number;
    strength: number;
    confidence: number;
    priority: number;
    bias: string;
    pressureScore: number;
    structureType: string | null;
    structureStrength: number;
    timestamp: number;
    score: number;
    normalizedScore: number;
    classification: OpportunityClassification;
    nextBarrierDistancePct?: number;
    clearanceLabel?: "tight" | "limited" | "open";
    barrierClutterLabel?: "clear" | "stacked" | "dense";
    nearbyBarrierCount?: number;
    pathQualityLabel?: "clean" | "layered" | "choppy";
    pathBarrierCount?: number;
    tacticalRead?: "firm" | "balanced" | "tired";
    exhaustionLabel?: "fresh" | "tested" | "worn" | "spent";
};
export declare class OpportunityEngine {
    private readonly debug;
    constructor(debug?: boolean);
    rank(events: MonitoringEvent[]): RankedOpportunity[];
    selectTop<T extends RankedOpportunity>(opportunities: T[], limit: number): T[];
}
//# sourceMappingURL=opportunity-engine.d.ts.map