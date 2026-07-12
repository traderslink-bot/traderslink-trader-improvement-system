import type { FinalLevelZone, LevelDataFreshness, LevelKind } from "./level-types.js";
export type ZoneTacticalRead = "firm" | "balanced" | "tired";
export type ZoneTacticalBias = "tailwind" | "neutral" | "headwind";
type ZoneTacticalEventType = "level_touch" | "breakout" | "breakdown" | "rejection" | "fake_breakout" | "fake_breakdown" | "reclaim" | "compression";
export declare function deriveZoneTacticalRead(zone?: Pick<FinalLevelZone, "freshness" | "followThroughScore" | "reactionQualityScore" | "touchCount" | "rejectionScore">, freshnessOverride?: LevelDataFreshness): ZoneTacticalRead | undefined;
export declare function resolveZoneTacticalBias(params: {
    zoneKind: LevelKind;
    eventType: ZoneTacticalEventType;
    tacticalRead?: ZoneTacticalRead;
}): ZoneTacticalBias;
export {};
//# sourceMappingURL=zone-tactical-read.d.ts.map