import { buildFailedLevelMemoryContext, } from "./failed-level-memory.js";
import { buildPrimaryTradeAreaContext, } from "./primary-trade-area.js";
function formatLevel(value) {
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}
function zoneLow(zone) {
    return Math.min(zone.zoneLow, zone.zoneHigh, zone.representativePrice);
}
function zoneHigh(zone) {
    return Math.max(zone.zoneLow, zone.zoneHigh, zone.representativePrice);
}
function strengthRank(strength) {
    switch (strength) {
        case "major":
            return 4;
        case "strong":
            return 3;
        case "moderate":
            return 2;
        case "weak":
            return 1;
        default:
            return 0;
    }
}
function pctDistance(from, to) {
    if (typeof from !== "number" ||
        typeof to !== "number" ||
        !Number.isFinite(from) ||
        !Number.isFinite(to) ||
        from === 0) {
        return null;
    }
    return ((to - from) / from) * 100;
}
function rangeBoxWidthPct(support, resistance) {
    if (!support || !resistance || support.high <= 0 || resistance.low <= support.high) {
        return null;
    }
    return ((resistance.low - support.high) / support.high) * 100;
}
function rangeWidthThresholdPct(price) {
    if (price < 1) {
        return 16;
    }
    if (price < 2) {
        return 14;
    }
    if (price < 5) {
        return 12;
    }
    if (price < 10) {
        return 10;
    }
    return 8;
}
function recentInsideBoxPosts(params) {
    if (!params.support || !params.resistance) {
        return 0;
    }
    const windowMs = 3 * 60 * 60 * 1000;
    return params.recentEvents.filter((event) => {
        if (params.timestamp - event.timestamp < 0 || params.timestamp - event.timestamp > windowMs) {
            return false;
        }
        return event.triggerPrice >= params.support.low && event.triggerPrice <= params.resistance.high;
    }).length;
}
export function buildRangeBoxContext(params) {
    const support = params.tradeStructure?.supportArea;
    const resistance = params.tradeStructure?.resistanceArea;
    const widthPct = rangeBoxWidthPct(support, resistance);
    if (!support || !resistance || widthPct === null) {
        return {
            label: "not_enough_structure",
            low: null,
            high: null,
            widthPct: null,
            recentInsidePostCount: 0,
        };
    }
    const recentInsidePostCount = recentInsideBoxPosts({
        recentEvents: params.recentEvents,
        support,
        resistance,
        timestamp: params.timestamp,
    });
    const threshold = rangeWidthThresholdPct(params.price);
    if (widthPct > threshold) {
        return {
            label: "wide",
            low: support.low,
            high: resistance.high,
            widthPct: Number(widthPct.toFixed(2)),
            recentInsidePostCount,
        };
    }
    return {
        label: "active",
        low: support.low,
        high: resistance.high,
        widthPct: Number(widthPct.toFixed(2)),
        recentInsidePostCount,
        traderLine: `${params.symbol} is boxed between ${formatLevel(support.high)} support and ${formatLevel(resistance.low)} resistance; small moves inside the box are lower-quality noise`,
    };
}
function acceptanceThresholdPct(price) {
    if (price < 1) {
        return 2.5;
    }
    if (price < 2) {
        return 2;
    }
    if (price < 5) {
        return 1.5;
    }
    if (price < 10) {
        return 1.1;
    }
    return 0.8;
}
export function buildAcceptanceContext(params) {
    const reasons = [];
    const threshold = acceptanceThresholdPct(params.price);
    if (params.eventType === "rejection" || params.eventType === "fake_breakout") {
        return {
            label: "rejected",
            beyondZonePct: null,
            reasons: ["resistance push rejected"],
            traderLine: "price rejected resistance instead of accepting above it",
        };
    }
    if (params.eventType === "fake_breakdown") {
        return {
            label: "failed",
            beyondZonePct: null,
            reasons: ["support loss failed"],
            traderLine: "support loss failed and price reclaimed the area",
        };
    }
    if (params.eventType === "breakout") {
        const beyondPct = pctDistance(zoneHigh(params.zone), params.price);
        reasons.push(`above resistance by ${beyondPct === null ? "n/a" : beyondPct.toFixed(2)}%`);
        if ((beyondPct ?? 0) >= threshold || params.stableMaterialChange === true) {
            return {
                label: "accepted",
                beyondZonePct: beyondPct === null ? null : Number(beyondPct.toFixed(2)),
                reasons,
                traderLine: "price is showing cleaner acceptance above resistance",
            };
        }
        return {
            label: (beyondPct ?? 0) > 0 ? "weak_probe" : "testing",
            beyondZonePct: beyondPct === null ? null : Number(beyondPct.toFixed(2)),
            reasons,
            traderLine: "price is only slightly above resistance, so the break still needs acceptance",
        };
    }
    if (params.eventType === "breakdown") {
        const beyondPct = pctDistance(params.price, zoneLow(params.zone));
        reasons.push(`below support by ${beyondPct === null ? "n/a" : beyondPct.toFixed(2)}%`);
        return {
            label: (beyondPct ?? 0) >= threshold ? "accepted" : "weak_probe",
            beyondZonePct: beyondPct === null ? null : Number(beyondPct.toFixed(2)),
            reasons,
            traderLine: (beyondPct ?? 0) >= threshold
                ? "support is cleanly lost for now"
                : "price is only slightly below support, so the support loss still needs proof",
        };
    }
    if (params.eventType === "reclaim") {
        const beyondPct = pctDistance(zoneHigh(params.zone), params.price);
        return {
            label: (beyondPct ?? 0) >= threshold ? "accepted" : "testing",
            beyondZonePct: beyondPct === null ? null : Number(beyondPct.toFixed(2)),
            reasons: [`reclaim above area by ${beyondPct === null ? "n/a" : beyondPct.toFixed(2)}%`],
            traderLine: (beyondPct ?? 0) >= threshold
                ? "reclaim is holding with cleaner acceptance"
                : "reclaim is still being tested near the area",
        };
    }
    return {
        label: "testing",
        beyondZonePct: null,
        reasons: ["level is being tested"],
    };
}
function nearestDeeperSupport(symbolState, support) {
    if (!support) {
        return null;
    }
    const candidate = symbolState.supportZones
        .filter((zone) => zoneHigh(zone) < support.low)
        .sort((left, right) => zoneHigh(right) - zoneHigh(left))[0];
    if (!candidate) {
        return null;
    }
    return {
        side: "support",
        low: zoneLow(candidate),
        high: zoneHigh(candidate),
        representative: candidate.representativePrice,
        strengthLabel: candidate.strengthLabel,
        sourceLabel: candidate.timeframeBias,
        zoneCount: 1,
    };
}
export function buildSupportImportanceContext(params) {
    const support = params.tradeStructure?.supportArea ?? null;
    if (!support) {
        return {
            label: "unknown",
            supportArea: null,
            deeperSupportArea: null,
            distanceToSupportPct: null,
        };
    }
    const deeper = nearestDeeperSupport(params.symbolState, support);
    const distanceToSupportPct = pctDistance(params.price, support.high);
    const rank = strengthRank(support.strengthLabel);
    const label = rank >= 4 || support.zoneCount >= 2
        ? "must_hold_structure"
        : rank >= 2
            ? "practical_support"
            : "noise_support";
    return {
        label,
        supportArea: support,
        deeperSupportArea: deeper,
        distanceToSupportPct: distanceToSupportPct === null ? null : Number(distanceToSupportPct.toFixed(2)),
        traderLine: label === "must_hold_structure"
            ? `${formatLevel(support.low)}-${formatLevel(support.high)} is the main structure support area`
            : label === "practical_support"
                ? `${formatLevel(support.low)}-${formatLevel(support.high)} is practical support, but small flickers around it can be noise`
                : `${formatLevel(support.low)}-${formatLevel(support.high)} is light support, so it should not be over-read by itself`,
    };
}
export function buildBehaviorBudgetContext(params) {
    const windowMs = 6 * 60 * 60 * 1000;
    const recent = params.recentEvents.filter((event) => params.timestamp - event.timestamp >= 0 && params.timestamp - event.timestamp <= windowMs);
    const prices = recent.map((event) => event.triggerPrice).filter((price) => Number.isFinite(price) && price > 0);
    const low = prices.length > 0 ? Math.min(...prices) : params.price;
    const high = prices.length > 0 ? Math.max(...prices) : params.price;
    const rangePct = ((high - low) / Math.max(low, 0.0001)) * 100;
    const reasons = [`recent post range ${rangePct.toFixed(1)}%`, `recent events ${recent.length}`];
    if (params.rangeBox.label === "active" && rangePct < rangeBoxWidthThresholdForBudget(params.price)) {
        return {
            label: "boring_range",
            maxUsefulPostsPerDay: 6,
            maxRangePosts: 2,
            reasons,
        };
    }
    if (rangePct >= 80 || recent.length >= 25) {
        return {
            label: "extreme_runner",
            maxUsefulPostsPerDay: 24,
            maxRangePosts: 6,
            reasons,
        };
    }
    if (rangePct >= 25 || recent.length >= 12) {
        return {
            label: "active_runner",
            maxUsefulPostsPerDay: 16,
            maxRangePosts: 4,
            reasons,
        };
    }
    return {
        label: "normal_trade",
        maxUsefulPostsPerDay: 10,
        maxRangePosts: 3,
        reasons,
    };
}
function rangeBoxWidthThresholdForBudget(price) {
    if (price < 2) {
        return 12;
    }
    if (price < 5) {
        return 10;
    }
    return 8;
}
export function deriveTradeStoryState(params) {
    if (params.eventType === "breakout") {
        return params.acceptance.label === "accepted" ? "breakout_accepted" : "breakout_attempt";
    }
    if (params.eventType === "rejection" || params.eventType === "fake_breakout") {
        return "breakout_failed";
    }
    if (params.eventType === "breakdown") {
        return params.acceptance.label === "accepted" ? "support_lost" : "support_test";
    }
    if (params.eventType === "fake_breakdown" || params.eventType === "reclaim") {
        return "reclaim_attempt";
    }
    if (params.eventType === "compression") {
        return params.tradeStructure?.state === "pressing_resistance" ? "testing_resistance" : "building";
    }
    if (params.eventType === "level_touch") {
        return params.tradeStructure?.resistanceArea && params.tradeStructure.state === "pressing_resistance"
            ? "testing_resistance"
            : "support_test";
    }
    if (params.rangeBox.label === "active") {
        return "building";
    }
    return "reset";
}
export function buildTradeStoryIntelligenceContext(params) {
    const recentEvents = params.symbolState.recentEvents;
    const rangeBox = buildRangeBoxContext({
        symbol: params.symbolState.symbol,
        price: params.price,
        tradeStructure: params.tradeStructure,
        recentEvents,
        timestamp: params.timestamp,
    });
    const acceptance = buildAcceptanceContext({
        eventType: params.eventType,
        zone: params.zone,
        price: params.price,
        stableMaterialChange: params.stableMaterialChange,
    });
    const supportImportance = buildSupportImportanceContext({
        symbolState: params.symbolState,
        price: params.price,
        tradeStructure: params.tradeStructure,
    });
    const behaviorBudget = buildBehaviorBudgetContext({
        price: params.price,
        rangeBox,
        recentEvents,
        timestamp: params.timestamp,
    });
    const primaryTradeArea = buildPrimaryTradeAreaContext({
        symbol: params.symbolState.symbol,
        price: params.price,
        tradeStructure: params.tradeStructure,
        rangeBox,
        acceptance,
        stableMaterialChange: params.stableMaterialChange,
    });
    const failedLevelMemory = buildFailedLevelMemoryContext({
        zone: params.zone,
        eventType: params.eventType,
        price: params.price,
        timestamp: params.timestamp,
        recentEvents,
    });
    const storyState = deriveTradeStoryState({
        eventType: params.eventType,
        tradeStructure: params.tradeStructure,
        acceptance,
        rangeBox,
    });
    const traderLine = failedLevelMemory.traderLine ??
        primaryTradeArea.traderLine ??
        acceptance.traderLine ??
        rangeBox.traderLine ??
        supportImportance.traderLine ??
        "trade story is still developing";
    return {
        storyState,
        rangeBox,
        acceptance,
        supportImportance,
        behaviorBudget,
        primaryTradeArea,
        failedLevelMemory,
        traderLine,
    };
}
