import { IBApi } from "@stoqey/ib";
import type { LivePriceProvider } from "./live-price-types.js";
export type LivePriceProviderName = "ibkr" | "eodhd";
export type LivePriceProviderFactoryOptions = {
    provider?: LivePriceProviderName;
    ib?: IBApi;
};
export declare function resolveLivePriceProviderName(raw: string | undefined): LivePriceProviderName;
export declare function createLivePriceProvider(options?: LivePriceProviderFactoryOptions): LivePriceProvider;
//# sourceMappingURL=live-price-provider-factory.d.ts.map