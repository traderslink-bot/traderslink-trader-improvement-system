import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { formatLevelExtensionMessage, formatLevelLadderMessage, formatLevelSnapshotMessage } from "./alert-router.js";
import { buildWatchlistDiscordLinkMessage } from "./watchlist-discord-link-message.js";
const DISCORD_STATE_VERSION = 1;
const DEFAULT_DISCORD_STATE_FILE = resolve(process.cwd(), "artifacts", "discord-threads.json");
function buildEmptyState() {
    return {
        version: DISCORD_STATE_VERSION,
        nextThreadSequence: 1,
        threads: {},
    };
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validateState(value) {
    if (!isRecord(value)) {
        return null;
    }
    if (value.version !== DISCORD_STATE_VERSION ||
        typeof value.nextThreadSequence !== "number" ||
        !Number.isInteger(value.nextThreadSequence) ||
        value.nextThreadSequence < 1 ||
        !isRecord(value.threads)) {
        return null;
    }
    const threads = {};
    for (const [threadId, threadValue] of Object.entries(value.threads)) {
        if (!isRecord(threadValue) ||
            typeof threadValue.id !== "string" ||
            typeof threadValue.name !== "string" ||
            !Array.isArray(threadValue.messages)) {
            return null;
        }
        const messages = [];
        for (const messageValue of threadValue.messages) {
            if (!isRecord(messageValue) ||
                (messageValue.type !== "alert" &&
                    messageValue.type !== "level_snapshot" &&
                    messageValue.type !== "level_extension") ||
                typeof messageValue.title !== "string" ||
                typeof messageValue.body !== "string" ||
                typeof messageValue.symbol !== "string" ||
                typeof messageValue.timestamp !== "number" ||
                !Number.isFinite(messageValue.timestamp)) {
                return null;
            }
            messages.push({
                type: messageValue.type,
                title: messageValue.title,
                body: messageValue.body,
                symbol: messageValue.symbol,
                timestamp: messageValue.timestamp,
            });
        }
        threads[threadId] = {
            id: threadValue.id,
            name: threadValue.name,
            messages,
        };
    }
    return {
        version: DISCORD_STATE_VERSION,
        nextThreadSequence: value.nextThreadSequence,
        threads,
    };
}
export class LocalDiscordThreadGateway {
    filePath;
    constructor(config = {}) {
        this.filePath = config.filePath ?? DEFAULT_DISCORD_STATE_FILE;
    }
    loadState() {
        try {
            const raw = readFileSync(this.filePath, "utf8");
            const parsed = JSON.parse(raw);
            const validated = validateState(parsed);
            if (!validated) {
                console.error(`[LocalDiscordThreadGateway] Discarded invalid Discord thread state at ${this.filePath}.`);
                return buildEmptyState();
            }
            return validated;
        }
        catch (error) {
            if (error?.code !== "ENOENT") {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`[LocalDiscordThreadGateway] Failed to load Discord thread state from ${this.filePath}: ${message}`);
            }
            return buildEmptyState();
        }
    }
    saveState(state) {
        const directory = dirname(this.filePath);
        const tempFilePath = `${this.filePath}.tmp`;
        try {
            mkdirSync(directory, { recursive: true });
            writeFileSync(tempFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
            renameSync(tempFilePath, this.filePath);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[LocalDiscordThreadGateway] Failed to save Discord thread state to ${this.filePath}: ${message}`);
        }
    }
    async getThreadById(threadId) {
        const state = this.loadState();
        const thread = state.threads[threadId];
        if (!thread) {
            return null;
        }
        return {
            id: thread.id,
            name: thread.name,
        };
    }
    async findThreadByName(name) {
        const state = this.loadState();
        const thread = Object.values(state.threads).find((item) => item.name === name);
        if (!thread) {
            return null;
        }
        return {
            id: thread.id,
            name: thread.name,
        };
    }
    async createThread(name) {
        const state = this.loadState();
        const threadId = `discord-thread-${state.nextThreadSequence}`;
        state.nextThreadSequence += 1;
        state.threads[threadId] = {
            id: threadId,
            name,
            messages: [
                {
                    type: "alert",
                    title: name,
                    body: buildWatchlistDiscordLinkMessage(name),
                    symbol: name,
                    timestamp: Date.now(),
                },
            ],
        };
        this.saveState(state);
        return {
            id: threadId,
            name,
        };
    }
    async sendMessage(threadId, payload) {
        const state = this.loadState();
        const thread = state.threads[threadId];
        if (!thread) {
            throw new Error(`Discord thread ${threadId} was not found.`);
        }
        thread.messages.push({
            type: "alert",
            title: payload.title,
            body: payload.body,
            symbol: payload.symbol ?? payload.event?.symbol ?? "UNKNOWN",
            timestamp: payload.timestamp ?? payload.event?.timestamp ?? Date.now(),
        });
        this.saveState(state);
    }
    async sendLevelSnapshot(threadId, payload) {
        const state = this.loadState();
        const thread = state.threads[threadId];
        if (!thread) {
            throw new Error(`Discord thread ${threadId} was not found.`);
        }
        thread.messages.push({
            type: "level_snapshot",
            title: `${payload.symbol} support and resistance`,
            body: formatLevelSnapshotMessage(payload),
            symbol: payload.symbol,
            timestamp: payload.timestamp,
        });
        this.saveState(state);
    }
    async sendLevelLadder(threadId, payload) {
        const body = formatLevelLadderMessage(payload);
        if (!body) {
            return;
        }
        const state = this.loadState();
        const thread = state.threads[threadId];
        if (!thread) {
            throw new Error(`Discord thread ${threadId} was not found.`);
        }
        thread.messages.push({
            type: "level_snapshot",
            title: `${payload.symbol} full level ladder`,
            body,
            symbol: payload.symbol,
            timestamp: payload.timestamp,
        });
        this.saveState(state);
    }
    async sendLevelExtension(threadId, payload) {
        const state = this.loadState();
        const thread = state.threads[threadId];
        if (!thread) {
            throw new Error(`Discord thread ${threadId} was not found.`);
        }
        thread.messages.push({
            type: "level_extension",
            title: `${payload.symbol} next levels to watch`,
            body: formatLevelExtensionMessage(payload),
            symbol: payload.symbol,
            timestamp: payload.timestamp,
        });
        this.saveState(state);
    }
}
