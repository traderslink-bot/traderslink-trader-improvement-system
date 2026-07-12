// 2026-04-18 08:40 AM America/Toronto
// Runtime-compatible projection from the new structural ranking + surfaced adapter path into the legacy bucketed output contract.
import { rankLevels } from "./level-ranking.js";
import { normalizeSurfacedSelectionOutput } from "./level-ranking-comparison.js";
import { LEVEL_SCORE_CONFIG } from "./level-score-config.js";
import { LEVEL_SURFACED_SELECTION_CONFIG } from "./level-surfaced-selection-config.js";
import { selectSurfacedLevels, } from "./level-surfaced-selection.js";
import { buildZoneBounds, clamp, isPriceInsideZone, priceDistancePct, zonesOverlap, } from "./level-zone-utils.js";
const RAW_LEVEL_SOURCE_TYPES = [
    "swing_high",
    "swing_low",
    "premarket_high",
    "premarket_low",
    "opening_range_high",
    "opening_range_low",
];
function normalizeRuntimeSourceTimeframe(timeframe) {
    if (timeframe === "daily" || timeframe === "4h" || timeframe === "5m") {
        return timeframe;
    }
    return "5m";
}
function deriveCurrentTimeframe(candlesByTimeframe) {
    if ((candlesByTimeframe["5m"]?.length ?? 0) > 0) {
        return "5m";
    }
    if ((candlesByTimeframe["4h"]?.length ?? 0) > 0) {
        return "4h";
    }
    return "daily";
}
function deriveLatestTimestamp(candlesByTimeframe) {
    return Math.max(0, ...Object.values(candlesByTimeframe).map((candles) => candles?.at(-1)?.timestamp ?? 0));
}
function buildScoringContext(symbol, candlesByTimeframe, metadata) {
    const currentTimeframe = deriveCurrentTimeframe(candlesByTimeframe);
    const recentCandles = candlesByTimeframe[currentTimeframe] ??
        candlesByTimeframe["5m"] ??
        candlesByTimeframe["4h"] ??
        candlesByTimeframe.daily ??
        [];
    return {
        symbol: symbol.toUpperCase(),
        currentPrice: metadata.referencePrice ?? 0,
        latestTimestamp: deriveLatestTimestamp(candlesByTimeframe),
        recentCandles,
        currentTimeframe,
    };
}
function convertRawCandidateToLevelCandidate(candidate, candlesByTimeframe) {
    const zoneBounds = buildZoneBounds(candidate.price);
    return {
        id: candidate.id,
        symbol: candidate.symbol,
        type: candidate.kind === "support" ? "support" : "resistance",
        price: candidate.price,
        zoneLow: zoneBounds.zoneLow,
        zoneHigh: zoneBounds.zoneHigh,
        sourceTimeframes: [candidate.timeframe],
        originKinds: [candidate.sourceType],
        analysisCandles: candlesByTimeframe[candidate.timeframe],
    };
}
function bucketForSurfacedLevel(level) {
    const normalized = [...new Set(level.sourceTimeframes.map(normalizeRuntimeSourceTimeframe))];
    if (normalized.includes("daily") || normalized.length > 1) {
        return "major";
    }
    if (normalized.includes("4h")) {
        return "intermediate";
    }
    return "intraday";
}
function adjustedLabelScore(score, durabilityLabel) {
    if (durabilityLabel === "reinforced") {
        return score + 4;
    }
    if (durabilityLabel === "tested") {
        return score - 4;
    }
    if (durabilityLabel === "fragile") {
        return score - 10;
    }
    return score;
}
function deriveStrengthLabel(score, durabilityLabel) {
    const labelScore = adjustedLabelScore(score, durabilityLabel);
    if (labelScore >= 80) {
        return "major";
    }
    if (labelScore >= 64) {
        return "strong";
    }
    if (labelScore >= 46) {
        return "moderate";
    }
    return "weak";
}
function deriveFreshness(level) {
    if (level.barsSinceLastReaction <= 8) {
        return "fresh";
    }
    if (level.barsSinceLastReaction <= 30) {
        return "aging";
    }
    return "stale";
}
function deriveTimeframeBias(level) {
    const normalized = [...new Set(level.sourceTimeframes.map(normalizeRuntimeSourceTimeframe))];
    if (normalized.length !== 1) {
        return "mixed";
    }
    return normalized[0];
}
function deriveSourceTypes(level) {
    const sourceTypes = level.originKinds.filter((origin) => RAW_LEVEL_SOURCE_TYPES.includes(origin));
    if (sourceTypes.length > 0) {
        return [...new Set(sourceTypes)];
    }
    return [level.type === "support" ? "swing_low" : "swing_high"];
}
function deriveReactionScore(level) {
    return clamp(level.scoreBreakdown.reactionQualityScore / 15, 0, 1);
}
function deriveRejectionScore(level) {
    return clamp((level.rejectionCount + level.failedBreakCount + level.reclaimCount) /
        Math.max(level.touchCount, 1), 0, 1);
}
function deriveDisplacementScore(level) {
    return clamp(level.scoreBreakdown.reactionMagnitudeScore / 10, 0, 1);
}
function deriveSessionSignificanceScore(level) {
    return clamp(level.scoreBreakdown.volumeScore / 10, 0, 1);
}
function deriveFollowThroughScore(level) {
    return clamp(level.averageReactionMovePct / 0.08, 0, 1);
}
function deriveFirstTimestamp(level, generatedAt) {
    const timestamps = level.touches.map((touch) => touch.candleTimestamp);
    return timestamps.length > 0 ? Math.min(...timestamps) : generatedAt;
}
function deriveLastTimestamp(level, generatedAt) {
    const timestamps = level.touches.map((touch) => touch.candleTimestamp);
    return timestamps.length > 0 ? Math.max(...timestamps) : generatedAt;
}
function toEnrichedAnalysis(level) {
    return {
        source: "rankLevels",
        structuralStrengthScore: level.structuralStrengthScore,
        activeRelevanceScore: level.activeRelevanceScore,
        finalLevelScore: level.finalLevelScore,
        confidence: level.confidence,
        state: level.state,
        rank: level.rank,
        explanation: level.explanation,
        scoreBreakdown: { ...level.scoreBreakdown },
        touchStats: {
            touchCount: level.touchCount,
            meaningfulTouchCount: level.meaningfulTouchCount,
            rejectionCount: level.rejectionCount,
            failedBreakCount: level.failedBreakCount,
            cleanBreakCount: level.cleanBreakCount,
            reclaimCount: level.reclaimCount,
            strongestReactionMovePct: level.strongestReactionMovePct,
            averageReactionMovePct: level.averageReactionMovePct,
            bestVolumeRatio: level.bestVolumeRatio,
            averageVolumeRatio: level.averageVolumeRatio,
            cleanlinessStdDevPct: level.cleanlinessStdDevPct,
            barsSinceLastReaction: level.barsSinceLastReaction,
            ageInBars: level.ageInBars,
        },
    };
}
function toRuntimeZone(level, generatedAt) {
    const strengthScore = Number(level.surfacedSelectionScore.toFixed(2));
    const timeframeSources = [...new Set(level.sourceTimeframes.map(normalizeRuntimeSourceTimeframe))];
    return {
        id: level.id,
        symbol: level.symbol,
        kind: level.type,
        timeframeBias: deriveTimeframeBias(level),
        zoneLow: level.zoneLow,
        zoneHigh: level.zoneHigh,
        representativePrice: level.price,
        strengthScore,
        // This label is an explicit approximation from the new surfaced-selection score,
        // not the old scorer's native label taxonomy.
        strengthLabel: deriveStrengthLabel(strengthScore, level.durabilityLabel),
        touchCount: level.touchCount,
        confluenceCount: Math.max(timeframeSources.length + level.roleFlipCount, 1),
        sourceTypes: deriveSourceTypes(level),
        timeframeSources,
        reactionQualityScore: deriveReactionScore(level),
        rejectionScore: deriveRejectionScore(level),
        displacementScore: deriveDisplacementScore(level),
        sessionSignificanceScore: deriveSessionSignificanceScore(level),
        followThroughScore: deriveFollowThroughScore(level),
        gapContinuationScore: undefined,
        sourceEvidenceCount: Math.max(level.meaningfulTouchCount, timeframeSources.length),
        firstTimestamp: deriveFirstTimestamp(level, generatedAt),
        lastTimestamp: deriveLastTimestamp(level, generatedAt),
        sessionDate: undefined,
        isExtension: level.selectionCategory === "anchor",
        freshness: deriveFreshness(level),
        notes: [
            "runtime_compatibility_adapter:new_surfaced_selection",
            `state=${level.state}`,
            `durability=${level.durabilityLabel ?? "tested"}`,
            `confidence=${level.confidence.toFixed(2)}`,
            level.surfacedSelectionExplanation,
            ...level.surfacedSelectionNotes,
        ],
        enrichedAnalysis: toEnrichedAnalysis(level),
    };
}
function cloneEnrichedAnalysis(enrichedAnalysis) {
    if (!enrichedAnalysis) {
        return undefined;
    }
    return {
        ...enrichedAnalysis,
        scoreBreakdown: { ...enrichedAnalysis.scoreBreakdown },
        touchStats: { ...enrichedAnalysis.touchStats },
    };
}
function cloneRuntimeZone(zone) {
    return {
        ...zone,
        sourceTypes: [...zone.sourceTypes],
        timeframeSources: [...zone.timeframeSources],
        notes: [...zone.notes],
        enrichedAnalysis: cloneEnrichedAnalysis(zone.enrichedAnalysis),
    };
}
function cloneExtensionLevels(extensionLevels, rankedLevels, accumulator) {
    return {
        support: extensionLevels.support.map((zone) => cloneRuntimeZoneWithEnrichment(zone, rankedLevels, accumulator)),
        resistance: extensionLevels.resistance.map((zone) => cloneRuntimeZoneWithEnrichment(zone, rankedLevels, accumulator)),
    };
}
function normalizedTimeframeSet(timeframes) {
    return new Set(timeframes.map(normalizeRuntimeSourceTimeframe));
}
function levelSourceContextMatches(zone, level) {
    const levelTimeframes = normalizedTimeframeSet(level.sourceTimeframes);
    const timeframeMatches = zone.timeframeSources.some((timeframe) => levelTimeframes.has(timeframe));
    const originMatches = level.originKinds.some((origin) => zone.sourceTypes.includes(origin));
    return timeframeMatches && originMatches;
}
function levelPriceMatches(zone, level) {
    const runtimeZone = {
        zoneLow: Math.min(zone.zoneLow, zone.zoneHigh),
        zoneHigh: Math.max(zone.zoneLow, zone.zoneHigh),
    };
    const rankedZone = {
        zoneLow: Math.min(level.zoneLow, level.zoneHigh),
        zoneHigh: Math.max(level.zoneLow, level.zoneHigh),
    };
    return (isPriceInsideZone(level.price, runtimeZone.zoneLow, runtimeZone.zoneHigh) ||
        isPriceInsideZone(zone.representativePrice, rankedZone.zoneLow, rankedZone.zoneHigh) ||
        zonesOverlap(runtimeZone, rankedZone) ||
        priceDistancePct(zone.representativePrice, level.price) <= 0.006);
}
function findEnrichmentMatch(zone, rankedLevels) {
    const matches = rankedLevels
        .filter((level) => level.symbol === zone.symbol)
        .filter((level) => level.type === zone.kind)
        .filter((level) => levelSourceContextMatches(zone, level))
        .filter((level) => levelPriceMatches(zone, level))
        .sort((left, right) => {
        const leftInside = isPriceInsideZone(left.price, Math.min(zone.zoneLow, zone.zoneHigh), Math.max(zone.zoneLow, zone.zoneHigh));
        const rightInside = isPriceInsideZone(right.price, Math.min(zone.zoneLow, zone.zoneHigh), Math.max(zone.zoneLow, zone.zoneHigh));
        return (Number(rightInside) - Number(leftInside) ||
            Number(right.isClusterRepresentative) - Number(left.isClusterRepresentative) ||
            left.rank - right.rank ||
            priceDistancePct(zone.representativePrice, left.price) -
                priceDistancePct(zone.representativePrice, right.price));
    });
    return matches[0] ?? null;
}
function cloneRuntimeZoneWithEnrichment(zone, rankedLevels, accumulator) {
    const cloned = cloneRuntimeZone(zone);
    const match = findEnrichmentMatch(cloned, rankedLevels);
    if (!match) {
        accumulator.unmatchedRuntimeZoneIds.push(cloned.id);
        return cloned;
    }
    return {
        ...cloned,
        enrichedAnalysis: toEnrichedAnalysis(match),
    };
}
function cloneRuntimeZones(zones, rankedLevels, accumulator) {
    return zones.map((zone) => cloneRuntimeZoneWithEnrichment(zone, rankedLevels, accumulator));
}
function cloneLegacyRuntimeBuckets(runtimeBuckets, rankedLevels, accumulator) {
    return {
        majorSupport: cloneRuntimeZones(runtimeBuckets.majorSupport, rankedLevels, accumulator),
        majorResistance: cloneRuntimeZones(runtimeBuckets.majorResistance, rankedLevels, accumulator),
        intermediateSupport: cloneRuntimeZones(runtimeBuckets.intermediateSupport, rankedLevels, accumulator),
        intermediateResistance: cloneRuntimeZones(runtimeBuckets.intermediateResistance, rankedLevels, accumulator),
        intradaySupport: cloneRuntimeZones(runtimeBuckets.intradaySupport, rankedLevels, accumulator),
        intradayResistance: cloneRuntimeZones(runtimeBuckets.intradayResistance, rankedLevels, accumulator),
    };
}
function runtimeZones(output) {
    return [
        ...output.majorSupport,
        ...output.majorResistance,
        ...output.intermediateSupport,
        ...output.intermediateResistance,
        ...output.intradaySupport,
        ...output.intradayResistance,
        ...output.extensionLevels.support,
        ...output.extensionLevels.resistance,
    ];
}
function buildEnrichmentDiagnostics(output, accumulator) {
    const zones = runtimeZones(output);
    const enrichedZones = zones.filter((zone) => zone.enrichedAnalysis).length;
    return {
        totalRuntimeZones: zones.length,
        enrichedZones,
        unenrichedZones: zones.length - enrichedZones,
        unmatchedRuntimeZoneIds: [...accumulator.unmatchedRuntimeZoneIds],
        unmatchedReason: accumulator.unmatchedRuntimeZoneIds.length > 0 ? "no_safe_ranked_level_match" : null,
    };
}
function pushBucketedZone(buckets, level, generatedAt) {
    buckets[bucketForSurfacedLevel(level)].push(toRuntimeZone(level, generatedAt));
}
function buildActionableBuckets(levels, generatedAt) {
    const buckets = {
        major: [],
        intermediate: [],
        intraday: [],
    };
    for (const level of levels) {
        pushBucketedZone(buckets, level, generatedAt);
    }
    return buckets;
}
export function buildNewRuntimeCompatibleLevelOutput(input) {
    const symbol = input.symbol.toUpperCase();
    const scoreConfig = input.scoreConfig ?? LEVEL_SCORE_CONFIG;
    const surfacedSelectionConfig = input.surfacedSelectionConfig ?? LEVEL_SURFACED_SELECTION_CONFIG;
    const generatedAt = input.generatedAt ?? Date.now();
    const levelCandidates = input.levelCandidates ??
        input.rawCandidates.map((candidate) => convertRawCandidateToLevelCandidate(candidate, input.candlesByTimeframe));
    const rankedOutput = rankLevels(levelCandidates, buildScoringContext(symbol, input.candlesByTimeframe, input.metadata), scoreConfig);
    const rankedLevels = [
        ...rankedOutput.supports,
        ...rankedOutput.resistances,
    ];
    const enrichmentAccumulator = {
        unmatchedRuntimeZoneIds: [],
    };
    const surfacedSelection = selectSurfacedLevels(rankedOutput, surfacedSelectionConfig);
    const supportBuckets = buildActionableBuckets(surfacedSelection.surfacedSupports, generatedAt);
    const resistanceBuckets = buildActionableBuckets(surfacedSelection.surfacedResistances, generatedAt);
    const extensionSupport = surfacedSelection.deeperSupportAnchor
        ? [toRuntimeZone(surfacedSelection.deeperSupportAnchor, generatedAt)]
        : [];
    const extensionResistance = surfacedSelection.deeperResistanceAnchor
        ? [toRuntimeZone(surfacedSelection.deeperResistanceAnchor, generatedAt)]
        : [];
    const extensionLevels = input.legacyExtensionLevels
        ? cloneExtensionLevels(input.legacyExtensionLevels, rankedLevels, enrichmentAccumulator)
        : {
            support: extensionSupport,
            resistance: extensionResistance,
        };
    const runtimeBuckets = input.legacyRuntimeBuckets
        ? cloneLegacyRuntimeBuckets(input.legacyRuntimeBuckets, rankedLevels, enrichmentAccumulator)
        : {
            majorSupport: supportBuckets.major,
            majorResistance: resistanceBuckets.major,
            intermediateSupport: supportBuckets.intermediate,
            intermediateResistance: resistanceBuckets.intermediate,
            intradaySupport: supportBuckets.intraday,
            intradayResistance: resistanceBuckets.intraday,
        };
    const output = {
        symbol,
        generatedAt,
        metadata: input.metadata,
        majorSupport: runtimeBuckets.majorSupport,
        majorResistance: runtimeBuckets.majorResistance,
        intermediateSupport: runtimeBuckets.intermediateSupport,
        intermediateResistance: runtimeBuckets.intermediateResistance,
        intradaySupport: runtimeBuckets.intradaySupport,
        intradayResistance: runtimeBuckets.intradayResistance,
        extensionLevels,
        specialLevels: input.specialLevels,
    };
    const enrichmentDiagnostics = buildEnrichmentDiagnostics(output, enrichmentAccumulator);
    return {
        output,
        rankedOutput,
        surfacedSelection,
        comparableOutput: normalizeSurfacedSelectionOutput(surfacedSelection, 12),
        enrichmentDiagnostics,
        mappingNotes: [
            "The new surfaced adapter is projected into the legacy bucketed LevelEngineOutput contract for runtime compatibility.",
            input.legacyRuntimeBuckets
                ? "Runtime buckets reuse the legacy FinalLevelZone transport buckets supplied by the old runtime path so bucket coverage, nearest levels, and legacy strength labels remain stable while richer surfaced selection stays observational."
                : "Strength labels are approximated from surfaced-selection scores because the new path does not emit the old scorer's native label buckets.",
            input.legacyExtensionLevels
                ? "Extension levels reuse the legacy extension ladder supplied by the old runtime path so forward-planning coverage is not limited to one surfaced anchor per side."
                : "Extension levels fall back to surfaced deeper anchors when no legacy extension ladder is supplied.",
            enrichmentDiagnostics.unenrichedZones > 0
                ? `enrichedAnalysis attached to ${enrichmentDiagnostics.enrichedZones} runtime zones; ${enrichmentDiagnostics.unenrichedZones} remain undefined because no safe ranked-level match was available.`
                : `enrichedAnalysis attached to all ${enrichmentDiagnostics.enrichedZones} runtime zones as additive shadow metadata.`,
        ],
    };
}
