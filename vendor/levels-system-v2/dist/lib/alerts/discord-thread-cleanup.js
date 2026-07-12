import { readFileSync } from "node:fs";
function normalizeSymbol(value) {
    if (typeof value !== "string") {
        return null;
    }
    const normalized = value.trim().toUpperCase();
    return normalized.length > 0 ? normalized : null;
}
function normalizeThreadId(value) {
    if (typeof value !== "string") {
        return null;
    }
    const normalized = value.trim();
    return /^\d{10,30}$/.test(normalized) ? normalized : null;
}
function normalizeTimestamp(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function newestTimestamp(...values) {
    const usable = values.filter((value) => typeof value === "number");
    return usable.length > 0 ? Math.max(...usable) : undefined;
}
export function loadThreadCleanupCandidatesFromWatchlistState(path) {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const candidates = [];
    for (const entry of entries) {
        const symbol = normalizeSymbol(entry.symbol);
        const threadId = normalizeThreadId(entry.discordThreadId);
        if (!symbol || !threadId) {
            continue;
        }
        candidates.push({
            symbol,
            threadId,
            active: typeof entry.active === "boolean" ? entry.active : null,
            lifecycle: typeof entry.lifecycle === "string" ? entry.lifecycle : undefined,
            lastSeenAt: newestTimestamp(normalizeTimestamp(entry.lastThreadPostAt), normalizeTimestamp(entry.lastLevelPostAt), normalizeTimestamp(entry.activatedAt)),
            source: "watchlist_state",
        });
    }
    return dedupeCleanupCandidates(candidates);
}
export function loadThreadCleanupCandidatesFromDiscordAudit(path) {
    const text = readFileSync(path, "utf8");
    const latestByThread = new Map();
    for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) {
            continue;
        }
        let row;
        try {
            row = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (row.type !== "discord_delivery_audit") {
            continue;
        }
        const symbol = normalizeSymbol(row.symbol);
        const threadId = normalizeThreadId(row.threadId);
        if (!symbol || !threadId) {
            continue;
        }
        const timestamp = normalizeTimestamp(row.timestamp);
        const existing = latestByThread.get(threadId);
        if (!existing || (timestamp ?? 0) >= (existing.lastSeenAt ?? 0)) {
            latestByThread.set(threadId, {
                symbol,
                threadId,
                active: null,
                lastSeenAt: timestamp,
                source: "discord_audit",
            });
        }
    }
    return [...latestByThread.values()].sort((left, right) => left.symbol.localeCompare(right.symbol));
}
export function filterThreadCleanupCandidates(candidates, filter = {}) {
    const symbolSet = filter.symbols
        ? new Set(filter.symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))
        : null;
    return dedupeCleanupCandidates(candidates)
        .filter((candidate) => !symbolSet || symbolSet.has(candidate.symbol))
        .filter((candidate) => filter.includeActive || candidate.active !== true);
}
export function dedupeCleanupCandidates(candidates) {
    const byThread = new Map();
    for (const candidate of candidates) {
        const existing = byThread.get(candidate.threadId);
        if (!existing ||
            (candidate.lastSeenAt ?? 0) > (existing.lastSeenAt ?? 0) ||
            (existing.active === null && candidate.active !== null)) {
            byThread.set(candidate.threadId, candidate);
        }
    }
    return [...byThread.values()].sort((left, right) => left.symbol.localeCompare(right.symbol) || left.threadId.localeCompare(right.threadId));
}
