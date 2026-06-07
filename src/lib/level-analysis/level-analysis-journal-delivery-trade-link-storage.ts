import type Database from "better-sqlite3";
import { getTraderIntelligenceDatabase } from "../trader-analytics/product/import-commit/sqlite-import-commit-repository";
import {
  runJournalLevelAnalysisDeliveryMigrations,
} from "./level-analysis-journal-delivery-persistence-storage";
import {
  isJournalLevelAnalysisTradeLinkDuplicate,
  validateJournalLevelAnalysisTradeLinkRecord,
  type JournalLevelAnalysisTradeLinkRecord,
} from "./level-analysis-journal-delivery-trade-link-contract";

type SqliteDatabase = Database.Database;

export const LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG =
  "LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED";

export const LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG =
  "LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_ADMIN_DEBUG_ENABLED";

export const LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_FEATURE_FLAG =
  "LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED";

export const LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_UI_FEATURE_FLAG =
  "LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED";

export interface SaveJournalLevelAnalysisTradeLinkRecordResult {
  status: "stored" | "duplicate";
  record: JournalLevelAnalysisTradeLinkRecord;
}

export interface TradeLinkIdempotencyQuery {
  workspaceId: string;
  accountId: string;
  userId: string;
  savedTradeId: string;
  deliveryId: string;
  symbol: string;
  provider: string;
}

export interface TradeLinkJournalScope {
  workspaceId: string;
  accountId: string;
  userId: string;
}

export interface LatestTradeLinkForSavedTradeQuery
  extends TradeLinkJournalScope {
  savedTradeId: string;
}

export interface LatestTradeLinksForSavedTradesQuery
  extends TradeLinkJournalScope {
  savedTradeIds: string[];
}

export interface JournalLevelAnalysisTradeLinkRepository {
  saveTradeLinkRecord(
    record: JournalLevelAnalysisTradeLinkRecord,
  ): SaveJournalLevelAnalysisTradeLinkRecordResult;
  getTradeLinkRecord(id: string): JournalLevelAnalysisTradeLinkRecord | null;
  getTradeLinkByIdempotency(
    query: TradeLinkIdempotencyQuery,
  ): JournalLevelAnalysisTradeLinkRecord | null;
  getLatestTradeLinkForSavedTrade(
    query: LatestTradeLinkForSavedTradeQuery,
  ): JournalLevelAnalysisTradeLinkRecord | null;
  getLatestTradeLinksForSavedTrades(
    query: LatestTradeLinksForSavedTradesQuery,
  ): Record<string, JournalLevelAnalysisTradeLinkRecord>;
}

function envEnabled(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function isLevelAnalysisTradeLinkApiEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envEnabled(env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG]);
}

export function isLevelAnalysisTradeLinkAdminDebugEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envEnabled(env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG]);
}

export function isLevelAnalysisTradeDetailLevelFactsEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envEnabled(env[LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_FEATURE_FLAG]);
}

export function isLevelAnalysisTradeDetailLevelFactsUiEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envEnabled(env[LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_UI_FEATURE_FLAG]);
}

