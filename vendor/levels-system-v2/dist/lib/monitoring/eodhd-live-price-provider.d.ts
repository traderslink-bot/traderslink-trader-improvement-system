import type { LivePriceProvider, LivePriceListener } from "./live-price-types.js";
import type { WatchlistEntry } from "./monitoring-types.js";
type EodhdWebSocketLike = {
    readyState: number;
    send: (data: string) => void;
    close: () => void;
    addEventListener: (event: "open" | "message" | "error" | "close", listener: (event: any) => void) => void;
    removeEventListener?: (event: "open" | "message" | "error" | "close", listener: (event: any) => void) => void;
};
type EodhdWebSocketFactory = (url: string) => EodhdWebSocketLike;
export type EodhdLivePriceProviderOptions = {
    apiToken?: string;
    endpointUrl?: string;
    maxSymbols?: number;
    reconnectDelayMs?: number;
    socketFactory?: EodhdWebSocketFactory;
};
export declare class EodhdLivePriceProvider implements LivePriceProvider {
    private readonly apiToken;
    private readonly endpointUrl;
    private readonly maxSymbols;
    private readonly reconnectDelayMs;
    private readonly socketFactory;
    private activeSymbols;
    private activeSymbolByStreamSymbol;
    private listener?;
    private socket?;
    private reconnectTimer?;
    private stopping;
    constructor(options?: EodhdLivePriceProviderOptions);
    start(entries: WatchlistEntry[], onUpdate: LivePriceListener): Promise<void>;
    stop(): Promise<void>;
    private connect;
    private subscribe;
    private scheduleReconnect;
    private handleMessage;
    private handleTradeMessage;
}
export {};
//# sourceMappingURL=eodhd-live-price-provider.d.ts.map