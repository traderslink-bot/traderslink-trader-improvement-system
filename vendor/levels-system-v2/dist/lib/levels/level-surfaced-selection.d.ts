import type { LevelSurfacedSelectionConfig } from "./level-surfaced-selection-config.js";
import type { LevelType, RankedLevel, RankedLevelsOutput } from "./level-types.js";
export type SurfaceSelectionContext = {
    symbol: string;
    currentPrice: number;
};
export type SurfacedSelectionScoreBreakdown = {
    structuralQualityComponent: number;
    proximityComponent: number;
    actionableStateComponent: number;
    ladderUsefulnessComponent: number;
    anchorAdjustment: number;
    redundancyPenalty: number;
    surfacedSelectionScore: number;
    distanceToPricePct: number;
    proximityBand: "immediate" | "near" | "local" | "extended" | "distant";
};
export type SurfacedLevelSelection = RankedLevel & {
    selectionCategory: "actionable" | "anchor";
    surfacedSelectionScore: number;
    surfacedSelectionBreakdown: SurfacedSelectionScoreBreakdown;
    surfacedSelectionExplanation: string;
    surfacedSelectionNotes: string[];
};
export type SuppressedSurfacedLevel = {
    side: LevelType;
    level: RankedLevel;
    suppressedByLevelId?: string;
    reason: "below_minimum_structural_quality" | "below_minimum_confidence" | "wrong_side_of_price" | "broken_state" | "nearby_stronger_level" | "outside_actionable_range" | "anchor_not_needed";
    explanation: string;
};
export type SurfacedSelectionResult = {
    symbol: string;
    currentPrice: number;
    surfacedSupports: SurfacedLevelSelection[];
    surfacedResistances: SurfacedLevelSelection[];
    topActionableSupport?: SurfacedLevelSelection;
    topActionableResistance?: SurfacedLevelSelection;
    deeperSupportAnchor?: SurfacedLevelSelection;
    deeperResistanceAnchor?: SurfacedLevelSelection;
    suppressedNearbyLevels: SuppressedSurfacedLevel[];
    surfacedSelectionNotes: string[];
    computedAt: number;
};
type SideSelectionResult = {
    surfaced: SurfacedLevelSelection[];
    anchor?: SurfacedLevelSelection;
    suppressed: SuppressedSurfacedLevel[];
    notes: string[];
};
export declare function selectSurfacedSupports(output: RankedLevelsOutput, config?: LevelSurfacedSelectionConfig): SideSelectionResult;
export declare function selectSurfacedResistances(output: RankedLevelsOutput, config?: LevelSurfacedSelectionConfig): SideSelectionResult;
export declare function selectSurfacedLevels(output: RankedLevelsOutput, config?: LevelSurfacedSelectionConfig): SurfacedSelectionResult;
export {};
//# sourceMappingURL=level-surfaced-selection.d.ts.map