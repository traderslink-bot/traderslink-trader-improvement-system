import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import type Database from "better-sqlite3";

type SqliteDatabase = Database.Database;
type NeonSql = ReturnType<typeof neon>;

export interface NewsArticleInput {
  sourceEventId?: string | null;
  ticker: string;
  headline: string;
  summary?: string | null;
  articleText?: string | null;
  sourceUrl?: string | null;
  eventType?: string | null;
  routeTag?: string | null;
  publishedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  positives?: string[];
  negatives?: string[];
  riskFlags?: string[];
  diagnostics?: Record<string, unknown> | null;
  rawPayload?: unknown;
}

export interface NewsArticle {
  id: string;
  ticker: string;
  slug: string;
  headline: string;
  summary: string | null;
  articleText: string | null;
  sourceUrl: string | null;
  eventType: string | null;
  routeTag: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
  positives: string[];
  negatives: string[];
  riskFlags: string[];
  diagnostics: Record<string, unknown>;
  rawPayload: unknown;
}

let sharedSqliteDatabase: SqliteDatabase | null = null;
let sharedNeonSql: NeonSql | null = null;
let sharedNeonSchemaPromise: Promise<void> | null = null;

function configuredDatabaseUrl(): string | undefined {
  return (
    process.env.NEWS_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.ACADEMY_DATABASE_URL ||
    process.env.DATABASE_URL
  );
}

function shouldUseSqliteFallback(): boolean {
  if (process.env.TRADERSLINK_NEWS_DB_PATH) {
    return true;
  }

  if (configuredDatabaseUrl()) {
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "News article storage requires NEWS_DATABASE_URL, ACADEMY_DATABASE_URL, or DATABASE_URL in production.",
    );
  }

  return true;
}

function databasePath(): string {
  const configured =
    process.env.TRADERSLINK_NEWS_DB_PATH ||
    process.env.TRADER_INTELLIGENCE_DB_PATH;

  if (configured) {
    return isAbsolute(configured)
      ? configured
      : join(process.cwd(), "data", configured);
  }

  return join(process.cwd(), "data", "trader-intelligence.sqlite");
}

async function getSqliteDatabase(): Promise<SqliteDatabase> {
  if (sharedSqliteDatabase) {
    return sharedSqliteDatabase;
  }

  const { default: Database } = await import("better-sqlite3");
  const filePath = databasePath();
  mkdirSync(dirname(filePath), { recursive: true });
  sharedSqliteDatabase = new Database(filePath);
  runNewsSqliteMigrations(sharedSqliteDatabase);
  return sharedSqliteDatabase;
}

function getNeonSql(): NeonSql {
  const databaseUrl = configuredDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "News article storage requires NEWS_DATABASE_URL, ACADEMY_DATABASE_URL, or DATABASE_URL in production.",
    );
  }

  if (!sharedNeonSql) {
    sharedNeonSql = neon(databaseUrl);
  }

  return sharedNeonSql;
}

