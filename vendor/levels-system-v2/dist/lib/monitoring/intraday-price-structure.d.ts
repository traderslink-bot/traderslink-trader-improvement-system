import type { IntradayPriceStructureContext, LivePriceUpdate } from "./monitoring-types.js";
export declare class IntradayPriceStructureTracker {
    private readonly bucketMs;
    private readonly bucketsBySymbol;
    constructor(bucketMs?: number);
    update(update: LivePriceUpdate): IntradayPriceStructureContext | undefined;
    reset(symbol: string): void;
}
//# sourceMappingURL=intraday-price-structure.d.ts.map