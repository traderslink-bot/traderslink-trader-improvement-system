export declare const ICE_PRODUCT_CODES_CSV_URL = "https://www.ice.com/api/productguide/info/codes/all/csv";
export type FuturesUniverseSource = "seed" | "ice_product_codes";
export type FuturesUniverseTier = "tier_1_liquid" | "tier_2_watch" | "full_inventory";
export type FuturesRoot = {
    root: string;
    name: string;
    exchange: string;
    currency: string;
    assetClass: string;
    tier: FuturesUniverseTier;
    source: FuturesUniverseSource;
    sourceProductId?: string;
    sourceMarketType?: string;
    sourceMicCode?: string;
    notes?: string;
};
export type IceProductCodeRow = {
    productName: string;
    productId: string;
    physical: string;
    logical: string;
    group: string;
    clearingAdmin: string;
    clearingVenue: string;
    micCode: string;
    marketTypeName: string;
    symbolCode: string;
};
export type FuturesUniverse = {
    generatedAt: string;
    sources: string[];
    counts: {
        totalRoots: number;
        seedRoots: number;
        iceRows: number;
        iceFutureRows: number;
        uniqueIceSymbolCodes: number;
        byTier: Record<FuturesUniverseTier, number>;
        byExchange: Record<string, number>;
        byAssetClass: Record<string, number>;
    };
    notes: string[];
    roots: FuturesRoot[];
    iceProducts: IceProductCodeRow[];
};
export type FuturesUniverseWriteResult = {
    masterJsonPath: string;
    markdownPath: string;
    artifactJsonPath: string;
    artifactMarkdownPath: string;
    universe: FuturesUniverse;
};
export declare function fetchIceProductCodes(fetchImpl?: typeof fetch): Promise<IceProductCodeRow[]>;
export declare function buildFuturesUniverse(params?: {
    iceProducts?: IceProductCodeRow[];
    generatedAt?: string;
}): FuturesUniverse;
export declare function writeFuturesUniverseArtifacts(params: {
    universe: FuturesUniverse;
    masterJsonPath?: string;
    markdownPath?: string;
    artifactsRoot?: string;
}): Promise<FuturesUniverseWriteResult>;
export declare function formatFuturesUniverseMarkdown(universe: FuturesUniverse): string;
//# sourceMappingURL=futures-universe.d.ts.map