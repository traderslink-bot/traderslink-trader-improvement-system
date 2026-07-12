export const LIVE_WATCHLIST_PULLBACK_READ_ENABLED_ENV = "LIVE_WATCHLIST_PULLBACK_READ_ENABLED";
const SMALL_CAP_ORDINARY_MATERIAL_DISTANCE_PCT = 15;
const SMALL_CAP_HIGH_QUALITY_MATERIAL_DISTANCE_PCT = 10;
function isTruthyFlag(value) {
    const normalized = value?.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
function isFalseyFlag(value) {
    const normalized = value?.trim().toLowerCase();
    return normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off";
}
export function resolveLiveWatchlistPullbackReadEnabled(env = process.env) {
    const value = env[LIVE_WATCHLIST_PULLBACK_READ_ENABLED_ENV];
    if (isFalseyFlag(value)) {
        return false;
    }
    return value === undefined ? true : isTruthyFlag(value);
}
function formatPrice(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "n/a";
    }
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}
function formatSignedPercent(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "n/a";
    }
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
}
function belowCurrent(price, currentPrice) {
    return typeof price === "number" && Number.isFinite(price) && price > 0 && price < currentPrice;
}
function distanceFromCurrentPct(price, currentPrice) {
    return Math.abs((price - currentPrice) / Math.max(currentPrice, 0.0001)) * 100;
}
function strengthRank(value) {
    if (value === "major")
        return 4;
    if (value === "strong")
        return 3;
    if (value === "moderate")
        return 2;
    if (value === "weak")
        return 1;
    return 0;
}
function isHighQualityLevel(level) {
    return (strengthRank(level.strengthLabel) >= strengthRank("strong") ||
        /daily|4h|confluence|structure/i.test(level.sourceLabel ?? "") ||
        level.freshness === "fresh");
}
function isMaterialSmallCapReference(price, currentPrice, highQuality = false) {
    const distance = distanceFromCurrentPct(price, currentPrice);
    return (distance >= SMALL_CAP_ORDINARY_MATERIAL_DISTANCE_PCT ||
        (highQuality && distance >= SMALL_CAP_HIGH_QUALITY_MATERIAL_DISTANCE_PCT));
}
function dedupePrices(prices) {
    const selected = [];
    for (const candidate of prices) {
        const duplicate = selected.some((item) => Math.abs(item.price - candidate.price) / Math.max(item.price, candidate.price, 0.0001) < 0.003);
        if (!duplicate) {
            selected.push(candidate);
        }
    }
    return selected;
}
function fallbackCandidates(params) {
    const candidates = [];
    const nearestSupport = params.levelMap?.nearestSupport;
    const nextStrongSupport = params.levelMap?.nextStrongSupport;
    if (belowCurrent(nearestSupport?.price, params.currentPrice)) {
        candidates.push({
            label: "nearest support",
            price: nearestSupport.price,
            highQuality: isHighQualityLevel(nearestSupport),
        });
    }
    if (belowCurrent(params.context.vwap, params.currentPrice)) {
        candidates.push({ label: "VWAP", price: params.context.vwap });
    }
    if (belowCurrent(params.context.ema9, params.currentPrice)) {
        candidates.push({ label: "EMA9", price: params.context.ema9 });
    }
    if (belowCurrent(params.context.ema20, params.currentPrice)) {
        candidates.push({ label: "EMA20", price: params.context.ema20 });
    }
    if (belowCurrent(nextStrongSupport?.price, params.currentPrice)) {
        candidates.push({
            label: "next stronger support",
            price: nextStrongSupport.price,
            highQuality: isHighQualityLevel(nextStrongSupport),
        });
    }
    return dedupePrices(candidates)
        .filter((candidate) => isMaterialSmallCapReference(candidate.price, params.currentPrice, candidate.highQuality))
        .sort((left, right) => right.price - left.price)
        .slice(0, 3);
}
function continuationLine(levelMap, currentPrice) {
    const materialResistance = levelMap?.resistanceLevels.find((level) => level.price > currentPrice && isMaterialSmallCapReference(level.price, currentPrice, isHighQualityLevel(level)));
    if (!materialResistance) {
        return `Continuation trigger: no material ${SMALL_CAP_ORDINARY_MATERIAL_DISTANCE_PCT}%+ resistance target, or high-quality ${SMALL_CAP_HIGH_QUALITY_MATERIAL_DISTANCE_PCT}%+ level, on the current path map yet.`;
    }
    return `Continuation trigger: reclaim/hold above ${formatPrice(materialResistance.price)} with fresh 1m/5m confirmation.`;
}
function derivePhase(context) {
    const vsVwap = context.priceVsVwapPct;
    const vsEma9 = context.priceVsEma9Pct;
    const vsEma20 = context.priceVsEma20Pct;
    if (context.aboveVwap === false && context.aboveEma9 === false) {
        return "failed_move_risk";
    }
    if (context.aboveVwap === true && context.aboveEma9 === false) {
        return "pullback_forming";
    }
    if ((typeof vsVwap === "number" && vsVwap >= 8) ||
        (typeof vsEma20 === "number" && vsEma20 >= 12) ||
        (typeof vsEma9 === "number" && vsEma9 >= 6)) {
        return "extended";
    }
    if (context.aboveVwap === true && context.aboveEma9 === true) {
        return "continuation_watch";
    }
    return null;
}
function phaseLabel(phase) {
    switch (phase) {
        case "extended":
            return "Extended";
        case "pullback_forming":
            return "Pullback forming";
        case "continuation_watch":
            return "Continuation watch";
        case "failed_move_risk":
            return "Failed move risk";
    }
}
function phaseLine(phase, context) {
    switch (phase) {
        case "extended":
            return `Move phase: extended. Price is ${formatSignedPercent(context.priceVsVwapPct)} vs VWAP and ${formatSignedPercent(context.priceVsEma20Pct)} vs EMA20.`;
        case "pullback_forming":
            return "Move phase: pullback forming. Price is still above VWAP but has cooled below EMA9.";
        case "continuation_watch":
            return "Move phase: continuation watch. Price is holding above VWAP and short-term EMAs.";
        case "failed_move_risk":
            return "Move phase: failed move risk. Price is below VWAP/EMA9, so late buyers may be losing control.";
    }
}
function fallbackLine(candidates) {
    if (candidates.length === 0) {
        return `Fallback watch: no clean ${SMALL_CAP_ORDINARY_MATERIAL_DISTANCE_PCT}%+ pullback reference, or high-quality ${SMALL_CAP_HIGH_QUALITY_MATERIAL_DISTANCE_PCT}%+ level, yet. Treat closer VWAP/EMA noise as posture, not a target.`;
    }
    return `Fallback watch: ${candidates.map((item) => `${formatPrice(item.price)} ${item.label}`).join(" | ")}.`;
}
function volumeLabel(value) {
    switch (value) {
        case "strong":
            return "strong";
        case "expanding":
            return "expanding";
        case "normal":
            return "normal";
        case "thin":
            return "thin";
        case "fading":
            return "fading";
        case "unknown":
            return "unknown";
    }
}
function volumeLine(volumeRead) {
    if (!volumeRead || volumeRead.label === "unknown" || volumeRead.relativeVolumeRatio === null) {
        return `Volume read: unknown${volumeRead?.reason ? ` (${volumeRead.reason})` : ""}.`;
    }
    if (volumeRead.partial &&
        typeof volumeRead.rawRelativeVolumeRatio === "number" &&
        Number.isFinite(volumeRead.rawRelativeVolumeRatio)) {
        return `Volume read: ${volumeLabel(volumeRead.label)} (${volumeRead.relativeVolumeRatio.toFixed(2)}x projected 5m pace; raw ${volumeRead.rawRelativeVolumeRatio.toFixed(2)}x so far).`;
    }
    return `Volume read: ${volumeLabel(volumeRead.label)} (${volumeRead.relativeVolumeRatio.toFixed(2)}x recent 5m average).`;
}
export function buildLiveWatchlistPullbackRead(input) {
    const context = input.technicalContext;
    if (!context ||
        context.confidence === "unavailable" ||
        !Number.isFinite(input.currentPrice) ||
        input.currentPrice <= 0 ||
        context.vwap === null ||
        context.ema9 === null ||
        context.ema20 === null) {
        return null;
    }
    const phase = derivePhase(context);
    if (!phase) {
        return null;
    }
    const candidates = fallbackCandidates({
        currentPrice: input.currentPrice,
        context,
        levelMap: input.levelMap,
    });
    const continuation = continuationLine(input.levelMap, input.currentPrice);
    const lines = [
        `${input.symbol.toUpperCase()} ${phaseLabel(phase)}`,
        phaseLine(phase, context),
        volumeLine(input.volumeRead),
        fallbackLine(candidates),
        continuation,
        `Confidence: ${context.confidence}; ${context.candleCount} 5m candles from ${context.provider ?? "unknown provider"}.`,
    ];
    return {
        phase,
        confidence: context.confidence,
        body: lines.join("\n"),
        metadata: {
            pullbackReadEnabled: true,
            pullbackPhase: phase,
            pullbackConfidence: context.confidence,
            pullbackProvider: context.provider,
            pullbackCandleCount: context.candleCount,
            pullbackVwap: context.vwap,
            pullbackEma9: context.ema9,
            pullbackEma20: context.ema20,
            pullbackPriceVsVwapPct: context.priceVsVwapPct,
            pullbackPriceVsEma9Pct: context.priceVsEma9Pct,
            pullbackPriceVsEma20Pct: context.priceVsEma20Pct,
            pullbackVolumeLabel: input.volumeRead?.label ?? "unknown",
            pullbackVolumeRatio: input.volumeRead?.relativeVolumeRatio ?? null,
            pullbackVolumeRawRatio: input.volumeRead?.rawRelativeVolumeRatio ?? null,
            pullbackCurrentVolume: input.volumeRead?.currentVolume ?? null,
            pullbackAverageVolume: input.volumeRead?.averageVolume ?? null,
            pullbackProjectedVolume: input.volumeRead?.projectedVolume ?? null,
            pullbackVolumePartial: input.volumeRead?.partial ?? false,
            pullbackFallback1: candidates[0]?.price ?? null,
            pullbackFallback2: candidates[1]?.price ?? null,
            pullbackFallback3: candidates[2]?.price ?? null,
            pullbackContinuationTrigger: input.levelMap?.nearestResistance?.price ?? null,
        },
    };
}
