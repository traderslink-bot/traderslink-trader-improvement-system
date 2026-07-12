import { type NasdaqMarketCapBucket, type NasdaqRawScreenerRow, type NasdaqUniverseRow, type NasdaqUniverseSnapshot } from "./nasdaq-marketcap-universe.js";
export declare const NYSE_SCREENER_URL = "https://api.nasdaq.com/api/screener/stocks?exchange=nyse&download=true";
export type NyseMarketCapUniverse = {
    generatedAt: string;
    source: string;
    bucketCounts: Record<Exclude<NasdaqMarketCapBucket, "invalid_or_missing">, number>;
    buckets: Record<Exclude<NasdaqMarketCapBucket, "invalid_or_missing">, NasdaqUniverseRow[]>;
};
export type NyseUniverseWriteResult = {
    masterJsonPath: string;
    rawJsonPath: string;
    cleanJsonPath: string;
    marketCapJsonPath: string;
    marketCapMarkdownPath: string;
    docMarketCapMarkdownPath: string;
    snapshot: NasdaqUniverseSnapshot;
    marketCapUniverse: NyseMarketCapUniverse;
};
export declare function fetchNyseScreenerRows(fetchImpl?: typeof fetch): Promise<NasdaqRawScreenerRow[]>;
export declare function buildNyseUniverseSnapshot(rows: NasdaqRawScreenerRow[], generatedAt?: string): NasdaqUniverseSnapshot;
export declare function buildNyseMarketCapUniverse(snapshot: NasdaqUniverseSnapshot): NyseMarketCapUniverse;
export declare function formatNyseMarketCapMarkdown(universe: NyseMarketCapUniverse): string;
export declare function writeNyseUniverseArtifacts(params: {
    snapshot: NasdaqUniverseSnapshot;
    rawRows: NasdaqRawScreenerRow[];
    masterJsonPath?: string;
    artifactsRoot?: string;
    docMarketCapMarkdownPath?: string;
}): Promise<NyseUniverseWriteResult>;
export declare function readNyseUniverseSnapshot(path: string): Promise<NasdaqUniverseSnapshot>;
//# sourceMappingURL=nyse-marketcap-universe.d.ts.map