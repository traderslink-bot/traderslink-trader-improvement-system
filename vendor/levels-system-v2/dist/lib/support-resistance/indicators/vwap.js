function defaultTypicalPrice(candle) {
    return (candle.high + candle.low + candle.close) / 3;
}
function candleUtcDate(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
}
function filterBySessionDate(candles, sessionDate) {
    if (!sessionDate) {
        return candles;
    }
    return candles.filter((candle) => candleUtcDate(candle.timestamp) === sessionDate);
}
export function calculateVwapSeries(candles, options = {}) {
    const typicalPriceSelector = options.typicalPriceSelector ?? defaultTypicalPrice;
    const sorted = filterBySessionDate([...candles].sort((left, right) => left.timestamp - right.timestamp), options.sessionDate);
    const series = [];
    let cumulativePriceVolume = 0;
    let cumulativeVolume = 0;
    for (const candle of sorted) {
        const typicalPrice = typicalPriceSelector(candle);
        if (!Number.isFinite(typicalPrice) ||
            !Number.isFinite(candle.volume) ||
            candle.volume <= 0) {
            continue;
        }
        cumulativePriceVolume += typicalPrice * candle.volume;
        cumulativeVolume += candle.volume;
        if (cumulativeVolume <= 0) {
            continue;
        }
        series.push({
            timestamp: candle.timestamp,
            value: cumulativePriceVolume / cumulativeVolume,
            cumulativeVolume,
        });
    }
    return series;
}
export function calculateLatestVwap(candles, options = {}) {
    const series = calculateVwapSeries(candles, options);
    return series.at(-1)?.value ?? null;
}
