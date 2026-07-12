import type { CandleFetchTimeframe } from "../market-data/candle-types.js";
import { type NasdaqMarketCapBucket, type NasdaqUniverseSnapshot } from "./nasdaq-marketcap-universe.js";
export type NasdaqUnder500CandleCoverageStatus = "covered" | "partial" | "missing" | "contract_unresolved";
export type NasdaqTimeframeCoverage = {
    timeframe: CandleFetchTimeframe;
    status: Exclude<NasdaqUnder500CandleCoverageStatus, "contract_unresolved">;
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
export type NasdaqUnder500CandleSymbolTask = {
    stage: number;
    bucket: Exclude<NasdaqMarketCapBucket, "500m_plus" | "invalid_or_missing">;
    symbol: string;
    name: string;
    marketCap: number;
    status: NasdaqUnder500CandleCoverageStatus;
    timeframeCoverage: NasdaqTimeframeCoverage[];
    fetchTimeframes: CandleFetchTimeframe[];
};
export type NasdaqUnder500CandleBackfillPlan = {
    generatedAt: string;
    sourceUniversePath: string;
    warehouseDirectoryPath: string;
    provider: "ibkr";
    timeframes: CandleFetchTimeframe[];
    dryRun: boolean;
    stageFilter: number | null;
    maxSymbols: number | null;
    totals: {
        symbols: number;
        covered: number;
        partial: number;
        missing: number;
        contractUnresolved: number;
        selectedForFetch: number;
    };
    tasks: NasdaqUnder500CandleSymbolTask[];
    selectedTasks: NasdaqUnder500CandleSymbolTask[];
};
export declare const NASDAQ_UNDER500_DEFAULT_TIMEFRAMES: CandleFetchTimeframe[];
export declare const NASDAQ_UNDER500_LOOKBACKS: Record<CandleFetchTimeframe, number>;
export declare function buildNasdaqUnder500CandleBackfillPlan(params: {
    snapshot: NasdaqUniverseSnapshot;
    sourceUniversePath: string;
    warehouseDirectoryPath?: string;
    timeframes?: CandleFetchTimeframe[];
    stage?: number;
    maxSymbols?: number;
    dryRun?: boolean;
    knownContractUnresolvedSymbols?: string[];
    now?: number;
}): NasdaqUnder500CandleBackfillPlan;
export declare function stageToBucket(stage: number): Exclude<NasdaqMarketCapBucket, "500m_plus" | "invalid_or_missing"> | null;
export declare function formatNasdaqUnder500CandleBackfillPlan(plan: NasdaqUnder500CandleBackfillPlan): string;
//# sourceMappingURL=nasdaq-under500-candle-backfill.d.ts.map