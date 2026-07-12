import type { CandleFetchTimeframe } from "../market-data/candle-types.js";
import type { NasdaqUniverseRow, NasdaqUniverseSnapshot } from "./nasdaq-marketcap-universe.js";
export type NasdaqOver500CandleCoverageStatus = "covered" | "partial" | "missing" | "contract_unresolved";
export type NasdaqOver500TimeframeCoverage = {
    timeframe: CandleFetchTimeframe;
    status: Exclude<NasdaqOver500CandleCoverageStatus, "contract_unresolved">;
    rowCount: number;
    uniqueTimestampCount: number;
    duplicateTimestampCount: number;
    invalidRowCount: number;
    firstTimestamp: number | null;
    lastTimestamp: number | null;
    minRowsForComplete: number;
    staleAfterDays: number;
    reason: string;
};
export type NasdaqOver500CandleSymbolTask = {
    symbol: string;
    name: string;
    marketCap: number;
    status: NasdaqOver500CandleCoverageStatus;
    timeframeCoverage: NasdaqOver500TimeframeCoverage[];
    fetchTimeframes: CandleFetchTimeframe[];
};
export type NasdaqOver500CandleBackfillPlan = {
    generatedAt: string;
    sourceUniversePath: string;
    warehouseDirectoryPath: string;
    provider: "ibkr";
    timeframes: CandleFetchTimeframe[];
    dryRun: boolean;
    maxSymbols: number | null;
    totals: {
        symbols: number;
        covered: number;
        partial: number;
        missing: number;
        contractUnresolved: number;
        selectedForFetch: number;
    };
    tasks: NasdaqOver500CandleSymbolTask[];
    selectedTasks: NasdaqOver500CandleSymbolTask[];
};
export declare const NASDAQ_OVER500_DEFAULT_TIMEFRAMES: CandleFetchTimeframe[];
export declare const NASDAQ_OVER500_LOOKBACKS: Record<CandleFetchTimeframe, number>;
export declare function buildOver500Universe(snapshot: NasdaqUniverseSnapshot): NasdaqUniverseRow[];
export declare function buildNasdaqOver500CandleBackfillPlan(params: {
    snapshot: NasdaqUniverseSnapshot;
    sourceUniversePath: string;
    warehouseDirectoryPath?: string;
    timeframes?: CandleFetchTimeframe[];
    maxSymbols?: number;
    dryRun?: boolean;
    knownContractUnresolvedSymbols?: string[];
    now?: number;
}): NasdaqOver500CandleBackfillPlan;
export declare function formatNasdaqOver500CandleBackfillPlan(plan: NasdaqOver500CandleBackfillPlan): string;
//# sourceMappingURL=nasdaq-over500-candle-backfill.d.ts.map