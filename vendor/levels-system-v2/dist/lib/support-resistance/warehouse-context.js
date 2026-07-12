import { CandleFetchService, StubHistoricalCandleProvider, } from "../market-data/candle-fetch-service.js";
import { DurableCandleWarehouse, DurableCandleWarehouseFetchService, } from "../candle-warehouse/index.js";
import { buildSupportResistanceContextForSymbol, } from "./symbol-context.js";
import { buildTradeAnalysisCandleContext, } from "./trade-analysis-context.js";
function hasExplicitProvider(options) {
    return Boolean(options.fetchServiceOptions?.provider ||
        options.fetchServiceOptions?.ib);
}
function defaultProvider(options) {
    return hasExplicitProvider(options)
        ? options.preferredProvider
        : options.preferredProvider ?? "ibkr";
}
function defaultMode(options) {
    if (options.mode) {
        return options.mode;
    }
    return hasExplicitProvider(options) ? "read_write" : "replay";
}
function buildWarehouseFetchService(options = {}) {
    const warehouse = options.warehouse ?? new DurableCandleWarehouse(options.warehouseDirectoryPath ?? "data/candles");
    const provider = defaultProvider(options);
    const mode = defaultMode(options);
    const delegate = hasExplicitProvider(options)
        ? new CandleFetchService({
            ...options.fetchServiceOptions,
            providerName: provider ?? options.fetchServiceOptions?.providerName,
        })
        : new CandleFetchService(new StubHistoricalCandleProvider());
    return new DurableCandleWarehouseFetchService({
        warehouse,
        delegate,
        mode,
    });
}
export async function buildWarehouseBackedSupportResistanceContextForSymbol(request) {
    const fetchService = buildWarehouseFetchService(request);
    return buildSupportResistanceContextForSymbol({
        ...request,
        fetchService,
        preferredProvider: defaultProvider(request),
    });
}
export async function buildDefaultSupportResistanceContextForSymbol(request) {
    return buildWarehouseBackedSupportResistanceContextForSymbol({
        warehouseDirectoryPath: "data/candles",
        ...request,
    });
}
export async function buildWarehouseBackedTradeAnalysisCandleContext(request) {
    const fetchService = buildWarehouseFetchService(request);
    return buildTradeAnalysisCandleContext({
        ...request,
        fetchService,
        preferredProvider: defaultProvider(request),
    });
}
export async function buildDefaultTradeAnalysisCandleContext(request) {
    return buildWarehouseBackedTradeAnalysisCandleContext({
        warehouseDirectoryPath: "data/candles",
        ...request,
    });
}
