export type CandleWarehouseAuditSymbol = {
    provider: string;
    symbol: string;
    timeframe: string;
    files: number;
    rows: number;
    duplicateTimestamps: number;
    invalidRows: number;
    zeroVolumeRows: number;
    firstTimestamp: number | null;
    lastTimestamp: number | null;
    status: "healthy" | "watch" | "broken";
};
export type CandleWarehouseAuditReport = {
    rootDirectoryPath: string;
    generatedAt: string;
    providerCount: number;
    symbolTimeframeCount: number;
    totalRows: number;
    brokenCount: number;
    watchCount: number;
    symbols: CandleWarehouseAuditSymbol[];
};
export declare function buildCandleWarehouseAuditReport(rootDirectoryPath?: string): Promise<CandleWarehouseAuditReport>;
export declare function formatCandleWarehouseAuditReport(report: CandleWarehouseAuditReport): string;
export declare function writeCandleWarehouseAuditReport(params: {
    report: CandleWarehouseAuditReport;
    outDir?: string;
}): Promise<{
    jsonPath: string;
    markdownPath: string;
}>;
//# sourceMappingURL=candle-warehouse-audit.d.ts.map