function formatLevel(value) {
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}
function pctWidth(low, high) {
    if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high <= low) {
        return null;
    }
    return Number((((high - low) / low) * 100).toFixed(2));
}
export function buildPrimaryTradeAreaContext(params) {
    const support = params.tradeStructure?.supportArea;
    const resistance = params.tradeStructure?.resistanceArea;
    if (!support || !resistance || resistance.high <= support.low) {
        return {
            supportLow: null,
            supportHigh: null,
            resistanceLow: null,
            resistanceHigh: null,
            centerPrice: null,
            widthPct: null,
            locked: false,
            escapeSide: "none",
            escapeConfidence: "none",
        };
    }
    const low = support.low;
    const high = resistance.high;
    const widthPct = pctWidth(low, high);
    const centerPrice = Number(((low + high) / 2).toFixed(4));
    const priceAbove = params.price > resistance.high;
    const priceBelow = params.price < support.low;
    const accepted = params.acceptance.label === "accepted" || params.stableMaterialChange === true;
    const escapeSide = priceAbove ? "up" : priceBelow ? "down" : "none";
    const escapeConfidence = escapeSide === "none" ? "none" : accepted ? "accepted" : "testing";
    const locked = params.rangeBox.label === "active" && escapeSide === "none";
    return {
        supportLow: support.low,
        supportHigh: support.high,
        resistanceLow: resistance.low,
        resistanceHigh: resistance.high,
        centerPrice,
        widthPct,
        locked,
        escapeSide,
        escapeConfidence,
        traderLine: locked
            ? `${params.symbol} is still working inside ${formatLevel(support.high)} support and ${formatLevel(resistance.low)} resistance`
            : escapeSide === "up"
                ? `price is testing above the active range; acceptance above ${formatLevel(resistance.high)} keeps the expansion cleaner`
                : escapeSide === "down"
                    ? `price is testing below the active range; reclaiming ${formatLevel(support.low)} would repair the range`
                    : undefined,
    };
}
