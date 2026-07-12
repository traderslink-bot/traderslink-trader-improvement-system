import { CandleFetchService, type CandleFetchServiceOptions, type HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import type { Candle, CandleFetchTimeframe, CandleProviderResponse } from "../market-data/candle-types.js";
import { DurableCandleWarehouse, type DurableCandleWarehouseFetchServiceOptions } from "../candle-warehouse/index.js";
import type { BuildSupportResistanceContextForSymbolRequest, SupportResistanceSymbolContext } from "./symbol-context.js";
import { type SharedCandleTimestamp } from "./build-support-resistance-context.js";
import { type ExecutionLevelRelations } from "./execution-level-relations.js";
import type { DynamicLevelPriceContext, DynamicLevelsFromCandles } from "./indicators/index.js";
export type TradeAnalysisExecutionInput = {
    timestamp: SharedCandleTimestamp;
    price?: number;
    quantity?: number;
    side?: "buy" | "sell" | "unknown";
};
export type TradeAnalysisCandleWindowOptions = {
    timeframe?: Extract<CandleFetchTimeframe, "1m" | "5m">;
    fallbackTimeframe?: Extract<CandleFetchTimeframe, "5m">;
    allowFiveMinuteFallback?: boolean;
    preTradeMinutes?: number;
    postTradeMinutes?: number;
    paddingMinutes?: number;
    lookbackBars?: number;
};
export type TradeAnalysisMarketFactsOptions = {
    benchmarkProfile?: MarketFactsBenchmarkProfile;
    includeDisagreementSummary?: boolean;
    includePostTradeSummary?: boolean;
};
export type BuildTradeAnalysisCandleContextRequest = {
    symbol: string;
    sessionDate?: string;
    asOfTimestamp?: SharedCandleTimestamp;
    executions?: TradeAnalysisExecutionInput[];
    tradeStartTimestamp?: SharedCandleTimestamp;
    tradeEndTimestamp?: SharedCandleTimestamp;
    preferredProvider?: HistoricalFetchRequest["preferredProvider"];
    fetchService?: CandleFetchService;
    fetchServiceOptions?: CandleFetchServiceOptions;
    warehouseDirectoryPath?: string;
    warehouse?: DurableCandleWarehouse;
    warehouseMode?: DurableCandleWarehouseFetchServiceOptions["mode"];
    supportResistance?: Omit<BuildSupportResistanceContextForSymbolRequest, "symbol" | "sessionDate" | "asOfTimestamp" | "fetchService" | "fetchServiceOptions" | "preferredProvider">;
    tradeWindow?: TradeAnalysisCandleWindowOptions;
    marketFacts?: TradeAnalysisMarketFactsOptions;
};
export type MarketFactsContractVersion = "market_facts.trade_review.v2";
export type MarketFactsBenchmarkProfile = "small_cap_day_trade_v1" | "small_cap_day_trade_enriched_v1";
export type MarketFactsBenchmarkKind = "vwap" | "ema" | "support" | "resistance";
export type MarketFactsBenchmarkRole = "primary" | "comparison" | "advanced";
export type MarketFactsVwapMode = "regular_session" | "extended_session";
export type MarketFactsSessionScope = "regular_session" | "extended_session" | "rolling";
export type MarketFactsRelation = "above" | "below" | "at" | "missing";
export type MarketFactsQualityFlag = "thin_basis" | "fallback_timeframe" | "missing_volume" | "missing_candles" | "partial_candle_window" | "stale_candles" | "insufficient_ema_warmup" | "session_reset" | "level_context_unavailable" | "calculation_unavailable";
export type MarketFactQuality = {
    status: "available" | "missing";
    confidence: "high" | "medium" | "low" | "unknown";
    flags: MarketFactsQualityFlag[];
    reasons: string[];
};
export type MarketFactBenchmarkDefinition = {
    benchmarkId: string;
    kind: MarketFactsBenchmarkKind;
    role: MarketFactsBenchmarkRole;
    label: string;
    timeframe: Extract<CandleFetchTimeframe, "1m" | "5m">;
    vwapMode?: MarketFactsVwapMode;
    emaLength?: number;
    sessionScope: MarketFactsSessionScope;
};
export type MarketFactCalculationBasis = {
    timeframe: Extract<CandleFetchTimeframe, "1m" | "5m">;
    requestedTimeframe: Extract<CandleFetchTimeframe, "1m" | "5m">;
    fallbackUsed: boolean;
    vwapMode?: MarketFactsVwapMode;
    emaLength?: number;
    sessionScope: MarketFactsSessionScope;
    startTimestamp: string;
    endTimestamp: string;
    barsUsed: number;
    volumeBarsUsed?: number;
    missingBars: number;
    partialBars: number;
};
export type MarketFactBenchmarkRelation = {
    benchmarkId: string;
    kind: MarketFactsBenchmarkKind;
    label: string;
    value: number | null;
    level: MarketFactLevelMetadata | null;
    price: number;
    relation: MarketFactsRelation;
    priceMinusBenchmarkAbs: number | null;
    priceMinusBenchmarkPct: number | null;
    basis: MarketFactCalculationBasis;
    quality: MarketFactQuality;
};
export type MarketFactLevelMetadata = {
    id: string;
    kind: "support" | "resistance";
    representativePrice: number;
    zoneLow: number;
    zoneHigh: number;
    strengthScore: number;
    strengthLabel: "weak" | "moderate" | "strong" | "major";
    confidence: number | null;
    timeframeSources: string[];
    freshness: string;
    sourceEvidenceCount: number;
    touchCount: number;
    confluenceCount: number;
};
export type MarketFactDiagnostic = {
    code: "THIN_REGULAR_SESSION_VWAP" | "EXTENDED_SESSION_VWAP_AVAILABLE" | "MISSING_VOLUME_FOR_VWAP" | "TIMEFRAME_FALLBACK_USED" | "PARTIAL_CANDLE_WINDOW" | "STALE_CANDLE_DATA" | "INSUFFICIENT_EMA_WARMUP" | "MULTI_DAY_VWAP_SESSION_RESET" | "INDICATOR_DISAGREEMENT" | "BENCHMARK_UNAVAILABLE";
    severity: "info" | "warning" | "error";
    message: string;
    affectedBenchmarkIds: string[];
};
export type MarketFactExecutionSnapshot = {
    snapshotId: string;
    timestamp: string;
    price: number | null;
    quantity?: number;
    side?: "buy" | "sell" | "unknown";
    relations: MarketFactBenchmarkRelation[];
    diagnostics: MarketFactDiagnostic[];
};
export type MarketFactDisagreementSummary = {
    disagreementId: string;
    kind: MarketFactsBenchmarkKind;
    benchmarkIds: string[];
    summary: string;
    severity: "info" | "warning";
};
export type MarketFactCrossedBenchmark = {
    benchmarkId: string;
    label: string;
    crossedAtTimestamp: string;
    direction: "above" | "below";
};
export type MarketFactTradeWindowSummary = {
    tradeStartTimestamp: string;
    tradeEndTimestamp: string;
    holdDurationMinutes: number;
    highDuringTrade: number | null;
    lowDuringTrade: number | null;
    maxFavorableMovePct: number | null;
    maxAdverseMovePct: number | null;
    crossedBenchmarksDuringTrade: MarketFactCrossedBenchmark[];
    movedIntoNearestResistance: boolean | null;
    movedIntoNearestSupport: boolean | null;
    reachedNearestDaily4hResistanceDuringTrade: boolean | null;
    reachedNearestDaily4hSupportDuringTrade: boolean | null;
};
export type MarketFactPostTradeSummary = {
    postTradeStartTimestamp: string | null;
    postTradeEndTimestamp: string | null;
    maxMoveAfterExitPct: number | null;
    reclaimedEntryPriceAfterExit: boolean | null;
    reachedNearestResistanceAfterExit: boolean | null;
    brokeNearestSupportAfterExit: boolean | null;
    reachedNearestDaily4hResistanceAfterExit: boolean | null;
    brokeNearestDaily4hSupportAfterExit: boolean | null;
};
export type TradeAnalysisMarketFacts = {
    contractVersion: MarketFactsContractVersion;
    benchmarkProfile: MarketFactsBenchmarkProfile;
    symbol: string;
    asOfTimestamp: string | null;
    candleFetchingOwnedBy: "levels-system";
    noLookaheadPolicy: {
        policy: "closed_candles_only";
        candleInclusionRule: "candle_end_lte_snapshot_timestamp";
        partialCandlesRequireLowerGranularitySource: true;
    };
    benchmarkDefinitions: MarketFactBenchmarkDefinition[];
    executionSnapshots: MarketFactExecutionSnapshot[];
    tradeWindowSummary: MarketFactTradeWindowSummary;
    postTradeSummary: MarketFactPostTradeSummary | null;
    disagreementSummary: MarketFactDisagreementSummary[];
    diagnostics: MarketFactDiagnostic[];
};
export type TradeAnalysisCandleWindow = {
    timeframe: Extract<CandleFetchTimeframe, "1m" | "5m">;
    requestedTimeframe: Extract<CandleFetchTimeframe, "1m" | "5m">;
    fallbackUsed: boolean;
    requestedStartTimestamp: number;
    requestedEndTimestamp: number;
    tradeStartTimestamp: number;
    tradeEndTimestamp: number;
    preTradeCandles: Candle[];
    tradeCandles: Candle[];
    postTradeCandles: Candle[];
    allCandles: Candle[];
    dynamicLevels: DynamicLevelsFromCandles;
    fetch: {
        provider: CandleProviderResponse["provider"];
        freshnessStatus: "fresh" | "usable" | "stale" | "partial" | "missing";
        requestedLookbackBars: number;
        actualBarsReturned: number;
        requestedStartTimestamp: number;
        requestedEndTimestamp: number;
        newestCandleTimestamp: number | null;
        completenessStatus: CandleProviderResponse["completenessStatus"];
        stale: boolean;
        validationIssues: CandleProviderResponse["validationIssues"];
    };
};
export type TradeAnalysisCandleContextDiagnosticCode = "trade_window_fetched" | "trade_window_one_minute_unavailable" | "trade_window_fell_back_to_5m" | "trade_window_aggregated_eodhd_1m_to_5m" | "trade_window_missing_pre_trade_candles" | "trade_window_missing_trade_candles" | "trade_window_missing_post_trade_candles" | "trade_window_truncated_by_as_of" | "future_candles_filtered" | "partial_candles_filtered" | "historical_as_of_snapshot_built" | "historical_higher_timeframe_closed_candle_cutoff" | "historical_price_anchor_used" | "historical_symbol_alias_used" | "historical_symbol_resolved_to_pink" | "possible_price_adjustment_mismatch" | "likely_price_basis_adjustment_multiple" | "trade_window_price_basis_unverified" | "trade_window_basis_validation_status" | "trade_window_provider_warning";
export type TradeAnalysisCandleContextDiagnostic = {
    code: TradeAnalysisCandleContextDiagnosticCode;
    severity: "info" | "warning" | "error";
    message: string;
};
export type TradeAnalysisExecutionRelationDiagnosticCode = "execution_after_as_of" | "execution_missing_price" | "execution_invalid_price" | "execution_missing_trade_window_candles" | "execution_context_unavailable";
export type TradeAnalysisExecutionRelationDiagnostic = {
    code: TradeAnalysisExecutionRelationDiagnosticCode;
    severity: "info" | "warning";
    message: string;
};
export type TradeAnalysisExecutionDynamicRelations = DynamicLevelPriceContext;
export type TradeAnalysisExecutionRelationFact = {
    timestamp: number;
    timestampIso: string;
    price: number | null;
    quantity?: number;
    side?: "buy" | "sell" | "unknown";
    levelRelations: ExecutionLevelRelations | null;
    dynamicLevelRelations: TradeAnalysisExecutionDynamicRelations | null;
    marketStructureState: SupportResistanceSymbolContext["marketStructure"]["state"];
    marketStructureConfidence: SupportResistanceSymbolContext["marketStructure"]["confidence"]["label"];
    diagnostics: TradeAnalysisExecutionRelationDiagnostic[];
};
export type TradeAnalysisMoveWindowFact = {
    startTimestamp: number;
    startTimestampIso: string;
    endTimestamp: number;
    endTimestampIso: string;
    price: number;
    movePctFromReference: number;
};
export type TradeAnalysisTradeWindowFacts = {
    referenceExecutionTimestamp: number | null;
    referenceExecutionTimestampIso: string | null;
    referencePrice: number | null;
    referenceSide: "buy" | "sell" | "unknown" | null;
    highestHighDuringTrade: TradeAnalysisMoveWindowFact | null;
    lowestLowDuringTrade: TradeAnalysisMoveWindowFact | null;
    highestHighAfterExit: TradeAnalysisMoveWindowFact | null;
    lowestLowAfterExit: TradeAnalysisMoveWindowFact | null;
    maxFavorableMovePct: number | null;
    maxAdverseMovePct: number | null;
    postExitContinuationPct: number | null;
    postExitReliefPct: number | null;
};
export type TradeAnalysisCandleContext = {
    symbol: string;
    mode: "trade_analysis";
    candleFetchingOwnedBy: "levels-system";
    asOfTimestamp: number | null;
    supportResistanceContext: SupportResistanceSymbolContext;
    tradeWindow: TradeAnalysisCandleWindow;
    tradeWindowFacts: TradeAnalysisTradeWindowFacts;
    executionRelations: TradeAnalysisExecutionRelationFact[];
    marketFacts: TradeAnalysisMarketFacts;
    diagnostics: TradeAnalysisCandleContextDiagnostic[];
};
export declare function buildTradeAnalysisCandleContext(request: BuildTradeAnalysisCandleContextRequest): Promise<TradeAnalysisCandleContext>;
//# sourceMappingURL=trade-analysis-context.d.ts.map