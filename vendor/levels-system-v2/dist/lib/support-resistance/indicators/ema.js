function assertValidPeriod(period) {
    if (!Number.isInteger(period) || period <= 0) {
        throw new Error("EMA period must be a positive integer.");
    }
}
function defaultPriceSelector(candle) {
    return candle.close;
}
export function calculateEmaSeries(candles, period, options = {}) {
    assertValidPeriod(period);
    const priceSelector = options.priceSelector ?? defaultPriceSelector;
    const sorted = [...candles].sort((left, right) => left.timestamp - right.timestamp);
    const prices = sorted.map((candle) => priceSelector(candle));
    if (prices.length < period || prices.some((price) => !Number.isFinite(price))) {
        return [];
    }
    const multiplier = 2 / (period + 1);
    const seed = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    const series = [
        {
            timestamp: sorted[period - 1].timestamp,
            value: seed,
        },
    ];
    let previous = seed;
    for (let index = period; index < sorted.length; index += 1) {
        const value = prices[index] * multiplier + previous * (1 - multiplier);
        previous = value;
        series.push({
            timestamp: sorted[index].timestamp,
            value,
        });
    }
    return series;
}
export function calculateLatestEma(candles, period, options = {}) {
    const series = calculateEmaSeries(candles, period, options);
    return series.at(-1)?.value ?? null;
}
