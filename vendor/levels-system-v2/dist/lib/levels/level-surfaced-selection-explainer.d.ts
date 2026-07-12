import type { LevelType, RankedLevel } from "./level-types.js";
export type SurfacedSelectionExplanationInput = {
    level: RankedLevel;
    side: LevelType;
    distanceToPricePct: number;
    proximityBand: "immediate" | "near" | "local" | "extended" | "distant";
    selectionCategory: "actionable" | "anchor";
    redundantNearby: boolean;
};
export type SurfacedSuppressionExplanationInput = {
    level: RankedLevel;
    side: LevelType;
    reason: "below_minimum_structural_quality" | "below_minimum_confidence" | "wrong_side_of_price" | "broken_state" | "nearby_stronger_level" | "outside_actionable_range" | "anchor_not_needed";
    suppressedByLevel?: RankedLevel;
};
export declare function explainSurfacedSelection(input: SurfacedSelectionExplanationInput): string;
export declare function explainSuppressedSurfacedLevel(input: SurfacedSuppressionExplanationInput): string;
//# sourceMappingURL=level-surfaced-selection-explainer.d.ts.map