async function ensureNeonSchema(): Promise<void> {
  if (sharedNeonSchemaPromise) {
    return sharedNeonSchemaPromise;
  }

  const sql = getNeonSql();
  sharedNeonSchemaPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS news_articles (
        id TEXT PRIMARY KEY,
        source_event_id TEXT UNIQUE,
        canonical_source_key TEXT UNIQUE,
        ticker TEXT NOT NULL,
        slug TEXT NOT NULL,
        headline TEXT NOT NULL,
        summary TEXT,
        article_text TEXT,
        source_url TEXT,
        event_type TEXT,
        route_tag TEXT,
        published_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        positives_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        negatives_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        risk_flags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        diagnostics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        raw_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        UNIQUE(ticker, slug)
      )
    `;

    await sql`
      ALTER TABLE news_articles
      ADD COLUMN IF NOT EXISTS canonical_source_key TEXT
    `;

    await sql`
      WITH ranked_sources AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY ticker, LOWER(TRIM(source_url))
            ORDER BY
              CASE WHEN route_tag IN ('default', 'spike') THEN 0 ELSE 1 END,
              CASE
                WHEN COALESCE(metadata_json ->> 'supportResistanceLevels', '') <> '' THEN 0
                ELSE 1
              END,
              created_at ASC
          ) AS source_rank
        FROM news_articles
        WHERE source_url IS NOT NULL AND TRIM(source_url) <> ''
      )
      UPDATE news_articles AS article
      SET canonical_source_key = article.ticker || '|' || LOWER(TRIM(article.source_url))
      FROM ranked_sources
      WHERE article.id = ranked_sources.id
        AND ranked_sources.source_rank = 1
        AND article.canonical_source_key IS NULL
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS news_articles_canonical_source
      ON news_articles(canonical_source_key)
      WHERE canonical_source_key IS NOT NULL
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS news_articles_ticker_published
      ON news_articles(ticker, published_at DESC)
    `;
  })();

  return sharedNeonSchemaPromise;
}

export async function resetNewsDatabaseForTests(): Promise<void> {
  sharedSqliteDatabase?.close();
  sharedSqliteDatabase = null;
  sharedNeonSql = null;
  sharedNeonSchemaPromise = null;
}

export function runNewsSqliteMigrations(db: SqliteDatabase): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id TEXT PRIMARY KEY,
      source_event_id TEXT UNIQUE,
      canonical_source_key TEXT UNIQUE,
      ticker TEXT NOT NULL,
      slug TEXT NOT NULL,
      headline TEXT NOT NULL,
      summary TEXT,
      article_text TEXT,
      source_url TEXT,
      event_type TEXT,
      route_tag TEXT,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      positives_json TEXT NOT NULL,
      negatives_json TEXT NOT NULL,
      risk_flags_json TEXT NOT NULL,
      diagnostics_json TEXT NOT NULL,
      raw_payload_json TEXT NOT NULL,
      UNIQUE(ticker, slug)
    );

    CREATE INDEX IF NOT EXISTS news_articles_ticker_published
      ON news_articles(ticker, published_at DESC);
  `);

  const columns = db
    .prepare("PRAGMA table_info(news_articles)")
    .all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "canonical_source_key")) {
    db.exec("ALTER TABLE news_articles ADD COLUMN canonical_source_key TEXT");
  }

  db.exec(`
    WITH ranked_sources AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY ticker, LOWER(TRIM(source_url))
          ORDER BY
            CASE WHEN route_tag IN ('default', 'spike') THEN 0 ELSE 1 END,
            CASE
              WHEN COALESCE(json_extract(metadata_json, '$.supportResistanceLevels'), '') <> '' THEN 0
              ELSE 1
            END,
            created_at ASC
        ) AS source_rank
      FROM news_articles
      WHERE source_url IS NOT NULL AND TRIM(source_url) <> ''
    )
    UPDATE news_articles
    SET canonical_source_key = ticker || '|' || LOWER(TRIM(source_url))
    WHERE id IN (
      SELECT id FROM ranked_sources WHERE source_rank = 1
    )
      AND canonical_source_key IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS news_articles_canonical_source
      ON news_articles(canonical_source_key)
      WHERE canonical_source_key IS NOT NULL;
  `);
}

export const runNewsMigrations = runNewsSqliteMigrations;

