export type DiscordThreadCleanupCandidate = {
    symbol: string;
    threadId: string;
    active: boolean | null;
    lifecycle?: string;
    lastSeenAt?: number;
    source: "watchlist_state" | "discord_audit" | "channel_scan";
};
export type DiscordThreadCleanupFilter = {
    symbols?: string[];
    includeActive?: boolean;
};
export declare function loadThreadCleanupCandidatesFromWatchlistState(path: string): DiscordThreadCleanupCandidate[];
export declare function loadThreadCleanupCandidatesFromDiscordAudit(path: string): DiscordThreadCleanupCandidate[];
export declare function filterThreadCleanupCandidates(candidates: DiscordThreadCleanupCandidate[], filter?: DiscordThreadCleanupFilter): DiscordThreadCleanupCandidate[];
export declare function dedupeCleanupCandidates(candidates: DiscordThreadCleanupCandidate[]): DiscordThreadCleanupCandidate[];
//# sourceMappingURL=discord-thread-cleanup.d.ts.map