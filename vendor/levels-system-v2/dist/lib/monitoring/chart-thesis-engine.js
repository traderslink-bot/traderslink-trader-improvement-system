import { evaluateLiveVolumeExpansionConfirmationQuality } from "./live-confirmation-quality.js";
function formatPrice(value) {
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}
function formatPct(value) {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
}
function bodyTop(candle) {
    return Math.max(candle.open, candle.close);
}
function bodyBottom(candle) {
    return Math.min(candle.open, candle.close);
}
function isValidCandle(candle) {
    return (Number.isFinite(candle.timestamp) &&
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        candle.open > 0 &&
        candle.high > 0 &&
        candle.low > 0 &&
        candle.close > 0 &&
        candle.high >= candle.low);
}
function recentCandles(series, count) {
    return (series?.candles ?? [])
        .filter(isValidCandle)
        .sort((left, right) => left.timestamp - right.timestamp)
        .slice(-count);
}
function rangeLabel(low, high) {
    return Math.abs(high - low) / Math.max(high, 0.0001) <= 0.01
        ? formatPrice(high)
        : `${formatPrice(low)}-${formatPrice(high)}`;
}
function candleRange(candle) {
    return candle.high - candle.low;
}
function upperCloseRatio(candle) {
    const range = candleRange(candle);
    return range <= 0 ? 0 : (candle.close - candle.low) / range;
}
function candleDateKey(candle) {
    return new Date(candle.timestamp).toISOString().slice(0, 10);
}
function latestSessionCandles(candles) {
    const latest = candles.at(-1);
    if (!latest) {
        return [];
    }
    const latestDateKey = candleDateKey(latest);
    const session = candles.filter((candle) => candleDateKey(candle) === latestDateKey);
    return session.length >= 8 ? session : candles.slice(-Math.min(candles.length, 30));
}
function confidenceFromScore(score) {
    if (score >= 82)
        return "high";
    if (score >= 62)
        return "medium";
    return "low";
}
function statusLabel(status) {
    switch (status) {
        case "active":
            return "Active";
        case "watch":
            return "Setup watch";
        case "early":
            return "Early";
    }
}
function findSelloffCandidate(timeframe, candles) {
    const candidates = [];
    const latestIndex = candles.length - 1;
    for (let index = Math.max(0, candles.length - 12); index < latestIndex; index += 1) {
        const candle = candles[index];
        const dropPct = ((candle.close - candle.open) / candle.open) * 100;
        const rangePct = ((candle.high - candle.low) / candle.high) * 100;
        const closeInLowerHalf = candle.close <= candle.low + (candle.high - candle.low) * 0.55;
        if ((dropPct <= -12 || rangePct >= 18) && closeInLowerHalf) {
            candidates.push({ timeframe, candles, index, dropPct, rangePct });
        }
    }
    return candidates
        .sort((left, right) => Math.max(right.rangePct, Math.abs(right.dropPct)) - Math.max(left.rangePct, Math.abs(left.dropPct)))[0] ?? null;
}
function bestSelloffCandidate(input) {
    const daily = findSelloffCandidate("daily", recentCandles(input.seriesMap.daily, 20));
    const fourHour = findSelloffCandidate("4h", recentCandles(input.seriesMap["4h"], 42));
    if (!daily)
        return fourHour;
    if (!fourHour)
        return daily;
    return Math.max(daily.rangePct, Math.abs(daily.dropPct)) >= Math.max(fourHour.rangePct, Math.abs(fourHour.dropPct))
        ? daily
        : fourHour;
}
function buildReturnToSelloffOriginThesis(input) {
    const candidate = bestSelloffCandidate(input);
    if (!candidate) {
        return null;
    }
    const selloff = candidate.candles[candidate.index];
    const after = candidate.candles.slice(candidate.index + 1);
    if (after.length === 0) {
        return null;
    }
    const buyerResponseLow = Math.min(...after.map((candle) => candle.low));
    const bouncePct = ((input.currentPrice - buyerResponseLow) / Math.max(buyerResponseLow, 0.0001)) * 100;
    if (bouncePct < 6) {
        return null;
    }
    const selloffOriginLow = Math.min(bodyTop(selloff), selloff.high);
    const selloffOriginHigh = Math.max(bodyTop(selloff), selloff.high);
    if (selloffOriginHigh <= input.currentPrice) {
        return null;
    }
    const reclaimTrigger = Math.max(selloff.close, buyerResponseLow + (selloffOriginHigh - buyerResponseLow) * 0.38);
    const triggerGapPct = ((reclaimTrigger - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    const reclaimedTrigger = input.currentPrice >= reclaimTrigger;
    if (!reclaimedTrigger && triggerGapPct > 15) {
        return null;
    }
    const roomToTargetPct = ((selloffOriginLow - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 8) {
        return null;
    }
    const sessionsAgo = candidate.candles.length - 1 - candidate.index;
    const status = reclaimedTrigger ? "active" : triggerGapPct <= 5 ? "watch" : "early";
    const score = 38 +
        Math.min(16, Math.max(0, bouncePct)) +
        Math.min(18, Math.max(0, roomToTargetPct)) +
        (reclaimedTrigger ? 18 : Math.max(0, 12 - triggerGapPct)) -
        (status === "early" ? 8 : 0) -
        (candidate.timeframe === "daily" ? Math.max(0, sessionsAgo - 5) * 1.5 : 0);
    const origin = rangeLabel(selloffOriginLow, selloffOriginHigh);
    const triggerLine = reclaimedTrigger
        ? `Buyers responded near ${formatPrice(buyerResponseLow)}; holding above ${formatPrice(reclaimTrigger)} keeps the return-to-origin path in play.`
        : `Buyers responded near ${formatPrice(buyerResponseLow)}; a reclaim through ${formatPrice(reclaimTrigger)} is still needed before the return-to-origin path is active.`;
    return {
        type: "return_to_selloff_origin",
        label: "Return to selloff origin",
        timeframe: candidate.timeframe,
        status,
        confidence: confidenceFromScore(score),
        score,
        triggerLow: reclaimTrigger,
        triggerHigh: reclaimTrigger,
        targetLow: selloffOriginLow,
        targetHigh: selloffOriginHigh,
        invalidationLevel: buyerResponseLow,
        roomToTargetPct,
        sessionsAgo,
        evidence: [
            `selloff ${sessionsAgo} ${candidate.timeframe === "daily" ? "session" : "bar"}${sessionsAgo === 1 ? "" : "s"} ago`,
            `buyers responded near ${formatPrice(buyerResponseLow)}`,
            reclaimedTrigger
                ? `reclaimed ${formatPrice(reclaimTrigger)}`
                : `${formatPct(triggerGapPct)} below reclaim trigger`,
            `${formatPct(roomToTargetPct)} room to selloff-origin lower edge`,
        ],
        selloffOriginLow,
        selloffOriginHigh,
        buyerResponseLow,
        reclaimTrigger,
        returnTargetLow: selloffOriginLow,
        returnTargetHigh: selloffOriginHigh,
        lines: [
            `${input.symbol.toUpperCase()} had a sharp ${candidate.timeframe} selloff ${sessionsAgo} ${candidate.timeframe === "daily" ? "session" : "bar"}${sessionsAgo === 1 ? "" : "s"} ago from the ${origin} area.`,
            triggerLine,
            `If that reclaim holds, the chart has room back toward ${origin} (${formatPct(roomToTargetPct)} to the lower edge).`,
        ],
    };
}
function buildFailedBreakdownReclaimThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 24);
    const latest = candles.at(-1);
    if (!latest || candles.length < 6) {
        return null;
    }
    const prior = candles.slice(-7, -1);
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const sweptLow = latest.low < priorLow * 0.985;
    const reclaimed = latest.close > priorLow && input.currentPrice > priorLow;
    if (!sweptLow || !reclaimed || priorHigh <= input.currentPrice) {
        return null;
    }
    const roomToTargetPct = ((priorHigh - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 8 || roomToTargetPct > 120) {
        return null;
    }
    const score = 55 + Math.min(25, roomToTargetPct) + (input.currentPrice > latest.open ? 8 : 0);
    return {
        type: "failed_breakdown_reclaim",
        label: "Failed breakdown reclaim",
        timeframe: "4h",
        status: "active",
        confidence: confidenceFromScore(score),
        score,
        triggerLow: priorLow,
        triggerHigh: priorLow,
        targetLow: priorHigh,
        targetHigh: priorHigh,
        invalidationLevel: latest.low,
        roomToTargetPct,
        evidence: [
            `swept below ${formatPrice(priorLow)} and reclaimed`,
            `range high sits near ${formatPrice(priorHigh)}`,
        ],
        lines: [
            `${input.symbol.toUpperCase()} swept below the recent ${formatPrice(priorLow)} support area and reclaimed it.`,
            `Holding above ${formatPrice(priorLow)} keeps the failed-breakdown read alive.`,
            `If buyers keep control, the natural return area is the prior range high near ${formatPrice(priorHigh)} (${formatPct(roomToTargetPct)}).`,
        ],
    };
}
function buildCompressionBreakoutThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 18);
    if (candles.length < 8) {
        return null;
    }
    const base = candles.slice(-7);
    const baseHigh = Math.max(...base.map((candle) => candle.high));
    const baseLow = Math.min(...base.map((candle) => candle.low));
    const baseRangePct = ((baseHigh - baseLow) / Math.max(input.currentPrice, 0.0001)) * 100;
    const nearBaseHigh = input.currentPrice >= baseHigh * 0.96;
    if (baseRangePct > 16 || !nearBaseHigh) {
        return null;
    }
    const expansionTarget = baseHigh + (baseHigh - baseLow);
    const roomToTargetPct = ((expansionTarget - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 8) {
        return null;
    }
    const score = 48 + Math.max(0, 16 - baseRangePct) + Math.min(25, roomToTargetPct);
    return {
        type: "compression_breakout",
        label: "Compression breakout",
        timeframe: "4h",
        status: input.currentPrice >= baseHigh ? "active" : "watch",
        confidence: confidenceFromScore(score),
        score,
        triggerLow: baseHigh,
        triggerHigh: baseHigh,
        targetLow: expansionTarget,
        targetHigh: expansionTarget,
        invalidationLevel: baseLow,
        roomToTargetPct,
        evidence: [
            `recent 4h base compressed inside ${formatPrice(baseLow)}-${formatPrice(baseHigh)}`,
            `price is pressing the top of the base`,
        ],
        lines: [
            `${input.symbol.toUpperCase()} is compressing inside a tight 4h base from ${formatPrice(baseLow)} to ${formatPrice(baseHigh)}.`,
            `Acceptance above ${formatPrice(baseHigh)} would turn the base into a breakout setup.`,
            `A measured first expansion area is near ${formatPrice(expansionTarget)} (${formatPct(roomToTargetPct)}).`,
        ],
    };
}
function buildGapFillReclaimThesis(input) {
    const candles = recentCandles(input.seriesMap.daily, 8);
    const latest = candles.at(-1);
    const prior = candles.at(-2);
    if (!latest || !prior) {
        return null;
    }
    const priorClose = prior.close;
    const gapDownPct = ((latest.open - priorClose) / Math.max(priorClose, 0.0001)) * 100;
    const reclaimedFromOpenPct = ((input.currentPrice - latest.open) / Math.max(latest.open, 0.0001)) * 100;
    const reclaimedFromLowPct = ((input.currentPrice - latest.low) / Math.max(latest.low, 0.0001)) * 100;
    const target = Math.min(priorClose, prior.high);
    if (gapDownPct > -10 ||
        reclaimedFromOpenPct < 6 ||
        reclaimedFromLowPct < 10 ||
        target <= input.currentPrice) {
        return null;
    }
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 10) {
        return null;
    }
    const score = 52 +
        Math.min(18, Math.abs(gapDownPct)) +
        Math.min(15, reclaimedFromLowPct) +
        Math.min(20, roomToTargetPct);
    return {
        type: "gap_fill_reclaim",
        label: "Gap-fill reclaim",
        timeframe: "daily",
        status: "active",
        confidence: confidenceFromScore(score),
        score,
        triggerLow: latest.open,
        triggerHigh: latest.open,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: latest.low,
        roomToTargetPct,
        evidence: [
            `gapped down ${formatPct(gapDownPct)} from prior close`,
            `buyers reclaimed ${formatPct(reclaimedFromOpenPct)} from the gap open`,
            `gap-fill target sits near ${formatPrice(target)}`,
        ],
        lines: [
            `${input.symbol.toUpperCase()} opened well below the prior close near ${formatPrice(priorClose)} and buyers are reclaiming the gap-down open.`,
            `Holding above the ${formatPrice(latest.open)} open keeps the gap-fill route in play.`,
            `The clean fill target is near ${formatPrice(target)} (${formatPct(roomToTargetPct)} from current price).`,
        ],
    };
}
function buildOpeningRangeExpansionThesis(input) {
    const session = latestSessionCandles(recentCandles(input.seriesMap["5m"], 90));
    if (session.length < 10) {
        return null;
    }
    const openingRange = session.slice(0, 6);
    const rangeHigh = Math.max(...openingRange.map((candle) => candle.high));
    const rangeLow = Math.min(...openingRange.map((candle) => candle.low));
    const rangePct = ((rangeHigh - rangeLow) / Math.max(rangeLow, 0.0001)) * 100;
    const pressingBreakout = input.currentPrice >= rangeHigh * 0.985;
    if (rangePct < 5 || !pressingBreakout) {
        return null;
    }
    const expansionTarget = rangeHigh + (rangeHigh - rangeLow) * 1.25;
    if (expansionTarget <= input.currentPrice) {
        return null;
    }
    const roomToTargetPct = ((expansionTarget - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 10) {
        return null;
    }
    const score = 50 + Math.min(18, rangePct) + Math.min(24, roomToTargetPct) + (input.currentPrice >= rangeHigh ? 8 : 0);
    return {
        type: "opening_range_expansion",
        label: "Opening range expansion",
        timeframe: "5m",
        status: input.currentPrice >= rangeHigh ? "active" : "watch",
        confidence: confidenceFromScore(score),
        score,
        triggerLow: rangeHigh,
        triggerHigh: rangeHigh,
        targetLow: expansionTarget,
        targetHigh: expansionTarget,
        invalidationLevel: rangeLow,
        roomToTargetPct,
        evidence: [
            `opening range ${formatPrice(rangeLow)}-${formatPrice(rangeHigh)}`,
            `price is pressing the opening-range high`,
            `measured expansion target near ${formatPrice(expansionTarget)}`,
        ],
        lines: [
            `${input.symbol.toUpperCase()} built an opening range from ${formatPrice(rangeLow)} to ${formatPrice(rangeHigh)} and is pressing the top of it.`,
            `Acceptance above ${formatPrice(rangeHigh)} gives traders a clean breakout trigger instead of chasing random ticks.`,
            `The measured expansion area is near ${formatPrice(expansionTarget)} (${formatPct(roomToTargetPct)}).`,
        ],
    };
}
function buildLiveVolumeExpansionConfirmationThesis(input) {
    const session = latestSessionCandles(recentCandles(input.seriesMap["5m"], 120));
    const latest = session.at(-1);
    if (!latest || session.length < 18) {
        return null;
    }
    const prior = session.slice(-18, -1);
    const positiveVolumeCandles = prior.filter((candle) => Number.isFinite(candle.volume) && candle.volume > 0);
    if (prior.length < 12 || positiveVolumeCandles.length < 8 || !Number.isFinite(latest.volume) || latest.volume <= 0) {
        return null;
    }
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const priorRange = priorHigh - priorLow;
    const priorRangePct = (priorRange / Math.max(priorLow, 0.0001)) * 100;
    const latestRange = candleRange(latest);
    const latestRangePct = (latestRange / Math.max(latest.low, 0.0001)) * 100;
    const averagePriorVolume = positiveVolumeCandles.reduce((sum, candle) => sum + candle.volume, 0) / positiveVolumeCandles.length;
    const volumeRatio = latest.volume / Math.max(averagePriorVolume, 1);
    const brokeShortRange = latest.high >= priorHigh * 1.01 && input.currentPrice >= priorHigh * 0.995;
    const holdingExpansion = input.currentPrice >= Math.max(priorHigh * 0.995, latest.low + latestRange * 0.52);
    const strongClose = upperCloseRatio(latest) >= 0.58 || latest.close >= priorHigh;
    const closeExtensionPct = ((input.currentPrice - priorHigh) / Math.max(priorHigh, 0.0001)) * 100;
    const quality = evaluateLiveVolumeExpansionConfirmationQuality({
        currentPrice: input.currentPrice,
        latestRangePct,
        priorRangePct,
        closeExtensionPct,
        latestTimestamp: latest.timestamp,
    });
    if (!quality.passed ||
        !brokeShortRange ||
        !holdingExpansion ||
        !strongClose ||
        volumeRatio < 2) {
        return null;
    }
    const trigger = priorHigh;
    const expansionUnit = Math.max(priorRange, latestRange);
    const target = Math.max(priorHigh + expansionUnit * 1.15, input.currentPrice + latestRange * 0.8);
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 8 || roomToTargetPct > 120) {
        return null;
    }
    const score = 56 +
        Math.min(18, volumeRatio * 4) +
        Math.min(16, latestRangePct) +
        Math.min(20, roomToTargetPct) +
        (input.currentPrice >= trigger ? 8 : 0);
    return {
        type: "live_volume_expansion_confirmation",
        label: "Live volume expansion confirmation",
        timeframe: "5m",
        status: "active",
        confidence: confidenceFromScore(score),
        score,
        triggerLow: trigger,
        triggerHigh: trigger,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: Math.min(latest.low, trigger * 0.96),
        roomToTargetPct,
        evidence: [
            `cleared short-term 5m high near ${formatPrice(trigger)}`,
            `${volumeRatio.toFixed(1)}x recent 5m volume`,
            `close is ${formatPct(closeExtensionPct)} above the trigger`,
            `${formatPct(roomToTargetPct)} measured room to first expansion area`,
        ],
        lines: [
            `${input.symbol.toUpperCase()} is giving fresh 5m confirmation through the short-term high near ${formatPrice(trigger)}.`,
            `Volume expanded to ${volumeRatio.toFixed(1)}x the recent 5m average, so this is live tape confirmation rather than a quiet-base prediction.`,
            `If buyers hold the breakout area, the first practical expansion target is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}).`,
        ],
    };
}
function buildImpulseFlagContinuationThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 30);
    const latest = candles.at(-1);
    if (!latest || candles.length < 9) {
        return null;
    }
    const candidates = [];
    for (let index = Math.max(0, candles.length - 14); index <= candles.length - 4; index += 1) {
        const impulse = candles[index];
        const impulseRange = impulse.high - impulse.low;
        const impulsePct = (impulseRange / Math.max(impulse.low, 0.0001)) * 100;
        const closedStrong = impulse.close >= impulse.low + impulseRange * 0.62;
        if (impulsePct < 25 || !closedStrong) {
            continue;
        }
        const flag = candles.slice(index + 1);
        const flagLow = Math.min(...flag.map((candle) => candle.low));
        const flagHigh = Math.max(...flag.map((candle) => candle.high));
        const upperHalfHold = flagLow >= impulse.low + impulseRange * 0.45;
        const pressingFlagHigh = input.currentPrice >= flagHigh * 0.96;
        const target = impulse.high + impulseRange * 0.55;
        if (!upperHalfHold || !pressingFlagHigh || target <= input.currentPrice) {
            continue;
        }
        const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
        if (roomToTargetPct < 12) {
            continue;
        }
        const barsAgo = candles.length - 1 - index;
        const score = 54 +
            Math.min(20, impulsePct / 2) +
            Math.min(22, roomToTargetPct) +
            (input.currentPrice >= flagHigh ? 6 : 0);
        candidates.push({
            type: "impulse_flag_continuation",
            label: "Impulse flag continuation",
            timeframe: "4h",
            status: input.currentPrice >= flagHigh ? "active" : "watch",
            confidence: confidenceFromScore(score),
            score,
            triggerLow: flagHigh,
            triggerHigh: flagHigh,
            targetLow: target,
            targetHigh: target,
            invalidationLevel: flagLow,
            roomToTargetPct,
            sessionsAgo: barsAgo,
            evidence: [
                `${formatPct(impulsePct)} impulse ${barsAgo} 4h bars ago`,
                `pullback held the upper half above ${formatPrice(flagLow)}`,
                `continuation target near ${formatPrice(target)}`,
            ],
            lines: [
                `${input.symbol.toUpperCase()} made a strong 4h impulse ${barsAgo} bars ago and the pullback has held the upper half of that move.`,
                `A push through ${formatPrice(flagHigh)} would confirm the flag is turning back into continuation.`,
                `The next measured continuation area is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}).`,
            ],
        });
    }
    return candidates.sort((left, right) => right.score - left.score)[0] ?? null;
}
function buildMomentumExpansionContinuationThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 24);
    const latest = candles.at(-1);
    if (!latest || candles.length < 8) {
        return null;
    }
    const prior = candles.slice(-8, -1);
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const averagePriorRange = prior.reduce((sum, candle) => sum + candleRange(candle), 0) / Math.max(prior.length, 1);
    const latestRange = candleRange(latest);
    const expansionPct = (latestRange / Math.max(latest.low, 0.0001)) * 100;
    const rangeExpansionRatio = latestRange / Math.max(averagePriorRange, 0.0001);
    const brokePriorHigh = latest.high > priorHigh * 1.03;
    const strongClose = upperCloseRatio(latest) >= 0.62;
    const holdingBreakout = input.currentPrice >= Math.max(bodyBottom(latest), priorHigh * 0.98);
    if (expansionPct < 18 ||
        rangeExpansionRatio < 1.6 ||
        !brokePriorHigh ||
        !strongClose ||
        !holdingBreakout) {
        return null;
    }
    const measuredTarget = latest.close + latestRange * 0.35;
    const priorRangeTarget = priorHigh + (priorHigh - priorLow) * 0.35;
    const target = Math.max(measuredTarget, priorRangeTarget);
    if (target <= input.currentPrice) {
        return null;
    }
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 12) {
        return null;
    }
    const score = 50 +
        Math.min(20, expansionPct / 2) +
        Math.min(14, rangeExpansionRatio * 3) +
        Math.min(20, roomToTargetPct);
    return {
        type: "momentum_expansion_continuation",
        label: "Momentum expansion continuation",
        timeframe: "4h",
        status: "active",
        confidence: confidenceFromScore(score),
        score,
        triggerLow: priorHigh,
        triggerHigh: priorHigh,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: Math.max(priorHigh * 0.92, latest.low),
        roomToTargetPct,
        evidence: [
            `${formatPct(expansionPct)} latest 4h range`,
            `${rangeExpansionRatio.toFixed(1)}x recent average range`,
            `cleared prior range high near ${formatPrice(priorHigh)}`,
        ],
        lines: [
            `${input.symbol.toUpperCase()} is in a live 4h expansion candle that cleared the recent range high near ${formatPrice(priorHigh)}.`,
            `As long as price holds above the breakout area, this is a momentum-continuation read rather than a pullback read.`,
            `The measured continuation area is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}).`,
        ],
    };
}
function buildWashoutBaseReversalThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 22);
    const latest = candles.at(-1);
    if (!latest || candles.length < 8) {
        return null;
    }
    const lookback = candles.slice(-10);
    const prior = lookback.slice(0, -1);
    const recent = lookback.slice(-4);
    if (prior.length < 5 || recent.length < 3) {
        return null;
    }
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const recentLow = Math.min(...recent.map((candle) => candle.low));
    const recentHigh = Math.max(...recent.map((candle) => candle.high));
    const range = priorHigh - Math.min(priorLow, recentLow);
    const rangePct = (range / Math.max(input.currentPrice, 0.0001)) * 100;
    const positionPct = ((input.currentPrice - recentLow) / Math.max(range, 0.0001)) * 100;
    const selloffPct = ((priorHigh - recentLow) / Math.max(priorHigh, 0.0001)) * 100;
    const currentAboveRecentLowPct = ((input.currentPrice - recentLow) / Math.max(recentLow, 0.0001)) * 100;
    const repeatedLowTouches = recent.filter((candle) => candle.low <= recentLow * 1.04).length >= 2;
    const reclaimedRecentOpen = input.currentPrice >= Math.min(...recent.map((candle) => candle.open)) * 0.995;
    const constructiveLatest = latest.close >= latest.open || upperCloseRatio(latest) >= 0.42;
    const notAlreadyExtended = input.currentPrice <= priorHigh * 0.78;
    if (selloffPct < 14 ||
        selloffPct > 32 ||
        rangePct < 14 ||
        positionPct > 38 ||
        currentAboveRecentLowPct > 18 ||
        !notAlreadyExtended ||
        (!repeatedLowTouches && !constructiveLatest)) {
        return null;
    }
    const reclaimTrigger = Math.max(recentHigh, recentLow + range * 0.22);
    const target = Math.min(priorHigh, recentLow + range * 0.72);
    if (target <= input.currentPrice || reclaimTrigger <= recentLow) {
        return null;
    }
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    const triggerGapPct = ((reclaimTrigger - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 18 || triggerGapPct > 35) {
        return null;
    }
    const reclaimedTrigger = input.currentPrice >= reclaimTrigger;
    const status = reclaimedTrigger
        ? "active"
        : triggerGapPct <= 10 && (reclaimedRecentOpen || constructiveLatest)
            ? "watch"
            : "early";
    const rawScore = 32 +
        Math.min(18, selloffPct / 1.5) +
        Math.min(20, roomToTargetPct / 2) +
        (repeatedLowTouches ? 8 : 0) +
        (constructiveLatest ? 5 : 0) +
        (reclaimedTrigger ? 10 : Math.max(0, 8 - triggerGapPct / 2)) -
        (status === "early" ? 8 : 0);
    const score = status === "active"
        ? rawScore
        : Math.min(rawScore, status === "watch" ? 68 : 58);
    return {
        type: "washout_base_reversal",
        label: "Washout base reversal",
        timeframe: "4h",
        status,
        confidence: confidenceFromScore(score),
        score,
        triggerLow: reclaimTrigger,
        triggerHigh: reclaimTrigger,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: recentLow * 0.96,
        roomToTargetPct,
        evidence: [
            `washed out ${formatPct(-selloffPct)} from the recent 4h shelf`,
            `base low near ${formatPrice(recentLow)}`,
            `${formatPct(roomToTargetPct)} room back toward the lower return shelf`,
        ],
        buyerResponseLow: recentLow,
        reclaimTrigger,
        returnTargetLow: target,
        returnTargetHigh: priorHigh,
        lines: [
            `${input.symbol.toUpperCase()} is washed out near the lower end of its recent 4h range after a ${formatPct(-selloffPct)} slide from the prior shelf.`,
            reclaimedTrigger
                ? `Price has reclaimed the first base trigger near ${formatPrice(reclaimTrigger)}; holding that area keeps the reversal path alive.`
                : `The first useful reclaim trigger is near ${formatPrice(reclaimTrigger)}; without that, this is still a base-reversal watch, not confirmation.`,
            `If buyers keep defending ${formatPrice(recentLow)}, the first practical return area is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}), with the wider shelf up toward ${formatPrice(priorHigh)}.`,
        ],
    };
}
function buildDamagedRangeReclaimThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 22);
    const latest = candles.at(-1);
    if (!latest || candles.length < 9) {
        return null;
    }
    const lookback = candles.slice(-10);
    const prior = lookback.slice(0, -1);
    const recent = lookback.slice(-4);
    if (prior.length < 5 || recent.length < 3) {
        return null;
    }
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const recentLow = Math.min(...recent.map((candle) => candle.low));
    const recentHigh = Math.max(...recent.map((candle) => candle.high));
    const range = priorHigh - Math.min(priorLow, recentLow);
    const selloffPct = ((priorHigh - recentLow) / Math.max(priorHigh, 0.0001)) * 100;
    const positionPct = ((input.currentPrice - recentLow) / Math.max(range, 0.0001)) * 100;
    const currentAboveRecentLowPct = ((input.currentPrice - recentLow) / Math.max(recentLow, 0.0001)) * 100;
    const reclaimedRecentBody = input.currentPrice >= Math.min(...recent.map((candle) => bodyTop(candle))) * 0.98;
    const latestCloseAbovePrevious = latest.close > (candles.at(-2)?.close ?? Number.POSITIVE_INFINITY);
    const recentUpperCloses = recent.filter((candle) => upperCloseRatio(candle) >= 0.45).length;
    const recentLowIndex = recent.findIndex((candle) => candle.low === recentLow);
    const candlesAfterDamageLow = recent.slice(recentLowIndex + 1);
    const higherLowAfterDamage = candlesAfterDamageLow.length > 0 && Math.min(...candlesAfterDamageLow.map((candle) => candle.low)) > recentLow * 1.02;
    if (selloffPct <= 32 ||
        selloffPct > 75 ||
        positionPct > 35 ||
        (!reclaimedRecentBody && currentAboveRecentLowPct < 4)) {
        return null;
    }
    const reclaimTrigger = Math.max(recentHigh, recentLow + range * 0.3);
    const target = Math.min(priorHigh, recentLow + range * 0.62);
    if (target <= input.currentPrice || reclaimTrigger <= recentLow) {
        return null;
    }
    const triggerGapPct = ((reclaimTrigger - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 18 || triggerGapPct > 35) {
        return null;
    }
    const hasFreshRepairCandle = latestCloseAbovePrevious && triggerGapPct <= 30 && (currentAboveRecentLowPct >= 15 || recentUpperCloses >= 2);
    const hasConstructiveRepairShelf = recentUpperCloses >= 3 && higherLowAfterDamage && triggerGapPct <= 20;
    if (selloffPct > 60 ||
        currentAboveRecentLowPct < 8 ||
        !reclaimedRecentBody ||
        (!hasFreshRepairCandle && !hasConstructiveRepairShelf)) {
        return null;
    }
    const reclaimedTrigger = input.currentPrice >= reclaimTrigger;
    const status = reclaimedTrigger
        ? "active"
        : triggerGapPct <= 15
            ? "watch"
            : "early";
    const score = 44 +
        Math.min(18, (selloffPct - 32) / 1.6) +
        Math.min(22, roomToTargetPct / 2) +
        Math.min(12, currentAboveRecentLowPct / 2) +
        (reclaimedRecentBody ? 8 : 0) +
        (hasFreshRepairCandle ? 8 : 0) +
        (hasConstructiveRepairShelf ? 6 : 0) +
        (reclaimedTrigger ? 10 : Math.max(0, 8 - triggerGapPct / 4)) -
        (status === "early" ? 6 : 0);
    return {
        type: "damaged_range_reclaim",
        label: "Damaged range reclaim",
        timeframe: "4h",
        status,
        confidence: confidenceFromScore(score),
        score,
        triggerLow: reclaimTrigger,
        triggerHigh: reclaimTrigger,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: recentLow * 0.93,
        roomToTargetPct,
        evidence: [
            `range was damaged by a ${formatPct(-selloffPct)} 4h break`,
            `buyers lifted price ${formatPct(currentAboveRecentLowPct)} from the damage low`,
            `${formatPct(roomToTargetPct)} room back toward the first broken shelf`,
        ],
        buyerResponseLow: recentLow,
        reclaimTrigger,
        returnTargetLow: target,
        returnTargetHigh: priorHigh,
        lines: [
            `${input.symbol.toUpperCase()} is not a clean base reversal; the prior 4h range was damaged by a ${formatPct(-selloffPct)} break from the shelf.`,
            reclaimedTrigger
                ? `Price has reclaimed the damaged-range trigger near ${formatPrice(reclaimTrigger)}, which puts the first broken shelf back in play.`
                : `A reclaim through ${formatPrice(reclaimTrigger)} is the confirmation trigger that buyers are repairing the damaged range.`,
            `If that repair holds, the first practical destination is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}), with the wider broken shelf up toward ${formatPrice(priorHigh)}.`,
        ],
    };
}
function buildBelowRangeBuyerReclaimThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 18);
    const latest = candles.at(-1);
    if (!latest || candles.length < 9) {
        return null;
    }
    const prior = candles.slice(-9, -1);
    const recent = candles.slice(-3);
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const range = priorHigh - priorLow;
    const rangePct = (range / Math.max(input.currentPrice, 0.0001)) * 100;
    const positionPct = ((input.currentPrice - priorLow) / Math.max(range, 0.0001)) * 100;
    const recentLow = Math.min(...recent.map((candle) => candle.low));
    const bounceFromRecentLowPct = ((input.currentPrice - recentLow) / Math.max(recentLow, 0.0001)) * 100;
    const latestRangePct = (candleRange(latest) / Math.max(input.currentPrice, 0.0001)) * 100;
    const latestCloseRatio = upperCloseRatio(latest);
    const constructiveLatest = latest.close >= latest.open || latestCloseRatio >= 0.58;
    const reclaimedRecentBody = input.currentPrice >= Math.min(...recent.map((candle) => bodyTop(candle))) * 0.98;
    const touchedOrUndercutRangeLow = recentLow <= priorLow * 1.04;
    const notPureCollapse = latest.close >= latest.low + candleRange(latest) * 0.45;
    const notAlreadyUpperRange = positionPct <= 48;
    const quietEnoughForRead = latestRangePct <= 42;
    if (rangePct < 18 ||
        rangePct > 160 ||
        positionPct > 48 ||
        bounceFromRecentLowPct < 9 ||
        !notAlreadyUpperRange ||
        !constructiveLatest ||
        !reclaimedRecentBody ||
        !touchedOrUndercutRangeLow ||
        !notPureCollapse ||
        !quietEnoughForRead) {
        return null;
    }
    const midpointTarget = priorLow + range * 0.55;
    const upperShelfTarget = priorLow + range * 0.82;
    const target = positionPct < 12 ? midpointTarget : upperShelfTarget;
    if (target <= input.currentPrice) {
        return null;
    }
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 18 || roomToTargetPct > 260) {
        return null;
    }
    const reclaimTrigger = priorLow;
    const triggerGapPct = ((reclaimTrigger - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    const reclaimedRangeLow = input.currentPrice >= reclaimTrigger;
    const status = reclaimedRangeLow
        ? "active"
        : triggerGapPct <= 12
            ? "watch"
            : "early";
    const score = 40 +
        Math.min(16, bounceFromRecentLowPct) +
        Math.min(22, roomToTargetPct / 2) +
        Math.max(0, Math.min(12, 48 - positionPct) / 3) +
        (reclaimedRangeLow ? 10 : Math.max(0, 8 - triggerGapPct / 2)) +
        (latestCloseRatio >= 0.68 ? 5 : 0) -
        (status === "early" ? 8 : 0);
    return {
        type: "below_range_buyer_reclaim",
        label: "Below-range buyer reclaim",
        timeframe: "4h",
        status,
        confidence: confidenceFromScore(score),
        score,
        triggerLow: reclaimTrigger,
        triggerHigh: reclaimTrigger,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: recentLow * 0.94,
        roomToTargetPct,
        evidence: [
            `price is ${positionPct.toFixed(1)}% through the recent 4h range`,
            `buyers lifted it ${formatPct(bounceFromRecentLowPct)} from the response low`,
            `${formatPct(roomToTargetPct)} room back toward the range return area`,
        ],
        buyerResponseLow: recentLow,
        reclaimTrigger,
        returnTargetLow: target,
        returnTargetHigh: priorHigh,
        lines: [
            `${input.symbol.toUpperCase()} is still low in its recent 4h range from ${formatPrice(priorLow)} to ${formatPrice(priorHigh)}, but buyers have started responding near ${formatPrice(recentLow)}.`,
            reclaimedRangeLow
                ? `Price has reclaimed the lower range edge near ${formatPrice(reclaimTrigger)}, which turns this from a dead-chart look into a buyer-reclaim read.`
                : `A reclaim through the lower range edge near ${formatPrice(reclaimTrigger)} is the cleaner confirmation trigger; until then this is a buyer-response watch.`,
            `If buyers keep defending that response low, the first practical return area is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}), with the wider shelf up toward ${formatPrice(priorHigh)}.`,
        ],
    };
}
function buildLowerRangeSpringboardThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 18);
    const latest = candles.at(-1);
    if (!latest || candles.length < 9) {
        return null;
    }
    const prior = candles.slice(-9, -1);
    const recent = candles.slice(-3);
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const range = priorHigh - priorLow;
    const rangePct = (range / Math.max(input.currentPrice, 0.0001)) * 100;
    const positionPct = ((input.currentPrice - priorLow) / Math.max(range, 0.0001)) * 100;
    const recentLow = Math.min(...recent.map((candle) => candle.low));
    const bounceFromRecentLowPct = ((input.currentPrice - recentLow) / Math.max(recentLow, 0.0001)) * 100;
    const latestRangePct = (candleRange(latest) / Math.max(input.currentPrice, 0.0001)) * 100;
    const latestCloseRatio = upperCloseRatio(latest);
    const recentUpperCloses = recent.filter((candle) => upperCloseRatio(candle) >= 0.45).length;
    const reclaimedRecentBody = input.currentPrice >= Math.min(...recent.map((candle) => bodyTop(candle))) * 0.985;
    const touchedOrUndercutRangeLow = recentLow <= priorLow * 1.04;
    if (rangePct < 14 ||
        rangePct > 120 ||
        positionPct < -20 ||
        positionPct > 12 ||
        bounceFromRecentLowPct < 1 ||
        !touchedOrUndercutRangeLow ||
        latestRangePct > 32 ||
        recentUpperCloses < 1 ||
        !reclaimedRecentBody ||
        latestCloseRatio < 0.22 ||
        latestCloseRatio > 0.65) {
        return null;
    }
    const midpointTarget = priorLow + range * 0.55;
    const upperShelfTarget = priorLow + range * 0.82;
    const target = positionPct < 12 ? midpointTarget : upperShelfTarget;
    if (target <= input.currentPrice) {
        return null;
    }
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 30 || roomToTargetPct > 260) {
        return null;
    }
    const reclaimTrigger = priorLow;
    const triggerGapPct = ((reclaimTrigger - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    const reclaimedRangeLow = input.currentPrice >= reclaimTrigger;
    const status = reclaimedRangeLow
        ? "active"
        : triggerGapPct <= 12
            ? "watch"
            : "early";
    const score = 26 +
        Math.min(12, bounceFromRecentLowPct) +
        Math.min(18, roomToTargetPct / 4) +
        Math.max(0, Math.min(10, 35 - positionPct) / 3) +
        (recentUpperCloses >= 2 ? 5 : 0) +
        (reclaimedRangeLow ? 7 : Math.max(0, 6 - triggerGapPct / 3)) -
        (status === "early" ? 6 : 0);
    return {
        type: "lower_range_springboard",
        label: "Lower-range springboard",
        timeframe: "4h",
        status,
        confidence: confidenceFromScore(score),
        score,
        triggerLow: reclaimTrigger,
        triggerHigh: reclaimTrigger,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: recentLow * 0.78,
        roomToTargetPct,
        evidence: [
            `price is ${positionPct.toFixed(1)}% through the recent 4h range`,
            `buyers are trying to spring from the lower range after a ${formatPct(bounceFromRecentLowPct)} lift`,
            `${formatPct(roomToTargetPct)} room back toward the first range-return area`,
        ],
        buyerResponseLow: recentLow,
        reclaimTrigger,
        returnTargetLow: target,
        returnTargetHigh: priorHigh,
        lines: [
            `${input.symbol.toUpperCase()} is still near the lower end of its recent 4h range from ${formatPrice(priorLow)} to ${formatPrice(priorHigh)}.`,
            reclaimedRangeLow
                ? `Price is back above the lower range edge near ${formatPrice(reclaimTrigger)}, so this can act as a lower-range springboard if buyers keep absorbing dips.`
                : `A reclaim through ${formatPrice(reclaimTrigger)} is the cleaner springboard trigger; before that, this is still a lower-range buyer-response watch.`,
            `Because this is still low in the range, the first practical destination is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}), while the risk marker has to stay wider near ${formatPrice(recentLow * 0.78)}.`,
        ],
    };
}
function buildQuietRangeAccumulationThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 18);
    const latest = candles.at(-1);
    if (!latest || candles.length < 9) {
        return null;
    }
    const prior = candles.slice(-9, -1);
    const recent = candles.slice(-4);
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const range = priorHigh - priorLow;
    const rangePct = (range / Math.max(input.currentPrice, 0.0001)) * 100;
    const positionPct = ((input.currentPrice - priorLow) / Math.max(range, 0.0001)) * 100;
    const recentLow = Math.min(...recent.map((candle) => candle.low));
    const recentHigh = Math.max(...recent.map((candle) => candle.high));
    const earlyLow = Math.min(...prior.slice(0, 4).map((candle) => candle.low));
    const lateLow = Math.min(...prior.slice(-4).map((candle) => candle.low));
    const averagePriorRange = prior.reduce((sum, candle) => sum + candleRange(candle), 0) / Math.max(prior.length, 1);
    const latestRange = candleRange(latest);
    const latestRangePct = (latestRange / Math.max(input.currentPrice, 0.0001)) * 100;
    const rangeExpansionRatio = latestRange / Math.max(averagePriorRange, 0.0001);
    const constructiveRecentCount = recent.filter((candle) => candle.close >= candle.open || upperCloseRatio(candle) >= 0.55).length;
    const holdingHigherSupport = lateLow >= earlyLow * 0.96;
    const notPressingBreakout = input.currentPrice <= priorHigh * 0.94;
    const notBelowRange = input.currentPrice >= priorLow * 0.99;
    const quietLatest = latestRangePct <= 22 && rangeExpansionRatio <= 2.1;
    const buyerLiftPct = ((input.currentPrice - recentLow) / Math.max(recentLow, 0.0001)) * 100;
    if (rangePct < 10 ||
        rangePct > 45 ||
        positionPct < 20 ||
        positionPct > 62 ||
        !notBelowRange ||
        !notPressingBreakout ||
        !quietLatest ||
        !holdingHigherSupport ||
        constructiveRecentCount < 2 ||
        buyerLiftPct < 3) {
        return null;
    }
    const trigger = Math.max(recentHigh, priorLow + range * 0.55);
    const target = priorHigh;
    if (target <= input.currentPrice || trigger <= priorLow) {
        return null;
    }
    const triggerGapPct = ((trigger - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 18 || roomToTargetPct > 120 || triggerGapPct > 22) {
        return null;
    }
    const active = input.currentPrice >= trigger;
    const status = active ? "active" : triggerGapPct <= 10 ? "watch" : "early";
    const score = 42 +
        Math.max(0, Math.min(14, 45 - rangePct) / 2) +
        Math.min(18, roomToTargetPct / 1.8) +
        Math.min(10, buyerLiftPct / 2) +
        (constructiveRecentCount >= 3 ? 6 : 0) +
        (active ? 8 : Math.max(0, 8 - triggerGapPct / 2)) -
        (status === "early" ? 6 : 0);
    return {
        type: "quiet_range_accumulation",
        label: "Quiet range accumulation",
        timeframe: "4h",
        status,
        confidence: confidenceFromScore(score),
        score,
        triggerLow: trigger,
        triggerHigh: trigger,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: recentLow * 0.95,
        roomToTargetPct,
        evidence: [
            `price is ${positionPct.toFixed(1)}% through a quiet 4h range`,
            `higher support is holding near ${formatPrice(lateLow)}`,
            `${formatPct(roomToTargetPct)} room back to the range high`,
        ],
        buyerResponseLow: recentLow,
        reclaimTrigger: trigger,
        returnTargetLow: target,
        returnTargetHigh: target,
        lines: [
            `${input.symbol.toUpperCase()} is not at the breakout yet; it is building quietly inside a 4h range from ${formatPrice(priorLow)} to ${formatPrice(priorHigh)}.`,
            active
                ? `Price has pushed through the first accumulation trigger near ${formatPrice(trigger)}, which puts the range-high return in play.`
                : `A push through ${formatPrice(trigger)} is the first accumulation trigger to confirm buyers are taking control.`,
            `If that buyer build continues, the practical first destination is the prior range high near ${formatPrice(target)} (${formatPct(roomToTargetPct)}).`,
        ],
    };
}
function buildControlledRangeBreakoutThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 18);
    const latest = candles.at(-1);
    if (!latest || candles.length < 8) {
        return null;
    }
    const prior = candles.slice(-8, -1);
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const range = priorHigh - priorLow;
    const rangePct = (range / Math.max(input.currentPrice, 0.0001)) * 100;
    const positionPct = ((input.currentPrice - priorLow) / Math.max(range, 0.0001)) * 100;
    const averagePriorRange = prior.reduce((sum, candle) => sum + candleRange(candle), 0) / Math.max(prior.length, 1);
    const latestRange = candleRange(latest);
    const latestRangePct = (latestRange / Math.max(input.currentPrice, 0.0001)) * 100;
    const rangeExpansionRatio = latestRange / Math.max(averagePriorRange, 0.0001);
    const closedConstructively = latest.close >= latest.open || upperCloseRatio(latest) >= 0.58;
    const pressingOrClearingShelf = input.currentPrice >= priorHigh * 0.985 || latest.high >= priorHigh * 1.02;
    const notNewsBurst = latestRangePct <= 22 && rangeExpansionRatio <= 2.4;
    const baseHeldSupport = Math.min(...prior.slice(-3).map((candle) => candle.low)) >= priorLow * 0.96;
    const notOverextendedFromShelf = input.currentPrice <= priorHigh * 1.18;
    if (rangePct < 8 ||
        rangePct > 34 ||
        positionPct < 58 ||
        !pressingOrClearingShelf ||
        !closedConstructively ||
        !notNewsBurst ||
        !baseHeldSupport ||
        !notOverextendedFromShelf) {
        return null;
    }
    const trigger = priorHigh;
    const measuredTarget = priorHigh + range * 1.35;
    const target = Math.max(measuredTarget, input.currentPrice + range * 0.75);
    if (target <= input.currentPrice) {
        return null;
    }
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 7) {
        return null;
    }
    const active = input.currentPrice >= trigger;
    const score = 44 +
        Math.max(0, Math.min(16, 34 - rangePct)) +
        Math.min(14, Math.max(0, positionPct - 58) / 4) +
        Math.min(18, roomToTargetPct) +
        (active ? 8 : 0);
    return {
        type: "controlled_range_breakout",
        label: "Controlled range breakout",
        timeframe: "4h",
        status: active ? "active" : "watch",
        confidence: confidenceFromScore(score),
        score,
        triggerLow: trigger,
        triggerHigh: trigger,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: Math.max(priorLow + range * 0.45, trigger * 0.94),
        roomToTargetPct,
        evidence: [
            `4h shelf ${formatPrice(priorLow)}-${formatPrice(priorHigh)}`,
            active ? `cleared shelf trigger near ${formatPrice(trigger)}` : `pressing shelf trigger near ${formatPrice(trigger)}`,
            `${formatPct(roomToTargetPct)} measured room to first continuation area`,
        ],
        lines: [
            `${input.symbol.toUpperCase()} has built a controlled 4h shelf from ${formatPrice(priorLow)} to ${formatPrice(priorHigh)}.`,
            active
                ? `Price is working through the shelf high near ${formatPrice(trigger)}, so this is a controlled breakout read rather than a random spike.`
                : `A push through ${formatPrice(trigger)} is the clean shelf-break trigger to watch.`,
            `If buyers hold the shelf, the first continuation area is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}).`,
        ],
    };
}
function buildUpperRangeIgnitionThesis(input) {
    const candles = recentCandles(input.seriesMap["4h"], 18);
    const latest = candles.at(-1);
    if (!latest || candles.length < 8) {
        return null;
    }
    const prior = candles.slice(-8, -1);
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const range = priorHigh - priorLow;
    const rangePct = (range / Math.max(input.currentPrice, 0.0001)) * 100;
    const positionPct = ((input.currentPrice - priorLow) / Math.max(range, 0.0001)) * 100;
    const compressionOwnsSetup = rangePct <= 16 && input.currentPrice >= priorHigh * 0.96;
    const lows = prior.map((candle) => candle.low);
    const earlyLow = Math.min(...lows.slice(0, 3));
    const lateLow = Math.min(...lows.slice(-3));
    const holdingHigherSupport = lateLow >= earlyLow * 0.97;
    const constructiveClose = latest.close >= latest.open || upperCloseRatio(latest) >= 0.55;
    if (rangePct < 8 ||
        rangePct > 28 ||
        positionPct < 55 ||
        positionPct > 95 ||
        compressionOwnsSetup ||
        !holdingHigherSupport ||
        !constructiveClose) {
        return null;
    }
    const breakoutTrigger = priorHigh;
    const measuredTarget = priorHigh + range * 1.1;
    const fallbackTarget = input.currentPrice + range * 0.75;
    const target = Math.max(measuredTarget, fallbackTarget);
    const roomToTargetPct = ((target - input.currentPrice) / Math.max(input.currentPrice, 0.0001)) * 100;
    if (roomToTargetPct < 8) {
        return null;
    }
    const score = 46 +
        Math.max(0, Math.min(18, 28 - rangePct)) +
        Math.min(14, Math.max(0, positionPct - 55) / 5) +
        Math.min(18, roomToTargetPct);
    return {
        type: "upper_range_ignition",
        label: "Upper-range ignition",
        timeframe: "4h",
        status: "watch",
        confidence: confidenceFromScore(score),
        score,
        triggerLow: breakoutTrigger,
        triggerHigh: breakoutTrigger,
        targetLow: target,
        targetHigh: target,
        invalidationLevel: priorLow + range * 0.45,
        roomToTargetPct,
        evidence: [
            `price is ${positionPct.toFixed(1)}% through the recent range`,
            `recent 4h range is ${formatPct(rangePct)}`,
            `breakout trigger sits near ${formatPrice(breakoutTrigger)}`,
        ],
        lines: [
            `${input.symbol.toUpperCase()} is holding the upper part of a recent 4h range from ${formatPrice(priorLow)} to ${formatPrice(priorHigh)}.`,
            `A push through ${formatPrice(breakoutTrigger)} would be the ignition trigger for continuation.`,
            `If that trigger works, the first measured expansion area is near ${formatPrice(target)} (${formatPct(roomToTargetPct)}).`,
        ],
    };
}
export function buildChartThesisRead(input) {
    if (!Number.isFinite(input.currentPrice) || input.currentPrice <= 0) {
        return null;
    }
    const candidates = [
        buildReturnToSelloffOriginThesis(input),
        buildFailedBreakdownReclaimThesis(input),
        buildCompressionBreakoutThesis(input),
        buildGapFillReclaimThesis(input),
        buildOpeningRangeExpansionThesis(input),
        buildLiveVolumeExpansionConfirmationThesis(input),
        buildImpulseFlagContinuationThesis(input),
        buildMomentumExpansionContinuationThesis(input),
        buildDamagedRangeReclaimThesis(input),
        buildBelowRangeBuyerReclaimThesis(input),
        buildLowerRangeSpringboardThesis(input),
        buildQuietRangeAccumulationThesis(input),
        buildWashoutBaseReversalThesis(input),
        buildControlledRangeBreakoutThesis(input),
        buildUpperRangeIgnitionThesis(input),
    ].filter((item) => Boolean(item));
    return candidates.sort((left, right) => right.score - left.score)[0] ?? null;
}
export function formatChartThesisRead(read) {
    if (!read) {
        return [];
    }
    return [
        `Chart Thesis (${statusLabel(read.status)}: ${read.label}, ${read.confidence} confidence):`,
        ...read.lines,
    ];
}
