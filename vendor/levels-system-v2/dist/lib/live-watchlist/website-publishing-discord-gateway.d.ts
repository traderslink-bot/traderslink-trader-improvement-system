import type { AlertPayload, DiscordThread, LevelExtensionPayload, LevelSnapshotPayload } from "../alerts/alert-types.js";
import type { DiscordThreadGateway } from "../alerts/alert-router.js";
import type { LiveWatchlistPublisher } from "./live-watchlist-types.js";
export declare class WebsitePublishingDiscordGateway implements DiscordThreadGateway {
    private readonly gateway;
    private readonly publisher;
    private readonly preDiscordPublishGraceMs;
    private readonly options;
    constructor(gateway: DiscordThreadGateway, publisher: LiveWatchlistPublisher | null, preDiscordPublishGraceMs?: number, options?: {
        pullbackReadEnabled?: boolean;
    });
    getThreadById(threadId: string): Promise<DiscordThread | null>;
    findThreadByName(name: string): Promise<DiscordThread | null>;
    createThread(name: string): Promise<DiscordThread>;
    sendMessage(threadId: string, payload: AlertPayload): Promise<void>;
    sendLevelSnapshot(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelLadder(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelExtension(threadId: string, payload: LevelExtensionPayload): Promise<void>;
    private publishBeforeDiscord;
}
//# sourceMappingURL=website-publishing-discord-gateway.d.ts.map