function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeTicker(value: unknown): string {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function buildCanonicalSourceKey(ticker: string, sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;

  try {
    const parsed = new URL(sourceUrl);
    parsed.hash = "";
    return `${ticker}|${parsed.toString().toLowerCase()}`;
  } catch {
    return `${ticker}|${sourceUrl.toLowerCase()}`;
  }
}

function routePriority(routeTag: unknown): number {
  const normalized = cleanText(routeTag).toLowerCase();
  if (normalized === "default" || normalized === "spike") return 2;
  if (normalized.startsWith("market_cap_")) return 1;
  return 0;
}

function mergeCanonicalInput(
  normalized: ReturnType<typeof normalizeInput>,
  existing: Record<string, unknown> | null,
) {
  if (!existing || routePriority(normalized.routeTag) >= routePriority(existing.route_tag)) {
    const existingMetadata = parseJsonObject(existing?.metadata_json);
    const incomingMetadata = parseJsonObject(normalized.metadataJson);
    if (
      existingMetadata.supportResistanceLevels &&
      !incomingMetadata.supportResistanceLevels
    ) {
      normalized.metadataJson = JSON.stringify({
        ...incomingMetadata,
        supportResistanceLevels: existingMetadata.supportResistanceLevels,
      });
    }
    return normalized;
  }

  return {
    ...normalized,
    headline: String(existing.headline),
    summary: typeof existing.summary === "string" ? existing.summary : null,
    articleText:
      typeof existing.article_text === "string" ? existing.article_text : null,
    eventType:
      typeof existing.event_type === "string" ? existing.event_type : null,
    routeTag: typeof existing.route_tag === "string" ? existing.route_tag : null,
    metadataJson: JSON.stringify(parseJsonObject(existing.metadata_json)),
    positivesJson: JSON.stringify(parseJsonArray(existing.positives_json)),
    negativesJson: JSON.stringify(parseJsonArray(existing.negatives_json)),
    riskFlagsJson: JSON.stringify(parseJsonArray(existing.risk_flags_json)),
    diagnosticsJson: JSON.stringify(parseJsonObject(existing.diagnostics_json)),
    rawPayloadJson: JSON.stringify(parseJsonObject(existing.raw_payload_json)),
  };
}

export function buildNewsArticleSlug(headline: string, publishedAt: string): string {
  const base = cleanText(headline)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 88)
    .replace(/-+$/g, "");
  const datePart = cleanText(publishedAt).slice(0, 10);

  return [base || "press-release", datePart].filter(Boolean).join("-");
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(cleanText).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function isSensitivePayloadKey(key: string): boolean {
  return (
    /^(authorization|cookie|set-cookie|x-news-publish-token)$/i.test(key) ||
    /(api[_-]?key|access[_-]?token|auth[_-]?token|bearer|password|secret|token|webhook)/i.test(
      key,
    )
  );
}

function sanitizeRawPayload(value: unknown, depth = 0): unknown {
  if (depth > 8) return null;
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRawPayload(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSensitivePayloadKey(key)) continue;
    sanitized[key] = sanitizeRawPayload(nestedValue, depth + 1);
  }

  return sanitized;
}

function stableIdForInput(input: NewsArticleInput): string {
  if (input.sourceEventId) {
    return createHash("sha256")
      .update(String(input.sourceEventId))
      .digest("hex")
      .slice(0, 24);
  }

  return randomBytes(12).toString("hex");
}

function toIsoString(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : cleanText(value);
}

function rowToArticle(row: Record<string, unknown>): NewsArticle {
  return {
    id: String(row.id),
    ticker: String(row.ticker),
    slug: String(row.slug),
    headline: String(row.headline),
    summary: typeof row.summary === "string" ? row.summary : null,
    articleText: typeof row.article_text === "string" ? row.article_text : null,
    sourceUrl: typeof row.source_url === "string" ? row.source_url : null,
    eventType: typeof row.event_type === "string" ? row.event_type : null,
    routeTag: typeof row.route_tag === "string" ? row.route_tag : null,
    publishedAt: toIsoString(row.published_at),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    metadata: parseJsonObject(row.metadata_json),
    positives: parseJsonArray(row.positives_json),
    negatives: parseJsonArray(row.negatives_json),
    riskFlags: parseJsonArray(row.risk_flags_json),
    diagnostics: parseJsonObject(row.diagnostics_json),
    rawPayload: parseJsonObject(row.raw_payload_json),
  };
}

