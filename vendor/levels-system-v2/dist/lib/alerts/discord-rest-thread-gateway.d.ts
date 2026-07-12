import type { AlertPayload, DiscordThread, LevelExtensionPayload, LevelSnapshotPayload } from "./alert-types.js";
import type { DiscordThreadGateway } from "./alert-router.js";
type FetchLike = typeof fetch;
export type DiscordRestThreadGatewayOptions = {
    botToken: string;
    watchlistChannelId: string;
    guildId?: string;
    fetchImpl?: FetchLike;
    apiBaseUrl?: string;
    autoArchiveDurationMinutes?: 60 | 1440 | 4320 | 10080;
    transientRetryAttempts?: number;
    transientRetryDelayMs?: number;
    maxTransientRetryDelayMs?: number;
    requestTimeoutMs?: number;
};
export type DiscordPermissionPreflightStatus = "pass" | "fail" | "skipped";
export type DiscordPermissionPreflightCheck = {
    name: string;
    status: DiscordPermissionPreflightStatus;
    detail: string;
};
export type DiscordPermissionPreflightResult = {
    ok: boolean;
    destructive: boolean;
    checks: DiscordPermissionPreflightCheck[];
};
export declare class DiscordRestThreadGateway implements DiscordThreadGateway {
    private readonly botToken;
    private readonly watchlistChannelId;
    private readonly guildId?;
    private readonly fetchImpl;
    private readonly apiBaseUrl;
    private readonly autoArchiveDurationMinutes;
    private readonly transientRetryAttempts;
    private readonly transientRetryDelayMs;
    private readonly maxTransientRetryDelayMs;
    private readonly requestTimeoutMs;
    constructor(options: DiscordRestThreadGatewayOptions);
    private request;
    private postSingleMessage;
    private postMessage;
    private deleteMessage;
    preflightPermissions(options?: {
        postTest?: boolean;
    }): Promise<DiscordPermissionPreflightResult>;
    getThreadById(threadId: string): Promise<DiscordThread | null>;
    private findMatchingThread;
    findThreadByName(name: string): Promise<DiscordThread | null>;
    createThread(name: string): Promise<DiscordThread>;
    sendMessage(threadId: string, payload: AlertPayload): Promise<void>;
    sendLevelSnapshot(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelLadder(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelExtension(threadId: string, payload: LevelExtensionPayload): Promise<void>;
}
export {};
//# sourceMappingURL=discord-rest-thread-gateway.d.ts.map