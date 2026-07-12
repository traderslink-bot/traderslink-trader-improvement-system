import type { AcceptanceContext, RangeBoxContext } from "./trade-story-intelligence.js";
import type { PracticalTradeStructureContext } from "./monitoring-types.js";
export type PrimaryTradeAreaEscapeSide = "up" | "down" | "none";
export type PrimaryTradeAreaContext = {
    supportLow: number | null;
    supportHigh: number | null;
    resistanceLow: number | null;
    resistanceHigh: number | null;
    centerPrice: number | null;
    widthPct: number | null;
    locked: boolean;
    escapeSide: PrimaryTradeAreaEscapeSide;
    escapeConfidence: "none" | "testing" | "accepted";
    traderLine?: string;
};
export declare function buildPrimaryTradeAreaContext(params: {
    symbol: string;
    price: number;
    tradeStructure?: PracticalTradeStructureContext;
    rangeBox: RangeBoxContext;
    acceptance: AcceptanceContext;
    stableMaterialChange?: boolean;
}): PrimaryTradeAreaContext;
//# sourceMappingURL=primary-trade-area.d.ts.map