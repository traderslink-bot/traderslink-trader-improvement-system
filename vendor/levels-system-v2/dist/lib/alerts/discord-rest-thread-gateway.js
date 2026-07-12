import { formatLevelExtensionMessage, formatLevelLadderMessage, formatLevelSnapshotMessage } from "./alert-router.js";
import { buildWatchlistDiscordLinkMessage } from "./watchlist-discord-link-message.js";
const DEFAULT_API_BASE_URL = "https://discord.com/api/v10";
const DISCORD_FLAG_SUPPRESS_EMBEDS = 1 << 2;
const DEFAULT_TRANSIENT_RETRY_ATTEMPTS = 1;
const DEFAULT_TRANSIENT_RETRY_DELAY_MS = 750;
const DEFAULT_MAX_TRANSIENT_RETRY_DELAY_MS = 10_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const DISCORD_MESSAGE_MAX_LENGTH = 2000;
function normalizeNonEmpty(value, label) {
    const normalized = value?.trim();
    if (!normalized) {
        throw new Error(`${label} is required for Discord REST gateway.`);
    }
    return normalized;
}
function buildAlertMessageContent(payload) {
    const title = payload.title.trim();
    return title ? `${title}\n${payload.body}` : payload.body;
}
function removeDynamicIndicatorLines(content) {
    return content
        .split("\n")
        .filter((line) => !/\b(?:vwap|ema(?:9|20)?|ema\s*\d*)\b/i.test(line))
        .join("\n")
        .trimEnd();
}
function prepareDiscordContent(content) {
    return removeDynamicIndicatorLines(content);
}
function splitLongLine(line, maxLength) {
    const chunks = [];
    for (let index = 0; index < line.length; index += maxLength) {
        chunks.push(line.slice(index, index + maxLength));
    }
    return chunks;
}
function splitDiscordContent(content) {
    const prepared = prepareDiscordContent(content).trimEnd();
    if (prepared.length <= DISCORD_MESSAGE_MAX_LENGTH) {
        return [prepared.length > 0 ? prepared : " "];
    }
    const chunks = [];
    let current = "";
    const flushCurrent = () => {
        if (current.length > 0) {
            chunks.push(current);
            current = "";
        }
    };
    for (const line of prepared.split("\n")) {
        const candidate = current.length > 0 ? `${current}\n${line}` : line;
        if (candidate.length <= DISCORD_MESSAGE_MAX_LENGTH) {
            current = candidate;
            continue;
        }
        flushCurrent();
        if (line.length <= DISCORD_MESSAGE_MAX_LENGTH) {
            current = line;
            continue;
        }
        chunks.push(...splitLongLine(line, DISCORD_MESSAGE_MAX_LENGTH));
    }
    flushCurrent();
    return chunks.length > 0 ? chunks : [" "];
}
async function parseDiscordJson(response) {
    const text = await response.text();
    if (!text.trim()) {
        return null;
    }
    return JSON.parse(text);
}
function isTransientDiscordStatus(status) {
    return status === 429 || status === 502 || status === 503 || status === 504;
}
function parseRetryAfterMs(response, fallbackMs) {
    const retryAfter = response.headers.get("retry-after");
    if (!retryAfter) {
        return fallbackMs;
    }
    const seconds = Number(retryAfter);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : fallbackMs;
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export class DiscordRestThreadGateway {
    botToken;
    watchlistChannelId;
    guildId;
    fetchImpl;
    apiBaseUrl;
    autoArchiveDurationMinutes;
    transientRetryAttempts;
    transientRetryDelayMs;
    maxTransientRetryDelayMs;
    requestTimeoutMs;
    constructor(options) {
        this.botToken = normalizeNonEmpty(options.botToken, "Discord bot token");
        this.watchlistChannelId = normalizeNonEmpty(options.watchlistChannelId, "Discord watchlist channel id");
        this.guildId = options.guildId?.trim() || undefined;
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.apiBaseUrl = options.apiBaseUrl?.trim() || DEFAULT_API_BASE_URL;
        this.autoArchiveDurationMinutes = options.autoArchiveDurationMinutes ?? 1440;
        this.transientRetryAttempts = Math.max(0, Math.floor(options.transientRetryAttempts ?? DEFAULT_TRANSIENT_RETRY_ATTEMPTS));
        this.transientRetryDelayMs = Math.max(0, Math.floor(options.transientRetryDelayMs ?? DEFAULT_TRANSIENT_RETRY_DELAY_MS));
        this.maxTransientRetryDelayMs = Math.max(0, Math.floor(options.maxTransientRetryDelayMs ?? DEFAULT_MAX_TRANSIENT_RETRY_DELAY_MS));
        this.requestTimeoutMs = Math.max(0, Math.floor(options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS));
    }
    async request(path, init) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.transientRetryAttempts; attempt += 1) {
            const controller = this.requestTimeoutMs > 0 ? new AbortController() : null;
            const timeout = controller
                ? setTimeout(() => controller.abort(), this.requestTimeoutMs)
                : null;
            let response;
            try {
                response = await this.fetchImpl(`${this.apiBaseUrl}${path}`, {
                    ...init,
                    signal: init?.signal ?? controller?.signal,
                    headers: {
                        Authorization: `Bot ${this.botToken}`,
                        "Content-Type": "application/json",
                        ...(init?.headers ?? {}),
                    },
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                lastError = new Error(controller?.signal.aborted
                    ? `Discord API request timed out after ${this.requestTimeoutMs}ms for ${path}.`
                    : `Discord API request failed for ${path}: ${message}`);
                if (attempt < this.transientRetryAttempts) {
                    await delay(this.transientRetryDelayMs);
                    continue;
                }
                throw lastError;
            }
            finally {
                if (timeout) {
                    clearTimeout(timeout);
                }
            }
            if (response.ok) {
                return (await parseDiscordJson(response));
            }
            const body = await response.text();
            lastError = new Error(`Discord API request failed (${response.status}) for ${path}: ${body || response.statusText}`);
            if (attempt < this.transientRetryAttempts && isTransientDiscordStatus(response.status)) {
                const retryDelayMs = parseRetryAfterMs(response, this.transientRetryDelayMs);
                if (retryDelayMs > this.maxTransientRetryDelayMs) {
                    throw new Error(`Discord transient retry delay ${retryDelayMs}ms exceeds max ${this.maxTransientRetryDelayMs}ms for ${path}: ${body || response.statusText}`);
                }
                await delay(retryDelayMs);
                continue;
            }
            throw lastError;
        }
        throw lastError ?? new Error(`Discord API request failed for ${path}.`);
    }
    async postSingleMessage(channelId, content, flags) {
        return this.request(`/channels/${channelId}/messages`, {
            method: "POST",
            body: JSON.stringify(flags === undefined ? { content } : { content, flags }),
        });
    }
    async postMessage(channelId, content, flags) {
        const chunks = splitDiscordContent(content);
        const [firstChunk, ...remainingChunks] = chunks;
        const firstResponse = await this.postSingleMessage(channelId, firstChunk ?? " ", flags);
        for (const chunk of remainingChunks) {
            await this.postSingleMessage(channelId, chunk, flags);
        }
        return firstResponse;
    }
    async deleteMessage(channelId, messageId) {
        await this.request(`/channels/${channelId}/messages/${messageId}`, {
            method: "DELETE",
        });
    }
    async preflightPermissions(options = {}) {
        const checks = [];
        const runCheck = async (name, detail, check) => {
            try {
                await check();
                checks.push({ name, status: "pass", detail });
            }
            catch (error) {
                checks.push({
                    name,
                    status: "fail",
                    detail: error instanceof Error ? error.message : String(error),
                });
            }
        };
        await runCheck("watchlist_channel_read", `can read channel ${this.watchlistChannelId}`, async () => {
            await this.request(`/channels/${this.watchlistChannelId}`);
        });
        if (this.guildId) {
            await runCheck("active_threads_read", `can read active threads for guild ${this.guildId}`, async () => {
                await this.request(`/guilds/${this.guildId}/threads/active`);
            });
        }
        else {
            checks.push({
                name: "active_threads_read",
                status: "skipped",
                detail: "DISCORD_GUILD_ID is not configured, so active-thread recovery cannot be preflighted.",
            });
        }
        await runCheck("archived_threads_read", `can read archived public threads for channel ${this.watchlistChannelId}`, async () => {
            await this.request(`/channels/${this.watchlistChannelId}/threads/archived/public?limit=2`);
        });
        if (options.postTest) {
            let messageId = null;
            await runCheck("watchlist_channel_post", "can send a temporary preflight message in the watchlist channel", async () => {
                const message = await this.postMessage(this.watchlistChannelId, `TradersLink permission preflight ${new Date().toISOString()}`);
                messageId = message.id;
            });
            if (messageId) {
                await runCheck("watchlist_channel_delete_test_message", "can delete the temporary preflight message", async () => {
                    await this.deleteMessage(this.watchlistChannelId, messageId);
                });
            }
        }
        else {
            checks.push({
                name: "watchlist_channel_post",
                status: "skipped",
                detail: "post test skipped; rerun with --post-test to verify send/delete permissions.",
            });
        }
        return {
            ok: checks.every((check) => check.status !== "fail"),
            destructive: Boolean(options.postTest),
            checks,
        };
    }
    async getThreadById(threadId) {
        try {
            const channel = await this.request(`/channels/${threadId}`);
            if (channel.parent_id && channel.parent_id !== this.watchlistChannelId) {
                return null;
            }
            return {
                id: channel.id,
                name: channel.name ?? "",
            };
        }
        catch {
            return null;
        }
    }
    findMatchingThread(threads, name) {
        const match = threads.find((thread) => thread.name === name && thread.parent_id === this.watchlistChannelId);
        if (!match) {
            return null;
        }
        return {
            id: match.id,
            name: match.name ?? name,
        };
    }
    async findThreadByName(name) {
        if (this.guildId) {
            try {
                const active = await this.request(`/guilds/${this.guildId}/threads/active`);
                const activeMatch = this.findMatchingThread(active.threads ?? [], name);
                if (activeMatch) {
                    return activeMatch;
                }
            }
            catch {
                // Keep recovery deterministic: a failed active-thread lookup just falls through.
            }
        }
        try {
            const archived = await this.request(`/channels/${this.watchlistChannelId}/threads/archived/public?limit=100`);
            return this.findMatchingThread(archived.threads ?? [], name);
        }
        catch {
            return null;
        }
    }
    async createThread(name) {
        const starterMessage = await this.postMessage(this.watchlistChannelId, buildWatchlistDiscordLinkMessage(name));
        const thread = await this.request(`/channels/${this.watchlistChannelId}/messages/${starterMessage.id}/threads`, {
            method: "POST",
            body: JSON.stringify({
                name,
                auto_archive_duration: this.autoArchiveDurationMinutes,
            }),
        });
        return {
            id: thread.id,
            name: thread.name ?? name,
        };
    }
    async sendMessage(threadId, payload) {
        const flags = payload.metadata?.suppressEmbeds ? DISCORD_FLAG_SUPPRESS_EMBEDS : undefined;
        await this.postMessage(threadId, buildAlertMessageContent(payload), flags);
    }
    async sendLevelSnapshot(threadId, payload) {
        await this.postMessage(threadId, formatLevelSnapshotMessage(payload));
    }
    async sendLevelLadder(threadId, payload) {
        const ladder = formatLevelLadderMessage(payload);
        if (ladder) {
            await this.postMessage(threadId, ladder);
        }
    }
    async sendLevelExtension(threadId, payload) {
        await this.postMessage(threadId, formatLevelExtensionMessage(payload));
    }
}
