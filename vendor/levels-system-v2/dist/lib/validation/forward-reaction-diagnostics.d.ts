import type { Candle } from "../market-data/candle-types.js";
import type { ForwardReactionLevelResult } from "./forward-reaction-validator.js";
export type ForwardLevelDiagnosticState = "fresh" | "respected" | "testing" | "broken" | "consumed_by_momentum" | "over_tested";
export type ForwardLevelDiagnosticConfidence = "high" | "medium" | "watch";
export type ForwardLevelDiagnosticTag = "active_intraday_reference" | "small_clean_break_watch" | "thin_liquidity_break_watch" | "single_touch_higher_timeframe_reference" | "sparse_tape_clean_break_watch";
export type ForwardLevelDiagnostic = {
    state: ForwardLevelDiagnosticState;
    confidence: ForwardLevelDiagnosticConfidence;
    tags: ForwardLevelDiagnosticTag[];
    reasons: string[];
    maxFavorableExcursionPct: number;
    maxAdverseExcursionPct: number;
};
export declare function classifyForwardLevelDiagnostic(params: {
    level: ForwardReactionLevelResult;
    resolutionCandles?: Candle[];
}): ForwardLevelDiagnostic;
//# sourceMappingURL=forward-reaction-diagnostics.d.ts.map