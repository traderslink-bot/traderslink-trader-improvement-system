import { CandleFetchService } from "../market-data/candle-fetch-service.js";
import { DurableCandleWarehouse, DurableCandleWarehouseFetchService, } from "../candle-warehouse/index.js";
import { buildTradeAnalysisCandleContext, } from "./trade-analysis-context.js";
export async function buildWarehouseBackedTradeAnalysisContext(request) {
    const warehouse = request.warehouse ??
        new DurableCandleWarehouse(request.warehouseRootDirectoryPath ?? "data/candles");
    const delegate = request.delegateFetchService ??
        new CandleFetchService({
            ...request.delegateFetchServiceOptions,
            providerName: request.providerName ?? request.preferredProvider ?? request.delegateFetchServiceOptions?.providerName,
        });
    const fetchService = new DurableCandleWarehouseFetchService({
        warehouse,
        delegate,
        mode: request.warehouseMode ?? "read_write",
    });
    return buildTradeAnalysisCandleContext({
        ...request,
        fetchService,
    });
}
