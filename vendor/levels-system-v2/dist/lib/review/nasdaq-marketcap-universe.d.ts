import type { CandleFetchTimeframe } from "../market-data/candle-types.js";
export declare const NASDAQ_SCREENER_URL = "https://api.nasdaq.com/api/screener/stocks?exchange=nasdaq&download=true";
export type NasdaqRawScreenerRow = {
    symbol?: unknown;
    name?: unknown;
    lastsale?: unknown;
    netchange?: unknown;
    pctchange?: unknown;
    marketCap?: unknown;
    country?: unknown;
    ipoyear?: unknown;
    volume?: unknown;
    sector?: unknown;
    industry?: unknown;
    url?: unknown;
    [key: string]: unknown;
};
export type NasdaqMarketCapBucket = "under_100m" | "100m_to_200m" | "200m_to_300m" | "300m_to_400m" | "400m_to_500m" | "500m_plus" | "invalid_or_missing";
export type CommonEquityStatus = "likely_common_equity" | "invalid_symbol" | "invalid_market_cap" | "blocked_name_pattern" | "blocked_symbol_suffix";
export type NasdaqUniverseRow = {
    symbol: string;
    name: string;
    lastSale: string;
    netChange: string;
    percentChange: string;
    marketCap: number;
    marketCapRaw: string;
    marketCapBucket: NasdaqMarketCapBucket;
    country: string;
    ipoYear: string;
    volume: number;
    sector: string;
    industry: string;
    url: string;
    isLikelyCommonEquity: boolean;
    commonEquityStatus: CommonEquityStatus;
    raw: NasdaqRawScreenerRow;
};
export type NasdaqUniverseSnapshot = {
    generatedAt: string;
    source: string;
    rawCount: number;
    cleanCount: number;
    rows: NasdaqUniverseRow[];
};
export type NasdaqUnder500Universe = {
    generatedAt: string;
    source: string;
    bucketCounts: Record<Exclude<NasdaqMarketCapBucket, "500m_plus" | "invalid_or_missing">, number>;
    buckets: Record<Exclude<NasdaqMarketCapBucket, "500m_plus" | "invalid_or_missing">, NasdaqUniverseRow[]>;
};
export type ExistingDocDiffStatus = "still_current_under_100m" | "current_but_moved_bucket" | "not_in_current_nasdaq_screener" | "possible_alias_candidate" | "new_under_100m_candidate";
export type ExistingDocDiffRow = {
    symbol: string;
    status: ExistingDocDiffStatus;
    currentSymbol: string | null;
    currentBucket: NasdaqMarketCapBucket | null;
    marketCap: number | null;
    reason: string;
};
export type ExistingDocDiff = {
    generatedAt: string;
    sourceChecklistPath: string;
    rows: ExistingDocDiffRow[];
};
export type NasdaqUniverseWriteResult = {
    masterJsonPath: string;
    rawJsonPath: string;
    cleanJsonPath: string;
    under500JsonPath: string;
    under500MarkdownPath: string;
    docUnder500MarkdownPath: string;
    diffMarkdownPath: string;
    diffJsonPath: string;
    snapshot: NasdaqUniverseSnapshot;
    under500: NasdaqUnder500Universe;
    diff: ExistingDocDiff;
};
export type NasdaqBackfillPlanStage = {
    stage: number;
    bucket: Exclude<NasdaqMarketCapBucket, "500m_plus" | "invalid_or_missing">;
    symbols: string[];
    missingSymbols: string[];
    coveredSymbols: string[];
    unresolvedSymbols: string[];
};
export type NasdaqBackfillPlan = {
    generatedAt: string;
    sourceUniversePath: string;
    warehouseDirectoryPath: string;
    provider: "ibkr";
    timeframes: CandleFetchTimeframe[];
    dryRun: true;
    stages: NasdaqBackfillPlanStage[];
};
export declare function normalizeNasdaqSymbol(value: unknown): string;
export declare function parseNasdaqMarketCap(value: unknown): number;
export declare function parseNasdaqVolume(value: unknown): number;
export declare function bucketNasdaqMarketCap(marketCap: number): NasdaqMarketCapBucket;
export declare function classifyCommonEquity(row: Pick<NasdaqUniverseRow, "symbol" | "name" | "marketCap">): CommonEquityStatus;
export declare function normalizeNasdaqRow(row: NasdaqRawScreenerRow): NasdaqUniverseRow;
export declare function fetchNasdaqScreenerRows(fetchImpl?: typeof fetch): Promise<NasdaqRawScreenerRow[]>;
export declare function buildNasdaqUniverseSnapshot(rows: NasdaqRawScreenerRow[], generatedAt?: string): NasdaqUniverseSnapshot;
export declare function buildUnder500Universe(snapshot: NasdaqUniverseSnapshot): NasdaqUnder500Universe;
export declare function parseExistingUnder100mSymbols(markdown: string): string[];
export declare function buildExistingDocDiff(params: {
    existingSymbols: string[];
    snapshot: NasdaqUniverseSnapshot;
    sourceChecklistPath: string;
}): ExistingDocDiff;
export declare function formatUnder500Markdown(under500: NasdaqUnder500Universe): string;
export declare function formatExistingDocDiffMarkdown(diff: ExistingDocDiff): string;
export declare function writeNasdaqUniverseArtifacts(params: {
    snapshot: NasdaqUniverseSnapshot;
    rawRows: NasdaqRawScreenerRow[];
    checklistPath: string;
    masterJsonPath?: string;
    artifactsRoot?: string;
    docUnder500MarkdownPath?: string;
}): Promise<NasdaqUniverseWriteResult>;
export declare function readNasdaqUniverseSnapshot(path: string): Promise<NasdaqUniverseSnapshot>;
export declare function buildNasdaqUnder500BackfillPlan(params: {
    snapshot: NasdaqUniverseSnapshot;
    sourceUniversePath: string;
    warehouseDirectoryPath?: string;
    timeframes?: CandleFetchTimeframe[];
}): NasdaqBackfillPlan;
export declare function formatNasdaqBackfillPlanMarkdown(plan: NasdaqBackfillPlan): string;
export declare function writeNasdaqBackfillPlan(params: {
    plan: NasdaqBackfillPlan;
    outDir?: string;
}): Promise<{
    jsonPath: string;
    markdownPath: string;
}>;
//# sourceMappingURL=nasdaq-marketcap-universe.d.ts.map