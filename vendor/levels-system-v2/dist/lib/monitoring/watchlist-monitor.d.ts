import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import { type MonitoringConfig } from "./monitoring-config.js";
import type { LivePriceListener, LivePriceProvider } from "./live-price-types.js";
import type { MonitoringEvent, MonitoringEventDiagnosticListener, RuntimeMarketStructureSnapshot, WatchlistEntry } from "./monitoring-types.js";
import { LevelStore } from "./level-store.js";
export type MonitoringEventListener = (event: MonitoringEvent) => void;
export type WatchlistMonitorOptions = {
    diagnosticListener?: MonitoringEventDiagnosticListener;
    priceAnomalyGuard?: {
        enabled?: boolean;
        maxSingleUpdateMovePct?: number;
        confirmWindowMs?: number;
        confirmTolerancePct?: number;
    };
};
type MarketStructureSeedSeries = {
    candles: Candle[];
    requestedEndTimestamp?: number;
    fetchEndTimestamp?: number;
};
type MarketStructureSeedInput = Candle[] | Partial<Record<CandleTimeframe, Candle[] | MarketStructureSeedSeries>>;
export declare class WatchlistMonitor {
    private readonly levelStore;
    private livePriceProvider;
    private readonly config;
    private readonly options;
    private readonly symbolStates;
    private readonly emittedEventTimestamps;
    private readonly pendingPriceAnomalies;
    private readonly intradayStructureTracker;
    private readonly stableMarketStructureTracker;
    private readonly formalMarketStructureTracker;
    private readonly higherTimeframeStableMarketStructureTrackers;
    private readonly higherTimeframeFormalMarketStructureTrackers;
    private readonly volumeTracker;
    constructor(levelStore: LevelStore, livePriceProvider: LivePriceProvider, config?: MonitoringConfig, options?: WatchlistMonitorOptions);
    setLivePriceProvider(provider: LivePriceProvider): LivePriceProvider;
    private ensureSymbolState;
    private reconcileSymbolState;
    private applyVolumeBaseline;
    seedMarketStructure(symbolInput: string, seedInput: MarketStructureSeedInput, asOfTimestamp?: number): RuntimeMarketStructureSnapshot | null;
    getMarketStructureSnapshot(symbolInput: string): RuntimeMarketStructureSnapshot | null;
    private getMarketStructureForTimeframe;
    private buildMarketStructureSnapshot;
    private applyMarketStructureSnapshotToSymbolState;
    private syncTrackedSymbols;
    private buildEventGateKey;
    private isEventOnCooldown;
    private markEventEmitted;
    private applyEmittedEventToState;
    private collectZoneEvents;
    private dedupeAndPrioritizeEvents;
    private emitPendingEvents;
    private shouldSuppressUnconfirmedPriceAnomaly;
    private handleUpdate;
    start(entries: WatchlistEntry[], listener: MonitoringEventListener, onPriceUpdate?: LivePriceListener): Promise<void>;
    stop(): Promise<void>;
}
export {};
//# sourceMappingURL=watchlist-monitor.d.ts.map