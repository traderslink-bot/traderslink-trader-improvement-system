import { buildLiveWatchlistAlertPatch, buildLiveWatchlistExtensionPatch, buildLiveWatchlistSnapshotPatch, } from "./live-watchlist-publisher.js";
const DEFAULT_PRE_DISCORD_PUBLISH_GRACE_MS = 1_500;
export class WebsitePublishingDiscordGateway {
    gateway;
    publisher;
    preDiscordPublishGraceMs;
    options;
    constructor(gateway, publisher, preDiscordPublishGraceMs = DEFAULT_PRE_DISCORD_PUBLISH_GRACE_MS, options = {}) {
        this.gateway = gateway;
        this.publisher = publisher;
        this.preDiscordPublishGraceMs = preDiscordPublishGraceMs;
        this.options = options;
    }
    async getThreadById(threadId) {
        return this.gateway.getThreadById(threadId);
    }
    async findThreadByName(name) {
        return this.gateway.findThreadByName(name);
    }
    async createThread(name) {
        return this.gateway.createThread(name);
    }
    async sendMessage(threadId, payload) {
        void threadId;
        await this.publishBeforeDiscord(buildLiveWatchlistAlertPatch(payload));
    }
    async sendLevelSnapshot(threadId, payload) {
        void threadId;
        await this.publishBeforeDiscord(buildLiveWatchlistSnapshotPatch(payload, {
            pullbackReadEnabled: this.options.pullbackReadEnabled,
        }));
    }
    async sendLevelLadder(threadId, payload) {
        void threadId;
        void payload;
    }
    async sendLevelExtension(threadId, payload) {
        void threadId;
        await this.publishBeforeDiscord(buildLiveWatchlistExtensionPatch(payload));
    }
    async publishBeforeDiscord(patch) {
        if (!this.publisher || !patch) {
            return;
        }
        let timeout = null;
        const publishPromise = this.publisher.publish(patch).catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[WebsitePublishingDiscordGateway] Live watchlist publish failed: ${message}`);
        });
        await Promise.race([
            publishPromise,
            new Promise((resolve) => {
                timeout = setTimeout(() => {
                    console.warn(`[WebsitePublishingDiscordGateway] Live watchlist publish did not finish before Discord grace window for ${patch.symbol}.`);
                    resolve();
                }, this.preDiscordPublishGraceMs);
            }),
        ]);
        if (timeout) {
            clearTimeout(timeout);
        }
    }
}
