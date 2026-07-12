import { EodhdLivePriceProvider } from "./eodhd-live-price-provider.js";
import { IBKRLivePriceProvider } from "./ibkr-live-price-provider.js";
export function resolveLivePriceProviderName(raw) {
    return raw?.trim().toLowerCase() === "eodhd" ? "eodhd" : "ibkr";
}
export function createLivePriceProvider(options = {}) {
    const provider = options.provider ?? resolveLivePriceProviderName(process.env.LEVEL_LIVE_PRICE_PROVIDER);
    if (provider === "eodhd") {
        return new EodhdLivePriceProvider();
    }
    return options.ib ? new IBKRLivePriceProvider(options.ib) : new IBKRLivePriceProvider();
}
