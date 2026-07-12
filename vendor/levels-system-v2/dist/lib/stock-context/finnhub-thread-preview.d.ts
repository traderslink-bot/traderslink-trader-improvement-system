import type { FinnhubThreadPreview } from "./finnhub-client.js";
import type { StockContextPreview } from "./stock-context-types.js";
import type { AlertPayload } from "../alerts/alert-types.js";
export type ResolvedStockContextCurrentPrice = {
    price: number;
    label: "postmarket" | "premarket" | "regular" | "finnhub";
    timestamp: number | null;
    source: "Yahoo" | "Finnhub";
};
export declare function resolveStockContextCurrentPrice(preview: StockContextPreview): ResolvedStockContextCurrentPrice | null;
export declare function buildFinnhubThreadPreviewPayload(preview: FinnhubThreadPreview | StockContextPreview): AlertPayload;
export declare function formatFinnhubThreadPreview(preview: FinnhubThreadPreview | StockContextPreview): string;
//# sourceMappingURL=finnhub-thread-preview.d.ts.map