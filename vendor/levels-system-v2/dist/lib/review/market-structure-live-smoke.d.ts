export type MarketStructureLiveSmokeStatus = "pass" | "warn" | "fail";
export type MarketStructureLiveSmokeCheck = {
    name: string;
    status: MarketStructureLiveSmokeStatus;
    detail: string;
    count?: number;
};
export type MarketStructureLiveSmokeReport = {
    generatedAt: string;
    sourceAuditPath: string;
    session: string;
    ok: boolean;
    totals: {
        rowsScanned: number;
        postedRows: number;
        visibleFormal5mStoryKeys: number;
        visibleHigherTimeframeFormalStoryKeys: number;
        visibleStable5mStoryKeys: number;
        actionableFormalEvents: number;
        metadataOnlyFormalEvents: number;
    };
    checks: MarketStructureLiveSmokeCheck[];
};
export type BuildMarketStructureLiveSmokeOptions = {
    input?: string;
};
export declare function buildMarketStructureLiveSmokeReport(options?: BuildMarketStructureLiveSmokeOptions): MarketStructureLiveSmokeReport;
export declare function formatMarketStructureLiveSmokeMarkdown(report: MarketStructureLiveSmokeReport): string;
export declare function writeMarketStructureLiveSmokeReport(params: {
    report: MarketStructureLiveSmokeReport;
    jsonPath: string;
    markdownPath: string;
}): void;
//# sourceMappingURL=market-structure-live-smoke.d.ts.map