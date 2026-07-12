import { existsSync, readFileSync } from "node:fs";
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function finiteTimestamp(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function normalizeSymbol(value) {
    if (typeof value !== "string") {
        return null;
    }
    const symbol = value.trim().toUpperCase();
    return symbol.length > 0 ? symbol : null;
}
function latestTimestamp(values) {
    return values.reduce((latest, value) => {
        const timestamp = finiteTimestamp(value);
        return timestamp === null ? latest : Math.max(latest ?? timestamp, timestamp);
    }, null);
}
function eventTimestamp(event) {
    return finiteTimestamp(event.timestamp);
}
function eventSymbol(event) {
    return normalizeSymbol(event.symbol);
}
export function buildWatchlistLifecycleSessionsFromArchive(archive) {
    if (!archive?.symbols?.length) {
        return [];
    }
    const sessions = [];
    for (const item of archive.symbols) {
        const symbol = normalizeSymbol(item.symbol);
        const startedAt = finiteTimestamp(item.firstPostedAt) ?? finiteTimestamp(item.firstSeenAt);
        if (!symbol || startedAt === null) {
            continue;
        }
        const status = typeof item.status === "string" ? item.status : "archived";
        const lastSeenAt = finiteTimestamp(item.lastSeenAt) ?? finiteTimestamp(item.updatedAt) ?? finiteTimestamp(item.archivedAt);
        const endedAt = status === "live" ? null : lastSeenAt;
        sessions.push({
            symbol,
            startedAt,
            endedAt,
            source: "archive",
            status,
            firstPostedAt: finiteTimestamp(item.firstPostedAt),
        });
    }
    return sessions;
}
export function buildWatchlistLifecycleSessionsFromState(entries) {
    if (!entries?.length) {
        return [];
    }
    const sessions = [];
    for (const entry of entries) {
        const symbol = normalizeSymbol(entry.symbol);
        const startedAt = finiteTimestamp(entry.activatedAt);
        if (!symbol || startedAt === null) {
            continue;
        }
        const lifecycle = entry.lifecycle ?? (entry.active ? "active" : "inactive");
        const endedAt = entry.active
            ? null
            : latestTimestamp([
                entry.lastPriceUpdateAt,
                entry.lastThreadPostAt,
                entry.lastLevelPostAt,
                entry.lastExtensionPostAt,
                entry.lastTradeStoryAt,
                entry.activatedAt,
            ]);
        sessions.push({
            symbol,
            startedAt,
            endedAt,
            source: "state",
            status: entry.active ? "live" : "inactive",
            lifecycle,
        });
    }
    return sessions;
}
export function buildWatchlistLifecycleSessionsFromEvents(events) {
    if (!events?.length) {
        return [];
    }
    const sessions = [];
    const openBySymbol = new Map();
    const sortedEvents = [...events].sort((left, right) => (eventTimestamp(left) ?? 0) - (eventTimestamp(right) ?? 0));
    for (const event of sortedEvents) {
        const symbol = eventSymbol(event);
        const timestamp = eventTimestamp(event);
        if (!symbol || timestamp === null) {
            continue;
        }
        const existing = openBySymbol.get(symbol);
        if (event.event === "activation_queued" || event.event === "activation_started") {
            if (!existing) {
                openBySymbol.set(symbol, {
                    symbol,
                    startedAt: timestamp,
                    endedAt: null,
                    source: "event_log",
                    status: "activating",
                    lifecycle: "activating",
                });
            }
            continue;
        }
        if (event.event === "activation_completed") {
            const session = existing ?? {
                symbol,
                startedAt: timestamp,
                endedAt: null,
                source: "event_log",
                status: "live",
                lifecycle: "active",
            };
            session.status = "live";
            session.lifecycle = "active";
            session.firstPostedAt = session.firstPostedAt ?? timestamp;
            openBySymbol.set(symbol, session);
            continue;
        }
        if (event.event === "restore_started") {
            openBySymbol.set(symbol, {
                symbol,
                startedAt: existing?.startedAt ?? timestamp,
                endedAt: null,
                source: "event_log",
                status: "restoring",
                lifecycle: "restoring",
                firstPostedAt: existing?.firstPostedAt ?? null,
            });
            continue;
        }
        if (event.event === "restore_completed") {
            const session = existing ?? {
                symbol,
                startedAt: timestamp,
                endedAt: null,
                source: "event_log",
                status: "restoring",
                lifecycle: "restoring",
            };
            session.status = "restoring";
            session.lifecycle = "restoring";
            session.endedAt = timestamp;
            session.firstPostedAt = session.firstPostedAt ?? timestamp;
            sessions.push(session);
            openBySymbol.set(symbol, {
                symbol,
                startedAt: timestamp,
                endedAt: null,
                source: "event_log",
                status: "live",
                lifecycle: "active",
                firstPostedAt: timestamp,
            });
            continue;
        }
        if (event.event === "deactivated") {
            if (existing) {
                existing.endedAt = timestamp;
                if (existing.status !== "live" && existing.status !== "restoring") {
                    existing.status = "live";
                }
                sessions.push(existing);
                openBySymbol.delete(symbol);
            }
            continue;
        }
        if (event.event === "activation_failed" ||
            event.event === "activation_marked_failed" ||
            event.event === "restore_failed") {
            if (existing) {
                existing.endedAt = timestamp;
                existing.status = "failed";
                sessions.push(existing);
                openBySymbol.delete(symbol);
            }
        }
    }
    sessions.push(...openBySymbol.values());
    return sessions;
}
export function groupWatchlistLifecycleSessionsBySymbol(sessions) {
    const grouped = {};
    for (const session of sessions) {
        const symbol = session.symbol.toUpperCase();
        grouped[symbol] = [...(grouped[symbol] ?? []), session];
    }
    for (const symbol of Object.keys(grouped)) {
        grouped[symbol] = grouped[symbol].sort((left, right) => left.startedAt - right.startedAt);
    }
    return grouped;
}
export function classifyWatchlistLifecycleScope(params) {
    const sessions = params.sessionsBySymbol?.[params.symbol.toUpperCase()] ?? [];
    if (sessions.length === 0) {
        return "unknown_lifecycle";
    }
    const matching = sessions.filter((session) => (params.timestamp >= session.startedAt &&
        (session.endedAt === null || params.timestamp <= session.endedAt)));
    if (matching.length === 0) {
        return "outside_active_window";
    }
    if (matching.some((session) => session.lifecycle === "restoring" || session.status === "restoring")) {
        return "restart_restore_window";
    }
    if (matching.some((session) => session.source === "event_log" && session.status === "live")) {
        return "active_window";
    }
    if (matching.some((session) => session.source === "state" && session.status === "live")) {
        return "active_window";
    }
    if (matching.some((session) => session.source === "archive" && session.status === "live")) {
        return "active_window";
    }
    if (matching.some((session) => session.source === "archive")) {
        return "archive_only";
    }
    return "outside_active_window";
}
function readJsonFile(filePath) {
    if (!existsSync(filePath)) {
        return null;
    }
    try {
        return JSON.parse(readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
    }
    catch {
        return null;
    }
}
function readLifecycleEventsFile(filePath) {
    if (!existsSync(filePath)) {
        return [];
    }
    try {
        return readFileSync(filePath, "utf8")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => JSON.parse(line))
            .filter((value) => (isRecord(value) &&
            value.type === "manual_watchlist_lifecycle" &&
            typeof value.event === "string" &&
            typeof value.timestamp === "number"));
    }
    catch {
        return [];
    }
}
export function readWatchlistLifecycleSessionsFromFiles(options) {
    const sessions = [];
    if (options.eventLogPath) {
        sessions.push(...buildWatchlistLifecycleSessionsFromEvents(readLifecycleEventsFile(options.eventLogPath)));
    }
    const archivePayload = options.archivePath ? readJsonFile(options.archivePath) : null;
    if (isRecord(archivePayload) && archivePayload.version === 1 && Array.isArray(archivePayload.symbols)) {
        sessions.push(...buildWatchlistLifecycleSessionsFromArchive(archivePayload));
    }
    const statePayload = options.statePath ? readJsonFile(options.statePath) : null;
    if (isRecord(statePayload) && Array.isArray(statePayload.entries)) {
        sessions.push(...buildWatchlistLifecycleSessionsFromState(statePayload.entries));
    }
    return sessions;
}
export function emptyLifecycleScopeCounts() {
    return {
        active_window: 0,
        restart_restore_window: 0,
        archive_only: 0,
        outside_active_window: 0,
        unknown_lifecycle: 0,
    };
}
