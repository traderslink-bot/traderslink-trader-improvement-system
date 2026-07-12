export declare const LEVEL_SURFACED_SELECTION_CONFIG: {
    readonly minimumStructuralScore: 32;
    readonly minimumConfidence: 45;
    readonly maximumSurfacedSupportCount: 3;
    readonly maximumSurfacedResistanceCount: 3;
    readonly includeOneDeeperAnchor: true;
    readonly deeperAnchorMinStructuralScore: 52;
    readonly deeperAnchorMinDistancePct: 0.018;
    readonly strongerFarLevelStructuralBuffer: 12;
    readonly staleContext: {
        readonly barsSinceLastReaction: 30;
        readonly freshReactionScore: 8;
        readonly actionablePenalty: 18;
        readonly strongConfirmationStructuralScore: 72;
        readonly strongConfirmationConfidence: 70;
        readonly maxStrongConfirmationDistancePct: 0.03;
    };
    readonly sideRules: {
        readonly support: {
            readonly maxActionableDistancePct: 0.12;
            readonly practicalInteractionBandPct: 0.025;
            readonly preferredDistanceBandsPct: {
                readonly immediate: 0.005;
                readonly near: 0.015;
                readonly local: 0.03;
                readonly extended: 0.06;
            };
        };
        readonly resistance: {
            readonly maxActionableDistancePct: 0.12;
            readonly practicalInteractionBandPct: 0.025;
            readonly preferredDistanceBandsPct: {
                readonly immediate: 0.005;
                readonly near: 0.015;
                readonly local: 0.03;
                readonly extended: 0.06;
            };
        };
    };
    readonly weights: {
        readonly structuralQuality: 0.42;
        readonly proximity: 0.33;
        readonly actionableState: 0.15;
        readonly ladderUsefulness: 0.1;
    };
    readonly stateAdjustments: {
        readonly fresh: 8;
        readonly respected: 10;
        readonly heavily_tested: -2;
        readonly weakened: -14;
        readonly broken: -40;
        readonly reclaimed: 9;
        readonly flipped: 7;
    };
    readonly nearPriceSelection: {
        readonly minimumStructuralScore: 52;
        readonly minimumConfidence: 60;
        readonly weakenedStructuralOverride: 72;
        readonly weakenedConfidenceOverride: 70;
        readonly practicalInteractionBonus: 12;
        readonly firstActionablePriorityBonus: 14;
        readonly weakNearClutterPenalty: 22;
    };
    readonly confidenceBonusScale: 0.08;
    readonly sameBandSuppressionDistancePct: 0.011;
    readonly bandOwnershipDistancePct: 0.019;
    readonly strongerNearbyOverrideStructuralBuffer: 16;
    readonly ladderSpacingRules: {
        readonly minSpacingPct: 0.012;
        readonly preferredSpacingPct: 0.022;
    };
    readonly ladderUsefulness: {
        readonly firstLevelBonus: 12;
        readonly spacingBonus: 8;
        readonly nearPriceActionableBonus: 10;
        readonly currentInteractionBonus: 6;
        readonly freshReactionBonus: 5;
        readonly anchorContextBonus: 9;
    };
    readonly tieBreakPriority: readonly ["selectionScore", "distanceToPrice", "structuralStrength", "confidence", "rank"];
};
export type LevelSurfacedSelectionConfig = typeof LEVEL_SURFACED_SELECTION_CONFIG;
//# sourceMappingURL=level-surfaced-selection-config.d.ts.map