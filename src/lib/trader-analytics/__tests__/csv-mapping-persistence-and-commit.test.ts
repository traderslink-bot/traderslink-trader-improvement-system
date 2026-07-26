import { mkdtempSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  inferGenericCsvSchema,
  normalizeGenericCsvMappingReviewCsv,
} from "../../execution-sources/csv";
import {
  SqliteImportCommitRepository,
  resetTraderIntelligenceDatabaseForTests,
} from "../product/import-commit/sqlite-import-commit-repository";
import {
  deleteOwnerCsvMappingTemplate,
  listOwnerCsvMappingTemplates,
  saveOwnerCsvMappingTemplate,
} from "../server/csv-mapping-template-service";
import {
  buildDurableImportCommitPlan,
  parseImportCommitRequestInput,
} from "../server/import-commit-service";
import { resolveOwnerWorkspaceImportContext } from "../server/owner-workspace-context";

let tempDir = "";
let originalDbPath: string | undefined;
let originalDataMode: string | undefined;

function context(ownerId: string, repository: SqliteImportCommitRepository) {
  return resolveOwnerWorkspaceImportContext({
    owner: { identity: { ownerId } },
    repository,
  });
}

beforeEach(() => {
  originalDbPath = process.env.TRADER_INTELLIGENCE_DB_PATH;
  originalDataMode = process.env.TRADER_INTELLIGENCE_DATA_MODE;
  tempDir = mkdtempSync(join(homedir(), ".trader-intelligence-csv-map-"));
  process.env.TRADER_INTELLIGENCE_DB_PATH = join(tempDir, "test.sqlite");
  process.env.TRADER_INTELLIGENCE_DATA_MODE = "real_owner_data";
  resetTraderIntelligenceDatabaseForTests();
});

afterEach(() => {
  resetTraderIntelligenceDatabaseForTests();
  if (originalDbPath === undefined) delete process.env.TRADER_INTELLIGENCE_DB_PATH;
  else process.env.TRADER_INTELLIGENCE_DB_PATH = originalDbPath;
  if (originalDataMode === undefined) delete process.env.TRADER_INTELLIGENCE_DATA_MODE;
  else process.env.TRADER_INTELLIGENCE_DATA_MODE = originalDataMode;
  rmSync(tempDir, { recursive: true, force: true });
});

describe("owner CSV mapping persistence and controlled continuation", () => {
  const csv = [
    "Symbol,Executed At,Side,Quantity,Price,Commission,Fees",
    "AAPL,2026-07-24 09:35:00,BUY,10,182.10,1.00,0.05",
    "AAPL,2026-07-24 10:05:00,SELL,10,184.25,1.00,0.05",
  ].join("\n");

  it("accepts expanded broker selections and resolves their preset mappings", () => {
    const input = parseImportCommitRequestInput({
      broker: "alpaca_trade_activities",
      csvText: "activity_type,transaction_time,side,qty,symbol,price",
    });

    expect(input).toMatchObject({
      broker: "generic_execution_csv",
      columnMapping: {
        status: ["activity_type"],
        timestamp: ["transaction_time"],
      },
    });
  });

  it("isolates versioned templates by owner and account and rejects foreign updates", () => {
    const repository = new SqliteImportCommitRepository();
    const first = context("owner-one", repository);
    const second = context("owner-two", repository);
    const inference = inferGenericCsvSchema(csv);
    const template = saveOwnerCsvMappingTemplate({
      context: first,
      repository,
      input: {
        name: "Broker export",
        normalizedHeaders: inference.headers,
        delimiter: inference.delimiter,
        columnMapping: inference.proposedMapping,
        sideValueMapping: { buy: "buy", sell: "sell" },
        timestampTimezone: "America/Toronto",
      },
    });

    expect(template.contractVersion).toBe("owner_csv_mapping_template_v1");
    expect(listOwnerCsvMappingTemplates({ context: first, repository })).toHaveLength(1);
    expect(listOwnerCsvMappingTemplates({ context: second, repository })).toHaveLength(0);
    expect(() => saveOwnerCsvMappingTemplate({ context: second, repository, templateId: template.id, input: { ...template } })).toThrow(/active account/);
    expect(deleteOwnerCsvMappingTemplate({ context: second, repository, templateId: template.id })).toBe(false);
    expect(deleteOwnerCsvMappingTemplate({ context: first, repository, templateId: template.id })).toBe(true);
  });

  it("reparses reviewed CSV server-side into the existing commit planner without a preview write", () => {
    const repository = new SqliteImportCommitRepository();
    const ownerContext = context("owner-commit", repository);
    const inference = inferGenericCsvSchema(csv);
    const normalizedCsv = normalizeGenericCsvMappingReviewCsv({
      csvText: csv,
      inference,
      columnMapping: inference.proposedMapping,
      sideValueMapping: { buy: "buy", sell: "sell" },
    });
    const plan = buildDurableImportCommitPlan({
      repository,
      context: ownerContext,
      input: {
        csvText: normalizedCsv,
        broker: "generic_execution_csv",
        columnMapping: inference.proposedMapping,
        acknowledgements: {
          mappingReview: true,
          groupingReview: true,
          pnlReview: true,
          openPositions: true,
          rejectedRows: true,
        },
      },
    });

    expect(plan.batch.userId).toBe("owner-commit");
    expect(plan.batch.accountId).toBe(ownerContext.account.id);
    expect(plan.executions).toHaveLength(2);
    expect(plan.executions.map((execution) => execution.commission)).toEqual([1, 1]);
    expect(plan.executions.map((execution) => execution.fees)).toEqual([0.05, 0.05]);
    expect(repository.listSavedTrades(ownerContext.account.id)).toHaveLength(0);
    repository.savePreviewPlan(plan);
    expect(repository.getPreviewPlan(plan.batch.id)?.executions).toHaveLength(2);
    expect(repository.listSavedTrades(ownerContext.account.id)).toHaveLength(0);

    expect(plan.canCommitNow).toBe(true);
    const committed = repository.commitImportPlan(plan);
    expect(committed.status).toBe("committed");
    expect(repository.listSavedTrades(ownerContext.account.id)).toHaveLength(1);

    const replay = repository.commitImportPlan(plan);
    expect(replay).toMatchObject({
      status: "rejected",
      message: "This file has already been committed for the active account.",
    });
  });
});
