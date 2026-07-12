import { CandleFetchService, type CandleFetchServiceOptions } from "../market-data/candle-fetch-service.js";
import type { CandleProviderName } from "../market-data/candle-types.js";
import { DurableCandleWarehouse } from "../candle-warehouse/index.js";
import { type BuildTradeAnalysisCandleContextRequest, type TradeAnalysisCandleContext } from "./trade-analysis-context.js";
export type BuildWarehouseBackedTradeAnalysisContextRequest = Omit<BuildTradeAnalysisCandleContextRequest, "fetchService" | "fetchServiceOptions"> & {
    warehouse?: DurableCandleWarehouse;
    warehouseRootDirectoryPath?: string;
    warehouseMode?: "read_write" | "refresh" | "replay";
    providerName?: CandleProviderName;
    delegateFetchService?: CandleFetchService;
    delegateFetchServiceOptions?: CandleFetchServiceOptions;
};
export declare function buildWarehouseBackedTradeAnalysisContext(request: BuildWarehouseBackedTradeAnalysisContextRequest): Promise<TradeAnalysisCandleContext>;
//# sourceMappingURL=warehouse-backed-trade-analysis.d.ts.map