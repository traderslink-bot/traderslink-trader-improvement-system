import type { Candle, CandleProviderName } from "../market-data/candle-types.js";
import { type VolumeActivityLabel } from "../monitoring/volume-activity.js";
import type { DurableCandleWarehouse } from "./durable-candle-warehouse.js";
export type WarehouseVolumeSessionBucket = "premarket" | "open" | "midday" | "afternoon" | "after_hours" | "extended" | "unknown";
export type WarehouseVolumeReliability = "reliable" | "watch" | "unreliable";
export type WarehouseVolumeActivityContext = {
    symbol: string;
    provider: CandleProviderName | "provided";
    timeframe: "5m";
    candleCount: number;
    sessionBucket: WarehouseVolumeSessionBucket;
    reliability: WarehouseVolumeReliability;
    label: VolumeActivityLabel;
    baselineAverageVolume: number | null;
    currentVolume: number | null;
    relativeVolumeRatio: number | null;
    averageDollarVolume: number | null;
    currentDollarVolume: number | null;
    liquidityLabel: "liquid" | "tradeable" | "thin" | "unknown";
    atLevel: {
        side: "support" | "resistance" | "none";
        price: number | null;
        distancePct: number | null;
        evidence: string | null;
    };
    diagnostics: Array<{
        code: "missing_5m_candles" | "insufficient_baseline" | "zero_or_missing_volume" | "thin_dollar_volume" | "volume_context_operator_only";
        severity: "info" | "warning";
        message: string;
    }>;
};
export type BuildWarehouseVolumeActivityContextRequest = {
    warehouse: DurableCandleWarehouse;
    provider: CandleProviderName;
    symbol: string;
    sessionDate?: string;
    asOfTimestamp?: number;
    lookbackBars?: number;
    currentPrice?: number;
    supportLevels?: number[];
    resistanceLevels?: number[];
};
export type BuildVolumeActivityContextFromCandlesRequest = {
    symbol: string;
    candles: Candle[];
    provider?: CandleProviderName | "provided";
    asOfTimestamp?: number;
    currentPrice?: number;
    supportLevels?: number[];
    resistanceLevels?: number[];
};
export declare function buildVolumeActivityContextFromWarehouseCandles(request: BuildVolumeActivityContextFromCandlesRequest): WarehouseVolumeActivityContext;
export declare function buildWarehouseVolumeActivityContext(request: BuildWarehouseVolumeActivityContextRequest): Promise<WarehouseVolumeActivityContext>;
//# sourceMappingURL=warehouse-volume-context.d.ts.map