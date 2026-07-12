export type CandleWarehouseStorageMode = "jsonl" | "sqlite_recommended" | "service_recommended";
export type CandleWarehouseStoragePolicyInput = {
    symbolCount: number;
    sessionCount: number;
    estimatedRows: number;
    monthlyImportTrades?: number;
};
export type CandleWarehouseStoragePolicy = {
    mode: CandleWarehouseStorageMode;
    reasons: string[];
    thresholds: {
        jsonlComfortRows: number;
        sqliteRecommendedRows: number;
        serviceRecommendedRows: number;
        sqliteRecommendedMonthlyTrades: number;
    };
};
export declare function assessCandleWarehouseStoragePolicy(input: CandleWarehouseStoragePolicyInput): CandleWarehouseStoragePolicy;
//# sourceMappingURL=warehouse-storage-policy.d.ts.map