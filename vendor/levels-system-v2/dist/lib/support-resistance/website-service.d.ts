import { type BulkCandleBackfillPlan, type BulkCandleBackfillPlanRequest } from "./bulk-candle-backfill-planner.js";
import { type BuildSupportResistanceContextForSymbolRequest, type SupportResistanceSymbolContext } from "./symbol-context.js";
import { type BuildWarehouseBackedTradeAnalysisContextRequest } from "./warehouse-backed-trade-analysis.js";
import type { TradeAnalysisCandleContext } from "./trade-analysis-context.js";
export declare const SHARED_SUPPORT_RESISTANCE_ENGINE_API_VERSION = "0.2.0";
export type SharedEngineServiceInfo = {
    apiVersion: string;
    ownsCandleFetching: true;
    ownsSupportResistance: true;
    ownsTradeWindowCandles: true;
    ownsDurableWarehouse: true;
};
export declare function getSharedEngineServiceInfo(): SharedEngineServiceInfo;
export declare function getSymbolStructureContext(request: BuildSupportResistanceContextForSymbolRequest): Promise<SupportResistanceSymbolContext>;
export declare function getTradeAnalysisContext(request: BuildWarehouseBackedTradeAnalysisContextRequest): Promise<TradeAnalysisCandleContext>;
export declare function getBulkTradeAnalysisPlan(request: BulkCandleBackfillPlanRequest): Promise<BulkCandleBackfillPlan>;
//# sourceMappingURL=website-service.d.ts.map