function normalizeInput(input: NewsArticleInput) {
  const ticker = normalizeTicker(input.ticker);
  const headline = cleanText(input.headline);

  if (!ticker) {
    throw new Error("ticker is required");
  }

  if (!headline) {
    throw new Error("headline is required");
  }

  const now = new Date().toISOString();
  const publishedAt = cleanText(input.publishedAt) || now;

  const sourceUrl = cleanText(input.sourceUrl) || null;

  return {
    id: stableIdForInput(input),
    ticker,
    headline,
    publishedAt,
    requestedSlug: buildNewsArticleSlug(headline, publishedAt),
    sourceEventId: cleanText(input.sourceEventId) || null,
    summary: cleanText(input.summary) || null,
    articleText:
      typeof input.articleText === "string" ? input.articleText.trim() || null : null,
    sourceUrl,
    canonicalSourceKey: buildCanonicalSourceKey(ticker, sourceUrl),
    eventType: cleanText(input.eventType) || null,
    routeTag: cleanText(input.routeTag) || null,
    metadataJson: JSON.stringify(input.metadata ?? {}),
    positivesJson: JSON.stringify(input.positives ?? []),
    negativesJson: JSON.stringify(input.negatives ?? []),
    riskFlagsJson: JSON.stringify(input.riskFlags ?? []),
    diagnosticsJson: JSON.stringify(input.diagnostics ?? {}),
    rawPayloadJson: JSON.stringify(sanitizeRawPayload(input.rawPayload ?? {})),
  };
}

function buildSqliteUniqueSlug(
  db: SqliteDatabase,
  ticker: string,
  requestedSlug: string,
): string {
  const exists = db
    .prepare("SELECT id FROM news_articles WHERE ticker = ? AND slug = ?")
    .get(ticker, requestedSlug);

  if (!exists) return requestedSlug;

  const suffix = randomBytes(3).toString("hex");
  return `${requestedSlug.slice(0, 96).replace(/-+$/g, "")}-${suffix}`;
}

async function buildNeonUniqueSlug(
  sql: NeonSql,
  ticker: string,
  requestedSlug: string,
): Promise<string> {
  const rows = (await sql`
    SELECT id FROM news_articles
    WHERE ticker = ${ticker}
      AND slug = ${requestedSlug}
    LIMIT 1
  `) as Array<Record<string, unknown>>;

  if (!rows.length) return requestedSlug;

  const suffix = randomBytes(3).toString("hex");
  return `${requestedSlug.slice(0, 96).replace(/-+$/g, "")}-${suffix}`;
}

async function upsertNewsArticleSqlite(
  input: NewsArticleInput,
): Promise<NewsArticle> {
  const db = await getSqliteDatabase();
  let normalized = normalizeInput(input);
  const now = new Date().toISOString();
  const existingBySource = normalized.canonicalSourceKey
    ? db
        .prepare("SELECT * FROM news_articles WHERE canonical_source_key = ?")
        .get(normalized.canonicalSourceKey)
    : null;
  const existing =
    existingBySource ??
    (normalized.sourceEventId
      ? db
          .prepare("SELECT * FROM news_articles WHERE source_event_id = ?")
          .get(normalized.sourceEventId)
      : null);
  const existingRow = existing as Record<string, unknown> | null;
  normalized = mergeCanonicalInput(normalized, existingRow);
  const slug = existingRow
    ? String(existingRow.slug)
    : buildSqliteUniqueSlug(db, normalized.ticker, normalized.requestedSlug);
  const id = existingRow ? String(existingRow.id) : normalized.id;
  const createdAt = existingRow ? String(existingRow.created_at) : now;

  db.prepare(
    `
      INSERT INTO news_articles (
        id,
        source_event_id,
        canonical_source_key,
        ticker,
        slug,
        headline,
        summary,
        article_text,
        source_url,
        event_type,
        route_tag,
        published_at,
        created_at,
        updated_at,
        metadata_json,
        positives_json,
        negatives_json,
        risk_flags_json,
        diagnostics_json,
        raw_payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        headline = excluded.headline,
        summary = excluded.summary,
        article_text = excluded.article_text,
        source_url = excluded.source_url,
        event_type = excluded.event_type,
        route_tag = excluded.route_tag,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at,
        metadata_json = excluded.metadata_json,
        positives_json = excluded.positives_json,
        negatives_json = excluded.negatives_json,
        risk_flags_json = excluded.risk_flags_json,
        diagnostics_json = excluded.diagnostics_json,
        raw_payload_json = excluded.raw_payload_json
    `,
  ).run(
    id,
    normalized.sourceEventId,
    normalized.canonicalSourceKey,
    normalized.ticker,
    slug,
    normalized.headline,
    normalized.summary,
    normalized.articleText,
    normalized.sourceUrl,
    normalized.eventType,
    normalized.routeTag,
    normalized.publishedAt,
    createdAt,
    now,
    normalized.metadataJson,
    normalized.positivesJson,
    normalized.negativesJson,
    normalized.riskFlagsJson,
    normalized.diagnosticsJson,
    normalized.rawPayloadJson,
  );

  const article = await getNewsArticleSqlite(normalized.ticker, slug);
  if (!article) {
    throw new Error("news article was not saved");
  }

  return article;
}

