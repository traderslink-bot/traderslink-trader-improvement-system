import { calculateLatestEma } from "./ema.js";
import { calculateLatestVwap } from "./vwap.js";
function pctFromPrice(price, level) {
    return level === null ? null : Number(((price - level) / Math.max(Math.abs(price), 0.0001) * 100).toFixed(4));
}
function nearestDynamicLevel(price, levels, side) {
    const candidates = levels
        .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
        .filter(([, value]) => side === "below" ? value <= price : value >= price)
        .sort((left, right) => side === "below"
        ? right[1] - left[1]
        : left[1] - right[1]);
    return candidates[0]?.[0] ?? null;
}
export function buildDynamicLevelsFromCandles(candles, options = {}) {
    const sorted = [...(candles ?? [])].sort((left, right) => left.timestamp - right.timestamp);
    const emaPeriods = options.emaPeriods ?? [9, 20];
    const diagnostics = [];
    const emaByPeriod = {};
    if (sorted.length === 0) {
        diagnostics.push({
            code: "missing_intraday_candles",
            message: "5-minute candles are required for shared VWAP/EMA dynamic levels.",
        });
    }
    for (const period of emaPeriods) {
        const latest = calculateLatestEma(sorted, period);
        emaByPeriod[period] = latest;
        if (latest === null) {
            diagnostics.push({
                code: "insufficient_ema_bars",
                message: `At least ${period} candles are required to calculate EMA ${period}.`,
            });
        }
    }
    const vwap = calculateLatestVwap(sorted, { sessionDate: options.sessionDate });
    if (vwap === null && sorted.length > 0) {
        diagnostics.push({
            code: "missing_volume_for_vwap",
            message: "VWAP requires positive per-bar volume on the supplied intraday candles.",
        });
    }
    const currentPrice = options.currentPrice;
    const priceContext = typeof currentPrice === "number" && Number.isFinite(currentPrice) && currentPrice > 0
        ? {
            currentPrice,
            priceVsVwapPct: pctFromPrice(currentPrice, vwap),
            priceVsEma9Pct: pctFromPrice(currentPrice, emaByPeriod[9] ?? null),
            priceVsEma20Pct: pctFromPrice(currentPrice, emaByPeriod[20] ?? null),
            aboveVwap: vwap === null ? null : currentPrice >= vwap,
            aboveEma9: emaByPeriod[9] === null || emaByPeriod[9] === undefined ? null : currentPrice >= emaByPeriod[9],
            aboveEma20: emaByPeriod[20] === null || emaByPeriod[20] === undefined ? null : currentPrice >= emaByPeriod[20],
            dynamicSupportCandidate: nearestDynamicLevel(currentPrice, [
                ["vwap", vwap],
                ["ema9", emaByPeriod[9] ?? null],
                ["ema20", emaByPeriod[20] ?? null],
            ], "below"),
            dynamicResistanceCandidate: nearestDynamicLevel(currentPrice, [
                ["vwap", vwap],
                ["ema9", emaByPeriod[9] ?? null],
                ["ema20", emaByPeriod[20] ?? null],
            ], "above"),
        }
        : null;
    return {
        vwap,
        emaByPeriod,
        ema9: emaByPeriod[9] ?? null,
        ema20: emaByPeriod[20] ?? null,
        priceContext,
        diagnostics,
    };
}
