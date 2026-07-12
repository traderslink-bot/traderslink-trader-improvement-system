import type { AlertPayload, DiscordThread, LevelExtensionPayload, LevelSnapshotPayload } from "./alert-types.js";
import type { DiscordThreadGateway } from "./alert-router.js";
export type LocalDiscordThreadGatewayConfig = {
    filePath?: string;
};
export declare class LocalDiscordThreadGateway implements DiscordThreadGateway {
    private readonly filePath;
    constructor(config?: LocalDiscordThreadGatewayConfig);
    private loadState;
    private saveState;
    getThreadById(threadId: string): Promise<DiscordThread | null>;
    findThreadByName(name: string): Promise<DiscordThread | null>;
    createThread(name: string): Promise<DiscordThread>;
    sendMessage(threadId: string, payload: AlertPayload): Promise<void>;
    sendLevelSnapshot(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelLadder(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelExtension(threadId: string, payload: LevelExtensionPayload): Promise<void>;
}
//# sourceMappingURL=local-discord-thread-gateway.d.ts.map