async function upsertNewsArticleNeon(
  input: NewsArticleInput,
): Promise<NewsArticle> {
  await ensureNeonSchema();
  const sql = getNeonSql();
  let normalized = normalizeInput(input);
  const now = new Date().toISOString();
  const existingRows = normalized.canonicalSourceKey
    ? ((await sql`
        SELECT * FROM news_articles
        WHERE canonical_source_key = ${normalized.canonicalSourceKey}
        LIMIT 1
      `) as Array<Record<string, unknown>>)
    : normalized.sourceEventId
      ? ((await sql`
          SELECT * FROM news_articles
          WHERE source_event_id = ${normalized.sourceEventId}
          LIMIT 1
        `) as Array<Record<string, unknown>>)
      : [];
  const existing = existingRows[0];
  normalized = mergeCanonicalInput(normalized, existing ?? null);
  const slug = existing
    ? String(existing.slug)
    : await buildNeonUniqueSlug(sql, normalized.ticker, normalized.requestedSlug);
  const id = existing ? String(existing.id) : normalized.id;
  const createdAt = existing ? toIsoString(existing.created_at) : now;

  await sql`
    INSERT INTO news_articles (
      id,
      source_event_id,
      canonical_source_key,
      ticker,
      slug,
      headline,
      summary,
      article_text,
      source_url,
      event_type,
      route_tag,
      published_at,
      created_at,
      updated_at,
      metadata_json,
      positives_json,
      negatives_json,
      risk_flags_json,
      diagnostics_json,
      raw_payload_json
    )
    VALUES (
      ${id},
      ${normalized.sourceEventId},
      ${normalized.canonicalSourceKey},
      ${normalized.ticker},
      ${slug},
      ${normalized.headline},
      ${normalized.summary},
      ${normalized.articleText},
      ${normalized.sourceUrl},
      ${normalized.eventType},
      ${normalized.routeTag},
      ${normalized.publishedAt},
      ${createdAt},
      ${now},
      CAST(${normalized.metadataJson} AS jsonb),
      CAST(${normalized.positivesJson} AS jsonb),
      CAST(${normalized.negativesJson} AS jsonb),
      CAST(${normalized.riskFlagsJson} AS jsonb),
      CAST(${normalized.diagnosticsJson} AS jsonb),
      CAST(${normalized.rawPayloadJson} AS jsonb)
    )
    ON CONFLICT(id) DO UPDATE SET
      headline = excluded.headline,
      summary = excluded.summary,
      article_text = excluded.article_text,
      source_url = excluded.source_url,
      event_type = excluded.event_type,
      route_tag = excluded.route_tag,
      published_at = excluded.published_at,
      updated_at = excluded.updated_at,
      metadata_json = excluded.metadata_json,
      positives_json = excluded.positives_json,
      negatives_json = excluded.negatives_json,
      risk_flags_json = excluded.risk_flags_json,
      diagnostics_json = excluded.diagnostics_json,
      raw_payload_json = excluded.raw_payload_json
  `;

  const article = await getNewsArticleNeon(normalized.ticker, slug);
  if (!article) {
    throw new Error("news article was not saved");
  }

  return article;
}

