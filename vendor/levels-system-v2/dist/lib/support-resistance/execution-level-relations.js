function representativePrice(level) {
    return level.representativePrice;
}
function pctDistance(from, to) {
    return Number((Math.abs(to - from) / Math.max(Math.abs(from), 0.0001) * 100).toFixed(4));
}
function matchesSourceTimeframes(level, sourceTimeframes) {
    return sourceTimeframes === undefined ||
        level.timeframeSources.some((timeframe) => sourceTimeframes.includes(timeframe));
}
function collectLevels(levels, kind, sourceTimeframes) {
    const source = kind === "support"
        ? [
            ...levels.majorSupport,
            ...levels.intermediateSupport,
            ...levels.intradaySupport,
            ...levels.extensionLevels.support,
        ]
        : [
            ...levels.majorResistance,
            ...levels.intermediateResistance,
            ...levels.intradayResistance,
            ...levels.extensionLevels.resistance,
        ];
    const byId = new Map();
    for (const level of source) {
        if (!matchesSourceTimeframes(level, sourceTimeframes)) {
            continue;
        }
        byId.set(level.id, level);
    }
    return [...byId.values()].sort((left, right) => representativePrice(left) - representativePrice(right));
}
function nearestBelow(levels, price) {
    return levels.filter((level) => representativePrice(level) <= price)
        .sort((left, right) => representativePrice(right) - representativePrice(left))[0] ?? null;
}
function nearestAbove(levels, price) {
    return levels.filter((level) => representativePrice(level) >= price)
        .sort((left, right) => representativePrice(left) - representativePrice(right))[0] ?? null;
}
function referenceMatches(referenceLevels, price) {
    if (!referenceLevels) {
        return [];
    }
    const keys = [
        "previousDayHigh",
        "previousDayLow",
        "previousDayClose",
        "premarketHigh",
        "premarketLow",
        "premarketBase",
        "openingRangeHigh",
        "openingRangeLow",
        "currentSessionHigh",
        "currentSessionLow",
    ];
    return keys.flatMap((key) => {
        const value = referenceLevels[key];
        return typeof value === "number" && Number.isFinite(value)
            ? [{ label: key, price: value, distancePct: pctDistance(price, value) }]
            : [];
    }).sort((left, right) => left.distancePct - right.distancePct);
}
export function buildExecutionLevelRelations(request) {
    if (!Number.isFinite(request.price) || request.price <= 0) {
        throw new Error("price must be a positive finite number.");
    }
    const nearLevelPct = request.nearLevelPct ?? 1.5;
    const stackedWindowPct = request.stackedWindowPct ?? 8;
    const openAirPct = request.openAirPct ?? 12;
    const supports = collectLevels(request.levels, "support", request.sourceTimeframes);
    const resistances = collectLevels(request.levels, "resistance", request.sourceTimeframes);
    const nearestSupportBelow = nearestBelow(supports, request.price);
    const nearestResistanceAbove = nearestAbove(resistances, request.price);
    const nearestResistanceBelow = nearestBelow(resistances, request.price);
    const nearestSupportAbove = nearestAbove(supports, request.price);
    const distanceToSupportPct = nearestSupportBelow
        ? pctDistance(request.price, representativePrice(nearestSupportBelow))
        : null;
    const distanceToResistancePct = nearestResistanceAbove
        ? pctDistance(request.price, representativePrice(nearestResistanceAbove))
        : null;
    const distanceAboveResistanceBelowPct = nearestResistanceBelow
        ? pctDistance(request.price, representativePrice(nearestResistanceBelow))
        : null;
    const stackedResistanceAboveCount = resistances.filter((level) => {
        const levelPrice = representativePrice(level);
        return levelPrice >= request.price && pctDistance(request.price, levelPrice) <= stackedWindowPct;
    }).length;
    const stackedSupportBelowCount = supports.filter((level) => {
        const levelPrice = representativePrice(level);
        return levelPrice <= request.price && pctDistance(request.price, levelPrice) <= stackedWindowPct;
    }).length;
    return {
        price: request.price,
        nearestSupportBelow,
        nearestResistanceAbove,
        nearestResistanceBelow,
        nearestSupportAbove,
        distanceToSupportPct,
        distanceToResistancePct,
        distanceAboveResistanceBelowPct,
        roomAbovePct: distanceToResistancePct,
        roomBelowPct: distanceToSupportPct,
        isNearSupport: distanceToSupportPct !== null && distanceToSupportPct <= nearLevelPct,
        isNearResistance: distanceToResistancePct !== null && distanceToResistancePct <= nearLevelPct,
        clearedNearestResistanceBelow: nearestResistanceBelow !== null &&
            representativePrice(nearestResistanceBelow) < request.price &&
            (distanceAboveResistanceBelowPct ?? 0) > nearLevelPct,
        occurredBelowNearestSupport: nearestSupportBelow === null && supports.some((level) => representativePrice(level) > request.price),
        occurredInOpenAir: (distanceToResistancePct === null || distanceToResistancePct >= openAirPct) &&
            stackedResistanceAboveCount === 0,
        stackedResistanceAboveCount,
        stackedSupportBelowCount,
        nearestReference: referenceMatches(request.referenceLevels, request.price)[0] ?? null,
    };
}
