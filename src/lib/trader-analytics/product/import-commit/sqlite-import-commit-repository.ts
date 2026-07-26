import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { resolveTraderIntelligenceLocalPersistence } from "../../../trader-intelligence-v3/deployment";
import { buildTraderAnalyticsReport } from "../../build-trader-analytics-report";
import type { ExecutionFeedbackSummary } from "../../../execution-feedback/summary/build-execution-feedback-summary";
import type {
  SavedReportNote,
  SavedExecutionTrade,
  SavedExecutionTradeId,
  SavedReviewStatus,
  SavedTraderAnalyticsReport,
  SavedTraderAnalyticsReportId,
  SavedTraderAnalyticsRepository,
  SavedTraderAnalyticsSummaryRef,
  TradeReviewChecklistItemId,
  TradeReviewChecklistItemStatus,
  TraderAnalyticsUserId,
} from "../types";
import type { CsvDryRunPrototypeDecisionReviewInput } from "../functional-readiness";
import type {
  CommitImportBatchResult,
  ImportCommitRepository,
} from "./in-memory-import-commit-repository";
import type {
  ImportCommitBatchRecord,
  ImportCommitDecisionReviewJobRecord,
  ImportCommitExecutionFeedbackSummaryRecord,
  ImportCommitExecutionRecord,
  ImportCommitPlanResult,
  ImportCommitRepairItemRecord,
  ImportCommitSavedTradeExecutionLinkRecord,
  ImportCommitSavedTradeRecord,
  ImportCommitTradeGroupingDiagnosticRecord,
} from "./import-commit-planner";
import type { CsvMappingTemplateInput } from "../../server/csv-mapping-template-service";

export const DEMO_WORKSPACE_ID = "local-demo-workspace";
export const DEMO_USER_ID = "local-demo-user";
export const DEMO_ACCOUNT_ID = "local-demo-account";

export interface PersistedOwnerWorkspaceAccount {
  ownerId: string;
  workspaceId: string;
  id: string;
  label: string;
  brokerLabel: string;
  timezone: string;
  baseCurrency: string;
  importDefaults: {
    timestampTimezone: string;
    optionsHandling: "reject" | "skip" | "allow";
    maxTradeGroupingGapMinutes: number | null;
    splitTradesAtSessionBoundary: boolean;
  };
}

export interface PersistedCsvMappingTemplate {
  contractVersion: "owner_csv_mapping_template_v1";
  id: string;
  ownerId: string;
  accountId: string;
  name: string;
  normalizedHeaders: string[];
  delimiter: string;
  columnMapping: import("../../../execution-sources/csv").BrokerExecutionCsvColumnMapping;
  sideValueMapping: Record<string, "buy" | "sell">;
  timestampTimezone?: string;
  optionsHandling?: "reject" | "skip" | "allow";
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

type SqliteDatabase = Database.Database;

export interface PersistedTradeReviewItemState {
  tradeId: SavedExecutionTradeId;
  itemId: TradeReviewChecklistItemId;
  status: TradeReviewChecklistItemStatus;
  updatedAt: string;
}

export interface ImportRepairActionEvent {
  id: string;
  importBatchId: string;
  repairItemId: string;
  status: ImportCommitRepairItemRecord["status"];
  createdAt: string;
}

export interface PersistedDecisionReviewSnapshot {
  id: string;
  accountId: string;
  userId: string;
  savedTradeId: string;
  importBatchId: string;
  requestIndex: number;
  symbol: string;
  generatedAt: string;
  status: "completed";
  review: CsvDryRunPrototypeDecisionReviewInput;
}

export interface PersistedDecisionReviewDiagnostic {
  id: string;
  accountId: string;
  userId: string;
  savedTradeId: string | null;
  importBatchId: string;
  requestIndex: number | null;
  symbol: string | null;
  status:
    | "blocked_open_trade"
    | "market_context_unavailable"
    | "analysis_failed"
    | "skipped_limit";
  code: string;
  message: string;
  generatedAt: string;
}

export interface ImportBatchHistoryItem {
  batch: ImportCommitBatchRecord;
  duplicateFile: boolean;
  duplicateTradeCount: number;
  requiredDecisionCount: number;
  blockerCount: number;
  reviewCount: number;
  openRepairCount: number;
  resolvedRepairCount: number;
  savedTradeCount: number;
  decisionReviewJobCount: number;
  summaryStatus:
    | "committed"
    | "blocked"
    | "needs_review"
    | "ready"
    | "discarded";
  nextAction: string;
}

export interface UnresolvedImportRepairInboxItem {
  id: string;
  importBatchId: string;
  brokerLabel: string;
  batchStatus: ImportCommitBatchRecord["status"];
  severity: ImportCommitRepairItemRecord["severity"];
  actionKind: string;
  title: string;
  detail: string;
  rowIndex: number | null;
  requestIndex: number | null;
  updatedAt: string;
  href: string;
}

let sharedDatabase: SqliteDatabase | null = null;
let sharedDatabaseTarget: string | null = null;

export function getTraderIntelligenceDatabase(): SqliteDatabase {
  const dataMode = process.env.TRADER_INTELLIGENCE_DATA_MODE;
  if (dataMode !== "sample_data" && dataMode !== "real_owner_data") {
    throw new Error("ti_v3_data_mode_invalid");
  }
  const persistence = resolveTraderIntelligenceLocalPersistence({
    environment: process.env,
    dataMode,
  });
  if (!persistence.ok) {
    throw new Error(persistence.code);
  }
  if (
    sharedDatabase &&
    sharedDatabaseTarget === persistence.databaseTarget
  ) {
    return sharedDatabase;
  }
  if (sharedDatabase) {
    sharedDatabase.close();
    sharedDatabase = null;
    sharedDatabaseTarget = null;
  }
  if (persistence.kind === "file") {
    mkdirSync(persistence.parentPath, { recursive: true });
  }
  sharedDatabase = new Database(persistence.databaseTarget);
  sharedDatabaseTarget = persistence.databaseTarget;
  runTraderIntelligenceMigrations(sharedDatabase);
  return sharedDatabase;
}

export function resetTraderIntelligenceDatabaseForTests(): void {
  sharedDatabase?.close();
  sharedDatabase = null;
  sharedDatabaseTarget = null;
}

export function runTraderIntelligenceMigrations(db: SqliteDatabase): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      broker_key TEXT NOT NULL,
      broker_label TEXT NOT NULL,
      file_fingerprint TEXT NOT NULL,
      trade_fingerprints_json TEXT NOT NULL,
      plan_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      committed_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS import_batches_committed_file_unique
      ON import_batches(account_id, file_fingerprint)
      WHERE status = 'committed';

