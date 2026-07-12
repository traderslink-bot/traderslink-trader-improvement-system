import { IBApi } from "@stoqey/ib";
import { IbkrHistoricalCandleProvider } from "../market-data/ibkr-historical-candle-provider.js";
const runtimeStateByClient = new WeakMap();
const ibClientByConnectionKey = new Map();
export const DEFAULT_ON_DEMAND_IBKR_HOST = "127.0.0.1";
export const DEFAULT_ON_DEMAND_IBKR_PORT = 7497;
export const DEFAULT_ON_DEMAND_IBKR_CLIENT_ID = 101;
export const DEFAULT_ON_DEMAND_IBKR_HISTORICAL_TIMEOUT_MS = 30_000;
export const DEFAULT_ON_DEMAND_IBKR_CONNECTION_TIMEOUT_MS = 10_000;
const RECONNECT_DELAY_MS = 2_000;
function getIbApiWithEvents(ib) {
    return ib;
}
function clearReconnectTimer(state) {
    if (!state.reconnectTimer) {
        return;
    }
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = undefined;
}
function notifyDisconnect(state) {
    for (const listener of state.disconnectListeners) {
        listener();
    }
}
function notifyReconnect(state, info) {
    for (const listener of state.reconnectListeners) {
        listener(info);
    }
}
function scheduleReconnect(ib, state) {
    if (state.reconnecting || state.isConnected) {
        return;
    }
    state.reconnecting = true;
    const ibWithEvents = getIbApiWithEvents(ib);
    const attemptReconnect = () => {
        if (state.isConnected) {
            state.reconnecting = false;
            clearReconnectTimer(state);
            return;
        }
        try {
            ibWithEvents.connect();
        }
        catch {
            // Keep retrying until the client reconnects or the process exits.
        }
        state.reconnectTimer = setTimeout(attemptReconnect, RECONNECT_DELAY_MS);
    };
    state.reconnectTimer = setTimeout(attemptReconnect, RECONNECT_DELAY_MS);
}
function wrapDisconnectForIntent(ib, state) {
    const ibWithEvents = getIbApiWithEvents(ib);
    const originalDisconnect = ibWithEvents.disconnect.bind(ibWithEvents);
    ibWithEvents.disconnect = () => {
        state.intentionalDisconnect = true;
        return originalDisconnect();
    };
}
export function initializeIbkrRuntime(ib) {
    const existing = runtimeStateByClient.get(ib);
    if (existing) {
        return ib;
    }
    const state = {
        isConnected: ib.isConnected,
        reconnecting: false,
        reconnectListeners: new Set(),
        disconnectListeners: new Set(),
        intentionalDisconnect: false,
        onConnected: () => {
            state.isConnected = true;
            state.reconnecting = false;
            state.intentionalDisconnect = false;
            clearReconnectTimer(state);
        },
        onDisconnected: () => {
            state.isConnected = false;
            notifyDisconnect(state);
            if (state.intentionalDisconnect) {
                state.intentionalDisconnect = false;
                return;
            }
            scheduleReconnect(ib, state);
        },
        onError: (_error, code) => {
            if (code === 1100) {
                if (state.isConnected) {
                    state.isConnected = false;
                    notifyDisconnect(state);
                }
                scheduleReconnect(ib, state);
                return;
            }
            if (code === 1101 || code === 1102) {
                state.isConnected = true;
                state.reconnecting = false;
                clearReconnectTimer(state);
                notifyReconnect(state, {
                    code,
                    requiresResubscribe: code === 1101,
                });
            }
        },
    };
    const ibWithEvents = getIbApiWithEvents(ib);
    wrapDisconnectForIntent(ib, state);
    ibWithEvents.on("connected", state.onConnected);
    ibWithEvents.on("disconnected", state.onDisconnected);
    ibWithEvents.on("error", state.onError);
    runtimeStateByClient.set(ib, state);
    return ib;
}
export function createIbkrClient(args = {}) {
    const ib = new IBApi({
        host: args.host ?? DEFAULT_ON_DEMAND_IBKR_HOST,
        port: args.port ?? DEFAULT_ON_DEMAND_IBKR_PORT,
        clientId: args.clientId ?? DEFAULT_ON_DEMAND_IBKR_CLIENT_ID,
    });
    return initializeIbkrRuntime(ib);
}
function ibkrConnectionKey(args) {
    return [
        args.host ?? DEFAULT_ON_DEMAND_IBKR_HOST,
        args.port ?? DEFAULT_ON_DEMAND_IBKR_PORT,
        args.clientId ?? DEFAULT_ON_DEMAND_IBKR_CLIENT_ID,
    ].join(":");
}
export function getOrCreateIbkrClient(args = {}) {
    const key = ibkrConnectionKey(args);
    const existing = ibClientByConnectionKey.get(key);
    if (existing) {
        return initializeIbkrRuntime(existing);
    }
    const ib = createIbkrClient(args);
    ibClientByConnectionKey.set(key, ib);
    return ib;
}
export function isIbkrConnected(ib) {
    const state = runtimeStateByClient.get(ib);
    return state?.isConnected ?? ib.isConnected;
}
export function isIbkrReconnecting(ib) {
    return runtimeStateByClient.get(ib)?.reconnecting ?? false;
}
export async function waitForIbkrConnection(ib, timeoutMs = DEFAULT_ON_DEMAND_IBKR_CONNECTION_TIMEOUT_MS) {
    const ibWithEvents = getIbApiWithEvents(initializeIbkrRuntime(ib));
    if (isIbkrConnected(ib)) {
        return;
    }
    await new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            clearTimeout(timeoutHandle);
            ibWithEvents.off("connected", onConnected);
            ibWithEvents.off("error", onError);
        };
        const finalizeResolve = () => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve();
        };
        const finalizeReject = (error) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(error);
        };
        const onConnected = () => {
            finalizeResolve();
        };
        const onError = (error, code) => {
            if (typeof code !== "number" || code < 500 || code >= 600) {
                return;
            }
            const message = error instanceof Error
                ? error.message
                : typeof error === "string"
                    ? error
                    : "Unknown IBKR connection error.";
            finalizeReject(new Error(`IBKR connection failed (code ${code}): ${message}`));
        };
        const timeoutHandle = setTimeout(() => {
            finalizeReject(new Error(`Timed out after ${timeoutMs}ms waiting for IBKR connection.`));
        }, timeoutMs);
        ibWithEvents.on("connected", onConnected);
        ibWithEvents.on("error", onError);
        ibWithEvents.connect();
    });
}
export function onIbkrReconnect(ib, listener) {
    initializeIbkrRuntime(ib);
    const state = runtimeStateByClient.get(ib);
    state.reconnectListeners.add(listener);
    return () => {
        state.reconnectListeners.delete(listener);
    };
}
export function onIbkrDisconnect(ib, listener) {
    initializeIbkrRuntime(ib);
    const state = runtimeStateByClient.get(ib);
    state.disconnectListeners.add(listener);
    return () => {
        state.disconnectListeners.delete(listener);
    };
}
class ConnectedIbkrHistoricalCandleProvider {
    ib;
    historicalTimeoutMs;
    connectionTimeoutMs;
    providerName = "ibkr";
    delegate;
    constructor(ib, historicalTimeoutMs, connectionTimeoutMs) {
        this.ib = ib;
        this.historicalTimeoutMs = historicalTimeoutMs;
        this.connectionTimeoutMs = connectionTimeoutMs;
        this.delegate = new IbkrHistoricalCandleProvider(ib, historicalTimeoutMs);
    }
    async fetchCandles(request, plan) {
        await waitForIbkrConnection(this.ib, this.connectionTimeoutMs);
        return this.delegate.fetchCandles(request, plan);
    }
}
export function createIbkrOnDemandCandleFetchServiceOptions(args = {}) {
    const historicalTimeoutMs = args.historicalTimeoutMs ?? DEFAULT_ON_DEMAND_IBKR_HISTORICAL_TIMEOUT_MS;
    const connectionTimeoutMs = args.connectionTimeoutMs ?? DEFAULT_ON_DEMAND_IBKR_CONNECTION_TIMEOUT_MS;
    const ib = args.ib ??
        getOrCreateIbkrClient({
            clientId: args.clientId,
            host: args.host,
            port: args.port,
        });
    initializeIbkrRuntime(ib);
    return {
        providerName: "ibkr",
        provider: new ConnectedIbkrHistoricalCandleProvider(ib, historicalTimeoutMs, connectionTimeoutMs),
        ib,
        ibkrTimeoutMs: historicalTimeoutMs,
    };
}
