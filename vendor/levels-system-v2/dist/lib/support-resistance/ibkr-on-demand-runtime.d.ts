import { IBApi } from "@stoqey/ib";
import type { CandleFetchServiceOptions } from "../market-data/candle-fetch-service.js";
type ReconnectInfo = {
    code: 1101 | 1102;
    requiresResubscribe: boolean;
};
export type CreateIbkrOnDemandCandleFetchServiceOptionsArgs = {
    clientId?: number;
    host?: string;
    port?: number;
    historicalTimeoutMs?: number;
    connectionTimeoutMs?: number;
    ib?: IBApi;
};
export declare const DEFAULT_ON_DEMAND_IBKR_HOST = "127.0.0.1";
export declare const DEFAULT_ON_DEMAND_IBKR_PORT = 7497;
export declare const DEFAULT_ON_DEMAND_IBKR_CLIENT_ID = 101;
export declare const DEFAULT_ON_DEMAND_IBKR_HISTORICAL_TIMEOUT_MS = 30000;
export declare const DEFAULT_ON_DEMAND_IBKR_CONNECTION_TIMEOUT_MS = 10000;
export declare function initializeIbkrRuntime(ib: IBApi): IBApi;
export declare function createIbkrClient(args?: {
    clientId?: number;
    host?: string;
    port?: number;
}): IBApi;
export declare function getOrCreateIbkrClient(args?: {
    clientId?: number;
    host?: string;
    port?: number;
}): IBApi;
export declare function isIbkrConnected(ib: IBApi): boolean;
export declare function isIbkrReconnecting(ib: IBApi): boolean;
export declare function waitForIbkrConnection(ib: IBApi, timeoutMs?: number): Promise<void>;
export declare function onIbkrReconnect(ib: IBApi, listener: (info: ReconnectInfo) => void): () => void;
export declare function onIbkrDisconnect(ib: IBApi, listener: () => void): () => void;
export declare function createIbkrOnDemandCandleFetchServiceOptions(args?: CreateIbkrOnDemandCandleFetchServiceOptionsArgs): CandleFetchServiceOptions;
export {};
//# sourceMappingURL=ibkr-on-demand-runtime.d.ts.map