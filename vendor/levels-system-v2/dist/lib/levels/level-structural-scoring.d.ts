import type { LevelScoreConfig } from "./level-score-config.js";
import type { LevelDurabilityLabel, LevelScoreBreakdown, RankedLevel, LevelCandidate } from "./level-types.js";
type StructurallyScorableLevel = Pick<RankedLevel, "sourceTimeframes" | "meaningfulTouchCount" | "touchCount" | "touches" | "averageReactionMovePct" | "strongestReactionMovePct" | "averageVolumeRatio" | "bestVolumeRatio" | "cleanlinessStdDevPct" | "roleFlipCount" | "failedBreakCount" | "cleanBreakCount" | "reclaimCount" | "rejectionCount" | "barsSinceLastReaction" | "price"> & Partial<Pick<LevelCandidate, "clusterPenalty">>;
export declare function computeStructuralStrengthScore(level: StructurallyScorableLevel, config?: LevelScoreConfig): {
    structuralStrengthScore: number;
    scoreBreakdown: LevelScoreBreakdown;
    durabilityLabel: LevelDurabilityLabel;
};
export {};
//# sourceMappingURL=level-structural-scoring.d.ts.map