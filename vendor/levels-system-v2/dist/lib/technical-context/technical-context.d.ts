import type { Candle } from "../market-data/candle-types.js";
import type { TechnicalContext } from "./technical-context-types.js";
type BuildTechnicalContextRequest = {
    candles: Candle[];
    currentPrice?: number | null;
    provider?: string | null;
    sessionDate?: string | null;
    dataQualityFlags?: string[];
};
export declare function refreshTechnicalContextForPrice(context: TechnicalContext, currentPriceInput: number | null | undefined): TechnicalContext;
export declare function buildTechnicalContextFromCandles(request: BuildTechnicalContextRequest): TechnicalContext;
export {};
//# sourceMappingURL=technical-context.d.ts.map