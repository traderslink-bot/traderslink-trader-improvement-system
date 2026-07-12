import type { Candle } from "../market-data/candle-types.js";
type VolumePriceUpdate = {
    symbol: string;
    timestamp: number;
    lastPrice: number;
    volume?: number;
};
export type VolumeActivityLabel = "expanding" | "strong" | "normal" | "thin" | "fading" | "unknown";
export type VolumeActivityReliability = "reliable" | "watch" | "unreliable";
export type VolumeActivityDirection = "increasing" | "flat" | "fading" | "unknown";
export type VolumeActivityContext = {
    label: VolumeActivityLabel;
    reliability: VolumeActivityReliability;
    currentBucketVolume: number | null;
    baselineAverageVolume: number | null;
    relativeVolumeRatio: number | null;
    direction: VolumeActivityDirection;
    reason: string;
    traderLine?: string;
};
export type VolumeActivityBaseline = {
    averageVolume: number;
    sampleSize: number;
};
export type VolumeActivityTrackerOptions = {
    bucketMs?: number;
    minBaselineBars?: number;
    repeatedVolumeLimit?: number;
    strongRatio?: number;
    expandingRatio?: number;
    thinRatio?: number;
    fadingBucketRatio?: number;
};
export declare function unknownVolumeActivityContext(reason: string): VolumeActivityContext;
export declare function buildVolumeBaselineFromCandles(candles: Candle[], minBaselineBars?: number, maxBars?: number): VolumeActivityBaseline | null;
export declare class VolumeActivityTracker {
    private readonly options;
    private readonly states;
    constructor(options?: VolumeActivityTrackerOptions);
    reset(symbol: string): void;
    setBaseline(symbol: string, baseline: VolumeActivityBaseline | null | undefined): void;
    getContext(symbol: string): VolumeActivityContext | undefined;
    update(update: VolumePriceUpdate): VolumeActivityContext;
    private deriveLiveBaseline;
    private ensureState;
}
export {};
//# sourceMappingURL=volume-activity.d.ts.map