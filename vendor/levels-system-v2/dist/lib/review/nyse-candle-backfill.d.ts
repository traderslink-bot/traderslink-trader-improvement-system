import type { CandleFetchTimeframe } from "../market-data/candle-types.js";
import type { NasdaqUniverseRow, NasdaqUniverseSnapshot } from "./nasdaq-marketcap-universe.js";
export type NyseCandleCoverageStatus = "covered" | "partial" | "missing" | "contract_unresolved";
export type NyseTimeframeCoverage = {
    timeframe: CandleFetchTimeframe;
    status: Exclude<NyseCandleCoverageStatus, "contract_unresolved">;
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
export type NyseCandleSymbolTask = {
    symbol: string;
    name: string;
    marketCap: number;
    marketCapBucket: string;
    status: NyseCandleCoverageStatus;
    timeframeCoverage: NyseTimeframeCoverage[];
    fetchTimeframes: CandleFetchTimeframe[];
};
export type NyseCandleBackfillPlan = {
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
    tasks: NyseCandleSymbolTask[];
    selectedTasks: NyseCandleSymbolTask[];
};
export declare const NYSE_DEFAULT_TIMEFRAMES: CandleFetchTimeframe[];
export declare const NYSE_LOOKBACKS: Record<CandleFetchTimeframe, number>;
export declare function buildNyseCleanUniverse(snapshot: NasdaqUniverseSnapshot): NasdaqUniverseRow[];
export declare function buildNyseCandleBackfillPlan(params: {
    snapshot: NasdaqUniverseSnapshot;
    sourceUniversePath: string;
    warehouseDirectoryPath?: string;
    timeframes?: CandleFetchTimeframe[];
    maxSymbols?: number;
    dryRun?: boolean;
    knownContractUnresolvedSymbols?: string[];
    now?: number;
}): NyseCandleBackfillPlan;
export declare function formatNyseCandleBackfillPlan(plan: NyseCandleBackfillPlan): string;
//# sourceMappingURL=nyse-candle-backfill.d.ts.map