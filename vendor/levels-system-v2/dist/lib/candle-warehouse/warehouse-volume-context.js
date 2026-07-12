import { classifyCandleSessions } from "../market-data/candle-session-classifier.js";
import { buildVolumeBaselineFromCandles } from "../monitoring/volume-activity.js";
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const DEFAULT_LOOKBACK_BARS = 120;
const MIN_BASELINE_BARS = 10;
const nyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});
function normalizeSymbol(symbol) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
        throw new Error("symbol is required.");
    }
    return normalized;
}
function sessionDateRange(sessionDate, asOfTimestamp, lookbackBars) {
    const startTimestamp = Date.parse(`${sessionDate}T04:00:00-04:00`) - 60 * FIVE_MINUTES_MS;
    const fallbackEnd = Date.parse(`${sessionDate}T20:00:00-04:00`);
    const endTimestamp = asOfTimestamp ?? fallbackEnd;
    return {
        startTimestamp: Math.min(startTimestamp, endTimestamp - lookbackBars * FIVE_MINUTES_MS),
        endTimestamp,
    };
}
function fallbackRange(asOfTimestamp, lookbackBars) {
    const endTimestamp = asOfTimestamp ?? Date.now();
    return {
        startTimestamp: endTimestamp - lookbackBars * FIVE_MINUTES_MS,
        endTimestamp,
    };
}
function nyMinutes(timestamp) {
    const parts = nyFormatter.formatToParts(new Date(timestamp));
    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const hour = Number(byType.hour);
    const minute = Number(byType.minute);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null;
}
function bucketFor(timestamp) {
    const minute = nyMinutes(timestamp);
    if (minute === null) {
        return "unknown";
    }
    if (minute >= 4 * 60 && minute < 9 * 60 + 30) {
        return "premarket";
    }
    if (minute >= 9 * 60 + 30 && minute < 10 * 60 + 30) {
        return "open";
    }
    if (minute >= 10 * 60 + 30 && minute < 14 * 60) {
        return "midday";
    }
    if (minute >= 14 * 60 && minute < 16 * 60) {
        return "afternoon";
    }
    if (minute >= 16 * 60 && minute < 20 * 60) {
        return "after_hours";
    }
    return "extended";
}
function classifyLabel(ratio, currentVolume, previousVolume) {
    if (ratio === null || currentVolume === null || currentVolume <= 0) {
        return "unknown";
    }
    const fading = previousVolume !== null && previousVolume > 0 && currentVolume <= previousVolume * 0.8;
    if (fading && ratio < 1) {
        return "fading";
    }
    if (ratio >= 2) {
        return "strong";
    }
    if (ratio >= 1.4 && !fading) {
        return "expanding";
    }
    if (ratio < 0.75) {
        return fading ? "fading" : "thin";
    }
    return "normal";
}
function dollarVolume(candle) {
    return candle.close * candle.volume;
}
function liquidityLabel(averageDollarVolume) {
    if (averageDollarVolume === null) {
        return "unknown";
    }
    if (averageDollarVolume >= 1_000_000) {
        return "liquid";
    }
    if (averageDollarVolume >= 150_000) {
        return "tradeable";
    }
    return "thin";
}
function nearestLevel(params) {
    const currentPrice = params.currentPrice;
    if (!Number.isFinite(currentPrice) || currentPrice === undefined || currentPrice <= 0) {
        return { side: "none", price: null, distancePct: null, evidence: null };
    }
    const candidates = [
        ...params.supportLevels.map((price) => ({ side: "support", price })),
        ...params.resistanceLevels.map((price) => ({ side: "resistance", price })),
    ].filter((item) => Number.isFinite(item.price) && item.price > 0);
    const nearest = candidates
        .map((item) => ({
        ...item,
        distancePct: Math.abs(item.price - currentPrice) / currentPrice,
    }))
        .sort((left, right) => left.distancePct - right.distancePct)[0];
    if (!nearest || nearest.distancePct > 0.025) {
        return { side: "none", price: null, distancePct: null, evidence: null };
    }
    return {
        side: nearest.side,
        price: nearest.price,
        distancePct: Number(nearest.distancePct.toFixed(4)),
        evidence: `price is within ${(nearest.distancePct * 100).toFixed(1)}% of ${nearest.side} ${nearest.price}`,
    };
}
export function buildVolumeActivityContextFromWarehouseCandles(request) {
    const symbol = normalizeSymbol(request.symbol);
    const candles = [...request.candles]
        .filter((candle) => Number.isFinite(candle.timestamp) &&
        Number.isFinite(candle.close) &&
        Number.isFinite(candle.volume) &&
        (request.asOfTimestamp === undefined || candle.timestamp <= request.asOfTimestamp))
        .sort((left, right) => left.timestamp - right.timestamp);
    const diagnostics = [
        {
            code: "volume_context_operator_only",
            severity: "info",
            message: "Warehouse volume context is structured/operator evidence first; it should not create standalone Discord posts.",
        },
    ];
    if (candles.length === 0) {
        diagnostics.push({
            code: "missing_5m_candles",
            severity: "warning",
            message: "No 5m warehouse candles were available for volume context.",
        });
        return {
            symbol,
            provider: request.provider ?? "provided",
            timeframe: "5m",
            candleCount: 0,
            sessionBucket: "unknown",
            reliability: "unreliable",
            label: "unknown",
            baselineAverageVolume: null,
            currentVolume: null,
            relativeVolumeRatio: null,
            averageDollarVolume: null,
            currentDollarVolume: null,
            liquidityLabel: "unknown",
            atLevel: { side: "none", price: null, distancePct: null, evidence: null },
            diagnostics,
        };
    }
    const annotated = classifyCandleSessions(candles, "5m");
    const latest = candles.at(-1);
    const latestBucket = bucketFor(latest.timestamp);
    const sameBucketCandles = annotated
        .filter((item) => bucketFor(item.candle.timestamp) === latestBucket)
        .map((item) => item.candle);
    const baselineSource = sameBucketCandles.length >= MIN_BASELINE_BARS ? sameBucketCandles.slice(0, -1) : candles.slice(0, -1);
    const baseline = buildVolumeBaselineFromCandles(baselineSource, MIN_BASELINE_BARS, 30);
    const previousVolume = candles.at(-2)?.volume ?? null;
    const currentVolume = latest.volume > 0 ? latest.volume : null;
    const relativeVolumeRatio = baseline && currentVolume !== null ? Number((currentVolume / baseline.averageVolume).toFixed(4)) : null;
    const label = classifyLabel(relativeVolumeRatio, currentVolume, previousVolume);
    const averageDollarVolume = baselineSource.length >= MIN_BASELINE_BARS
        ? baselineSource.reduce((sum, candle) => sum + dollarVolume(candle), 0) / baselineSource.length
        : null;
    const currentDollarVolume = currentVolume === null ? null : dollarVolume(latest);
    const reliability = baseline && currentVolume !== null
        ? averageDollarVolume !== null && averageDollarVolume < 50_000
            ? "watch"
            : "reliable"
        : "unreliable";
    if (!baseline) {
        diagnostics.push({
            code: "insufficient_baseline",
            severity: "warning",
            message: "Not enough positive 5m volume bars were available to build a reliable baseline.",
        });
    }
    if (currentVolume === null) {
        diagnostics.push({
            code: "zero_or_missing_volume",
            severity: "warning",
            message: "Latest 5m candle volume is zero or missing.",
        });
    }
    if (averageDollarVolume !== null && averageDollarVolume < 50_000) {
        diagnostics.push({
            code: "thin_dollar_volume",
            severity: "warning",
            message: "Dollar-volume is thin, so activity reads should stay cautious.",
        });
    }
    return {
        symbol,
        provider: request.provider ?? "provided",
        timeframe: "5m",
        candleCount: candles.length,
        sessionBucket: latestBucket,
        reliability,
        label,
        baselineAverageVolume: baseline?.averageVolume ?? null,
        currentVolume,
        relativeVolumeRatio,
        averageDollarVolume: averageDollarVolume === null ? null : Number(averageDollarVolume.toFixed(2)),
        currentDollarVolume: currentDollarVolume === null ? null : Number(currentDollarVolume.toFixed(2)),
        liquidityLabel: liquidityLabel(averageDollarVolume),
        atLevel: nearestLevel({
            currentPrice: request.currentPrice ?? latest.close,
            supportLevels: request.supportLevels ?? [],
            resistanceLevels: request.resistanceLevels ?? [],
        }),
        diagnostics,
    };
}
export async function buildWarehouseVolumeActivityContext(request) {
    const symbol = normalizeSymbol(request.symbol);
    const lookbackBars = Math.max(20, request.lookbackBars ?? DEFAULT_LOOKBACK_BARS);
    const range = request.sessionDate
        ? sessionDateRange(request.sessionDate, request.asOfTimestamp, lookbackBars)
        : fallbackRange(request.asOfTimestamp, lookbackBars);
    const candles = await request.warehouse.getCandles({
        provider: request.provider,
        symbol,
        timeframe: "5m",
        startTimestamp: range.startTimestamp,
        endTimestamp: range.endTimestamp,
    });
    return buildVolumeActivityContextFromWarehouseCandles({
        symbol,
        provider: request.provider,
        candles,
        asOfTimestamp: request.asOfTimestamp,
        currentPrice: request.currentPrice,
        supportLevels: request.supportLevels,
        resistanceLevels: request.resistanceLevels,
    });
}
