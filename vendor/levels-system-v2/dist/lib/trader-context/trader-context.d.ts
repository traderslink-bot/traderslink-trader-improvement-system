import type { Candle } from "../market-data/candle-types.js";
import type { LevelEngineOutput } from "../levels/level-types.js";
import type { DynamicLevelsFromCandles } from "../support-resistance/indicators/index.js";
import type { StockContextPreview } from "../stock-context/stock-context-types.js";
export type ContextReliability = "reliable" | "watch" | "unreliable";
export type LiquidityTradabilityLabel = "clean" | "acceptable" | "thin" | "messy" | "unknown";
export type LiquidityTradabilityContext = {
    label: LiquidityTradabilityLabel;
    reliability: ContextReliability;
    spreadPct: number | null;
    averageFiveMinuteDollarVolume: number | null;
    recentDollarVolume: number | null;
    reasons: string[];
    traderLine?: string;
};
export type CatalystProfileRiskLabel = "low" | "watch" | "elevated" | "unknown";
export type CatalystProfileRiskContext = {
    label: CatalystProfileRiskLabel;
    reliability: ContextReliability;
    marketCapBucket: "nano" | "micro" | "small" | "mid_or_larger" | "unknown";
    floatBucket: "micro_float" | "low_float" | "normal_float" | "unknown";
    shortInterestLabel: "elevated" | "normal" | "unknown";
    catalystLabel: "known_catalyst" | "no_known_catalyst" | "unknown";
    reasons: string[];
    traderLine?: string;
};
export type SessionGapLabel = "gap_up" | "gap_down" | "inside_previous_range" | "above_previous_high" | "below_previous_low" | "unknown";
export type SessionGapContext = {
    label: SessionGapLabel;
    reliability: ContextReliability;
    previousDayHigh: number | null;
    previousDayLow: number | null;
    previousDayClose: number | null;
    premarketHigh: number | null;
    premarketLow: number | null;
    openingRangeHigh: number | null;
    openingRangeLow: number | null;
    gapPct: number | null;
    currentPosition: "above_premarket_high" | "below_premarket_low" | "inside_premarket_range" | "unknown";
    reasons: string[];
    traderLine?: string;
};
export type CandleReactionLabel = "strong_close_through" | "wick_rejection" | "support_defense" | "support_loss" | "failed_breakout" | "reclaim" | "indecision" | "unknown";
export type CandleReactionContext = {
    label: CandleReactionLabel;
    reliability: ContextReliability;
    bodyPct: number | null;
    rangePct: number | null;
    upperWickPct: number | null;
    lowerWickPct: number | null;
    closeLocation: number | null;
    levelDistancePct: number | null;
    materialityLabel: "material" | "minor" | "unknown";
    levelPrice: number | null;
    levelSide: "support" | "resistance" | null;
    reasons: string[];
    traderLine?: string;
};
export type MoveExtensionLabel = "normal" | "extended" | "stretched" | "pulling_back" | "unknown";
export type MoveExtensionContext = {
    label: MoveExtensionLabel;
    reliability: ContextReliability;
    percentFromSessionLow: number | null;
    percentFromSessionHigh: number | null;
    percentFromVwap: number | null;
    percentFromEma9: number | null;
    percentFromEma20: number | null;
    greenCandleStreak: number;
    reasons: string[];
    traderLine?: string;
};
export type SmallCapVolatilityLabel = "quiet" | "normal" | "volatile" | "wild" | "unknown";
export type SmallCapVolatilityContext = {
    label: SmallCapVolatilityLabel;
    reliability: ContextReliability;
    priceBucket: "sub_1" | "one_to_two" | "two_to_five" | "five_to_ten" | "ten_plus" | "unknown";
    medianFiveMinuteRangePct: number | null;
    averageFiveMinuteRangePct: number | null;
    oneCentMovePct: number | null;
    meaningfulMovePct: number | null;
    reasons: string[];
    traderLine?: string;
};
export type OpeningRangeLabel = "above_opening_range" | "below_opening_range" | "inside_opening_range" | "testing_opening_high" | "testing_opening_low" | "unavailable";
export type OpeningRangeContext = {
    label: OpeningRangeLabel;
    reliability: ContextReliability;
    high: number | null;
    low: number | null;
    rangePct: number | null;
    minutesCovered: number;
    reasons: string[];
    traderLine?: string;
};
export type HaltAwarenessLabel = "normal" | "possible_halt" | "paused_after_fast_move" | "unknown";
export type HaltAwarenessContext = {
    label: HaltAwarenessLabel;
    reliability: ContextReliability;
    gapSinceLastCandleMs: number | null;
    moveBeforePausePct: number | null;
    reasons: string[];
    traderLine?: string;
};
export type LevelQualityCalibrationLabel = "healthy" | "thin_ladder" | "wide_first_gap" | "crowded_nearby_levels" | "no_forward_levels" | "unknown";
export type LevelQualityCalibrationContext = {
    label: LevelQualityCalibrationLabel;
    reliability: ContextReliability;
    nearestSupportDistancePct: number | null;
    nearestResistanceDistancePct: number | null;
    forwardSupportGapPct: number | null;
    forwardResistanceGapPct: number | null;
    tightSupportClusterCount: number;
    tightResistanceClusterCount: number;
    supportCount: number;
    resistanceCount: number;
    reasons: string[];
    traderLine?: string;
};
export type DataQualityGateLabel = "trusted" | "watch" | "degraded" | "unusable";
export type DataQualityGateContext = {
    label: DataQualityGateLabel;
    score: number;
    reasons: string[];
    traderLine?: string;
};
export type TradeIdeaSummaryLabel = "range_trade" | "breakout_watch" | "support_reaction" | "support_reclaim" | "extended_runner" | "noisy_chop" | "needs_data";
export type TradeIdeaSummaryContext = {
    label: TradeIdeaSummaryLabel;
    confidence: "low" | "medium" | "high";
    leadLine: string;
    reasons: string[];
};
export type NoPostDecision = "post_needed" | "no_post_needed" | "operator_review";
export type NoPostExplainerContext = {
    decision: NoPostDecision;
    reasons: string[];
};
export type FirstPostTradePlanContext = {
    title: string;
    lines: string[];
};
export type TraderStoryMemoryDecision = "new_story" | "material_update" | "repeat" | "cooldown";
export type TraderStoryMemoryContext = {
    decision: TraderStoryMemoryDecision;
    storyKey: string;
    previousStoryKey: string | null;
    cooldownMs: number;
    elapsedMs: number | null;
    reasons: string[];
};
export type TraderIntelligenceContext = {
    liquidity: LiquidityTradabilityContext;
    catalystProfile: CatalystProfileRiskContext;
    sessionGap: SessionGapContext;
    candleReaction: CandleReactionContext;
    moveExtension: MoveExtensionContext;
    volatility: SmallCapVolatilityContext;
    openingRange: OpeningRangeContext;
    haltAwareness: HaltAwarenessContext;
    levelQuality: LevelQualityCalibrationContext;
    dataQuality: DataQualityGateContext;
    tradeIdea: TradeIdeaSummaryContext;
    noPost: NoPostExplainerContext;
    firstPostPlan: FirstPostTradePlanContext;
    storyMemory: TraderStoryMemoryContext;
};
export type ReferenceLevelForReaction = {
    price: number;
    side: "support" | "resistance";
};
export type PreviousTraderStory = {
    storyKey: string;
    timestamp: number;
};
export type BuildTraderIntelligenceContextRequest = {
    symbol: string;
    dailyCandles?: Candle[];
    intradayCandles?: Candle[];
    currentPrice?: number;
    bid?: number;
    ask?: number;
    dynamicLevels?: DynamicLevelsFromCandles;
    stockContext?: StockContextPreview | null;
    knownCatalyst?: boolean;
    catalystDescription?: string;
    referenceLevel?: ReferenceLevelForReaction;
    levels?: LevelEngineOutput;
    previousStory?: PreviousTraderStory | null;
    timestamp?: number;
};
export declare function buildLiquidityTradabilityContext(params: {
    candles?: Candle[];
    currentPrice?: number;
    bid?: number;
    ask?: number;
}): LiquidityTradabilityContext;
export declare function buildCatalystProfileRiskContext(params: {
    marketCapDollars?: number;
    floatShares?: number;
    sharesOutstanding?: number;
    shortPercentOfFloat?: number;
    knownCatalyst?: boolean;
    catalystDescription?: string;
}): CatalystProfileRiskContext;
export declare function buildCatalystProfileRiskFromStockContext(stockContext: StockContextPreview | null | undefined, knownCatalyst?: boolean): CatalystProfileRiskContext;
export declare function buildSessionGapContext(params: {
    dailyCandles?: Candle[];
    intradayCandles?: Candle[];
    currentPrice?: number;
    sessionDate?: string;
}): SessionGapContext;
export declare function buildCandleReactionContext(params: {
    candles?: Candle[];
    referenceLevel?: ReferenceLevelForReaction;
    meaningfulMovePct?: number | null;
}): CandleReactionContext;
export declare function buildMoveExtensionContext(params: {
    candles?: Candle[];
    currentPrice?: number;
    dynamicLevels?: DynamicLevelsFromCandles;
}): MoveExtensionContext;
export declare function buildSmallCapVolatilityContext(params: {
    candles?: Candle[];
    currentPrice?: number;
    spreadPct?: number | null;
}): SmallCapVolatilityContext;
export declare function buildOpeningRangeContext(params: {
    candles?: Candle[];
    currentPrice?: number;
    sessionDate?: string;
}): OpeningRangeContext;
export declare function buildHaltAwarenessContext(params: {
    candles?: Candle[];
    now?: number;
    expectedIntervalMs?: number;
}): HaltAwarenessContext;
export declare function buildLevelQualityCalibrationContext(params: {
    levels?: LevelEngineOutput;
    currentPrice?: number;
}): LevelQualityCalibrationContext;
export declare function buildDataQualityGateContext(params: {
    liquidity: LiquidityTradabilityContext;
    volatility: SmallCapVolatilityContext;
    sessionGap: SessionGapContext;
    candleReaction: CandleReactionContext;
    moveExtension: MoveExtensionContext;
    levelQuality: LevelQualityCalibrationContext;
    haltAwareness: HaltAwarenessContext;
    levelDataQualityFlags?: string[];
}): DataQualityGateContext;
export declare function buildTradeIdeaSummaryContext(params: {
    symbol: string;
    sessionGap: SessionGapContext;
    candleReaction: CandleReactionContext;
    moveExtension: MoveExtensionContext;
    volatility: SmallCapVolatilityContext;
    levelQuality: LevelQualityCalibrationContext;
    dataQuality?: DataQualityGateContext;
}): TradeIdeaSummaryContext;
export declare function buildNoPostExplainerContext(params: {
    storyMemory: TraderStoryMemoryContext;
    candleReaction: CandleReactionContext;
    volatility: SmallCapVolatilityContext;
    dataQuality: DataQualityGateContext;
    moveExtension: MoveExtensionContext;
}): NoPostExplainerContext;
export declare function buildFirstPostTradePlanContext(params: {
    symbol: string;
    tradeIdea: TradeIdeaSummaryContext;
    dataQuality: DataQualityGateContext;
    volatility: SmallCapVolatilityContext;
    openingRange: OpeningRangeContext;
    levelQuality: LevelQualityCalibrationContext;
}): FirstPostTradePlanContext;
export declare function buildTraderStoryKey(params: {
    symbol: string;
    structureState?: string;
    levelSide?: "support" | "resistance" | null;
    levelPrice?: number | null;
    reactionLabel?: string;
    extensionLabel?: string;
}): string;
export declare function evaluateTraderStoryMemory(params: {
    storyKey: string;
    previousStory?: PreviousTraderStory | null;
    timestamp?: number;
    cooldownMs?: number;
    materialChange?: boolean;
}): TraderStoryMemoryContext;
export declare class TraderStoryMemory {
    private readonly stories;
    evaluate(symbol: string, storyKey: string, timestamp?: number, materialChange?: boolean): TraderStoryMemoryContext;
}
export declare function buildTraderIntelligenceContext(request: BuildTraderIntelligenceContextRequest): TraderIntelligenceContext;
//# sourceMappingURL=trader-context.d.ts.map