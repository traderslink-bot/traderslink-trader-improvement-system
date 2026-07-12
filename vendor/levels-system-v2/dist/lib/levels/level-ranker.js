// 2026-04-16 02:41 PM America/Toronto
// Rank zones, enforce spacing-aware surfaced outputs, and preserve a cleaner ladder for extensions.
import { buildLevelExtensions } from "./level-extension-engine.js";
const SURFACED_FORWARD_PLANNING_RANGE_PCT = 0.5;
const LOW_PRICE_FORWARD_PLANNING_RANGE_PCT = 1;
const DEFAULT_EXTENSION_LEVELS_PER_SIDE = 3;
const ACTIVE_TRADER_EXTENSION_LEVELS_PER_SIDE = 6;
const LOW_PRICE_EXTENSION_LEVELS_PER_SIDE = 10;
const LOW_PRICE_RUNNER_THRESHOLD = 2;
const GAP_FILL_THRESHOLD_PCT = 0.18;
const ACTIVE_TRADER_GAP_FILL_THRESHOLD_PCT = 0.04;
const ACTIVE_TRADER_GAP_FILL_REFERENCE_THRESHOLD = 30;
const GAP_FILL_MAX_ADDITIONS_PER_SIDE = 6;
const ACTIVE_TRADER_GAP_FILL_MAX_ADDITIONS_PER_SIDE = 14;
const ACTIVE_TRADER_HIGH_CONFIDENCE_FILL_MAX_ADDITIONS_PER_SIDE = 8;
function forwardPlanningRangePctForReference(referencePrice) {
    return referencePrice && referencePrice > 0 && referencePrice < LOW_PRICE_RUNNER_THRESHOLD
        ? LOW_PRICE_FORWARD_PLANNING_RANGE_PCT
        : SURFACED_FORWARD_PLANNING_RANGE_PCT;
}
function maxExtensionLevelsPerSideForReference(referencePrice) {
    if (!referencePrice || referencePrice <= 0) {
        return DEFAULT_EXTENSION_LEVELS_PER_SIDE;
    }
    if (referencePrice < LOW_PRICE_RUNNER_THRESHOLD) {
        return LOW_PRICE_EXTENSION_LEVELS_PER_SIDE;
    }
    if (referencePrice < ACTIVE_TRADER_GAP_FILL_REFERENCE_THRESHOLD) {
        return ACTIVE_TRADER_EXTENSION_LEVELS_PER_SIDE;
    }
    return DEFAULT_EXTENSION_LEVELS_PER_SIDE;
}
function gapFillThresholdPctForReference(referencePrice) {
    return referencePrice && referencePrice > 0 && referencePrice < ACTIVE_TRADER_GAP_FILL_REFERENCE_THRESHOLD
        ? ACTIVE_TRADER_GAP_FILL_THRESHOLD_PCT
        : GAP_FILL_THRESHOLD_PCT;
}
function maxGapFillAdditionsForReference(referencePrice) {
    return referencePrice && referencePrice > 0 && referencePrice < ACTIVE_TRADER_GAP_FILL_REFERENCE_THRESHOLD
        ? ACTIVE_TRADER_GAP_FILL_MAX_ADDITIONS_PER_SIDE
        : GAP_FILL_MAX_ADDITIONS_PER_SIDE;
}
function highConfidenceFillMaxAdditionsForReference(referencePrice) {
    return referencePrice && referencePrice > 0 && referencePrice < ACTIVE_TRADER_GAP_FILL_REFERENCE_THRESHOLD
        ? ACTIVE_TRADER_HIGH_CONFIDENCE_FILL_MAX_ADDITIONS_PER_SIDE
        : 0;
}
function freshnessRank(zone) {
    if (zone.freshness === "fresh") {
        return 3;
    }
    if (zone.freshness === "aging") {
        return 2;
    }
    return 1;
}
function preferredBucketRank(bucket) {
    if (bucket === "daily") {
        return 3;
    }
    if (bucket === "4h") {
        return 2;
    }
    return 1;
}
function timeframeBiasRank(zone) {
    if (zone.timeframeBias === "mixed") {
        return 4;
    }
    if (zone.timeframeBias === "daily") {
        return 3;
    }
    if (zone.timeframeBias === "4h") {
        return 2;
    }
    return 1;
}
function preferredBucketForZone(zone) {
    const timeframeOrder = ["daily", "4h", "5m"];
    if (zone.timeframeBias !== "mixed" && zone.timeframeSources.includes(zone.timeframeBias)) {
        return zone.timeframeBias;
    }
    for (const timeframe of timeframeOrder) {
        if (zone.timeframeSources.includes(timeframe)) {
            return timeframe;
        }
    }
    return "5m";
}
function sortZones(zones) {
    return [...zones].sort((a, b) => b.strengthScore - a.strengthScore ||
        b.followThroughScore - a.followThroughScore ||
        freshnessRank(b) - freshnessRank(a) ||
        preferredBucketRank(preferredBucketForZone(b)) - preferredBucketRank(preferredBucketForZone(a)) ||
        b.touchCount - a.touchCount ||
        b.confluenceCount - a.confluenceCount);
}
function filterPracticalSurfacedResistanceZones(zones, referencePrice) {
    if (!referencePrice || referencePrice <= 0) {
        return zones;
    }
    const maxPracticalPrice = referencePrice * (1 + forwardPlanningRangePctForReference(referencePrice));
    return zones.filter((zone) => zone.representativePrice > referencePrice &&
        zone.representativePrice <= maxPracticalPrice);
}
function filterActionableSurfacedSupportZones(zones, referencePrice) {
    if (!referencePrice || referencePrice <= 0) {
        return zones;
    }
    return zones.filter((zone) => zone.representativePrice < referencePrice);
}
function byOwnedBucket(zones, bucket) {
    return zones.filter((zone) => preferredBucketForZone(zone) === bucket);
}
function proximityPct(left, right) {
    return (Math.abs(left.representativePrice - right.representativePrice) /
        Math.max(Math.max(left.representativePrice, right.representativePrice), 0.0001));
}
function materiallyDominatesInBand(incumbent, challenger) {
    const strengthLead = incumbent.strengthScore - challenger.strengthScore;
    const strongerTimeframe = timeframeBiasRank(incumbent) > timeframeBiasRank(challenger);
    const strongerConfluence = incumbent.confluenceCount > challenger.confluenceCount;
    const strongerRejection = incumbent.rejectionScore >= challenger.rejectionScore + 0.08;
    const strongerFollowThrough = incumbent.followThroughScore >= challenger.followThroughScore + 0.08;
    if (strengthLead >= 6) {
        return true;
    }
    if (strengthLead >= 3 && (strongerTimeframe || strongerConfluence)) {
        return true;
    }
    if (strengthLead >= 3 && (strongerRejection || strongerFollowThrough)) {
        return true;
    }
    if (strengthLead >= 1.25 && strongerConfluence && strongerRejection && strongerFollowThrough) {
        return true;
    }
    return false;
}
function selectSpacedZones(params) {
    const selected = [];
    const spacingPct = params.config.surfacedSpacingPct[params.bucket];
    const localBandPct = Math.max(params.config.maxMergedZoneWidthPct, Math.min(spacingPct * 8, 0.06));
    for (const zone of sortZones(params.zones)) {
        const tooCloseToSelected = selected.some((existing) => {
            const distancePct = proximityPct(existing, zone);
            const tightClose = distancePct <= spacingPct;
            const localBandClose = distancePct <= localBandPct;
            const strongerExisting = existing.strengthScore >= zone.strengthScore &&
                existing.confluenceCount >= zone.confluenceCount;
            const dominantBandIncumbent = materiallyDominatesInBand(existing, zone);
            return (tightClose && strongerExisting) || (localBandClose && dominantBandIncumbent);
        });
        if (tooCloseToSelected) {
            continue;
        }
        selected.push(zone);
        if (selected.length >= params.maxCount) {
            break;
        }
    }
    return selected;
}
function forwardSortZones(zones, side) {
    return [...zones].sort((left, right) => side === "support"
        ? right.representativePrice - left.representativePrice
        : left.representativePrice - right.representativePrice);
}
function uniqueByDisplayPrice(zones) {
    const seen = new Set();
    const unique = [];
    for (const zone of zones) {
        const key = zone.representativePrice.toFixed(zone.representativePrice >= 1 ? 2 : 4);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        unique.push(zone);
    }
    return unique;
}
function gapPctBetween(left, right) {
    return Math.abs(left.representativePrice - right.representativePrice) /
        Math.max(Math.min(left.representativePrice, right.representativePrice), 0.0001);
}
function isBetweenGap(zone, left, right) {
    const low = Math.min(left.representativePrice, right.representativePrice);
    const high = Math.max(left.representativePrice, right.representativePrice);
    return zone.representativePrice > low && zone.representativePrice < high;
}
function splitBalanceScore(zone, left, right) {
    const low = Math.min(left.representativePrice, right.representativePrice);
    const high = Math.max(left.representativePrice, right.representativePrice);
    const width = Math.max(high - low, 0.0001);
    return Math.min(zone.representativePrice - low, high - zone.representativePrice) / width;
}
function gapFillCandidateScore(zone, left, right) {
    const structuralBias = zone.timeframeBias === "daily"
        ? 10
        : zone.timeframeBias === "4h"
            ? 6
            : 0;
    const confluenceBias = zone.confluenceCount * 2;
    const balanceBias = splitBalanceScore(zone, left, right) * 20;
    return zone.strengthScore + structuralBias + confluenceBias + balanceBias;
}
function findBestGapFillCandidate(params) {
    const selectedIds = new Set(params.selectedZones.map((zone) => zone.id));
    const candidateFloor = params.config.scoreThresholds.moderate * 0.65;
    const candidates = params.allForwardZones
        .filter((zone) => !selectedIds.has(zone.id))
        .filter((zone) => isBetweenGap(zone, params.left, params.right))
        .filter((zone) => zone.timeframeBias === "daily" || zone.timeframeBias === "4h" || zone.timeframeBias === "mixed")
        .filter((zone) => zone.strengthScore >= candidateFloor)
        .filter((zone) => splitBalanceScore(zone, params.left, params.right) >= 0.12)
        .sort((left, right) => gapFillCandidateScore(right, params.left, params.right) -
        gapFillCandidateScore(left, params.left, params.right));
    return candidates[0] ?? null;
}
function fillForwardGaps(params) {
    const additions = [];
    const gapFillThresholdPct = gapFillThresholdPctForReference(params.referencePrice);
    const maxAdditions = maxGapFillAdditionsForReference(params.referencePrice);
    for (let count = 0; count < maxAdditions; count += 1) {
        const selectedWithAdditions = uniqueByDisplayPrice([...params.selectedZones, ...additions]);
        const sortedSelected = forwardSortZones(selectedWithAdditions, params.side);
        const gaps = sortedSelected
            .slice(1)
            .map((zone, index) => ({
            left: sortedSelected[index],
            right: zone,
            gapPct: gapPctBetween(sortedSelected[index], zone),
        }))
            .filter((gap) => gap.gapPct >= gapFillThresholdPct)
            .sort((left, right) => right.gapPct - left.gapPct);
        if (gaps.length === 0) {
            break;
        }
        let candidate = null;
        for (const gap of gaps) {
            candidate = findBestGapFillCandidate({
                allForwardZones: params.allForwardZones,
                selectedZones: selectedWithAdditions,
                left: gap.left,
                right: gap.right,
                config: params.config,
            });
            if (candidate) {
                break;
            }
        }
        if (!candidate) {
            break;
        }
        additions.push(candidate);
    }
    return additions;
}
function fillHighConfidenceForwardZones(params) {
    const maxAdditions = highConfidenceFillMaxAdditionsForReference(params.referencePrice);
    if (maxAdditions <= 0) {
        return [];
    }
    const selectedIds = new Set(params.selectedZones.map((zone) => zone.id));
    const selectedWithAdditions = [...params.selectedZones];
    const highConfidenceFloor = params.config.scoreThresholds.strong;
    const candidates = forwardSortZones(params.allForwardZones
        .filter((zone) => !selectedIds.has(zone.id))
        .filter((zone) => zone.strengthScore >= highConfidenceFloor)
        .filter((zone) => zone.timeframeBias === "daily" || zone.timeframeBias === "4h" || zone.timeframeBias === "mixed"), params.side);
    const additions = [];
    for (const candidate of candidates) {
        if (additions.length >= maxAdditions) {
            break;
        }
        const alreadyCovered = selectedWithAdditions.some((zone) => proximityPct(zone, candidate) <= params.config.overlapMergeTolerancePct);
        if (alreadyCovered) {
            continue;
        }
        additions.push(candidate);
        selectedWithAdditions.push(candidate);
    }
    return additions;
}
function addZonesToOwnedBuckets(params) {
    for (const zone of params.zones) {
        const bucket = preferredBucketForZone(zone);
        if (bucket === "daily") {
            params.daily.push(zone);
        }
        else if (bucket === "4h") {
            params.intermediate.push(zone);
        }
        else {
            params.intraday.push(zone);
        }
    }
}
function nearestForwardZone(params) {
    if (!params.referencePrice || params.referencePrice <= 0) {
        return null;
    }
    const sorted = forwardSortZones(params.side === "support"
        ? params.zones.filter((zone) => zone.representativePrice < params.referencePrice)
        : params.zones.filter((zone) => zone.representativePrice > params.referencePrice), params.side);
    return sorted[0] ?? null;
}
function ensureNearestForwardZone(params) {
    const nearestCandidate = nearestForwardZone({
        zones: params.allForwardZones,
        referencePrice: params.referencePrice,
        side: params.side,
    });
    if (!nearestCandidate) {
        return [];
    }
    const selectedIds = new Set(params.selectedZones.map((zone) => zone.id));
    if (selectedIds.has(nearestCandidate.id)) {
        return [];
    }
    const nearestSelected = nearestForwardZone({
        zones: params.selectedZones,
        referencePrice: params.referencePrice,
        side: params.side,
    });
    const selectedDistance = nearestSelected && params.referencePrice
        ? Math.abs(nearestSelected.representativePrice - params.referencePrice) / params.referencePrice
        : Number.POSITIVE_INFINITY;
    const candidateDistance = params.referencePrice
        ? Math.abs(nearestCandidate.representativePrice - params.referencePrice) / params.referencePrice
        : Number.POSITIVE_INFINITY;
    const candidateFloor = params.config.scoreThresholds.moderate * 0.55;
    if (nearestCandidate.strengthScore >= candidateFloor &&
        (candidateDistance <= 0.12 || selectedDistance - candidateDistance >= 0.04)) {
        return [nearestCandidate];
    }
    return [];
}
export function rankLevelZones(params) {
    const { symbol, supportZones, resistanceZones, specialLevels, metadata, config } = params;
    const actionableSupportZones = filterActionableSurfacedSupportZones(supportZones, metadata.referencePrice);
    const surfacedResistanceZones = filterPracticalSurfacedResistanceZones(resistanceZones, metadata.referencePrice);
    const dailySupport = selectSpacedZones({
        zones: byOwnedBucket(actionableSupportZones, "daily"),
        bucket: "daily",
        maxCount: config.timeframeConfig.daily.maxOutputPerSide,
        config,
    });
    const dailyResistance = selectSpacedZones({
        zones: byOwnedBucket(surfacedResistanceZones, "daily"),
        bucket: "daily",
        maxCount: config.timeframeConfig.daily.maxOutputPerSide,
        config,
    });
    const intermediateSupport = selectSpacedZones({
        zones: byOwnedBucket(actionableSupportZones, "4h"),
        bucket: "4h",
        maxCount: config.timeframeConfig["4h"].maxOutputPerSide,
        config,
    });
    const intermediateResistance = selectSpacedZones({
        zones: byOwnedBucket(surfacedResistanceZones, "4h"),
        bucket: "4h",
        maxCount: config.timeframeConfig["4h"].maxOutputPerSide,
        config,
    });
    const intradaySupport = selectSpacedZones({
        zones: byOwnedBucket(actionableSupportZones, "5m"),
        bucket: "5m",
        maxCount: config.timeframeConfig["5m"].maxOutputPerSide,
        config,
    });
    const intradayResistance = selectSpacedZones({
        zones: byOwnedBucket(surfacedResistanceZones, "5m"),
        bucket: "5m",
        maxCount: config.timeframeConfig["5m"].maxOutputPerSide,
        config,
    });
    const nearestSupportFillers = ensureNearestForwardZone({
        allForwardZones: actionableSupportZones,
        selectedZones: [...dailySupport, ...intermediateSupport, ...intradaySupport],
        referencePrice: metadata.referencePrice,
        side: "support",
        config,
    });
    addZonesToOwnedBuckets({
        zones: nearestSupportFillers,
        daily: dailySupport,
        intermediate: intermediateSupport,
        intraday: intradaySupport,
    });
    const supportGapFillers = fillForwardGaps({
        allForwardZones: actionableSupportZones,
        selectedZones: [...dailySupport, ...intermediateSupport, ...intradaySupport],
        side: "support",
        config,
        referencePrice: metadata.referencePrice,
    });
    addZonesToOwnedBuckets({
        zones: supportGapFillers,
        daily: dailySupport,
        intermediate: intermediateSupport,
        intraday: intradaySupport,
    });
    const supportHighConfidenceFillers = fillHighConfidenceForwardZones({
        allForwardZones: actionableSupportZones,
        selectedZones: [...dailySupport, ...intermediateSupport, ...intradaySupport],
        side: "support",
        referencePrice: metadata.referencePrice,
        config,
    });
    addZonesToOwnedBuckets({
        zones: supportHighConfidenceFillers,
        daily: dailySupport,
        intermediate: intermediateSupport,
        intraday: intradaySupport,
    });
    const nearestResistanceFillers = ensureNearestForwardZone({
        allForwardZones: surfacedResistanceZones,
        selectedZones: [...dailyResistance, ...intermediateResistance, ...intradayResistance],
        referencePrice: metadata.referencePrice,
        side: "resistance",
        config,
    });
    addZonesToOwnedBuckets({
        zones: nearestResistanceFillers,
        daily: dailyResistance,
        intermediate: intermediateResistance,
        intraday: intradayResistance,
    });
    const resistanceGapFillers = fillForwardGaps({
        allForwardZones: surfacedResistanceZones,
        selectedZones: [...dailyResistance, ...intermediateResistance, ...intradayResistance],
        side: "resistance",
        config,
        referencePrice: metadata.referencePrice,
    });
    addZonesToOwnedBuckets({
        zones: resistanceGapFillers,
        daily: dailyResistance,
        intermediate: intermediateResistance,
        intraday: intradayResistance,
    });
    const resistanceHighConfidenceFillers = fillHighConfidenceForwardZones({
        allForwardZones: surfacedResistanceZones,
        selectedZones: [...dailyResistance, ...intermediateResistance, ...intradayResistance],
        side: "resistance",
        referencePrice: metadata.referencePrice,
        config,
    });
    addZonesToOwnedBuckets({
        zones: resistanceHighConfidenceFillers,
        daily: dailyResistance,
        intermediate: intermediateResistance,
        intraday: intradayResistance,
    });
    const forwardPlanningRangePct = forwardPlanningRangePctForReference(metadata.referencePrice);
    const maxExtensionPerSide = maxExtensionLevelsPerSideForReference(metadata.referencePrice);
    const extensionLevels = buildLevelExtensions({
        supportZones,
        resistanceZones,
        surfacedSupport: [...dailySupport, ...intermediateSupport, ...intradaySupport],
        surfacedResistance: [...dailyResistance, ...intermediateResistance, ...intradayResistance],
        spacingPct: config.extensionSpacingPct,
        searchWindowPct: config.extensionSearchWindowPct,
        referencePrice: metadata.referencePrice,
        forwardPlanningRangePct,
        maxExtensionPerSide,
        preservePracticalResistanceCoverage: maxExtensionPerSide > DEFAULT_EXTENSION_LEVELS_PER_SIDE,
        allowSyntheticResistanceExtensions: true,
    });
    return {
        symbol,
        generatedAt: Date.now(),
        metadata,
        majorSupport: dailySupport,
        majorResistance: dailyResistance,
        intermediateSupport,
        intermediateResistance,
        intradaySupport,
        intradayResistance,
        extensionLevels,
        specialLevels,
    };
}
