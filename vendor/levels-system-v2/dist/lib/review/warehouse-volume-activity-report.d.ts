import type { CandleProviderName } from "../market-data/candle-types.js";
import { type WarehouseVolumeActivityContext, type WarehouseVolumeReliability } from "../support-resistance/index.js";
import type { VolumeActivityLabel } from "../monitoring/volume-activity.js";
export type WarehouseVolumeInteractionKind = "expanding_into_resistance" | "activity_pickup_on_reclaim" | "fading_while_retesting" | "thin_activity_chop" | "normal_or_unhelpful" | "stale_or_unreliable";
export type WarehouseVolumeActivityReplaySample = {
    symbol: string;
    timestamp: number;
    timestampIso: string;
    title?: string;
    eventType?: string;
    operation?: string;
    label: VolumeActivityLabel;
    reliability: WarehouseVolumeReliability;
    relativeVolumeRatio: number | null;
    currentVolume: number | null;
    baselineAverageVolume: number | null;
    liquidityLabel: WarehouseVolumeActivityContext["liquidityLabel"];
    sessionBucket: WarehouseVolumeActivityContext["sessionBucket"];
    atLevel: WarehouseVolumeActivityContext["atLevel"];
    interactionKind: WarehouseVolumeInteractionKind;
    recommendation: "may_help_existing_alert" | "keep_operator_only";
    reason: string;
    latestCandleTimestamp: number | null;
    latestCandleIso: string | null;
    candleLagMinutes: number | null;
};
export type WarehouseVolumeActivitySymbolReport = {
    symbol: string;
    alertRows: number;
    matchedRows: number;
    unmatchedRows: number;
    reliabilityCounts: Record<WarehouseVolumeReliability, number>;
    labelCounts: Record<VolumeActivityLabel, number>;
    interactionCounts: Record<WarehouseVolumeInteractionKind, number>;
    averageRelativeVolumeRatio: number | null;
    wouldHelpCount: number;
    shouldStayHiddenCount: number;
    operatorOnlyReasons: string[];
    samples: WarehouseVolumeActivityReplaySample[];
};
export type WarehouseVolumeActivityReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    cacheDirectoryPath: string;
    provider: CandleProviderName;
    maxTimestampDriftMinutes: number;
    totals: {
        alertRows: number;
        matchedRows: number;
        unmatchedRows: number;
        symbolsWithMatches: number;
        wouldHelpCount: number;
        shouldStayHiddenCount: number;
        reliabilityCounts: Record<WarehouseVolumeReliability, number>;
        labelCounts: Record<VolumeActivityLabel, number>;
        interactionCounts: Record<WarehouseVolumeInteractionKind, number>;
    };
    symbols: WarehouseVolumeActivitySymbolReport[];
    examples: {
        mayHelpExistingAlert: WarehouseVolumeActivityReplaySample[];
        keepOperatorOnly: WarehouseVolumeActivityReplaySample[];
    };
};
export type GenerateWarehouseVolumeActivityReportOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    provider?: CandleProviderName;
    maxTimestampDriftMinutes?: number;
};
export type WriteWarehouseVolumeActivityReportOptions = GenerateWarehouseVolumeActivityReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function generateWarehouseVolumeActivityReport(options: GenerateWarehouseVolumeActivityReportOptions): WarehouseVolumeActivityReport;
export declare function formatWarehouseVolumeActivityReport(report: WarehouseVolumeActivityReport): string;
export declare function writeWarehouseVolumeActivityReport(options: WriteWarehouseVolumeActivityReportOptions): WarehouseVolumeActivityReport;
//# sourceMappingURL=warehouse-volume-activity-report.d.ts.map