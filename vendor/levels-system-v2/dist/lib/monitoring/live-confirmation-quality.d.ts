export type LiveConfirmationQualityInput = {
    currentPrice: number;
    latestRangePct: number;
    priorRangePct: number;
    closeExtensionPct: number;
    latestTimestamp: number;
};
export type LiveConfirmationQualityResult = {
    passed: boolean;
    rejectReasons: string[];
};
export declare const LIVE_VOLUME_EXPANSION_CONFIRMATION_QUALITY: {
    readonly minCurrentPrice: 0.05;
    readonly minPriorRangePct: 3;
    readonly maxPriorRangePct: 30;
    readonly minLatestRangePct: 4;
    readonly maxLatestRangePct: 15;
    readonly maxCloseExtensionPct: 8;
    readonly lateSessionCutoffMinutesEt: number;
};
export declare function evaluateLiveVolumeExpansionConfirmationQuality(input: LiveConfirmationQualityInput): LiveConfirmationQualityResult;
export declare function describeLiveVolumeExpansionConfirmationQuality(): string;
//# sourceMappingURL=live-confirmation-quality.d.ts.map