function json<T>(value: T): string {
  return JSON.stringify(value);
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function rowJson<T>(row: unknown): T {
  return parseJson<T>((row as { record_json: string }).record_json);
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function runJournalLevelAnalysisTradeLinkMigrations(
  db: SqliteDatabase,
): void {
  runJournalLevelAnalysisDeliveryMigrations(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS journal_level_analysis_trade_links (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      saved_trade_id TEXT NOT NULL,
      import_batch_id TEXT,
      symbol TEXT NOT NULL,
      provider TEXT NOT NULL,
      link_status TEXT NOT NULL,
      link_source TEXT NOT NULL,
      delivery_id TEXT NOT NULL,
      raw_payload_hash TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      delivery_generated_at TEXT,
      symbol_summary_as_of_timestamp INTEGER,
      symbol_summary_as_of_iso TEXT,
      match_policy_json TEXT NOT NULL,
      match_result_json TEXT NOT NULL,
      linked_symbol_summary_json TEXT NOT NULL,
      limitations_json TEXT NOT NULL,
      safety_flags_json TEXT NOT NULL,
      audit_trail_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      record_json TEXT NOT NULL
    );

    DROP INDEX IF EXISTS journal_level_analysis_trade_links_idempotency;

    CREATE UNIQUE INDEX IF NOT EXISTS journal_level_analysis_trade_links_idempotency_scoped
      ON journal_level_analysis_trade_links(workspace_id, account_id, user_id, saved_trade_id, delivery_id, provider, symbol);

    CREATE INDEX IF NOT EXISTS journal_level_analysis_trade_links_trade_latest
      ON journal_level_analysis_trade_links(saved_trade_id, updated_at DESC, id DESC);

    CREATE INDEX IF NOT EXISTS journal_level_analysis_trade_links_scope_trade_latest
      ON journal_level_analysis_trade_links(workspace_id, account_id, user_id, saved_trade_id, updated_at DESC, id DESC);

    CREATE INDEX IF NOT EXISTS journal_level_analysis_trade_links_delivery
      ON journal_level_analysis_trade_links(delivery_id);

    CREATE INDEX IF NOT EXISTS journal_level_analysis_trade_links_active
      ON journal_level_analysis_trade_links(saved_trade_id, provider, symbol, updated_at DESC)
      WHERE link_status = 'linked';

    CREATE INDEX IF NOT EXISTS journal_level_analysis_trade_links_active_scoped
      ON journal_level_analysis_trade_links(workspace_id, account_id, user_id, saved_trade_id, provider, symbol, updated_at DESC)
      WHERE link_status = 'linked';
  `);

  db.prepare(
    "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
  ).run("005_level_analysis_trade_link_persistence", new Date().toISOString());
}

export class SqliteJournalLevelAnalysisTradeLinkRepository
  implements JournalLevelAnalysisTradeLinkRepository
{
  constructor(private readonly db: SqliteDatabase = getTraderIntelligenceDatabase()) {
    runJournalLevelAnalysisTradeLinkMigrations(this.db);
  }

  saveTradeLinkRecord(
    record: JournalLevelAnalysisTradeLinkRecord,
  ): SaveJournalLevelAnalysisTradeLinkRecordResult {
    const validation = validateJournalLevelAnalysisTradeLinkRecord(record);
    if (validation.status === "invalid") {
      throw new Error(
        `Invalid journal level analysis trade link record: ${validation.issues
          .map((issue) => `${issue.field}:${issue.code}`)
          .join(", ")}`,
      );
    }

    const existing = this.getTradeLinkByIdempotency({
      workspaceId: record.workspaceId,
      accountId: record.accountId,
      userId: record.userId,
      savedTradeId: record.savedTradeId,
      deliveryId: record.deliveryId,
      symbol: record.symbol,
      provider: record.provider,
    });

    if (
      existing &&
      isJournalLevelAnalysisTradeLinkDuplicate({
        existing,
        incoming: record,
      })
    ) {
      return { status: "duplicate", record: existing };
    }

    this.insertRecord(record);
    return { status: "stored", record };
  }

  getTradeLinkRecord(id: string): JournalLevelAnalysisTradeLinkRecord | null {
    const row = this.db
      .prepare("SELECT record_json FROM journal_level_analysis_trade_links WHERE id = ?")
      .get(id);

    return row ? rowJson<JournalLevelAnalysisTradeLinkRecord>(row) : null;
  }

  getTradeLinkByIdempotency(
    query: TradeLinkIdempotencyQuery,
  ): JournalLevelAnalysisTradeLinkRecord | null {
    const row = this.db
      .prepare(
        `SELECT record_json
         FROM journal_level_analysis_trade_links
         WHERE workspace_id = ?
           AND account_id = ?
           AND user_id = ?
           AND saved_trade_id = ?
           AND delivery_id = ?
           AND provider = ?
           AND symbol = ?
         LIMIT 1`,
      )
      .get(
        query.workspaceId,
        query.accountId,
        query.userId,
        query.savedTradeId,
        query.deliveryId,
        query.provider,
        normalizeSymbol(query.symbol),
      );

    return row ? rowJson<JournalLevelAnalysisTradeLinkRecord>(row) : null;
  }

  getLatestTradeLinkForSavedTrade(
    query: LatestTradeLinkForSavedTradeQuery,
  ): JournalLevelAnalysisTradeLinkRecord | null {
    const row = this.db
      .prepare(
        `SELECT record_json
         FROM journal_level_analysis_trade_links
         WHERE workspace_id = ?
           AND account_id = ?
           AND user_id = ?
           AND saved_trade_id = ?
         ORDER BY updated_at DESC, id DESC
         LIMIT 1`,
      )
      .get(query.workspaceId, query.accountId, query.userId, query.savedTradeId);

    return row ? rowJson<JournalLevelAnalysisTradeLinkRecord>(row) : null;
  }

  getLatestTradeLinksForSavedTrades(
    query: LatestTradeLinksForSavedTradesQuery,
  ): Record<string, JournalLevelAnalysisTradeLinkRecord> {
    const uniqueTradeIds = [...new Set(query.savedTradeIds.filter(Boolean))];
    const latestByTradeId: Record<string, JournalLevelAnalysisTradeLinkRecord> = {};

    if (uniqueTradeIds.length === 0) {
      return latestByTradeId;
    }

    for (let index = 0; index < uniqueTradeIds.length; index += 500) {
      const chunk = uniqueTradeIds.slice(index, index + 500);
      const placeholders = chunk.map(() => "?").join(", ");
      const rows = this.db
        .prepare(
          `SELECT saved_trade_id, record_json
           FROM journal_level_analysis_trade_links
           WHERE workspace_id = ?
             AND account_id = ?
             AND user_id = ?
             AND saved_trade_id IN (${placeholders})
           ORDER BY saved_trade_id ASC, updated_at DESC, id DESC`,
        )
        .all(query.workspaceId, query.accountId, query.userId, ...chunk) as Array<{
        saved_trade_id: string;
        record_json: string;
      }>;

      for (const row of rows) {
        if (latestByTradeId[row.saved_trade_id]) {
          continue;
        }

        latestByTradeId[row.saved_trade_id] =
          parseJson<JournalLevelAnalysisTradeLinkRecord>(row.record_json);
      }
    }

    return latestByTradeId;
  }

  private insertRecord(record: JournalLevelAnalysisTradeLinkRecord): void {
    this.db
      .prepare(
        `INSERT INTO journal_level_analysis_trade_links (
          id, workspace_id, account_id, user_id, saved_trade_id, import_batch_id,
          symbol, provider, link_status, link_source, delivery_id, raw_payload_hash,
          source_kind, delivery_generated_at, symbol_summary_as_of_timestamp,
          symbol_summary_as_of_iso, match_policy_json, match_result_json,
          linked_symbol_summary_json, limitations_json, safety_flags_json,
          audit_trail_json, created_at, updated_at, record_json
        ) VALUES (
          @id, @workspaceId, @accountId, @userId, @savedTradeId, @importBatchId,
          @symbol, @provider, @linkStatus, @linkSource, @deliveryId, @rawPayloadHash,
          @sourceKind, @deliveryGeneratedAt, @symbolSummaryAsOfTimestamp,
          @symbolSummaryAsOfIso, @matchPolicyJson, @matchResultJson,
          @linkedSymbolSummaryJson, @limitationsJson, @safetyFlagsJson,
          @auditTrailJson, @createdAt, @updatedAt, @recordJson
        )`,
      )
      .run({
        id: record.id,
        workspaceId: record.workspaceId,
        accountId: record.accountId,
        userId: record.userId,
        savedTradeId: record.savedTradeId,
        importBatchId: record.importBatchId ?? null,
        symbol: normalizeSymbol(record.symbol),
        provider: record.provider,
        linkStatus: record.linkStatus,
        linkSource: record.linkSource,
        deliveryId: record.deliveryId,
        rawPayloadHash: record.rawPayloadHash,
        sourceKind: record.sourceKind,
        deliveryGeneratedAt: record.deliveryGeneratedAt ?? null,
        symbolSummaryAsOfTimestamp: record.symbolSummaryAsOfTimestamp,
        symbolSummaryAsOfIso: record.symbolSummaryAsOfIso ?? null,
        matchPolicyJson: json(record.matchPolicy),
        matchResultJson: json(record.matchResult),
        linkedSymbolSummaryJson: json(record.linkedSymbolSummary),
        limitationsJson: json(record.limitations),
        safetyFlagsJson: json(record.safetyFlags),
        auditTrailJson: json(record.auditTrail),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        recordJson: json(record),
      });
  }
}
