export function deriveZoneTacticalRead(zone, freshnessOverride) {
    if (!zone) {
        return undefined;
    }
    const freshness = freshnessOverride ?? zone.freshness;
    const lowFollowThrough = zone.followThroughScore < 0.42;
    const lowReactionQuality = zone.reactionQualityScore < 0.58;
    const heavyRetestPressure = zone.touchCount >= 5 && zone.rejectionScore < 0.45;
    if (freshness === "stale" ||
        (lowFollowThrough && lowReactionQuality) ||
        heavyRetestPressure) {
        return "tired";
    }
    if (freshness === "fresh" &&
        zone.followThroughScore >= 0.68 &&
        zone.reactionQualityScore >= 0.7 &&
        zone.rejectionScore >= 0.48) {
        return "firm";
    }
    return "balanced";
}
export function resolveZoneTacticalBias(params) {
    const { zoneKind, eventType, tacticalRead } = params;
    if (!tacticalRead || tacticalRead === "balanced" || eventType === "compression") {
        return "neutral";
    }
    const supportHoldEvent = zoneKind === "support" &&
        (eventType === "level_touch" ||
            eventType === "reclaim" ||
            eventType === "fake_breakdown");
    const supportBreakEvent = zoneKind === "support" && eventType === "breakdown";
    const resistanceHoldEvent = zoneKind === "resistance" &&
        (eventType === "level_touch" ||
            eventType === "rejection" ||
            eventType === "fake_breakout");
    const resistanceBreakEvent = zoneKind === "resistance" && eventType === "breakout";
    if (tacticalRead === "firm") {
        if (supportHoldEvent || resistanceHoldEvent) {
            return "tailwind";
        }
        if (supportBreakEvent || resistanceBreakEvent) {
            return "headwind";
        }
        return "neutral";
    }
    if (supportHoldEvent || resistanceHoldEvent) {
        return "headwind";
    }
    if (supportBreakEvent || resistanceBreakEvent) {
        return "tailwind";
    }
    return "neutral";
}
