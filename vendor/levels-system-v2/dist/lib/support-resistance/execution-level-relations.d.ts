import type { FinalLevelZone, LevelEngineOutput } from "../levels/level-types.js";
import type { SharedReferenceLevels } from "./reference-levels.js";
export type ExecutionLevelSourceTimeframe = FinalLevelZone["timeframeSources"][number];
export type ExecutionLevelReferenceMatch = {
    label: keyof Omit<SharedReferenceLevels, "sessionDate" | "diagnostics">;
    price: number;
    distancePct: number;
};
export type ExecutionLevelRelations = {
    price: number;
    nearestSupportBelow: FinalLevelZone | null;
    nearestResistanceAbove: FinalLevelZone | null;
    nearestResistanceBelow: FinalLevelZone | null;
    nearestSupportAbove: FinalLevelZone | null;
    distanceToSupportPct: number | null;
    distanceToResistancePct: number | null;
    distanceAboveResistanceBelowPct: number | null;
    roomAbovePct: number | null;
    roomBelowPct: number | null;
    isNearSupport: boolean;
    isNearResistance: boolean;
    clearedNearestResistanceBelow: boolean;
    occurredBelowNearestSupport: boolean;
    occurredInOpenAir: boolean;
    stackedResistanceAboveCount: number;
    stackedSupportBelowCount: number;
    nearestReference: ExecutionLevelReferenceMatch | null;
};
export type BuildExecutionLevelRelationsRequest = {
    price: number;
    levels: LevelEngineOutput;
    referenceLevels?: SharedReferenceLevels | null;
    nearLevelPct?: number;
    stackedWindowPct?: number;
    openAirPct?: number;
    sourceTimeframes?: ExecutionLevelSourceTimeframe[];
};
export declare function buildExecutionLevelRelations(request: BuildExecutionLevelRelationsRequest): ExecutionLevelRelations;
//# sourceMappingURL=execution-level-relations.d.ts.map