import type { ChartThesisRead, LevelSnapshotPayload } from "../alerts/alert-types.js";
import type { CandleProviderResponse, CandleTimeframe } from "../market-data/candle-types.js";
export type ChartThesisEngineInput = {
    symbol: string;
    currentPrice: number;
    seriesMap: Partial<Record<CandleTimeframe, CandleProviderResponse>>;
};
export declare function buildChartThesisRead(input: ChartThesisEngineInput): ChartThesisRead | null;
export declare function formatChartThesisRead(read: LevelSnapshotPayload["potentialMoveRead"]): string[];
//# sourceMappingURL=chart-thesis-engine.d.ts.map