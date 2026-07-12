import type { FinalLevelZone, LevelLadderExtension } from "./level-types.js";
export declare function buildLevelExtensions(params: {
    supportZones: FinalLevelZone[];
    resistanceZones: FinalLevelZone[];
    surfacedSupport: FinalLevelZone[];
    surfacedResistance: FinalLevelZone[];
    maxExtensionPerSide?: number;
    spacingPct?: number;
    searchWindowPct?: number;
    referencePrice?: number;
    forwardPlanningRangePct?: number;
    preservePracticalResistanceCoverage?: boolean;
    allowSyntheticResistanceExtensions?: boolean;
}): LevelLadderExtension;
//# sourceMappingURL=level-extension-engine.d.ts.map