const DEFAULT_ENDPOINT_URL = "wss://ws.eodhistoricaldata.com/ws/us";
const DEFAULT_MAX_SYMBOLS = 50;
const DEFAULT_RECONNECT_DELAY_MS = 2_000;
const OPEN_STATE = 1;
function envText(...names) {
    return names.map((name) => process.env[name]?.trim()).find(Boolean);
}
function resolveSocketFactory(factory) {
    if (factory) {
        return factory;
    }
    const WebSocketCtor = globalThis.WebSocket;
    if (!WebSocketCtor) {
        throw new Error("Global WebSocket is unavailable; use Node 22+ or provide an EODHD socket factory.");
    }
    return (url) => new WebSocketCtor(url);
}
function parsePositiveNumber(value) {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
function normalizeWatchlistSymbol(symbol) {
    return symbol.trim().toUpperCase();
}
function normalizeEodhdWebSocketSymbol(symbol) {
    const normalized = normalizeWatchlistSymbol(symbol);
    return normalized.endsWith(".US") ? normalized.slice(0, -3) : normalized;
}
function positiveIntegerEnv(names, fallback) {
    const raw = envText(...names);
    const parsed = raw ? Number.parseInt(raw, 10) : undefined;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
export class EodhdLivePriceProvider {
    apiToken;
    endpointUrl;
    maxSymbols;
    reconnectDelayMs;
    socketFactory;
    activeSymbols = [];
    activeSymbolByStreamSymbol = new Map();
    listener;
    socket;
    reconnectTimer;
    stopping = false;
    constructor(options = {}) {
        const apiToken = options.apiToken ?? envText("EODHD_API_TOKEN", "LEVEL_EODHD_API_TOKEN");
        if (!apiToken) {
            throw new Error("EODHD_API_TOKEN is required to use the EODHD live price provider.");
        }
        this.apiToken = apiToken;
        this.endpointUrl = options.endpointUrl ?? envText("EODHD_WEBSOCKET_URL", "LEVEL_EODHD_WEBSOCKET_URL") ?? DEFAULT_ENDPOINT_URL;
        this.maxSymbols = options.maxSymbols ?? positiveIntegerEnv(["EODHD_WEBSOCKET_MAX_SYMBOLS", "LEVEL_EODHD_WEBSOCKET_MAX_SYMBOLS"], DEFAULT_MAX_SYMBOLS);
        this.reconnectDelayMs = options.reconnectDelayMs ?? positiveIntegerEnv(["EODHD_WEBSOCKET_RECONNECT_DELAY_MS", "LEVEL_EODHD_WEBSOCKET_RECONNECT_DELAY_MS"], DEFAULT_RECONNECT_DELAY_MS);
        this.socketFactory = resolveSocketFactory(options.socketFactory);
    }
    async start(entries, onUpdate) {
        await this.stop();
        const activeSymbolByStreamSymbol = new Map();
        for (const entry of entries) {
            if (!entry.active) {
                continue;
            }
            const watchlistSymbol = normalizeWatchlistSymbol(entry.symbol);
            if (!watchlistSymbol) {
                continue;
            }
            const streamSymbol = normalizeEodhdWebSocketSymbol(watchlistSymbol);
            if (!activeSymbolByStreamSymbol.has(streamSymbol)) {
                activeSymbolByStreamSymbol.set(streamSymbol, watchlistSymbol);
            }
        }
        const activeSymbols = [...activeSymbolByStreamSymbol.keys()];
        if (activeSymbols.length > this.maxSymbols) {
            throw new Error(`EODHD WebSocket supports ${this.maxSymbols} active symbols by configuration; received ${activeSymbols.length}.`);
        }
        this.activeSymbols = activeSymbols;
        this.activeSymbolByStreamSymbol = activeSymbolByStreamSymbol;
        this.listener = onUpdate;
        this.stopping = false;
        this.connect();
    }
    async stop() {
        this.stopping = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
        this.listener = undefined;
        this.activeSymbols = [];
        this.activeSymbolByStreamSymbol = new Map();
    }
    connect() {
        const url = new URL(this.endpointUrl);
        url.searchParams.set("api_token", this.apiToken);
        const socket = this.socketFactory(url.toString());
        this.socket = socket;
        socket.addEventListener("open", () => {
            if (this.socket !== socket || this.stopping) {
                return;
            }
            this.subscribe(socket);
        });
        socket.addEventListener("message", (event) => {
            if (this.socket !== socket || this.stopping) {
                return;
            }
            this.handleMessage(event?.data);
        });
        socket.addEventListener("error", (event) => {
            if (this.socket !== socket || this.stopping) {
                return;
            }
            console.error("EODHD WebSocket error:", event?.message ?? event);
        });
        socket.addEventListener("close", () => {
            if (this.socket !== socket) {
                return;
            }
            this.socket = undefined;
            if (!this.stopping) {
                this.scheduleReconnect();
            }
        });
    }
    subscribe(socket) {
        if (socket.readyState !== OPEN_STATE || this.activeSymbols.length === 0) {
            return;
        }
        socket.send(JSON.stringify({
            action: "subscribe",
            symbols: this.activeSymbols.join(","),
        }));
    }
    scheduleReconnect() {
        if (this.reconnectTimer) {
            return;
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            if (!this.stopping) {
                this.connect();
            }
        }, this.reconnectDelayMs);
    }
    handleMessage(raw) {
        if (!this.listener || raw === undefined || raw === null) {
            return;
        }
        let parsed;
        try {
            parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        }
        catch {
            return;
        }
        for (const message of Array.isArray(parsed) ? parsed : [parsed]) {
            this.handleTradeMessage(message);
        }
    }
    handleTradeMessage(message) {
        if (!this.listener) {
            return;
        }
        const symbol = typeof message.s === "string" ? normalizeEodhdWebSocketSymbol(message.s) : "";
        const watchlistSymbol = this.activeSymbolByStreamSymbol.get(symbol);
        const lastPrice = parsePositiveNumber(message.p);
        if (!symbol || !watchlistSymbol || !lastPrice || message.dp === true) {
            return;
        }
        this.listener({
            symbol: watchlistSymbol,
            timestamp: parsePositiveNumber(message.t) ?? Date.now(),
            lastPrice,
            volume: parsePositiveNumber(message.v),
        });
    }
}
