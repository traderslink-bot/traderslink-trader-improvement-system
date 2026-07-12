const DEFAULT_BUCKET_MS = 5 * 60 * 1000;
const MAX_BUCKETS = 12;
function bucketStart(timestamp, bucketMs) {
    return Math.floor(timestamp / bucketMs) * bucketMs;
}
function rangePct(low, high) {
    return (high - low) / Math.max(low, 0.0001);
}
function countHigherLows(buckets) {
    let count = 0;
    for (let index = 1; index < buckets.length; index += 1) {
        if (buckets[index].low > buckets[index - 1].low) {
            count += 1;
        }
    }
    return count;
}
function countLowerHighs(buckets) {
    let count = 0;
    for (let index = 1; index < buckets.length; index += 1) {
        if (buckets[index].high < buckets[index - 1].high) {
            count += 1;
        }
    }
    return count;
}
function deriveDirection(buckets) {
    if (buckets.length < 3) {
        return "unknown";
    }
    const higherLows = countHigherLows(buckets.slice(-4));
    const lowerHighs = countLowerHighs(buckets.slice(-4));
    if (higherLows >= 2 && higherLows > lowerHighs) {
        return "building";
    }
    if (lowerHighs >= 2 && lowerHighs > higherLows) {
        return "fading";
    }
    return "flat";
}
function buildContext(buckets, bucketMs) {
    if (buckets.length < 2) {
        return undefined;
    }
    const recent = buckets.slice(-6);
    const baseLow = Math.min(...recent.map((bucket) => bucket.low));
    const baseHigh = Math.max(...recent.map((bucket) => bucket.high));
    const lastClose = recent.at(-1).close;
    return {
        bucketMs,
        bucketCount: recent.length,
        baseLow,
        baseHigh,
        lastClose,
        rangePct: Number(rangePct(baseLow, baseHigh).toFixed(4)),
        higherLowCount: countHigherLows(recent),
        lowerHighCount: countLowerHighs(recent),
        direction: deriveDirection(recent),
    };
}
export class IntradayPriceStructureTracker {
    bucketMs;
    bucketsBySymbol = new Map();
    constructor(bucketMs = DEFAULT_BUCKET_MS) {
        this.bucketMs = bucketMs;
    }
    update(update) {
        const symbol = update.symbol.toUpperCase();
        const start = bucketStart(update.timestamp, this.bucketMs);
        const buckets = this.bucketsBySymbol.get(symbol) ?? [];
        const last = buckets.at(-1);
        if (last && last.start === start) {
            last.high = Math.max(last.high, update.lastPrice);
            last.low = Math.min(last.low, update.lastPrice);
            last.close = update.lastPrice;
        }
        else {
            buckets.push({
                start,
                open: update.lastPrice,
                high: update.lastPrice,
                low: update.lastPrice,
                close: update.lastPrice,
            });
            while (buckets.length > MAX_BUCKETS) {
                buckets.shift();
            }
        }
        this.bucketsBySymbol.set(symbol, buckets);
        return buildContext(buckets, this.bucketMs);
    }
    reset(symbol) {
        this.bucketsBySymbol.delete(symbol.toUpperCase());
    }
}
