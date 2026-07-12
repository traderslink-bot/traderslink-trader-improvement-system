import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildChartThesisRead } from "../monitoring/chart-thesis-engine.js";
import { evaluateLiveVolumeExpansionConfirmationQuality } from "../monitoring/live-confirmation-quality.js";
import { classifyWatchlistLifecycleScope, emptyLifecycleScopeCounts, } from "./watchlist-lifecycle-sessions.js";
const DEFAULT_HORIZON_BARS = 10;
const DEFAULT_SAMPLES_PER_SYMBOL = 12;
const DEFAULT_MEANINGFUL_MOVE_PCT = 25;
const DEFAULT_PARTIAL_PROGRESS_RATIO = 0.5;
function isValidCandle(candle) {
    return (Number.isFinite(candle.timestamp) &&
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        Number.isFinite(candle.volume) &&
        candle.open > 0 &&
        candle.high > 0 &&
        candle.low > 0 &&
        candle.close > 0 &&
        candle.high >= candle.low);
}
function normalizeCandles(candles) {
    const byTimestamp = new Map();
    for (const candle of candles) {
        if (!isValidCandle(candle)) {
            continue;
        }
        const existing = byTimestamp.get(candle.timestamp);
        if (!existing || candle.volume >= existing.volume) {
            byTimestamp.set(candle.timestamp, candle);
        }
    }
    return [...byTimestamp.values()].sort((left, right) => left.timestamp - right.timestamp);
}
function cloneResponseAtCutoff(response, cutoffTimestamp) {
    if (!response) {
        return undefined;
    }
    const candles = normalizeCandles(response.candles).filter((candle) => candle.timestamp <= cutoffTimestamp);
    return {
        ...response,
        candles,
        actualBarsReturned: candles.length,
        fetchStartTimestamp: candles[0]?.timestamp ?? response.fetchStartTimestamp,
        fetchEndTimestamp: candles.at(-1)?.timestamp ?? response.fetchEndTimestamp,
    };
}
function formatPrice(value) {
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}
function formatPct(value) {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
}
function nullablePct(value) {
    return value === null ? "n/a" : formatPct(value);
}
function targetPriceForThesis(thesis) {
    const target = thesis.targetLow ?? thesis.returnTargetLow ?? thesis.targetHigh ?? thesis.returnTargetHigh;
    return typeof target === "number" && Number.isFinite(target) && target > 0 ? target : null;
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
function emptyLiveConfirmationRead(summary = "No live 5m expansion confirmation at cutoff.") {
    return {
        present: false,
        volumeRatio: null,
        latestRangePct: null,
        priorRangePct: null,
        closeExtensionPct: null,
        triggerPrice: null,
        summary,
    };
}
function buildLiveConfirmationRead(params) {
    const session = latestSessionCandles(normalizeCandles(params.fiveMinuteResponse?.candles ?? []).slice(-120));
    const latest = session.at(-1);
    if (!latest || session.length < 18) {
        return emptyLiveConfirmationRead("Not enough same-session 5m candles for live confirmation.");
    }
    const prior = session.slice(-18, -1);
    const positiveVolumeCandles = prior.filter((candle) => Number.isFinite(candle.volume) && candle.volume > 0);
    if (positiveVolumeCandles.length < 8 || !Number.isFinite(latest.volume) || latest.volume <= 0) {
        return emptyLiveConfirmationRead("Not enough usable 5m volume to confirm the move.");
    }
    const priorHigh = Math.max(...prior.map((candle) => candle.high));
    const priorLow = Math.min(...prior.map((candle) => candle.low));
    const priorRange = priorHigh - priorLow;
    const priorRangePct = (priorRange / Math.max(priorLow, 0.0001)) * 100;
    const latestRange = candleRange(latest);
    const latestRangePct = (latestRange / Math.max(latest.low, 0.0001)) * 100;
    const averagePriorVolume = positiveVolumeCandles.reduce((sum, candle) => sum + candle.volume, 0) / positiveVolumeCandles.length;
    const volumeRatio = latest.volume / Math.max(averagePriorVolume, 1);
    const brokeShortRange = latest.high >= priorHigh * 1.01 && params.currentPrice >= priorHigh * 0.995;
    const holdingExpansion = params.currentPrice >= Math.max(priorHigh * 0.995, latest.low + latestRange * 0.52);
    const strongClose = upperCloseRatio(latest) >= 0.58 || latest.close >= priorHigh;
    const closeExtensionPct = ((params.currentPrice - priorHigh) / Math.max(priorHigh, 0.0001)) * 100;
    const quality = evaluateLiveVolumeExpansionConfirmationQuality({
        currentPrice: params.currentPrice,
        latestRangePct,
        priorRangePct,
        closeExtensionPct,
        latestTimestamp: latest.timestamp,
    });
    const present = quality.passed &&
        brokeShortRange &&
        holdingExpansion &&
        strongClose &&
        volumeRatio >= 2;
    return {
        present,
        volumeRatio,
        latestRangePct,
        priorRangePct,
        closeExtensionPct,
        triggerPrice: priorHigh,
        summary: present
            ? `5m expansion confirmed above ${formatPrice(priorHigh)} on ${volumeRatio.toFixed(1)}x recent volume.`
            : `No live confirmation: ${volumeRatio.toFixed(1)}x volume, ${formatPct(latestRangePct)} latest 5m range, ${formatPct(closeExtensionPct)} extension, trigger ${formatPrice(priorHigh)}${quality.rejectReasons.length > 0 ? ` (${quality.rejectReasons.join("; ")})` : ""}.`,
    };
}
function buildMissedMoveDiagnostics(params) {
    const priorHigh = params.priorCandles.length === 0
        ? null
        : Math.max(...params.priorCandles.map((candle) => candle.high));
    const priorLow = params.priorCandles.length === 0
        ? null
        : Math.min(...params.priorCandles.map((candle) => candle.low));
    const priorRangePct = priorHigh === null || priorLow === null
        ? null
        : ((priorHigh - priorLow) / Math.max(params.currentPrice, 0.0001)) * 100;
    const priorRangePositionPct = priorHigh === null || priorLow === null
        ? null
        : ((params.currentPrice - priorLow) / Math.max(priorHigh - priorLow, 0.0001)) * 100;
    const firstForward = params.forwardCandles[0];
    const firstForwardGapPct = firstForward
        ? ((firstForward.open - params.currentPrice) / Math.max(params.currentPrice, 0.0001)) * 100
        : null;
    const firstForwardRangePct = firstForward
        ? ((firstForward.high - firstForward.low) / Math.max(firstForward.low, 0.0001)) * 100
        : null;
    let reason = "delayed_move_after_quiet_chart";
    if ((firstForwardGapPct !== null && firstForwardGapPct >= 25) ||
        (firstForwardRangePct !== null && firstForwardRangePct >= 50)) {
        reason = "news_or_gap_burst";
    }
    else if (priorRangePositionPct !== null && priorRangePositionPct < 20) {
        reason = "below_recent_range";
    }
    else if (priorRangePct !== null && priorRangePct > 45) {
        reason = "loose_or_damaged_range";
    }
    else if (priorRangePositionPct !== null &&
        priorRangePct !== null &&
        priorRangePositionPct >= 55 &&
        priorRangePct <= 28) {
        reason = "possible_upper_range_setup";
    }
    const evidence = [
        `Prior 7-bar range: ${nullablePct(priorRangePct)}.`,
        `Price position in prior range: ${priorRangePositionPct === null ? "n/a" : `${priorRangePositionPct.toFixed(1)}%`}.`,
        `Next 4h open gap: ${nullablePct(firstForwardGapPct)}.`,
        `Next 4h candle range: ${nullablePct(firstForwardRangePct)}.`,
    ];
    return {
        reason,
        priorRangePct,
        priorRangePositionPct,
        firstForwardGapPct,
        firstForwardRangePct,
        evidence,
    };
}
function evaluateOutcome(params) {
    const forward = params.forwardCandles;
    const highs = forward.map((candle) => candle.high);
    const lows = forward.map((candle) => candle.low);
    const bestHigh = highs.length > 0 ? Math.max(...highs) : params.currentPrice;
    const worstLow = lows.length > 0 ? Math.min(...lows) : params.currentPrice;
    const bestForwardPct = ((bestHigh - params.currentPrice) / Math.max(params.currentPrice, 0.0001)) * 100;
    const worstForwardPct = ((worstLow - params.currentPrice) / Math.max(params.currentPrice, 0.0001)) * 100;
    if (!params.targetPrice || forward.length === 0) {
        return {
            outcome: "insufficient_forward",
            targetReached: false,
            invalidatedBeforeTarget: false,
            barsToTarget: null,
            bestForwardPct,
            worstForwardPct,
            forwardBars: forward.length,
        };
    }
    let targetReached = false;
    let invalidatedBeforeTarget = false;
    let barsToTarget = null;
    for (let index = 0; index < forward.length; index += 1) {
        const candle = forward[index];
        if (params.invalidationPrice !== null &&
            candle.low <= params.invalidationPrice &&
            !targetReached) {
            invalidatedBeforeTarget = true;
            break;
        }
        if (candle.high >= params.targetPrice) {
            targetReached = true;
            barsToTarget = index + 1;
            break;
        }
    }
    const roomToTargetPct = ((params.targetPrice - params.currentPrice) / Math.max(params.currentPrice, 0.0001)) * 100;
    const partialThresholdPct = Math.max(8, roomToTargetPct * params.partialProgressRatio);
    const madeUsefulPartialProgress = bestForwardPct >= partialThresholdPct;
    const outcome = targetReached
        ? "hit_target"
        : madeUsefulPartialProgress
            ? "partial_progress"
            : invalidatedBeforeTarget
                ? "invalidated"
                : "no_progress";
    return {
        outcome,
        targetReached,
        invalidatedBeforeTarget,
        barsToTarget,
        bestForwardPct,
        worstForwardPct,
        forwardBars: forward.length,
    };
}
function sampleCutoffIndexes(candles, samplesPerSymbol, horizonBars) {
    const latestUsable = candles.length - horizonBars - 1;
    const earliestUsable = Math.max(5, candles.length - horizonBars - samplesPerSymbol * 3);
    if (latestUsable < earliestUsable) {
        return [];
    }
    const indexes = new Set();
    const span = latestUsable - earliestUsable;
    const count = Math.min(samplesPerSymbol, span + 1);
    for (let step = 0; step < count; step += 1) {
        const offset = count === 1 ? 0 : Math.round((span * step) / (count - 1));
        indexes.add(earliestUsable + offset);
    }
    return [...indexes].sort((left, right) => left - right);
}
function buildSample(params) {
    const cutoffCandle = params.fourHourCandles[params.cutoffIndex];
    const currentPrice = cutoffCandle.close;
    const cutoffTimestamp = cutoffCandle.timestamp;
    const lifecycleScope = classifyWatchlistLifecycleScope({
        symbol: params.symbol,
        timestamp: cutoffTimestamp,
        sessionsBySymbol: params.lifecycleSessionsBySymbol,
    });
    const truncatedSeriesMap = {
        daily: cloneResponseAtCutoff(params.seriesMap.daily, cutoffTimestamp),
        "4h": cloneResponseAtCutoff(params.seriesMap["4h"], cutoffTimestamp),
        "5m": cloneResponseAtCutoff(params.seriesMap["5m"], cutoffTimestamp),
    };
    const liveConfirmation = buildLiveConfirmationRead({
        currentPrice,
        fiveMinuteResponse: truncatedSeriesMap["5m"],
    });
    const thesis = buildChartThesisRead({
        symbol: params.symbol,
        currentPrice,
        seriesMap: truncatedSeriesMap,
    });
    const forwardCandles = params.fourHourCandles.slice(params.cutoffIndex + 1, params.cutoffIndex + 1 + params.horizonBars);
    const targetPrice = thesis ? targetPriceForThesis(thesis) : null;
    const invalidationPrice = thesis?.invalidationLevel !== undefined && Number.isFinite(thesis.invalidationLevel)
        ? thesis.invalidationLevel
        : null;
    const evaluation = evaluateOutcome({
        currentPrice,
        targetPrice,
        invalidationPrice,
        forwardCandles,
        partialProgressRatio: params.partialProgressRatio,
    });
    if (!thesis) {
        const diagnostics = buildMissedMoveDiagnostics({
            currentPrice,
            priorCandles: params.fourHourCandles.slice(Math.max(0, params.cutoffIndex - 7), params.cutoffIndex),
            forwardCandles,
        });
        return {
            symbol: params.symbol,
            cutoffTimestamp,
            cutoffIso: new Date(cutoffTimestamp).toISOString(),
            lifecycleScope,
            currentPrice,
            liveConfirmation,
            bestForwardPct: evaluation.bestForwardPct,
            forwardBars: evaluation.forwardBars,
            ...diagnostics,
            summary: `${params.symbol} had no thesis at ${formatPrice(currentPrice)}, then traded up ${formatPct(evaluation.bestForwardPct)} over ${evaluation.forwardBars} forward 4h bars (${diagnostics.reason}).`,
        };
    }
    const roomToTargetPct = targetPrice === null
        ? null
        : ((targetPrice - currentPrice) / Math.max(currentPrice, 0.0001)) * 100;
    return {
        symbol: params.symbol,
        cutoffTimestamp,
        cutoffIso: new Date(cutoffTimestamp).toISOString(),
        lifecycleScope,
        currentPrice,
        liveConfirmation,
        thesis,
        outcome: evaluation.outcome,
        targetPrice,
        invalidationPrice,
        roomToTargetPct,
        bestForwardPct: evaluation.bestForwardPct,
        worstForwardPct: evaluation.worstForwardPct,
        targetReached: evaluation.targetReached,
        invalidatedBeforeTarget: evaluation.invalidatedBeforeTarget,
        barsToTarget: evaluation.barsToTarget,
        forwardBars: evaluation.forwardBars,
        summary: `${params.symbol} ${thesis.label} at ${formatPrice(currentPrice)} targeted ${targetPrice === null ? "n/a" : formatPrice(targetPrice)}; outcome ${evaluation.outcome}, best forward ${formatPct(evaluation.bestForwardPct)}.`,
        lines: thesis.lines,
    };
}
function buildStats(samples) {
    const byType = new Map();
    for (const sample of samples) {
        const key = sample.thesis?.type ?? "none";
        const existing = byType.get(key) ?? [];
        existing.push(sample);
        byType.set(key, existing);
    }
    return [...byType.entries()]
        .filter(([type]) => type !== "none")
        .map(([thesisType, items]) => {
        const hitTarget = items.filter((sample) => sample.outcome === "hit_target").length;
        const roomValues = items
            .map((sample) => sample.roomToTargetPct)
            .filter((value) => typeof value === "number" && Number.isFinite(value));
        const bestValues = items
            .map((sample) => sample.bestForwardPct)
            .filter((value) => Number.isFinite(value));
        const worstValues = items
            .map((sample) => sample.worstForwardPct)
            .filter((value) => Number.isFinite(value));
        const partialProgress = items.filter((sample) => sample.outcome === "partial_progress").length;
        const invalidated = items.filter((sample) => sample.outcome === "invalidated").length;
        const usefulCount = hitTarget + partialProgress;
        const move15Count = items.filter((sample) => sample.bestForwardPct >= 15).length;
        const move25Count = items.filter((sample) => sample.bestForwardPct >= 25).length;
        const move50Count = items.filter((sample) => sample.bestForwardPct >= 50).length;
        return {
            thesisType,
            samples: items.length,
            hitTarget,
            partialProgress,
            invalidated,
            noProgress: items.filter((sample) => sample.outcome === "no_progress").length,
            insufficientForward: items.filter((sample) => sample.outcome === "insufficient_forward").length,
            usefulCount,
            usefulRate: items.length === 0 ? 0 : usefulCount / items.length,
            hitRate: items.length === 0 ? 0 : hitTarget / items.length,
            invalidationRate: items.length === 0 ? 0 : invalidated / items.length,
            move15Count,
            move15Rate: items.length === 0 ? 0 : move15Count / items.length,
            move25Count,
            move25Rate: items.length === 0 ? 0 : move25Count / items.length,
            move50Count,
            move50Rate: items.length === 0 ? 0 : move50Count / items.length,
            statusCounts: items.reduce((counts, sample) => {
                counts[sample.thesis.status] += 1;
                return counts;
            }, emptyThesisStatusCounts()),
            lifecycleScopes: items.reduce((counts, sample) => {
                counts[sample.lifecycleScope] += 1;
                return counts;
            }, emptyLifecycleScopeCounts()),
            liveConfirmationPresent: items.filter((sample) => sample.liveConfirmation.present).length,
            liveConfirmationRate: items.length === 0
                ? 0
                : items.filter((sample) => sample.liveConfirmation.present).length / items.length,
            avgRoomToTargetPct: roomValues.length === 0
                ? null
                : roomValues.reduce((sum, value) => sum + value, 0) / roomValues.length,
            avgBestForwardPct: bestValues.length === 0
                ? null
                : bestValues.reduce((sum, value) => sum + value, 0) / bestValues.length,
            avgWorstForwardPct: worstValues.length === 0
                ? null
                : worstValues.reduce((sum, value) => sum + value, 0) / worstValues.length,
        };
    })
        .sort((left, right) => right.samples - left.samples || right.hitRate - left.hitRate);
}
function emptyMissedReasonCounts() {
    return {
        news_or_gap_burst: 0,
        below_recent_range: 0,
        loose_or_damaged_range: 0,
        possible_upper_range_setup: 0,
        delayed_move_after_quiet_chart: 0,
    };
}
function emptyThesisStatusCounts() {
    return {
        active: 0,
        watch: 0,
        early: 0,
    };
}
export function buildChartThesisQaReport(options) {
    const horizonBars = Math.max(1, Math.floor(options.horizonBars ?? DEFAULT_HORIZON_BARS));
    const samplesPerSymbol = Math.max(1, Math.floor(options.samplesPerSymbol ?? DEFAULT_SAMPLES_PER_SYMBOL));
    const meaningfulMovePct = Math.max(1, options.meaningfulMovePct ?? DEFAULT_MEANINGFUL_MOVE_PCT);
    const partialProgressRatio = Math.max(0.1, Math.min(0.9, options.partialProgressRatio ?? DEFAULT_PARTIAL_PROGRESS_RATIO));
    const samples = [];
    const missedCandidates = [];
    for (const symbolInput of options.symbols) {
        const fourHourCandles = normalizeCandles(symbolInput.seriesMap["4h"]?.candles ?? []);
        for (const cutoffIndex of sampleCutoffIndexes(fourHourCandles, samplesPerSymbol, horizonBars)) {
            const result = buildSample({
                symbol: symbolInput.symbol.toUpperCase(),
                cutoffIndex,
                fourHourCandles,
                seriesMap: symbolInput.seriesMap,
                horizonBars,
                partialProgressRatio,
                lifecycleSessionsBySymbol: options.lifecycleSessionsBySymbol,
            });
            if ("thesis" in result) {
                samples.push(result);
            }
            else if (result.bestForwardPct >= meaningfulMovePct) {
                missedCandidates.push(result);
            }
        }
    }
    const maxExamples = Math.max(1, options.maxExamples ?? 12);
    const goodExamples = samples
        .filter((sample) => sample.outcome === "hit_target" || sample.outcome === "partial_progress")
        .sort((left, right) => right.bestForwardPct - left.bestForwardPct)
        .slice(0, maxExamples);
    const badExamples = samples
        .filter((sample) => sample.outcome === "invalidated" || sample.outcome === "no_progress")
        .sort((left, right) => right.thesis.score - left.thesis.score || left.bestForwardPct - right.bestForwardPct)
        .slice(0, maxExamples);
    const missedMoves = missedCandidates
        .sort((left, right) => right.bestForwardPct - left.bestForwardPct)
        .slice(0, maxExamples);
    const missedMoveReasons = emptyMissedReasonCounts();
    for (const missed of missedCandidates) {
        missedMoveReasons[missed.reason] += 1;
    }
    const thesisStatuses = emptyThesisStatusCounts();
    const lifecycleScopes = emptyLifecycleScopeCounts();
    for (const sample of samples) {
        if (sample.thesis) {
            thesisStatuses[sample.thesis.status] += 1;
        }
        lifecycleScopes[sample.lifecycleScope] += 1;
    }
    for (const missed of missedCandidates) {
        lifecycleScopes[missed.lifecycleScope] += 1;
    }
    return {
        generatedAt: new Date().toISOString(),
        source: options.source ?? "in-memory candle series",
        settings: {
            horizonBars,
            samplesPerSymbol,
            meaningfulMovePct,
            partialProgressRatio,
        },
        totals: {
            symbols: options.symbols.length,
            samples: samples.length,
            samplesWithThesis: samples.length,
            hitTarget: samples.filter((sample) => sample.outcome === "hit_target").length,
            partialProgress: samples.filter((sample) => sample.outcome === "partial_progress").length,
            invalidated: samples.filter((sample) => sample.outcome === "invalidated").length,
            noProgress: samples.filter((sample) => sample.outcome === "no_progress").length,
            insufficientForward: samples.filter((sample) => sample.outcome === "insufficient_forward").length,
            missedMeaningfulMoves: missedCandidates.length,
            missedMoveAt50Pct: missedCandidates.filter((missed) => missed.bestForwardPct >= 50).length,
            missedMoveAt100Pct: missedCandidates.filter((missed) => missed.bestForwardPct >= 100).length,
            missedMoveReasons,
            thesisStatuses,
            lifecycleScopes,
            liveConfirmationPresent: samples.filter((sample) => sample.liveConfirmation.present).length +
                missedCandidates.filter((missed) => missed.liveConfirmation.present).length,
            liveConfirmationWithThesis: samples.filter((sample) => sample.liveConfirmation.present).length,
            liveConfirmationOnMissedMoves: missedCandidates.filter((missed) => missed.liveConfirmation.present).length,
        },
        thesisStats: buildStats(samples),
        goodExamples,
        badExamples,
        missedMoves,
        samples,
    };
}
function renderSample(sample) {
    const lines = [];
    lines.push(`- ${sample.summary}`);
    lines.push(`  - Cutoff: ${sample.cutoffIso}`);
    lines.push(`  - Watchlist scope: ${sample.lifecycleScope}`);
    lines.push(`  - Thesis: ${sample.thesis?.type ?? "none"} (${sample.thesis?.confidence ?? "n/a"} confidence, score ${sample.thesis?.score.toFixed(1) ?? "n/a"})`);
    lines.push(`  - Status: ${sample.thesis?.status ?? "n/a"}`);
    lines.push(`  - Live confirmation: ${sample.liveConfirmation.summary}`);
    lines.push(`  - Room: ${sample.roomToTargetPct === null ? "n/a" : formatPct(sample.roomToTargetPct)}, best forward: ${formatPct(sample.bestForwardPct)}, worst forward: ${formatPct(sample.worstForwardPct)}`);
    for (const thesisLine of sample.lines.slice(0, 3)) {
        lines.push(`  - Read: ${thesisLine}`);
    }
    return lines;
}
function renderMarkdown(report) {
    const lines = [];
    lines.push("# Chart Thesis QA Report");
    lines.push("");
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push(`Source: ${report.source}`);
    lines.push("");
    lines.push("## Summary");
    lines.push("");
    lines.push(`- Symbols scanned: ${report.totals.symbols}`);
    lines.push(`- Thesis samples: ${report.totals.samplesWithThesis}`);
    lines.push(`- Hit target: ${report.totals.hitTarget}`);
    lines.push(`- Partial progress: ${report.totals.partialProgress}`);
    lines.push(`- Invalidated: ${report.totals.invalidated}`);
    lines.push(`- No progress: ${report.totals.noProgress}`);
    lines.push(`- Missed meaningful moves with no thesis: ${report.totals.missedMeaningfulMoves}`);
    lines.push(`- Missed moves >=50%: ${report.totals.missedMoveAt50Pct}`);
    lines.push(`- Missed moves >=100%: ${report.totals.missedMoveAt100Pct}`);
    lines.push(`- Live 5m confirmation present: ${report.totals.liveConfirmationPresent} total, ${report.totals.liveConfirmationWithThesis} with thesis, ${report.totals.liveConfirmationOnMissedMoves} on missed moves`);
    lines.push(`- Horizon: ${report.settings.horizonBars} forward 4h bars`);
    lines.push("");
    lines.push("## Thesis Statuses");
    lines.push("");
    lines.push(`- active: ${report.totals.thesisStatuses.active}`);
    lines.push(`- watch: ${report.totals.thesisStatuses.watch}`);
    lines.push(`- early: ${report.totals.thesisStatuses.early}`);
    lines.push("");
    lines.push("## Watchlist Lifecycle Scope");
    lines.push("");
    lines.push("- This is an audit label only. Candle replay performance is not filtered by saved watchlist state.");
    lines.push(`- active_window: ${report.totals.lifecycleScopes.active_window}`);
    lines.push(`- restart_restore_window: ${report.totals.lifecycleScopes.restart_restore_window}`);
    lines.push(`- archive_only: ${report.totals.lifecycleScopes.archive_only}`);
    lines.push(`- outside_active_window: ${report.totals.lifecycleScopes.outside_active_window}`);
    lines.push(`- unknown_lifecycle: ${report.totals.lifecycleScopes.unknown_lifecycle}`);
    lines.push("");
    lines.push("## Missed Move Reasons");
    lines.push("");
    for (const [reason, count] of Object.entries(report.totals.missedMoveReasons)) {
        lines.push(`- ${reason}: ${count}`);
    }
    lines.push("");
    lines.push("## Thesis Leaderboard");
    lines.push("");
    if (report.thesisStats.length === 0) {
        lines.push("No thesis samples found.");
    }
    else {
        const rankedStats = [...report.thesisStats].sort((left, right) => right.usefulRate - left.usefulRate ||
            right.move25Rate - left.move25Rate ||
            right.samples - left.samples);
        for (const stat of rankedStats) {
            lines.push(`- ${stat.thesisType}: useful ${stat.usefulCount}/${stat.samples} (${(stat.usefulRate * 100).toFixed(1)}%), +15% ${stat.move15Count}/${stat.samples} (${(stat.move15Rate * 100).toFixed(1)}%), +25% ${stat.move25Count}/${stat.samples} (${(stat.move25Rate * 100).toFixed(1)}%), +50% ${stat.move50Count}/${stat.samples} (${(stat.move50Rate * 100).toFixed(1)}%), invalidated ${stat.invalidated}/${stat.samples} (${(stat.invalidationRate * 100).toFixed(1)}%), avg best ${stat.avgBestForwardPct === null ? "n/a" : formatPct(stat.avgBestForwardPct)}, avg worst ${stat.avgWorstForwardPct === null ? "n/a" : formatPct(stat.avgWorstForwardPct)}`);
        }
    }
    lines.push("");
    lines.push("## Thesis Stats");
    lines.push("");
    if (report.thesisStats.length === 0) {
        lines.push("No thesis samples found.");
    }
    else {
        for (const stat of report.thesisStats) {
            lines.push(`- ${stat.thesisType}: ${stat.samples} samples, ${(stat.hitRate * 100).toFixed(1)}% target hit, useful ${(stat.usefulRate * 100).toFixed(1)}%, ${stat.partialProgress} partial, ${stat.invalidated} invalidated (${(stat.invalidationRate * 100).toFixed(1)}%), live confirm ${stat.liveConfirmationPresent}/${stat.samples}, statuses active/watch/early=${stat.statusCounts.active}/${stat.statusCounts.watch}/${stat.statusCounts.early}, lifecycle active/archive/outside/unknown=${stat.lifecycleScopes.active_window}/${stat.lifecycleScopes.archive_only}/${stat.lifecycleScopes.outside_active_window}/${stat.lifecycleScopes.unknown_lifecycle}, avg room ${stat.avgRoomToTargetPct === null ? "n/a" : formatPct(stat.avgRoomToTargetPct)}, avg best forward ${stat.avgBestForwardPct === null ? "n/a" : formatPct(stat.avgBestForwardPct)}, avg worst forward ${stat.avgWorstForwardPct === null ? "n/a" : formatPct(stat.avgWorstForwardPct)}`);
        }
    }
    lines.push("");
    lines.push("## Good Examples");
    lines.push("");
    if (report.goodExamples.length === 0) {
        lines.push("No good examples found.");
    }
    else {
        for (const sample of report.goodExamples) {
            lines.push(...renderSample(sample));
        }
    }
    lines.push("");
    lines.push("## Bad Or Noisy Examples");
    lines.push("");
    if (report.badExamples.length === 0) {
        lines.push("No bad/noisy examples found.");
    }
    else {
        for (const sample of report.badExamples) {
            lines.push(...renderSample(sample));
        }
    }
    lines.push("");
    lines.push("## Missed Meaningful Moves");
    lines.push("");
    if (report.missedMoves.length === 0) {
        lines.push("No missed meaningful moves found.");
    }
    else {
        for (const missed of report.missedMoves) {
            lines.push(`- ${missed.summary}`);
            lines.push(`  - Cutoff: ${missed.cutoffIso}`);
            lines.push(`  - Watchlist scope: ${missed.lifecycleScope}`);
            lines.push(`  - Live confirmation: ${missed.liveConfirmation.summary}`);
            for (const evidence of missed.evidence) {
                lines.push(`  - Evidence: ${evidence}`);
            }
        }
    }
    lines.push("");
    return `${lines.join("\n")}\n`;
}
export function writeChartThesisQaReport(options) {
    const report = buildChartThesisQaReport(options);
    mkdirSync(options.outputDirectory, { recursive: true });
    writeFileSync(join(options.outputDirectory, "chart-thesis-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(join(options.outputDirectory, "chart-thesis-qa-report.md"), renderMarkdown(report));
    return report;
}
function readCachedResponse(filePath) {
    const raw = JSON.parse(readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
    return raw.response ?? null;
}
function latestCacheFile(directoryPath) {
    if (!existsSync(directoryPath)) {
        return null;
    }
    const files = readdirSync(directoryPath, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => join(directoryPath, entry.name));
    return files
        .map((filePath) => {
        try {
            const raw = JSON.parse(readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
            return {
                filePath,
                endTimeMs: raw.request?.endTimeMs ?? 0,
                cachedAt: raw.cachedAt ?? 0,
                bars: raw.response?.candles?.length ?? 0,
            };
        }
        catch {
            return null;
        }
    })
        .filter((item) => Boolean(item))
        .sort((left, right) => right.endTimeMs - left.endTimeMs || right.cachedAt - left.cachedAt || right.bars - left.bars)[0]?.filePath ?? null;
}
export function readChartThesisQaSymbolsFromCache(options) {
    const provider = options.provider ?? "eodhd";
    const root = join(options.cacheDirectory, provider);
    if (!existsSync(root)) {
        return [];
    }
    const requested = new Set(options.symbols?.map((symbol) => symbol.toUpperCase()));
    const symbolNames = readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name.toUpperCase())
        .filter((symbol) => requested.size === 0 || requested.has(symbol))
        .sort()
        .slice(0, options.maxSymbols ?? Number.POSITIVE_INFINITY);
    const result = [];
    for (const symbol of symbolNames) {
        const seriesMap = {};
        for (const timeframe of ["daily", "4h", "5m"]) {
            const filePath = latestCacheFile(join(root, symbol, timeframe));
            if (!filePath) {
                continue;
            }
            const response = readCachedResponse(filePath);
            if (response) {
                seriesMap[timeframe] = response;
            }
        }
        if (seriesMap["4h"]?.candles?.length) {
            result.push({ symbol, seriesMap });
        }
    }
    return result;
}
