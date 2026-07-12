import { planBulkCandleBackfill, } from "./bulk-candle-backfill-planner.js";
import { buildSupportResistanceContextForSymbol, } from "./symbol-context.js";
import { buildWarehouseBackedTradeAnalysisContext, } from "./warehouse-backed-trade-analysis.js";
export const SHARED_SUPPORT_RESISTANCE_ENGINE_API_VERSION = "0.2.0";
export function getSharedEngineServiceInfo() {
    return {
        apiVersion: SHARED_SUPPORT_RESISTANCE_ENGINE_API_VERSION,
        ownsCandleFetching: true,
        ownsSupportResistance: true,
        ownsTradeWindowCandles: true,
        ownsDurableWarehouse: true,
    };
}
export async function getSymbolStructureContext(request) {
    return buildSupportResistanceContextForSymbol(request);
}
export async function getTradeAnalysisContext(request) {
    return buildWarehouseBackedTradeAnalysisContext(request);
}
export async function getBulkTradeAnalysisPlan(request) {
    return planBulkCandleBackfill(request);
}
