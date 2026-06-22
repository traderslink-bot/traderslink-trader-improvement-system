import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import type Database from "better-sqlite3";

import type {
  LiveWatchlistCardContent,
  LiveWatchlistCardPatch,
  LiveWatchlistArchiveSnapshot,
  LiveWatchlistHealthPatch,
  LiveWatchlistLevelMap,
  LiveWatchlistMarketDataStatus,
  LiveWatchlistStatePayload,
  LiveWatchlistSymbolState,
  LiveWatchlistTickerDataPatch,
} from "./live-watchlist-types";

type SqliteDatabase = Database.Database;
type NeonSql = ReturnType<typeof neon>;

let sharedSqliteDatabase: SqliteDatabase | null = null;
let sharedNeonSql: NeonSql | null = null;
let sharedNeonSchemaPromise: Promise<void> | null = null;

function databaseUrl(): string | undefined {
  return process.env.LIVE_WATCHLIST_DATABASE_URL ?? process.env.ACADEMY_DATABASE_URL ?? process.env.DATABASE_URL;
}

function shouldUseSqliteFallback(): boolean {
  if (process.env.LIVE_WATCHLIST_STORAGE === "sqlite") {
    return true;
  }
  if (databaseUrl()) {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Live watchlist storage requires LIVE_WATCHLIST_DATABASE_URL or DATABASE_URL in production.");
  }
  return true;
}

function databasePath(): string {
  const configured = process.env.LIVE_WATCHLIST_DB_PATH ?? process.env.TRADER_INTELLIGENCE_DB_PATH;
  if (configured) {
    if (configured === ":memory:") {
      return configured;
    }
    return isAbsolute(configured)
      ? configured
      : join(/* turbopackIgnore: true */ process.cwd(), configured);
  }
  return join(process.cwd(), "data", "live-watchlist.sqlite");
}

