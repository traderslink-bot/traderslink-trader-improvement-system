export declare const SIGNAL_CATEGORY_KEYS: readonly ["support_resistance", "pivots", "market_structure", "range_compression", "breakout_reclaim_quality", "reaction_quality", "volume_activity", "liquidity_tradability", "volatility_context", "catalyst_context", "session_context", "opening_range", "halt_awareness", "candle_meaning", "move_extension", "level_calibration", "data_quality", "trade_idea_summary", "pattern_context", "follow_through", "trader_commentary", "no_post_explainer", "story_memory", "operator_review"];
export type SignalCategoryKey = (typeof SIGNAL_CATEGORY_KEYS)[number];
export type SignalSurfaceKey = "liveDiscord" | "operatorArtifacts" | "internalScoring";
export type SignalCategoryProfile = "minimal" | "levels_only" | "levels_plus_structure" | "trader_balanced" | "operator_full";
export type SignalSurfaceConfig = Record<SignalSurfaceKey, boolean>;
export type SignalSurfaceMatrix = Record<SignalCategoryKey, SignalSurfaceConfig>;
export declare function resolveSignalSurfaceMatrix(profileValue?: string | undefined): SignalSurfaceMatrix;
export declare function isSignalCategoryEnabledForSurface(category: SignalCategoryKey, surfaceName: SignalSurfaceKey, profileValue?: string | undefined): boolean;
//# sourceMappingURL=signal-category-config.d.ts.map