import type { Candle, CandleFetchTimeframe, CandleSessionLabel, CandleSessionSummary } from "./candle-types.js";
type SessionAnnotatedCandle = {
    candle: Candle;
    session: CandleSessionLabel;
    sessionDate: string | null;
};
export declare function classifyIntradayCandleTimestamp(timestamp: number): {
    session: CandleSessionLabel;
    sessionDate: string;
};
export declare function isLikelyTradableIntradayTimestamp(timestamp: number): boolean;
export declare function classifyCandleSessions(candles: Candle[], timeframe: CandleFetchTimeframe): SessionAnnotatedCandle[];
export declare function buildCandleSessionSummary(candles: Candle[], timeframe: CandleFetchTimeframe): CandleSessionSummary | null;
export declare function filterCandlesBySession(candles: Candle[], timeframe: CandleFetchTimeframe, session: CandleSessionLabel): Candle[];
export {};
//# sourceMappingURL=candle-session-classifier.d.ts.map