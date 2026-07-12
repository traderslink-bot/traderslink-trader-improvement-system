import { type CandleFetchServiceOptions } from "../market-data/candle-fetch-service.js";
import type { HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import { DurableCandleWarehouse, type DurableCandleWarehouseFetchServiceOptions } from "../candle-warehouse/index.js";
import { type BuildSupportResistanceContextForSymbolRequest, type SupportResistanceSymbolContext } from "./symbol-context.js";
import { type BuildTradeAnalysisCandleContextRequest, type TradeAnalysisCandleContext } from "./trade-analysis-context.js";
export type WarehouseBackedSharedContextOptions = {
    warehouseDirectoryPath?: string;
    warehouse?: DurableCandleWarehouse;
    mode?: DurableCandleWarehouseFetchServiceOptions["mode"];
    fetchServiceOptions?: CandleFetchServiceOptions;
    preferredProvider?: HistoricalFetchRequest["preferredProvider"];
};
export declare function buildWarehouseBackedSupportResistanceContextForSymbol(request: Omit<BuildSupportResistanceContextForSymbolRequest, "fetchService" | "fetchServiceOptions"> & WarehouseBackedSharedContextOptions): Promise<SupportResistanceSymbolContext>;
export declare function buildDefaultSupportResistanceContextForSymbol(request: Omit<BuildSupportResistanceContextForSymbolRequest, "fetchService" | "fetchServiceOptions"> & WarehouseBackedSharedContextOptions): Promise<SupportResistanceSymbolContext>;
export declare function buildWarehouseBackedTradeAnalysisCandleContext(request: Omit<BuildTradeAnalysisCandleContextRequest, "fetchService" | "fetchServiceOptions"> & WarehouseBackedSharedContextOptions): Promise<TradeAnalysisCandleContext>;
export declare function buildDefaultTradeAnalysisCandleContext(request: Omit<BuildTradeAnalysisCandleContextRequest, "fetchService" | "fetchServiceOptions"> & WarehouseBackedSharedContextOptions): Promise<TradeAnalysisCandleContext>;
//# sourceMappingURL=warehouse-context.d.ts.map