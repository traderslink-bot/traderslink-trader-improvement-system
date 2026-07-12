import type { MonitoringEventType } from "../monitoring/monitoring-types.js";
import type { ZoneTacticalBias } from "../levels/zone-tactical-read.js";
import type { TraderPressureLabel, TraderTriggerQualityLabel } from "./alert-types.js";
export type AlertIntelligenceConfig = {
    eventBaseScores: Record<MonitoringEventType, number>;
    strengthLabelScores: {
        weak: number;
        moderate: number;
        strong: number;
        major: number;
    };
    timeframeConfluenceBonus: number;
    weakZonePenalty: number;
    weak5mOnlyPenalty: number;
    notifyThreshold: number;
    severityThresholds: {
        critical: number;
        high: number;
        medium: number;
    };
    confidenceThresholds: {
        high: number;
        medium: number;
    };
    freshnessScores: {
        fresh: number;
        aging: number;
        stale: number;
    };
    originScores: {
        canonical: number;
        extension_inventory: number;
        promoted_extension: number;
    };
    ladderPositionScores: {
        inner: number;
        outermost: number;
        extension: number;
    };
    remapScores: {
        new: number;
        preserved: number;
        merged: number;
        split: number;
        replaced: number;
    };
    recentRefreshBonus: number;
    promotedExtensionBonus: number;
    dataQualityPenalty: number;
    lowValueInnerTouchPenalty: number;
    lowValueInnerCompressionPenalty: number;
    innerDirectionalPenalty: number;
    degradedDirectionalPenalty: number;
    clearanceScores: {
        tight: number;
        limited: number;
        open: number;
    };
    pressureLabelScores: Record<TraderPressureLabel, number>;
    triggerQualityScores: Record<TraderTriggerQualityLabel, number>;
    tacticalBiasScores: Record<ZoneTacticalBias, number>;
    structureStrengthScale: number;
    postingWindowsMs: {
        zone_context: number;
        bullish_resolution: number;
        bearish_resolution: number;
        failure: number;
    };
    materialScoreDeltaForRepost: number;
};
export declare const DEFAULT_ALERT_INTELLIGENCE_CONFIG: AlertIntelligenceConfig;
//# sourceMappingURL=alert-config.d.ts.map