    CREATE TABLE IF NOT EXISTS import_rows (
      id TEXT PRIMARY KEY,
      import_batch_id TEXT NOT NULL,
      row_index INTEGER NOT NULL,
      status TEXT NOT NULL,
      symbol TEXT,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_issues (
      id TEXT PRIMARY KEY,
      import_batch_id TEXT NOT NULL,
      issue_code TEXT NOT NULL,
      severity TEXT NOT NULL,
      row_index INTEGER,
      request_index INTEGER,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_repair_items (
      id TEXT PRIMARY KEY,
      import_batch_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS normalized_executions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      import_batch_id TEXT NOT NULL,
      sequence_index INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      side TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_trades (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      import_batch_id TEXT NOT NULL,
      trade_fingerprint TEXT,
      symbol TEXT NOT NULL,
      lifecycle_status TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      session_date TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS saved_trades_fingerprint_unique
      ON saved_trades(account_id, trade_fingerprint)
      WHERE trade_fingerprint IS NOT NULL;

    CREATE TABLE IF NOT EXISTS saved_trade_execution_links (
      id TEXT PRIMARY KEY,
      saved_trade_id TEXT NOT NULL,
      execution_id TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trade_grouping_diagnostics (
      id TEXT PRIMARY KEY,
      import_batch_id TEXT NOT NULL,
      saved_trade_id TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS execution_feedback_summaries (
      id TEXT PRIMARY KEY,
      saved_trade_id TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decision_review_jobs (
      id TEXT PRIMARY KEY,
      saved_trade_id TEXT NOT NULL,
      import_batch_id TEXT NOT NULL,
      status TEXT NOT NULL,
      symbol TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decision_review_snapshots (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      saved_trade_id TEXT NOT NULL,
      import_batch_id TEXT NOT NULL,
      request_index INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      status TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS decision_review_snapshots_trade_unique
      ON decision_review_snapshots(saved_trade_id);

    CREATE INDEX IF NOT EXISTS decision_review_snapshots_batch
      ON decision_review_snapshots(import_batch_id, generated_at);

    CREATE TABLE IF NOT EXISTS decision_review_diagnostics (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      saved_trade_id TEXT,
      import_batch_id TEXT NOT NULL,
      request_index INTEGER,
      symbol TEXT,
      status TEXT NOT NULL,
      code TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS decision_review_diagnostics_batch
      ON decision_review_diagnostics(import_batch_id, generated_at);

    CREATE TABLE IF NOT EXISTS saved_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      sample_data INTEGER NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_read_model_metadata (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_trade_notes (
      id TEXT PRIMARY KEY,
      saved_trade_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      body TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS saved_trade_notes_trade_created
      ON saved_trade_notes(saved_trade_id, created_at);

    CREATE TABLE IF NOT EXISTS trade_review_item_states (
      id TEXT PRIMARY KEY,
      saved_trade_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS trade_review_item_states_unique
      ON trade_review_item_states(saved_trade_id, item_id);

    CREATE TABLE IF NOT EXISTS import_repair_events (
      id TEXT PRIMARY KEY,
      import_batch_id TEXT NOT NULL,
      repair_item_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS owner_workspace_accounts (
      owner_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      account_id TEXT NOT NULL UNIQUE,
      json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS csv_mapping_templates (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      version TEXT NOT NULL,
      name TEXT NOT NULL,
      header_signature TEXT NOT NULL,
      delimiter TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_used_at TEXT,
      json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS csv_mapping_templates_owner_account_updated
      ON csv_mapping_templates(owner_id, account_id, updated_at DESC);
  `);

  db.prepare(
    "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
  ).run("001_saved_import_to_coaching_loop", new Date().toISOString());
  db.prepare(
    "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
  ).run("002_persisted_repair_and_review_state", new Date().toISOString());
  db.prepare(
    "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
  ).run("003_persisted_decision_review_snapshots", new Date().toISOString());
  db.prepare(
    "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
  ).run("004_owner_workspace_and_csv_mapping_templates", new Date().toISOString());
}

function json<T>(value: T): string {
  return JSON.stringify(value);
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function rowJson<T>(row: unknown): T {
  return parseJson<T>((row as { json: string }).json);
}

function savedTradeToAnalyticsTrade(
  trade: ImportCommitSavedTradeRecord,
  notes: SavedReportNote[] = [],
): SavedExecutionTrade {
  return {
    id: trade.id,
    userId: trade.userId,
    accountId: trade.accountId,
    importedAt: trade.openedAt,
    importBatchId: trade.importBatchId,
    repairSource: trade.repairSource ?? "original_csv",
    sourceLabel:
      trade.repairSource === "repaired_csv"
        ? `Committed repaired CSV import ${trade.importBatchId}`
        : `Committed import ${trade.importBatchId}`,
    sampleData: false,
    symbol: trade.symbol,
    tradeDirection: trade.tradeDirection,
    sessionDate: trade.sessionDate,
    sessionBucket: trade.sessionBucket,
    entrySessionBucket: trade.entrySessionBucket,
    entryHourLabelEt: trade.entryHourLabelEt,
    heldSessionBuckets: trade.heldSessionBuckets,
    heldHourBucketsEt: trade.heldHourBucketsEt,
    request: trade.request,
    reviewStatus: trade.reviewStatus,
    notes,
  };
}

function buildReportFromPlan(
  plan: ImportCommitPlanResult,
): SavedTraderAnalyticsReport | null {
  const closedTrades = plan.savedTrades.filter(
    (trade) => trade.lifecycleStatus === "closed",
  );
  const tradeById = new Map(closedTrades.map((trade) => [trade.id, trade]));
  const sourceSummaries: SavedTraderAnalyticsSummaryRef[] =
    plan.executionFeedbackSummaries
      .filter((summary) => tradeById.has(summary.savedTradeId))
      .map((summary, requestIndex) => ({
        tradeId: summary.savedTradeId,
        requestIndex,
        summary: summary.summary as ExecutionFeedbackSummary,
      }));

  if (sourceSummaries.length === 0) {
    return null;
  }

  const dates = closedTrades.map((trade) => trade.sessionDate).sort();
  const report = buildTraderAnalyticsReport({
    source: `saved_import:${plan.batch.id}`,
    generatedAt: plan.generatedAt,
    inputMode: "execution_feedback_summaries",
    summaries: sourceSummaries.map((item) => ({
      requestIndex: item.requestIndex,
      summary: item.summary,
    })),
    requestCount: sourceSummaries.length,
  });

  return {
    id: `report:${plan.batch.id}`,
    userId: plan.batch.userId,
    accountId: plan.batch.accountId,
    generatedAt: plan.generatedAt,
    reportPeriod: {
      startDate: dates[0] ?? plan.generatedAt.slice(0, 10),
      endDate: dates[dates.length - 1] ?? plan.generatedAt.slice(0, 10),
      label: `Import ${plan.batch.id}`,
    },
    sourceTradeIds: sourceSummaries.map((item) => item.tradeId),
    sourceSummaries,
    report,
    reviewStatus: "new",
    notes: [],
    sampleData: false,
  };
}

export class SqliteImportCommitRepository
  implements ImportCommitRepository, SavedTraderAnalyticsRepository
{
  constructor(private readonly db: SqliteDatabase = getTraderIntelligenceDatabase()) {
    runTraderIntelligenceMigrations(this.db);
  }

  getOrCreateOwnerWorkspaceAccount(ownerId: string): PersistedOwnerWorkspaceAccount {
    const existing = this.db.prepare("SELECT json FROM owner_workspace_accounts WHERE owner_id = ?").get(ownerId) as { json: string } | undefined;
    if (existing) return parseJson<PersistedOwnerWorkspaceAccount>(existing.json);
    const now = new Date().toISOString();
    const safeOwner = ownerId.replace(/[^a-zA-Z0-9_-]/gu, "-").slice(0, 80) || "owner";
    const account: PersistedOwnerWorkspaceAccount = {
      ownerId,
      workspaceId: `workspace:${safeOwner}`,
      id: `account:${safeOwner}`,
      label: "Active trading account",
      brokerLabel: "Generic CSV",
      timezone: "America/New_York",
      baseCurrency: "USD",
      importDefaults: {
        timestampTimezone: "America/New_York",
        optionsHandling: "reject",
        maxTradeGroupingGapMinutes: null,
        splitTradesAtSessionBoundary: true,
      },
    };
    this.db.prepare("INSERT INTO owner_workspace_accounts (owner_id, workspace_id, account_id, json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(ownerId, account.workspaceId, account.id, json(account), now, now);
    return account;
  }

  listCsvMappingTemplates(ownerId: string, accountId: string): PersistedCsvMappingTemplate[] {
    const rows = this.db.prepare("SELECT json FROM csv_mapping_templates WHERE owner_id = ? AND account_id = ? AND version = ? ORDER BY updated_at DESC, id ASC")
      .all(ownerId, accountId, "owner_csv_mapping_template_v1") as Array<{ json: string }>;
    return rows.map((row) => parseJson<PersistedCsvMappingTemplate>(row.json));
  }

  saveCsvMappingTemplate(args: { ownerId: string; accountId: string; templateId?: string; input: CsvMappingTemplateInput }): PersistedCsvMappingTemplate {
    const now = new Date().toISOString();
    let existing: PersistedCsvMappingTemplate | null = null;
    if (args.templateId) {
      const row = this.db.prepare("SELECT json FROM csv_mapping_templates WHERE id = ? AND owner_id = ? AND account_id = ?").get(args.templateId, args.ownerId, args.accountId) as { json: string } | undefined;
      if (!row) throw new Error("Mapping template was not found for the active account.");
      existing = parseJson<PersistedCsvMappingTemplate>(row.json);
      if (existing.contractVersion !== "owner_csv_mapping_template_v1") throw new Error("Mapping template version is unsupported.");
    }
    const template: PersistedCsvMappingTemplate = {
      contractVersion: "owner_csv_mapping_template_v1",
      id: existing?.id ?? `csv-template:${randomUUID()}`,
      ownerId: args.ownerId,
      accountId: args.accountId,
      name: args.input.name,
      normalizedHeaders: args.input.normalizedHeaders,
      delimiter: args.input.delimiter,
      columnMapping: args.input.columnMapping,
      sideValueMapping: args.input.sideValueMapping,
      timestampTimezone: args.input.timestampTimezone,
      optionsHandling: args.input.optionsHandling,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastUsedAt: existing?.lastUsedAt,
    };
    this.db.prepare(`INSERT INTO csv_mapping_templates (id, owner_id, account_id, version, name, header_signature, delimiter, created_at, updated_at, last_used_at, json)
      VALUES (@id, @ownerId, @accountId, @version, @name, @headerSignature, @delimiter, @createdAt, @updatedAt, @lastUsedAt, @json)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, header_signature = excluded.header_signature, delimiter = excluded.delimiter, updated_at = excluded.updated_at, json = excluded.json`)
      .run({ id: template.id, ownerId: template.ownerId, accountId: template.accountId, version: template.contractVersion, name: template.name, headerSignature: template.normalizedHeaders.join("|"), delimiter: template.delimiter, createdAt: template.createdAt, updatedAt: template.updatedAt, lastUsedAt: template.lastUsedAt ?? null, json: json(template) });
    return template;
  }

  deleteCsvMappingTemplate(ownerId: string, accountId: string, templateId: string): boolean {
    return this.db.prepare("DELETE FROM csv_mapping_templates WHERE id = ? AND owner_id = ? AND account_id = ?").run(templateId, ownerId, accountId).changes === 1;
  }

  markCsvMappingTemplateUsed(ownerId: string, accountId: string, templateId: string): void {
    const row = this.db.prepare("SELECT json FROM csv_mapping_templates WHERE id = ? AND owner_id = ? AND account_id = ?").get(templateId, ownerId, accountId) as { json: string } | undefined;
    if (!row) return;
    const template = parseJson<PersistedCsvMappingTemplate>(row.json);
    const updated = { ...template, lastUsedAt: new Date().toISOString(), updatedAt: template.updatedAt };
    this.db.prepare("UPDATE csv_mapping_templates SET last_used_at = ?, json = ? WHERE id = ? AND owner_id = ? AND account_id = ?").run(updated.lastUsedAt, json(updated), templateId, ownerId, accountId);
  }

  savePreviewPlan(plan: ImportCommitPlanResult): void {
    const transaction = this.db.transaction(() => {
      this.savePreviewPlanUnsafe(plan);
    });

    transaction();
  }

  getImportBatch(batchId: string): ImportCommitBatchRecord | null {
    const row = this.db
      .prepare("SELECT plan_json, status, updated_at FROM import_batches WHERE id = ?")
      .get(batchId) as
      | { plan_json: string | null; status: string; updated_at: string }
      | undefined;

    if (!row?.plan_json) {
      return null;
    }

    const plan = parseJson<ImportCommitPlanResult>(row.plan_json);
    return {
      ...plan.batch,
      status: row.status as ImportCommitBatchRecord["status"],
      updatedAt: row.updated_at,
    };
  }

  getPreviewPlan(batchId: string): ImportCommitPlanResult | null {
    const row = this.db
      .prepare("SELECT plan_json FROM import_batches WHERE id = ?")
      .get(batchId) as { plan_json: string | null } | undefined;

    return row?.plan_json ? parseJson<ImportCommitPlanResult>(row.plan_json) : null;
  }

  commitImportPlan(plan: ImportCommitPlanResult): CommitImportBatchResult {
    if (!plan.canCommitNow) {
      this.savePreviewPlan(plan);
      return {
        status: "rejected",
        batch: plan.batch,
        savedTradeCount: 0,
        executionCount: 0,
        decisionReviewJobCount: 0,
        message: plan.readModel.nextAction,
      };
    }

    if (
      this.listCommittedFileFingerprints(plan.batch.accountId).includes(
        plan.batch.fileFingerprint,
      )
    ) {
      return {
        status: "rejected",
        batch: plan.batch,
        savedTradeCount: 0,
        executionCount: 0,
        decisionReviewJobCount: 0,
        message: "This file has already been committed for the active account.",
      };
    }

    const committedBatch: ImportCommitBatchRecord = {
      ...plan.batch,
      status: "committed",
      updatedAt: plan.generatedAt,
    };
    const report = buildReportFromPlan(plan);

    const transaction = this.db.transaction(() => {
      this.savePreviewPlanUnsafe(plan);
      this.db
        .prepare(
          "UPDATE import_batches SET status = ?, updated_at = ?, committed_at = ?, plan_json = ? WHERE id = ?",
        )
        .run("committed", plan.generatedAt, plan.generatedAt, json({
          ...plan,
          batch: committedBatch,
        } satisfies ImportCommitPlanResult), plan.batch.id);

      for (const execution of plan.executions) {
        this.insertExecution(execution);
      }
      for (const trade of plan.savedTrades) {
        this.insertSavedTrade(trade);
      }
      for (const link of plan.savedTradeExecutionLinks) {
        this.insertLink(link);
      }
      for (const diagnostic of plan.groupingDiagnostics) {
        this.insertGroupingDiagnostic(diagnostic);
      }
      for (const summary of plan.executionFeedbackSummaries) {
        this.insertFeedbackSummary(summary);
      }
      for (const job of plan.decisionReviewJobs) {
        this.insertDecisionReviewJob(job);
      }
      if (report) {
        this.saveReport(report);
      }
      this.saveRouteMetadata(plan.batch.accountId, {
        latestCommittedBatchId: plan.batch.id,
        latestReportId: report?.id ?? null,
      });
    });

    transaction();

    return {
      status: "committed",
      batch: committedBatch,
      savedTradeCount: plan.savedTrades.length,
      executionCount: plan.executions.length,
      decisionReviewJobCount: plan.decisionReviewJobs.length,
      message: "Import committed to SQLite.",
    };
  }

  discardImportBatch(batchId: string): void {
    this.db
      .prepare("UPDATE import_batches SET status = ?, updated_at = ? WHERE id = ?")
      .run("discarded", new Date().toISOString(), batchId);
  }

  listSavedTrades(accountId: string): ImportCommitSavedTradeRecord[] {
    return this.db
      .prepare(
        "SELECT json FROM saved_trades WHERE account_id = ? ORDER BY opened_at ASC, id ASC",
      )
      .all(accountId)
      .map((row) => rowJson<ImportCommitSavedTradeRecord>(row));
  }

  getSavedTrade(tradeId: string): ImportCommitSavedTradeRecord | null {
    const row = this.db
      .prepare("SELECT json FROM saved_trades WHERE id = ?")
      .get(tradeId);
    return row ? rowJson<ImportCommitSavedTradeRecord>(row) : null;
  }

  listDecisionReviewJobs(batchId: string): ImportCommitDecisionReviewJobRecord[] {
    return this.db
      .prepare("SELECT json FROM decision_review_jobs WHERE import_batch_id = ?")
      .all(batchId)
      .map((row) => rowJson<ImportCommitDecisionReviewJobRecord>(row));
  }

  updateDecisionReviewJob(job: ImportCommitDecisionReviewJobRecord): void {
    this.db
      .prepare(
        "UPDATE decision_review_jobs SET status = ?, json = ? WHERE id = ?",
      )
      .run(job.status, json(job), job.id);
  }

  saveDecisionReviewSnapshot(record: PersistedDecisionReviewSnapshot): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO decision_review_snapshots
          (id, account_id, user_id, saved_trade_id, import_batch_id, request_index, symbol, generated_at, status, json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.accountId,
        record.userId,
        record.savedTradeId,
        record.importBatchId,
        record.requestIndex,
        record.symbol,
        record.generatedAt,
        record.status,
        json(record),
      );
  }

  saveDecisionReviewDiagnostic(record: PersistedDecisionReviewDiagnostic): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO decision_review_diagnostics
          (id, account_id, user_id, saved_trade_id, import_batch_id, request_index, symbol, status, code, generated_at, json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.accountId,
        record.userId,
        record.savedTradeId,
        record.importBatchId,
        record.requestIndex,
        record.symbol,
        record.status,
        record.code,
        record.generatedAt,
        json(record),
      );
  }

  listDecisionReviewSnapshotsForBatch(
    batchId: string,
  ): PersistedDecisionReviewSnapshot[] {
    return this.db
      .prepare(
        "SELECT json FROM decision_review_snapshots WHERE import_batch_id = ? ORDER BY request_index ASC, id ASC",
      )
      .all(batchId)
      .map((row) => rowJson<PersistedDecisionReviewSnapshot>(row));
  }

  listDecisionReviewDiagnosticsForBatch(
    batchId: string,
  ): PersistedDecisionReviewDiagnostic[] {
    return this.db
      .prepare(
        "SELECT json FROM decision_review_diagnostics WHERE import_batch_id = ? ORDER BY request_index ASC, id ASC",
      )
      .all(batchId)
      .map((row) => rowJson<PersistedDecisionReviewDiagnostic>(row));
  }

  getDecisionReviewSnapshotForTrade(
    tradeId: string,
  ): PersistedDecisionReviewSnapshot | null {
    const row = this.db
      .prepare("SELECT json FROM decision_review_snapshots WHERE saved_trade_id = ?")
      .get(tradeId);

    return row ? rowJson<PersistedDecisionReviewSnapshot>(row) : null;
  }

  listDecisionReviewDiagnosticsForTrade(
    tradeId: string,
  ): PersistedDecisionReviewDiagnostic[] {
    return this.db
      .prepare(
        "SELECT json FROM decision_review_diagnostics WHERE saved_trade_id = ? ORDER BY generated_at DESC, id ASC",
      )
      .all(tradeId)
      .map((row) => rowJson<PersistedDecisionReviewDiagnostic>(row));
  }

  deleteDecisionReviewDiagnosticsForTrade(tradeId: string): void {
    this.db
      .prepare("DELETE FROM decision_review_diagnostics WHERE saved_trade_id = ?")
      .run(tradeId);
  }

  getLatestCommittedBatch(accountId: string): ImportCommitBatchRecord | null {
    const row = this.db
      .prepare(
        "SELECT plan_json FROM import_batches WHERE account_id = ? AND status = 'committed' ORDER BY updated_at DESC LIMIT 1",
      )
      .get(accountId) as { plan_json: string } | undefined;

    return row ? parseJson<ImportCommitPlanResult>(row.plan_json).batch : null;
  }

  getCommittedBatchByFileFingerprint(args: {
    accountId: string;
    fileFingerprint: string;
    excludeBatchId?: string;
  }): ImportCommitBatchRecord | null {
    const row = this.db
      .prepare(
        `SELECT plan_json, status, updated_at
         FROM import_batches
         WHERE account_id = ?
           AND file_fingerprint = ?
           AND status = 'committed'
           AND id != ?
         ORDER BY updated_at DESC
         LIMIT 1`,
      )
      .get(args.accountId, args.fileFingerprint, args.excludeBatchId ?? "") as
      | { plan_json: string | null; status: string; updated_at: string }
      | undefined;

    if (!row?.plan_json) {
      return null;
    }

    const plan = parseJson<ImportCommitPlanResult>(row.plan_json);
    return {
      ...plan.batch,
      status: row.status as ImportCommitBatchRecord["status"],
      updatedAt: row.updated_at,
    };
  }

  listSavedTradesByFingerprints(args: {
    accountId: string;
    tradeFingerprints: string[];
  }): ImportCommitSavedTradeRecord[] {
    const fingerprints = Array.from(
      new Set(args.tradeFingerprints.filter(Boolean)),
    );

    if (fingerprints.length === 0) {
      return [];
    }

    return fingerprints.flatMap((fingerprint) => {
      const row = this.db
        .prepare(
          "SELECT json FROM saved_trades WHERE account_id = ? AND trade_fingerprint = ?",
        )
        .get(args.accountId, fingerprint) as { json: string } | undefined;

      return row ? [rowJson<ImportCommitSavedTradeRecord>(row)] : [];
    });
  }

  listCommittedFileFingerprints(accountId: string): string[] {
    return this.db
      .prepare(
        "SELECT file_fingerprint FROM import_batches WHERE account_id = ? AND status = 'committed'",
      )
      .all(accountId)
      .map((row) => (row as { file_fingerprint: string }).file_fingerprint);
  }

  listCommittedTradeFingerprints(accountId: string): string[] {
    return this.db
      .prepare(
        "SELECT trade_fingerprint FROM saved_trades WHERE account_id = ? AND trade_fingerprint IS NOT NULL",
      )
      .all(accountId)
      .map((row) => (row as { trade_fingerprint: string }).trade_fingerprint);
  }

  listImportBatches(accountId: string): ImportCommitBatchRecord[] {
    return this.db
      .prepare(
        "SELECT plan_json, status, updated_at FROM import_batches WHERE account_id = ? ORDER BY updated_at DESC LIMIT 25",
      )
      .all(accountId)
      .map((row) => {
        const typed = row as {
          plan_json: string | null;
          status: string;
          updated_at: string;
        };
        const plan = typed.plan_json
          ? parseJson<ImportCommitPlanResult>(typed.plan_json)
          : null;
        return {
          ...(plan?.batch ?? ({} as ImportCommitBatchRecord)),
          status: typed.status as ImportCommitBatchRecord["status"],
          updatedAt: typed.updated_at,
        };
      });
  }

  listImportBatchHistory(accountId: string): ImportBatchHistoryItem[] {
    return this.db
      .prepare(
        "SELECT plan_json, status, updated_at FROM import_batches WHERE account_id = ? ORDER BY updated_at DESC LIMIT 50",
      )
      .all(accountId)
      .flatMap((row) => {
        const typed = row as {
          plan_json: string | null;
          status: string;
          updated_at: string;
        };
        if (!typed.plan_json) {
          return [];
        }

        const plan = parseJson<ImportCommitPlanResult>(typed.plan_json);
        const batch: ImportCommitBatchRecord = {
          ...plan.batch,
          status: typed.status as ImportCommitBatchRecord["status"],
          updatedAt: typed.updated_at,
        };
        const openRepairCount = plan.repairItems.filter(
          (item) => item.status === "open",
        ).length;
        const resolvedRepairCount = plan.repairItems.filter(
          (item) => item.status === "resolved",
        ).length;
        const blockerCount = plan.requiredDecisions.filter(
          (item) => item.severity === "blocked",
        ).length;
        const reviewCount = plan.requiredDecisions.filter(
          (item) => item.severity === "review",
        ).length;
        const duplicateFile = plan.readModel.duplicateFile;
        const duplicateTradeCount = plan.readModel.duplicateTradeCount;

        return [
          {
            batch,
            duplicateFile,
            duplicateTradeCount,
            requiredDecisionCount: plan.requiredDecisions.length,
            blockerCount,
            reviewCount,
            openRepairCount,
            resolvedRepairCount,
            savedTradeCount: plan.savedTrades.length,
            decisionReviewJobCount: plan.decisionReviewJobs.length,
            summaryStatus:
              batch.status === "committed"
                ? "committed"
                : batch.status === "discarded"
                  ? "discarded"
                  : blockerCount > 0 || openRepairCount > 0
                    ? "blocked"
                    : reviewCount > 0 || duplicateFile || duplicateTradeCount > 0
                      ? "needs_review"
                      : "ready",
            nextAction:
              batch.status === "committed"
                ? "Review saved trades and coaching outputs."
                : batch.status === "discarded"
                  ? "No action. This preview was discarded."
                  : plan.readModel.nextAction,
          } satisfies ImportBatchHistoryItem,
        ];
      });
  }

  listUnresolvedImportRepairInbox(
    accountId: string,
  ): UnresolvedImportRepairInboxItem[] {
    return this.db
      .prepare(
        "SELECT plan_json, status, updated_at FROM import_batches WHERE account_id = ? AND status != 'discarded' ORDER BY updated_at DESC LIMIT 100",
      )
      .all(accountId)
      .flatMap((row) => {
        const typed = row as {
          plan_json: string | null;
          status: string;
          updated_at: string;
        };
        if (!typed.plan_json) {
          return [];
        }

        const plan = parseJson<ImportCommitPlanResult>(typed.plan_json);
        return plan.repairItems
          .filter((item) => item.status === "open")
          .map((item) => ({
            id: item.id,
            importBatchId: plan.batch.id,
            brokerLabel: plan.batch.brokerLabel,
            batchStatus: typed.status as ImportCommitBatchRecord["status"],
            severity: item.severity,
            actionKind: item.actionKind,
            title: item.title,
            detail: item.detail,
            rowIndex: item.rowIndex,
            requestIndex: item.requestIndex,
            updatedAt: typed.updated_at,
            href: `/intelligence/imports/${encodeURIComponent(plan.batch.id)}`,
          }));
      });
  }

  listTrades(userId: TraderAnalyticsUserId): SavedExecutionTrade[] {
    return this.db
      .prepare(
        "SELECT json FROM saved_trades WHERE user_id = ? ORDER BY session_date ASC, id ASC",
      )
      .all(userId)
      .map((row) => {
        const trade = rowJson<ImportCommitSavedTradeRecord>(row);
        return savedTradeToAnalyticsTrade(trade, this.listTradeNotes(trade.id));
      });
  }

  getTrade(
    userId: TraderAnalyticsUserId,
    tradeId: SavedExecutionTradeId,
  ): SavedExecutionTrade | null {
    const row = this.db
      .prepare("SELECT json FROM saved_trades WHERE user_id = ? AND id = ?")
      .get(userId, tradeId);
    if (!row) {
      return null;
    }

    const trade = rowJson<ImportCommitSavedTradeRecord>(row);
    return savedTradeToAnalyticsTrade(trade, this.listTradeNotes(trade.id));
  }

  saveTrade(trade: SavedExecutionTrade): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO saved_trades (
          id, workspace_id, account_id, user_id, import_batch_id,
          trade_fingerprint, symbol, lifecycle_status, opened_at, session_date, json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        trade.id,
        DEMO_WORKSPACE_ID,
        trade.accountId,
        trade.userId,
        "manual",
        null,
        trade.symbol,
        "closed",
        trade.importedAt,
        trade.sessionDate,
        json({
          ...trade,
          workspaceId: DEMO_WORKSPACE_ID,
          importBatchId: "manual",
          repairSource: trade.repairSource ?? "original_csv",
          requestIndex: 0,
          tradeFingerprint: null,
          entrySessionBucket: String(trade.entrySessionBucket ?? trade.sessionBucket),
          entryHourLabelEt: trade.entryHourLabelEt ?? "",
          heldSessionBuckets: trade.heldSessionBuckets ?? [],
          heldHourBucketsEt: trade.heldHourBucketsEt ?? [],
          heldPremarketIntoOpen: false,
          heldOpenIntoMidday: false,
          heldMiddayIntoPostmarket: false,
          heldPostmarketIntoOvernight: false,
          heldOvernight: false,
          lifecycleStatus: "closed",
          openedAt: trade.importedAt,
          closedAt: null,
          grossRealizedPnl: null,
          reviewStatus: trade.reviewStatus,
        } satisfies ImportCommitSavedTradeRecord),
      );
  }

  addTradeNote(args: {
    userId: TraderAnalyticsUserId;
    tradeId: SavedExecutionTradeId;
    body: string;
    createdAt?: string;
  }): SavedReportNote | null {
    const trade = this.getSavedTrade(args.tradeId);
    if (!trade || trade.userId !== args.userId) {
      return null;
    }

    const body = args.body.trim();
    if (body.length === 0) {
      return null;
    }

    const createdAt = args.createdAt ?? new Date().toISOString();
    const note: SavedReportNote = {
      id: `note:${args.tradeId}:${createdAt}`,
      createdAt,
      body: body.slice(0, 2000),
    };

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          "INSERT OR REPLACE INTO saved_trade_notes (id, saved_trade_id, user_id, created_at, body, json) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(note.id, args.tradeId, args.userId, note.createdAt, note.body, json(note));
      this.markTradeInProgress(trade);
    });

    transaction();
    return note;
  }

  listTradeNotes(tradeId: SavedExecutionTradeId): SavedReportNote[] {
    return this.db
      .prepare(
        "SELECT json FROM saved_trade_notes WHERE saved_trade_id = ? ORDER BY created_at ASC",
      )
      .all(tradeId)
      .map((row) => rowJson<SavedReportNote>(row));
  }

  setTradeReviewStatus(args: {
    userId: TraderAnalyticsUserId;
    tradeId: SavedExecutionTradeId;
    status: SavedReviewStatus;
  }): SavedExecutionTrade | null {
    const trade = this.getSavedTrade(args.tradeId);
    if (!trade || trade.userId !== args.userId) {
      return null;
    }

    const updated: ImportCommitSavedTradeRecord = {
      ...trade,
      reviewStatus: args.status,
    };

    this.db
      .prepare("UPDATE saved_trades SET json = ? WHERE id = ?")
      .run(json(updated), trade.id);

    return savedTradeToAnalyticsTrade(updated, this.listTradeNotes(trade.id));
  }

  markTradeClosedByUser(args: {
    userId: TraderAnalyticsUserId;
    tradeId: SavedExecutionTradeId;
    updatedAt?: string;
  }): SavedExecutionTrade | null {
    const trade = this.getSavedTrade(args.tradeId);
    if (!trade || trade.userId !== args.userId) {
      return null;
    }

    const updatedAt = args.updatedAt ?? new Date().toISOString();
    const updated: ImportCommitSavedTradeRecord = {
      ...trade,
      closedAt: trade.closedAt ?? updatedAt,
      lifecycleStatus: "closed",
      reviewStatus: "ignored",
      userLifecycleOverride: {
        reason: "marked_closed_by_user",
        status: "closed",
        updatedAt,
      },
    };
    const jobs = this.db
      .prepare("SELECT json FROM decision_review_jobs WHERE saved_trade_id = ?")
      .all(trade.id)
      .map((row) => rowJson<ImportCommitDecisionReviewJobRecord>(row));
    const blockedJobs = jobs.filter(
      (job) => job.status === "blocked_open_trade",
    );

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          "UPDATE saved_trades SET lifecycle_status = ?, json = ? WHERE id = ?",
        )
        .run(updated.lifecycleStatus, json(updated), trade.id);

      for (const job of blockedJobs) {
        const updatedJob: ImportCommitDecisionReviewJobRecord = {
          ...job,
          reason:
            "Trader marked the open or swing trade closed; this item is removed from open/swing review.",
          status: "skipped_limit",
        };

        this.db
          .prepare(
            "UPDATE decision_review_jobs SET status = ?, json = ? WHERE id = ?",
          )
          .run(updatedJob.status, json(updatedJob), updatedJob.id);
      }
    });

    transaction();

    return savedTradeToAnalyticsTrade(updated, this.listTradeNotes(trade.id));
  }

  setTradeReviewItemStatus(args: {
    userId: TraderAnalyticsUserId;
    tradeId: SavedExecutionTradeId;
    itemId: TradeReviewChecklistItemId;
    status: TradeReviewChecklistItemStatus;
    updatedAt?: string;
  }): PersistedTradeReviewItemState | null {
    const trade = this.getSavedTrade(args.tradeId);
    if (!trade || trade.userId !== args.userId) {
      return null;
    }

    const updatedAt = args.updatedAt ?? new Date().toISOString();
    const state: PersistedTradeReviewItemState = {
      tradeId: args.tradeId,
      itemId: args.itemId,
      status: args.status,
      updatedAt,
    };

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO trade_review_item_states (
            id, saved_trade_id, user_id, item_id, status, updated_at, json
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(saved_trade_id, item_id) DO UPDATE SET
            status = excluded.status,
            updated_at = excluded.updated_at,
            json = excluded.json`,
        )
        .run(
          `review-item:${args.tradeId}:${args.itemId}`,
          args.tradeId,
          args.userId,
          args.itemId,
          args.status,
          updatedAt,
          json(state),
        );
      this.markTradeInProgress(trade);
    });

    transaction();
    return state;
  }

  listTradeReviewItemStates(
    tradeId: SavedExecutionTradeId,
  ): PersistedTradeReviewItemState[] {
    return this.db
      .prepare(
        "SELECT json FROM trade_review_item_states WHERE saved_trade_id = ? ORDER BY item_id ASC",
      )
      .all(tradeId)
      .map((row) => rowJson<PersistedTradeReviewItemState>(row));
  }

  updateRepairItemStatus(args: {
    importBatchId: string;
    repairItemId: string;
    status: ImportCommitRepairItemRecord["status"];
    createdAt?: string;
  }): ImportCommitRepairItemRecord | null {
    const plan = this.getPreviewPlan(args.importBatchId);
    if (!plan) {
      return null;
    }

    const repairItem = plan.repairItems.find((item) => item.id === args.repairItemId);
    if (!repairItem) {
      return null;
    }

    const updatedItem: ImportCommitRepairItemRecord = {
      ...repairItem,
      status: args.status,
    };
    const updatedPlan: ImportCommitPlanResult = {
      ...plan,
      repairItems: plan.repairItems.map((item) =>
        item.id === args.repairItemId ? updatedItem : item,
      ),
    };
    const createdAt = args.createdAt ?? new Date().toISOString();
    const event: ImportRepairActionEvent = {
      id: `repair-event:${args.importBatchId}:${args.repairItemId}:${createdAt}`,
      importBatchId: args.importBatchId,
      repairItemId: args.repairItemId,
      status: args.status,
      createdAt,
    };

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          "UPDATE import_batches SET plan_json = ?, updated_at = ? WHERE id = ?",
        )
        .run(json(updatedPlan), createdAt, args.importBatchId);
      this.db
        .prepare(
          "UPDATE import_repair_items SET status = ?, json = ? WHERE id = ? AND import_batch_id = ?",
        )
        .run(args.status, json(updatedItem), args.repairItemId, args.importBatchId);
      this.db
        .prepare(
          "INSERT OR REPLACE INTO import_repair_events (id, import_batch_id, repair_item_id, status, created_at, json) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(
          event.id,
          event.importBatchId,
          event.repairItemId,
          event.status,
          event.createdAt,
          json(event),
        );
    });

    transaction();
    return updatedItem;
  }

  listImportRepairEvents(importBatchId: string): ImportRepairActionEvent[] {
    return this.db
      .prepare(
        "SELECT json FROM import_repair_events WHERE import_batch_id = ? ORDER BY created_at ASC",
      )
      .all(importBatchId)
      .map((row) => rowJson<ImportRepairActionEvent>(row));
  }

  listReports(userId: TraderAnalyticsUserId): SavedTraderAnalyticsReport[] {
    return this.db
      .prepare("SELECT json FROM saved_reports WHERE user_id = ? ORDER BY generated_at DESC")
      .all(userId)
      .map((row) => rowJson<SavedTraderAnalyticsReport>(row));
  }

  getReport(
    userId: TraderAnalyticsUserId,
    reportId: SavedTraderAnalyticsReportId,
  ): SavedTraderAnalyticsReport | null {
    const row = this.db
      .prepare("SELECT json FROM saved_reports WHERE user_id = ? AND id = ?")
      .get(userId, reportId);
    return row ? rowJson<SavedTraderAnalyticsReport>(row) : null;
  }

  saveReport(report: SavedTraderAnalyticsReport): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO saved_reports (id, user_id, account_id, generated_at, sample_data, json) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        report.id,
        report.userId,
        report.accountId,
        report.generatedAt,
        report.sampleData ? 1 : 0,
        json(report),
      );
  }

  private deletePreviewChildren(batchId: string): void {
    for (const table of ["import_rows", "import_issues", "import_repair_items"]) {
      this.db.prepare(`DELETE FROM ${table} WHERE import_batch_id = ?`).run(batchId);
    }
  }

  private savePreviewPlanUnsafe(plan: ImportCommitPlanResult): void {
    this.deletePreviewChildren(plan.batch.id);
    this.db
      .prepare(
        `INSERT INTO import_batches (
          id, workspace_id, account_id, user_id, status, broker_key,
          broker_label, file_fingerprint, trade_fingerprints_json, plan_json,
          created_at, updated_at, committed_at
        ) VALUES (
          @id, @workspaceId, @accountId, @userId, @status, @brokerKey,
          @brokerLabel, @fileFingerprint, @tradeFingerprintsJson, @planJson,
          @createdAt, @updatedAt, @committedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          plan_json = excluded.plan_json,
          updated_at = excluded.updated_at`,
      )
      .run({
        id: plan.batch.id,
        workspaceId: plan.batch.workspaceId,
        accountId: plan.batch.accountId,
        userId: plan.batch.userId,
        status: plan.batch.status,
        brokerKey: plan.batch.brokerKey,
        brokerLabel: plan.batch.brokerLabel,
        fileFingerprint: plan.batch.fileFingerprint,
        tradeFingerprintsJson: json(
          plan.savedTrades.map((trade) => trade.tradeFingerprint).filter(Boolean),
        ),
        planJson: json(plan),
        createdAt: plan.batch.createdAt,
        updatedAt: plan.batch.updatedAt,
        committedAt: null,
      });

    this.insertPreviewChildren(plan);
  }

  private insertPreviewChildren(plan: ImportCommitPlanResult): void {
    for (const row of plan.rows) {
      this.db
        .prepare(
          "INSERT OR REPLACE INTO import_rows (id, import_batch_id, row_index, status, symbol, json) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(row.id, row.importBatchId, row.rowIndex, row.status, row.symbol, json(row));
    }
    for (const issue of plan.issues) {
      this.db
        .prepare(
          "INSERT OR REPLACE INTO import_issues (id, import_batch_id, issue_code, severity, row_index, request_index, json) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          issue.id,
          issue.importBatchId,
          issue.issueCode,
          issue.severity,
          issue.rowIndex,
          issue.requestIndex,
          json(issue),
        );
    }
    for (const repair of plan.repairItems) {
      this.db
        .prepare(
          "INSERT OR REPLACE INTO import_repair_items (id, import_batch_id, severity, status, json) VALUES (?, ?, ?, ?, ?)",
        )
        .run(repair.id, repair.importBatchId, repair.severity, repair.status, json(repair));
    }
  }

  private insertExecution(execution: ImportCommitExecutionRecord): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO normalized_executions (id, workspace_id, account_id, import_batch_id, sequence_index, symbol, timestamp, side, json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        execution.id,
        execution.workspaceId,
        execution.accountId,
        execution.importBatchId,
        execution.sequenceIndex,
        execution.symbol,
        execution.timestamp,
        execution.side,
        json(execution),
      );
  }

  private insertSavedTrade(trade: ImportCommitSavedTradeRecord): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO saved_trades (id, workspace_id, account_id, user_id, import_batch_id, trade_fingerprint, symbol, lifecycle_status, opened_at, session_date, json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        trade.id,
        trade.workspaceId,
        trade.accountId,
        trade.userId,
        trade.importBatchId,
        trade.tradeFingerprint,
        trade.symbol,
        trade.lifecycleStatus,
        trade.openedAt,
        trade.sessionDate,
        json(trade),
      );
  }

  private markTradeInProgress(trade: ImportCommitSavedTradeRecord): void {
    const updated: ImportCommitSavedTradeRecord = {
      ...trade,
      reviewStatus:
        trade.reviewStatus === "new" ? "in_progress" : trade.reviewStatus,
    };

    this.db
      .prepare("UPDATE saved_trades SET json = ? WHERE id = ?")
      .run(json(updated), trade.id);
  }

  private insertLink(link: ImportCommitSavedTradeExecutionLinkRecord): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO saved_trade_execution_links (id, saved_trade_id, execution_id, json) VALUES (?, ?, ?, ?)",
      )
      .run(link.id, link.savedTradeId, link.executionId, json(link));
  }

  private insertGroupingDiagnostic(
    diagnostic: ImportCommitTradeGroupingDiagnosticRecord,
  ): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO trade_grouping_diagnostics (id, import_batch_id, saved_trade_id, json) VALUES (?, ?, ?, ?)",
      )
      .run(
        diagnostic.id,
        diagnostic.importBatchId,
        diagnostic.savedTradeId,
        json(diagnostic),
      );
  }

  private insertFeedbackSummary(
    summary: ImportCommitExecutionFeedbackSummaryRecord,
  ): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO execution_feedback_summaries (id, saved_trade_id, generated_at, json) VALUES (?, ?, ?, ?)",
      )
      .run(summary.id, summary.savedTradeId, summary.generatedAt, json(summary));
  }

  private insertDecisionReviewJob(job: ImportCommitDecisionReviewJobRecord): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO decision_review_jobs (id, saved_trade_id, import_batch_id, status, symbol, json) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(job.id, job.savedTradeId, job.importBatchId, job.status, job.symbol, json(job));
  }

  private saveRouteMetadata(accountId: string, value: unknown): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO route_read_model_metadata (id, account_id, updated_at, json) VALUES (?, ?, ?, ?)",
      )
      .run(
        `latest:${accountId}`,
        accountId,
        new Date().toISOString(),
        json(value),
      );
  }
}
