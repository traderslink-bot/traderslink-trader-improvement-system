function roundMetric(value) {
    return Number(value.toFixed(4));
}
function favorableExcursionPct(level, candle) {
    if (level.kind === "resistance") {
        return Math.max(level.representativePrice - candle.low, 0) / Math.max(level.representativePrice, 0.0001);
    }
    return Math.max(candle.high - level.representativePrice, 0) / Math.max(level.representativePrice, 0.0001);
}
function adverseExcursionPct(level, candle) {
    if (level.kind === "resistance") {
        return Math.max(candle.high - level.representativePrice, 0) / Math.max(level.representativePrice, 0.0001);
    }
    return Math.max(level.representativePrice - candle.low, 0) / Math.max(level.representativePrice, 0.0001);
}
function fullWindowExcursions(params) {
    const candles = params.resolutionCandles ?? [];
    if (candles.length === 0) {
        return {
            maxFavorablePct: params.level.maxFavorableExcursionPct ?? 0,
            maxAdversePct: params.level.maxAdverseExcursionPct ?? 0,
        };
    }
    return {
        maxFavorablePct: Math.max(...candles.map((candle) => favorableExcursionPct(params.level, candle))),
        maxAdversePct: Math.max(...candles.map((candle) => adverseExcursionPct(params.level, candle))),
    };
}
function isHighVolume(level) {
    return level.volumeContext.reliability === "reliable" &&
        (level.volumeContext.label === "heavy" || level.volumeContext.label === "elevated");
}
function isSoftHeavilyReusedLevel(level) {
    const heavilyReused = level.touchCount >= 20 || level.sourceEvidenceCount >= 6;
    const softReaction = level.rejectionScore < 0.3 || level.followThroughScore < 0.5;
    return heavilyReused && softReaction;
}
function activeIntradayReferenceTags(level, maxFavorableExcursionPct) {
    const intradayOnly = level.timeframeSources.length === 1 && level.timeframeSources[0] === "5m";
    const activeSource = level.sourceTypes.some((sourceType) => sourceType === "swing_high" ||
        sourceType === "swing_low" ||
        sourceType.startsWith("premarket") ||
        sourceType.startsWith("opening_range"));
    const meaningfulReaction = maxFavorableExcursionPct >= 0.02;
    if (intradayOnly &&
        activeSource &&
        meaningfulReaction &&
        level.strengthLabel === "weak" &&
        (level.outcome === "respected" || (level.outcome === "partial_respect" && !level.brokeAfterPartial))) {
        return ["active_intraday_reference"];
    }
    return [];
}
function singleTouchHigherTimeframeReferenceTags(level, maxFavorableExcursionPct) {
    const singleHigherTimeframe = level.timeframeSources.length === 1 &&
        (level.timeframeSources[0] === "daily" || level.timeframeSources[0] === "4h");
    const swingReference = level.sourceTypes.some((sourceType) => sourceType === "swing_high" || sourceType === "swing_low");
    const singleTouchReference = level.touchCount <= 1 && level.sourceEvidenceCount <= 1;
    const meaningfulReaction = maxFavorableExcursionPct >= 0.02;
    const constructiveFollowThrough = level.followThroughScore >= 0.55;
    if (singleHigherTimeframe &&
        swingReference &&
        singleTouchReference &&
        meaningfulReaction &&
        constructiveFollowThrough &&
        level.strengthLabel === "weak" &&
        (level.outcome === "respected" || (level.outcome === "partial_respect" && !level.brokeAfterPartial))) {
        return ["single_touch_higher_timeframe_reference"];
    }
    return [];
}
function isSmallCleanBreakWatch(level, maxFavorableExcursionPct, maxAdverseExcursionPct) {
    return level.outcome === "broken" &&
        level.broken &&
        !level.brokeAfterPartial &&
        !isHighVolume(level) &&
        maxFavorableExcursionPct < 0.01 &&
        maxAdverseExcursionPct >= 0.01 &&
        maxAdverseExcursionPct < 0.04;
}
function isThinLiquidityBreakWatch(level, maxFavorableExcursionPct, maxAdverseExcursionPct, resolutionCandles) {
    const candles = resolutionCandles ?? [];
    const zeroVolumeBars = candles.filter((candle) => candle.volume <= 0).length;
    const zeroVolumeRatio = candles.length === 0 ? 0 : zeroVolumeBars / candles.length;
    const sparseTape = candles.length >= 6 && zeroVolumeRatio >= 0.4;
    const unreliableVolume = level.volumeContext.reliability !== "reliable" ||
        level.volumeContext.label === "unknown";
    return level.outcome === "broken" &&
        level.broken &&
        !level.brokeAfterPartial &&
        !isHighVolume(level) &&
        unreliableVolume &&
        sparseTape &&
        maxFavorableExcursionPct < 0.01 &&
        maxAdverseExcursionPct >= 0.04 &&
        maxAdverseExcursionPct < 0.05;
}
function isSparseTapeCleanBreakWatch(level, maxAdverseExcursionPct, resolutionCandles) {
    const candles = resolutionCandles ?? [];
    const zeroVolumeBars = candles.filter((candle) => candle.volume <= 0).length;
    const zeroVolumeRatio = candles.length === 0 ? 0 : zeroVolumeBars / candles.length;
    const sparseTape = candles.length >= 6 && zeroVolumeRatio >= 0.4;
    const notHighVolume = !isHighVolume(level);
    return level.outcome === "broken" &&
        level.broken &&
        !level.brokeAfterPartial &&
        notHighVolume &&
        sparseTape &&
        maxAdverseExcursionPct >= 0.01 &&
        maxAdverseExcursionPct < 0.05;
}
function diagnosticTags(level, maxFavorableExcursionPct, maxAdverseExcursionPct, resolutionCandles) {
    const thinLiquidityBreakWatch = isThinLiquidityBreakWatch(level, maxFavorableExcursionPct, maxAdverseExcursionPct, resolutionCandles);
    return [
        ...activeIntradayReferenceTags(level, maxFavorableExcursionPct),
        ...singleTouchHigherTimeframeReferenceTags(level, maxFavorableExcursionPct),
        ...(isSmallCleanBreakWatch(level, maxFavorableExcursionPct, maxAdverseExcursionPct)
            ? ["small_clean_break_watch"]
            : []),
        ...(thinLiquidityBreakWatch
            ? ["thin_liquidity_break_watch"]
            : []),
        ...(!thinLiquidityBreakWatch && isSparseTapeCleanBreakWatch(level, maxAdverseExcursionPct, resolutionCandles)
            ? ["sparse_tape_clean_break_watch"]
            : []),
    ];
}
export function classifyForwardLevelDiagnostic(params) {
    const excursions = fullWindowExcursions(params);
    const maxFavorableExcursionPct = roundMetric(excursions.maxFavorablePct);
    const maxAdverseExcursionPct = roundMetric(excursions.maxAdversePct);
    const tags = diagnosticTags(params.level, maxFavorableExcursionPct, maxAdverseExcursionPct, params.resolutionCandles);
    const reasons = [];
    if (!params.level.touched) {
        reasons.push(`level remained ahead of price; closest approach ${(params.level.closestApproachPct * 100).toFixed(1)}%`);
        return {
            state: "fresh",
            confidence: params.level.closestApproachPct <= 0.02 ? "medium" : "watch",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (params.level.outcome === "respected") {
        reasons.push(`price reacted by ${(maxFavorableExcursionPct * 100).toFixed(1)}% from the level`);
        return {
            state: "respected",
            confidence: "high",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (params.level.outcome === "touched_no_resolution") {
        reasons.push("price touched the level but did not resolve enough to call respect or failure");
        return {
            state: "testing",
            confidence: "watch",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (params.level.outcome === "partial_respect" && !params.level.brokeAfterPartial) {
        reasons.push(`price partially reacted by ${(maxFavorableExcursionPct * 100).toFixed(1)}%`);
        return {
            state: "respected",
            confidence: "medium",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (!params.level.broken) {
        reasons.push("level is still unresolved");
        return {
            state: "testing",
            confidence: "watch",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (maxAdverseExcursionPct < 0.01) {
        reasons.push(`break stayed under 1% through the level (${(maxAdverseExcursionPct * 100).toFixed(1)}%)`);
        return {
            state: "testing",
            confidence: "watch",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (isSoftHeavilyReusedLevel(params.level)) {
        reasons.push(`level was heavily reused with soft reaction evidence (touches=${params.level.touchCount}, evidence=${params.level.sourceEvidenceCount})`);
        return {
            state: "over_tested",
            confidence: "medium",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (isHighVolume(params.level) && maxAdverseExcursionPct >= 0.015) {
        reasons.push(`price drove ${(maxAdverseExcursionPct * 100).toFixed(1)}% through the level on ${params.level.volumeContext.label} volume`);
        return {
            state: "consumed_by_momentum",
            confidence: "high",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (maxAdverseExcursionPct >= 0.05) {
        reasons.push(`price drove ${(maxAdverseExcursionPct * 100).toFixed(1)}% through the level in the forward window`);
        return {
            state: "consumed_by_momentum",
            confidence: "high",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (params.level.brokeAfterPartial) {
        reasons.push(`level gave a partial reaction first, then broke by ${(maxAdverseExcursionPct * 100).toFixed(1)}%`);
        return {
            state: "broken",
            confidence: "medium",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (tags.includes("small_clean_break_watch")) {
        reasons.push(`small clean break without elevated/heavy volume; watch before treating it as a strength-label miss`);
        reasons.push(`price broke the level by ${(maxAdverseExcursionPct * 100).toFixed(1)}%`);
        return {
            state: "broken",
            confidence: "watch",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (tags.includes("thin_liquidity_break_watch")) {
        reasons.push(`clean break happened in a sparse/zero-volume resolution window; watch before treating it as a strength-label miss`);
        reasons.push(`price broke the level by ${(maxAdverseExcursionPct * 100).toFixed(1)}%`);
        return {
            state: "broken",
            confidence: "watch",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    if (tags.includes("sparse_tape_clean_break_watch")) {
        reasons.push(`clean break happened in a sparse low-volume resolution window; watch before treating it as a strength-label miss`);
        reasons.push(`price broke the level by ${(maxAdverseExcursionPct * 100).toFixed(1)}%`);
        return {
            state: "broken",
            confidence: "watch",
            tags,
            reasons,
            maxFavorableExcursionPct,
            maxAdverseExcursionPct,
        };
    }
    reasons.push(`price broke the level by ${(maxAdverseExcursionPct * 100).toFixed(1)}%`);
    return {
        state: "broken",
        confidence: "medium",
        tags,
        reasons,
        maxFavorableExcursionPct,
        maxAdverseExcursionPct,
    };
}