export async function upsertNewsArticle(
  input: NewsArticleInput,
): Promise<NewsArticle> {
  return shouldUseSqliteFallback()
    ? upsertNewsArticleSqlite(input)
    : upsertNewsArticleNeon(input);
}

async function getNewsArticleSqlite(
  ticker: string,
  slug: string,
): Promise<NewsArticle | null> {
  const db = await getSqliteDatabase();
  const row = db
    .prepare("SELECT * FROM news_articles WHERE ticker = ? AND slug = ?")
    .get(normalizeTicker(ticker), cleanText(slug));

  return row ? rowToArticle(row as Record<string, unknown>) : null;
}

async function getNewsArticleNeon(
  ticker: string,
  slug: string,
): Promise<NewsArticle | null> {
  await ensureNeonSchema();
  const sql = getNeonSql();
  const rows = (await sql`
    SELECT * FROM news_articles
    WHERE ticker = ${normalizeTicker(ticker)}
      AND slug = ${cleanText(slug)}
    LIMIT 1
  `) as Array<Record<string, unknown>>;

  return rows[0] ? rowToArticle(rows[0]) : null;
}

export async function getNewsArticle(
  ticker: string,
  slug: string,
): Promise<NewsArticle | null> {
  return shouldUseSqliteFallback()
    ? getNewsArticleSqlite(ticker, slug)
    : getNewsArticleNeon(ticker, slug);
}

async function listNewsArticlesByTickerSqlite(
  ticker: string,
  limit = 25,
): Promise<NewsArticle[]> {
  const db = await getSqliteDatabase();
  const rows = db
    .prepare(
      `
        SELECT * FROM news_articles
        WHERE ticker = ?
        ORDER BY published_at DESC
        LIMIT ?
      `,
    )
    .all(normalizeTicker(ticker), Math.max(1, Math.min(100, limit)));

  return rows.map((row) => rowToArticle(row as Record<string, unknown>));
}

async function listNewsArticlesByTickerNeon(
  ticker: string,
  limit = 25,
): Promise<NewsArticle[]> {
  await ensureNeonSchema();
  const sql = getNeonSql();
  const rows = (await sql`
    SELECT * FROM news_articles
    WHERE ticker = ${normalizeTicker(ticker)}
    ORDER BY published_at DESC
    LIMIT ${Math.max(1, Math.min(100, limit))}
  `) as Array<Record<string, unknown>>;

  return rows.map(rowToArticle);
}

export async function listNewsArticlesByTicker(
  ticker: string,
  limit = 25,
): Promise<NewsArticle[]> {
  return shouldUseSqliteFallback()
    ? listNewsArticlesByTickerSqlite(ticker, limit)
    : listNewsArticlesByTickerNeon(ticker, limit);
}

async function listRecentNewsArticlesSqlite(limit = 50): Promise<NewsArticle[]> {
  const db = await getSqliteDatabase();
  const rows = db
    .prepare(
      `
        SELECT * FROM news_articles
        ORDER BY published_at DESC
        LIMIT ?
      `,
    )
    .all(Math.max(1, Math.min(100, limit)));

  return rows.map((row) => rowToArticle(row as Record<string, unknown>));
}

async function listRecentNewsArticlesNeon(limit = 50): Promise<NewsArticle[]> {
  await ensureNeonSchema();
  const sql = getNeonSql();
  const rows = (await sql`
    SELECT * FROM news_articles
    ORDER BY published_at DESC
    LIMIT ${Math.max(1, Math.min(100, limit))}
  `) as Array<Record<string, unknown>>;

  return rows.map(rowToArticle);
}

export async function listRecentNewsArticles(
  limit = 50,
): Promise<NewsArticle[]> {
  return shouldUseSqliteFallback()
    ? listRecentNewsArticlesSqlite(limit)
    : listRecentNewsArticlesNeon(limit);
}
