export type ManualWatchlistLifecycleEventName = "runtime_started" | "monitor_restart_completed" | "thread_ready" | "activation_queued" | "activation_started" | "activation_stuck" | "levels_seeded" | "activation_completed" | "activation_failed" | "activation_marked_failed" | "activation_retry_scheduled" | "restore_started" | "restore_completed" | "restore_skipped" | "stock_context_posted" | "stock_context_post_failed" | "snapshot_posted" | "extension_posted" | "alert_posted" | "alert_suppressed" | "alert_post_failed" | "continuity_posted" | "continuity_post_failed" | "follow_through_posted" | "follow_through_post_failed" | "follow_through_state_posted" | "follow_through_state_post_failed" | "market_structure_posted" | "market_structure_post_failed" | "market_structure_post_suppressed" | "market_structure_story_expired" | "recap_posted" | "recap_post_failed" | "ai_commentary_generated" | "ai_commentary_suppressed" | "ai_commentary_failed" | "ai_clean_read_requested" | "ai_clean_read_retrying" | "ai_clean_read_retry_succeeded" | "ai_clean_read_generated" | "ai_clean_read_failed" | "deactivated" | "restore_failed";
export type ManualWatchlistLifecycleEvent = {
    type: "manual_watchlist_lifecycle";
    event: ManualWatchlistLifecycleEventName;
    timestamp: number;
    symbol?: string;
    threadId?: string | null;
    details?: Record<string, string | number | boolean | null>;
};
export type ManualWatchlistLifecycleListener = (event: ManualWatchlistLifecycleEvent) => void;
export declare function isMarketStructureLifecycleEvent(event: ManualWatchlistLifecycleEvent): boolean;
export declare function createConsoleManualWatchlistLifecycleListener(): ManualWatchlistLifecycleListener;
export declare function createManualWatchlistLifecycleFileListener(filePath: string, options?: {
    include?: (event: ManualWatchlistLifecycleEvent) => boolean;
    onError?: (error: unknown, event: ManualWatchlistLifecycleEvent) => void;
}): ManualWatchlistLifecycleListener;
export declare function createCompositeManualWatchlistLifecycleListener(listeners: ManualWatchlistLifecycleListener[]): ManualWatchlistLifecycleListener;
//# sourceMappingURL=manual-watchlist-runtime-events.d.ts.map