async function getSqliteDatabase(): Promise<SqliteDatabase> {
  if (sharedSqliteDatabase) {
    return sharedSqliteDatabase;
  }

  const { default: DatabaseConstructor } = await import("better-sqlite3");
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseConstructor(path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS live_watchlist_symbols (
      symbol TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      state_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_watchlist_health (
      key TEXT PRIMARY KEY,
      market_data_status TEXT NOT NULL,
      market_data_updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS live_watchlist_archives (
      archive_id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      archived_at INTEGER NOT NULL,
      first_posted_at INTEGER,
      last_active_updated_at INTEGER NOT NULL,
      state_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS live_watchlist_archives_symbol_archived_at_idx
      ON live_watchlist_archives (symbol, archived_at DESC);
  `);
  sharedSqliteDatabase = db;
  return db;
}

function getNeonSql(): NeonSql {
  const url = databaseUrl();
  if (!url) {
    throw new Error("Live watchlist storage requires a database URL.");
  }
  sharedNeonSql ??= neon(url);
  return sharedNeonSql;
}

async function ensureNeonSchema(): Promise<void> {
  if (sharedNeonSchemaPromise) {
    return sharedNeonSchemaPromise;
  }

  const sql = getNeonSql();
  sharedNeonSchemaPromise = sql`
    CREATE TABLE IF NOT EXISTS live_watchlist_symbols (
      symbol TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      updated_at BIGINT NOT NULL,
      state_json TEXT NOT NULL
    )
  `
    .then(
      () => sql`
        CREATE TABLE IF NOT EXISTS live_watchlist_health (
          key TEXT PRIMARY KEY,
          market_data_status TEXT NOT NULL,
          market_data_updated_at BIGINT
        )
      `,
    )
    .then(
      () => sql`
        CREATE TABLE IF NOT EXISTS live_watchlist_archives (
          archive_id TEXT PRIMARY KEY,
          symbol TEXT NOT NULL,
          archived_at BIGINT NOT NULL,
          first_posted_at BIGINT,
          last_active_updated_at BIGINT NOT NULL,
          state_json TEXT NOT NULL
        )
      `,
    )
    .then(
      () => sql`
        CREATE INDEX IF NOT EXISTS live_watchlist_archives_symbol_archived_at_idx
          ON live_watchlist_archives (symbol, archived_at DESC)
      `,
    )
    .then(() => undefined);
  return sharedNeonSchemaPromise;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isCard(value: unknown): value is LiveWatchlistCardContent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LiveWatchlistCardContent).title === "string" &&
    typeof (value as LiveWatchlistCardContent).body === "string" &&
    typeof (value as LiveWatchlistCardContent).updatedAt === "number" &&
    typeof (value as LiveWatchlistCardContent).source === "string"
  );
}

function parseState(raw: string): LiveWatchlistSymbolState | null {
  try {
    const parsed = JSON.parse(raw) as LiveWatchlistSymbolState;
    if (!parsed.symbol || !parsed.cards) {
      return null;
    }
    return deriveStateFields({
      ...parsed,
      firstPostedAt: parsed.firstPostedAt ?? null,
    });
  } catch {
    return null;
  }
}

function symbolActivationSortTime(symbol: LiveWatchlistSymbolState): number {
  return symbol.firstPostedAt ?? symbol.updatedAt;
}

function sortSymbolsByActivation(
  left: LiveWatchlistSymbolState,
  right: LiveWatchlistSymbolState,
): number {
  const timeDiff = symbolActivationSortTime(right) - symbolActivationSortTime(left);
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return left.symbol.localeCompare(right.symbol);
}

function parseArchiveRow(row: {
  archive_id?: unknown;
  symbol?: unknown;
  archived_at?: unknown;
  first_posted_at?: unknown;
  last_active_updated_at?: unknown;
  state_json?: unknown;
}): LiveWatchlistArchiveSnapshot | null {
  if (
    typeof row.archive_id !== "string" ||
    typeof row.symbol !== "string" ||
    typeof row.state_json !== "string"
  ) {
    return null;
  }
  const archivedAt = normalizeLiveWatchlistTimestamp(row.archived_at);
  const firstPostedAt = normalizeLiveWatchlistTimestamp(row.first_posted_at);
  const lastActiveUpdatedAt = normalizeLiveWatchlistTimestamp(row.last_active_updated_at);
  const state = parseState(row.state_json);
  if (!archivedAt || !lastActiveUpdatedAt || !state) {
    return null;
  }
  return {
    archiveId: row.archive_id,
    symbol: row.symbol,
    archivedAt,
    firstPostedAt,
    lastActiveUpdatedAt,
    state,
  };
}

export function normalizeLiveWatchlistTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function archiveIdFor(symbol: string, archivedAt: number): string {
  const date = new Date(archivedAt);
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  return [
    normalizeSymbol(symbol),
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`,
    pad(date.getUTCMilliseconds(), 3),
  ].join("-");
}

function hasCoreArchiveCards(state: LiveWatchlistSymbolState): boolean {
  return Boolean(
    state.cards.nearestSupportResistance &&
      state.cards.liveTraderRead &&
      state.cards.fullLadder,
  );
}

function extractSection(body: string, startHeading: string, endHeadings: string[]): string | null {
  const normalized = body.replace(/\r\n/g, "\n");
  const startPattern = new RegExp(`^${escapeRegExp(startHeading)}:\\s*$`, "im");
  const startMatch = normalized.match(startPattern);
  if (!startMatch || startMatch.index === undefined) {
    return null;
  }

  const rest = normalized.slice(startMatch.index + startMatch[0].length);
  const endIndexes = endHeadings
    .map((heading) => {
      const match = rest.match(new RegExp(`\\n${escapeRegExp(heading)}:\\s*`, "i"));
      return match?.index ?? -1;
    })
    .filter((index) => index >= 0);
  const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : rest.length;
  return rest.slice(0, endIndex).trim() || null;
}

function formatStoredPrice(value: number): string {
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function deriveNearestLevelLabelFromCard(
  card: LiveWatchlistCardContent | undefined,
  side: "support" | "resistance",
  price: number | null,
): string | null {
  if (!card) {
    return null;
  }
  const sectionHeading = side === "support" ? "Support" : "Resistance";
  const section = extractSection(card.body, sectionHeading, [
    side === "support" ? "Resistance" : "Support",
    "More support and resistance",
  ]);
  const lines = (section ?? card.body)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(new RegExp(`^Nearest\\s+${side}:\\s*`, "i"), ""),
    )
    .filter((line) => /^\d+(?:\.\d+)?\b/.test(line))
    .filter(Boolean);
  if (lines.length === 0) {
    return null;
  }
  if (typeof price === "number" && Number.isFinite(price)) {
    const formatted = formatStoredPrice(price);
    const matched = lines.find((line) => line.startsWith(formatted));
    if (matched) {
      return matched;
    }
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeHeadline(value: string): string {
  return value.length > 140 ? `${value.slice(0, 137).trimEnd()}...` : value;
}

function deriveTraderReadHeadline(
  card: LiveWatchlistCardContent | undefined,
  existingHeadline: string | null,
): string | null {
  if (!card) {
    return existingHeadline;
  }

  if (typeof card.metadata?.headline === "string" && card.metadata.headline.trim()) {
    return normalizeHeadline(card.metadata.headline.trim());
  }

  const genericTitle = card.title.trim().toLowerCase() === "live trader read";
  if (!genericTitle && card.title.trim()) {
    return normalizeHeadline(card.title.trim());
  }

  const tradeMap = extractSection(card.body, "Trade map", [
    "Closest levels to watch",
    "More support and resistance",
  ]);
  const firstLine = (tradeMap ?? card.body)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? normalizeHeadline(firstLine) : existingHeadline;
}

function deriveStateFields(state: LiveWatchlistSymbolState): LiveWatchlistSymbolState {
  const companyInfo = state.cards.companyInfo;
  const nearest = state.cards.nearestSupportResistance;
  const liveTraderRead = state.cards.liveTraderRead;
  const nearestMetadata = nearest?.metadata ?? {};
  const nearestSupport =
    state.nearestSupport ??
    (typeof nearestMetadata.nearestSupport === "number"
      ? nearestMetadata.nearestSupport
      : null);
  const nearestResistance =
    state.nearestResistance ??
    (typeof nearestMetadata.nearestResistance === "number"
      ? nearestMetadata.nearestResistance
      : null);
  const cardTimes = Object.values(state.cards)
    .map((card) => card?.updatedAt)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const hasCards = cardTimes.length > 0;
  return {
    ...state,
    firstPostedAt:
      hasCards
        ? state.firstPostedAt ?? Math.min(...cardTimes)
        : null,
    companyName:
      typeof companyInfo?.metadata?.company === "string"
        ? companyInfo.metadata.company
        : companyInfo?.title ?? state.companyName ?? null,
    latestPrice:
      state.latestPrice ??
      liveTraderRead?.priceWhenPosted ??
      nearest?.priceWhenPosted ??
      companyInfo?.priceWhenPosted ??
      null,
    nearestSupport,
    nearestResistance,
    nearestSupportLabel:
      state.nearestSupportLabel ??
      (typeof nearestMetadata.nearestSupportLabel === "string"
        ? nearestMetadata.nearestSupportLabel
        : deriveNearestLevelLabelFromCard(nearest, "support", nearestSupport)),
    nearestResistanceLabel:
      state.nearestResistanceLabel ??
      (typeof nearestMetadata.nearestResistanceLabel === "string"
        ? nearestMetadata.nearestResistanceLabel
        : deriveNearestLevelLabelFromCard(nearest, "resistance", nearestResistance)),
    levelMap: state.levelMap ?? null,
    latestTraderReadHeadline:
      deriveTraderReadHeadline(liveTraderRead, state.latestTraderReadHeadline ?? null),
  };
}

function applyPatch(
  existing: LiveWatchlistSymbolState | null,
  patch: LiveWatchlistCardPatch,
): LiveWatchlistSymbolState {
  const symbol = normalizeSymbol(patch.symbol);
  const nextStatus = patch.status ?? existing?.status ?? "live";
  const isReactivation = existing?.status === "deactivated" && nextStatus !== "deactivated";
  const baseExisting = isReactivation ? null : existing;
  const nextCards = { ...(baseExisting?.cards ?? {}) };
  const patchesPriceCard = Boolean(
    patch.cards.liveTraderRead || patch.cards.nearestSupportResistance || patch.cards.companyInfo,
  );
  const patchesNearestCard = Boolean(patch.cards.nearestSupportResistance);
  const patchesLevelMap = Object.prototype.hasOwnProperty.call(patch, "levelMap");
  const patchesFirstPostedAt = Object.prototype.hasOwnProperty.call(patch, "firstPostedAt");
  for (const [kind, card] of Object.entries(patch.cards)) {
    if (card === null) {
      delete nextCards[kind as keyof typeof nextCards];
    } else if (isCard(card)) {
      nextCards[kind as keyof typeof nextCards] = card;
    }
  }

  return deriveStateFields({
    symbol,
    status: nextStatus,
    updatedAt: Math.max(patch.updatedAt, baseExisting?.updatedAt ?? 0),
    firstPostedAt: patchesFirstPostedAt
      ? normalizeLiveWatchlistTimestamp(patch.firstPostedAt)
      : baseExisting?.firstPostedAt ?? null,
    companyName: baseExisting?.companyName ?? null,
    latestPrice: patchesPriceCard ? null : baseExisting?.latestPrice ?? null,
    nearestSupport: patchesNearestCard ? null : baseExisting?.nearestSupport ?? null,
    nearestResistance: patchesNearestCard ? null : baseExisting?.nearestResistance ?? null,
    nearestSupportLabel: patchesNearestCard ? null : baseExisting?.nearestSupportLabel ?? null,
    nearestResistanceLabel: patchesNearestCard ? null : baseExisting?.nearestResistanceLabel ?? null,
    levelMap: patchesLevelMap ? normalizeLevelMap(patch.levelMap) : baseExisting?.levelMap ?? null,
    latestTraderReadHeadline: baseExisting?.latestTraderReadHeadline ?? null,
    cards: nextCards,
  });
}

function normalizeLevelMap(value: LiveWatchlistLevelMap | null | undefined): LiveWatchlistLevelMap | null {
  return value ?? null;
}

export class LiveWatchlistStore {
  async upsertHealth(patch: LiveWatchlistHealthPatch): Promise<{
    marketDataStatus: LiveWatchlistMarketDataStatus;
    marketDataUpdatedAt: number | null;
  }> {
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      await getNeonSql()`
        INSERT INTO live_watchlist_health (key, market_data_status, market_data_updated_at)
        VALUES ('global', ${patch.marketDataStatus}, ${patch.marketDataUpdatedAt})
        ON CONFLICT (key) DO UPDATE SET
          market_data_status = EXCLUDED.market_data_status,
          market_data_updated_at = EXCLUDED.market_data_updated_at
      `;
      return {
        marketDataStatus: patch.marketDataStatus,
        marketDataUpdatedAt: patch.marketDataUpdatedAt,
      };
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        INSERT INTO live_watchlist_health (key, market_data_status, market_data_updated_at)
        VALUES ('global', ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          market_data_status = excluded.market_data_status,
          market_data_updated_at = excluded.market_data_updated_at
      `,
    ).run(patch.marketDataStatus, patch.marketDataUpdatedAt);
    return {
      marketDataStatus: patch.marketDataStatus,
      marketDataUpdatedAt: patch.marketDataUpdatedAt,
    };
  }

  async getHealth(): Promise<{
    marketDataStatus: LiveWatchlistMarketDataStatus;
    marketDataUpdatedAt: number | null;
  }> {
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT market_data_status, market_data_updated_at
        FROM live_watchlist_health
        WHERE key = 'global'
        LIMIT 1
      `) as Array<{ market_data_status?: unknown; market_data_updated_at?: unknown }>;
      return normalizeHealthRow(rows[0]);
    }

    const db = await getSqliteDatabase();
    const row = db
      .prepare("SELECT market_data_status, market_data_updated_at FROM live_watchlist_health WHERE key = 'global'")
      .get() as
      | { market_data_status?: unknown; market_data_updated_at?: unknown }
      | undefined;
    return normalizeHealthRow(row);
  }

  async upsertPatch(patch: LiveWatchlistCardPatch): Promise<LiveWatchlistSymbolState> {
    const symbol = normalizeSymbol(patch.symbol);
    const existing = await this.getSymbol(symbol);
    const next = applyPatch(existing, { ...patch, symbol });

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      await getNeonSql()`
        INSERT INTO live_watchlist_symbols (symbol, status, updated_at, state_json)
        VALUES (${symbol}, ${next.status}, ${next.updatedAt}, ${JSON.stringify(next)})
        ON CONFLICT (symbol) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at,
          state_json = EXCLUDED.state_json
      `;
      if (next.status === "deactivated") {
        await this.createArchiveIfEligible(next);
      }
      return next;
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        INSERT INTO live_watchlist_symbols (symbol, status, updated_at, state_json)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          status = excluded.status,
          updated_at = excluded.updated_at,
          state_json = excluded.state_json
      `,
    ).run(symbol, next.status, next.updatedAt, JSON.stringify(next));
    if (next.status === "deactivated") {
      await this.createArchiveIfEligible(next);
    }
    return next;
  }

  async upsertTickerData(patch: LiveWatchlistTickerDataPatch): Promise<LiveWatchlistSymbolState> {
    const symbol = normalizeSymbol(patch.symbol);
    const existing = await this.getSymbol(symbol);
    const next = deriveStateFields({
      symbol,
      status: patch.status ?? existing?.status ?? "live",
      updatedAt: existing?.updatedAt ?? patch.updatedAt,
      firstPostedAt: existing?.firstPostedAt ?? null,
      companyName: existing?.companyName ?? null,
      latestPrice: patch.latestPrice,
      nearestSupport: patch.nearestSupport,
      nearestResistance: patch.nearestResistance,
      nearestSupportLabel: patch.nearestSupportLabel ?? null,
      nearestResistanceLabel: patch.nearestResistanceLabel ?? null,
      levelMap: normalizeLevelMap(patch.levelMap),
      latestTraderReadHeadline: existing?.latestTraderReadHeadline ?? null,
      cards: existing?.cards ?? {},
    });

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      await getNeonSql()`
        INSERT INTO live_watchlist_symbols (symbol, status, updated_at, state_json)
        VALUES (${symbol}, ${next.status}, ${next.updatedAt}, ${JSON.stringify(next)})
        ON CONFLICT (symbol) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at,
          state_json = EXCLUDED.state_json
      `;
      return next;
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        INSERT INTO live_watchlist_symbols (symbol, status, updated_at, state_json)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          status = excluded.status,
          updated_at = excluded.updated_at,
          state_json = excluded.state_json
      `,
    ).run(symbol, next.status, next.updatedAt, JSON.stringify(next));
    return next;
  }

  async getSymbol(symbolInput: string): Promise<LiveWatchlistSymbolState | null> {
    const symbol = normalizeSymbol(symbolInput);
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT state_json FROM live_watchlist_symbols WHERE symbol = ${symbol} LIMIT 1
      `) as Array<{ state_json?: unknown }>;
      const raw = rows[0]?.state_json;
      return typeof raw === "string" ? parseState(raw) : null;
    }

    const db = await getSqliteDatabase();
    const row = db.prepare("SELECT state_json FROM live_watchlist_symbols WHERE symbol = ?").get(symbol) as
      | { state_json?: unknown }
      | undefined;
    return typeof row?.state_json === "string" ? parseState(row.state_json) : null;
  }

  async listSymbols(): Promise<LiveWatchlistStatePayload> {
    const health = await this.getHealth();
    let symbols: LiveWatchlistSymbolState[];
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT state_json FROM live_watchlist_symbols ORDER BY updated_at DESC
      `) as Array<{ state_json?: unknown }>;
      symbols = rows
        .map((row) => (typeof row.state_json === "string" ? parseState(row.state_json) : null))
        .filter(isUserVisibleSymbol);
    } else {
      const db = await getSqliteDatabase();
      const rows = db.prepare("SELECT state_json FROM live_watchlist_symbols ORDER BY updated_at DESC").all() as Array<{
        state_json?: unknown;
      }>;
      symbols = rows
        .map((row) => (typeof row.state_json === "string" ? parseState(row.state_json) : null))
        .filter(isUserVisibleSymbol);
    }
    symbols.sort(sortSymbolsByActivation);

    return {
      generatedAt: Date.now(),
      marketDataStatus: health.marketDataStatus,
      marketDataUpdatedAt: health.marketDataUpdatedAt,
      symbols,
    };
  }

  async listArchives(): Promise<LiveWatchlistArchiveSnapshot[]> {
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json
        FROM live_watchlist_archives
        ORDER BY archived_at DESC
      `) as Array<{
        archive_id?: unknown;
        symbol?: unknown;
        archived_at?: unknown;
        first_posted_at?: unknown;
        last_active_updated_at?: unknown;
        state_json?: unknown;
      }>;
      return rows
        .map((row) => parseArchiveRow(row))
        .filter((archive): archive is LiveWatchlistArchiveSnapshot => Boolean(archive));
    }

    const db = await getSqliteDatabase();
    const rows = db
      .prepare(
        `
          SELECT archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json
          FROM live_watchlist_archives
          ORDER BY archived_at DESC
        `,
      )
      .all() as Array<{
      archive_id?: unknown;
      symbol?: unknown;
      archived_at?: unknown;
      first_posted_at?: unknown;
      last_active_updated_at?: unknown;
      state_json?: unknown;
    }>;
    return rows
      .map((row) => parseArchiveRow(row))
      .filter((archive): archive is LiveWatchlistArchiveSnapshot => Boolean(archive));
  }

  async getArchive(archiveId: string): Promise<LiveWatchlistArchiveSnapshot | null> {
    const normalizedArchiveId = archiveId.trim().toUpperCase();
    if (!normalizedArchiveId) {
      return null;
    }
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json
        FROM live_watchlist_archives
        WHERE archive_id = ${normalizedArchiveId}
        LIMIT 1
      `) as Array<{
        archive_id?: unknown;
        symbol?: unknown;
        archived_at?: unknown;
        first_posted_at?: unknown;
        last_active_updated_at?: unknown;
        state_json?: unknown;
      }>;
      return rows[0] ? parseArchiveRow(rows[0]) : null;
    }

    const db = await getSqliteDatabase();
    const row = db
      .prepare(
        `
          SELECT archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json
          FROM live_watchlist_archives
          WHERE archive_id = ?
          LIMIT 1
        `,
      )
      .get(normalizedArchiveId) as
      | {
          archive_id?: unknown;
          symbol?: unknown;
          archived_at?: unknown;
          first_posted_at?: unknown;
          last_active_updated_at?: unknown;
          state_json?: unknown;
        }
      | undefined;
    return row ? parseArchiveRow(row) : null;
  }

  async getLatestArchiveForSymbol(symbolInput: string): Promise<LiveWatchlistArchiveSnapshot | null> {
    const symbol = normalizeSymbol(symbolInput);
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json
        FROM live_watchlist_archives
        WHERE symbol = ${symbol}
        ORDER BY archived_at DESC
        LIMIT 1
      `) as Array<{
        archive_id?: unknown;
        symbol?: unknown;
        archived_at?: unknown;
        first_posted_at?: unknown;
        last_active_updated_at?: unknown;
        state_json?: unknown;
      }>;
      return rows[0] ? parseArchiveRow(rows[0]) : null;
    }

    const db = await getSqliteDatabase();
    const row = db
      .prepare(
        `
          SELECT archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json
          FROM live_watchlist_archives
          WHERE symbol = ?
          ORDER BY archived_at DESC
          LIMIT 1
        `,
      )
      .get(symbol) as
      | {
          archive_id?: unknown;
          symbol?: unknown;
          archived_at?: unknown;
          first_posted_at?: unknown;
          last_active_updated_at?: unknown;
          state_json?: unknown;
        }
      | undefined;
    return row ? parseArchiveRow(row) : null;
  }

  async clearArchives(): Promise<number> {
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`SELECT COUNT(*)::int AS count FROM live_watchlist_archives`) as Array<{
        count?: unknown;
      }>;
      const count = typeof rows[0]?.count === "number" ? rows[0].count : 0;
      await getNeonSql()`DELETE FROM live_watchlist_archives`;
      return count;
    }

    const db = await getSqliteDatabase();
    const result = db.prepare("DELETE FROM live_watchlist_archives").run();
    return result.changes;
  }

  private async createArchiveIfEligible(state: LiveWatchlistSymbolState): Promise<void> {
    if (!hasCoreArchiveCards(state)) {
      return;
    }
    const archiveId = archiveIdFor(state.symbol, state.updatedAt);
    const stateJson = JSON.stringify(state);

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      await getNeonSql()`
        INSERT INTO live_watchlist_archives (
          archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json
        )
        VALUES (
          ${archiveId},
          ${state.symbol},
          ${state.updatedAt},
          ${state.firstPostedAt},
          ${state.updatedAt},
          ${stateJson}
        )
        ON CONFLICT (archive_id) DO NOTHING
      `;
      return;
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        INSERT OR IGNORE INTO live_watchlist_archives (
          archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    ).run(archiveId, state.symbol, state.updatedAt, state.firstPostedAt, state.updatedAt, stateJson);
  }
}

function isUserVisibleSymbol(
  state: LiveWatchlistSymbolState | null,
): state is LiveWatchlistSymbolState {
  return Boolean(state && state.status !== "deactivated");
}

function normalizeHealthRow(row: { market_data_status?: unknown; market_data_updated_at?: unknown } | undefined): {
  marketDataStatus: LiveWatchlistMarketDataStatus;
  marketDataUpdatedAt: number | null;
} {
  const status = row?.market_data_status;
  const timestamp = row?.market_data_updated_at;
  return {
    marketDataStatus:
      status === "live" || status === "stale" || status === "offline" || status === "starting"
        ? status
        : "offline",
    marketDataUpdatedAt:
      typeof timestamp === "number" && Number.isFinite(timestamp)
        ? timestamp
        : typeof timestamp === "bigint"
          ? Number(timestamp)
          : null,
  };
}

export function resetLiveWatchlistStoreForTests(): void {
  sharedSqliteDatabase?.close();
  sharedSqliteDatabase = null;
  sharedNeonSql = null;
  sharedNeonSchemaPromise = null;
}
