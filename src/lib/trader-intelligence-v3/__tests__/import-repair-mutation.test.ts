import { describe, expect, it } from "vitest";

import {
  buildImportRepairReplacement,
  IMPORT_REPAIR_MUTATION_VERSION,
  validateImportRepairMutation,
} from "../ingestion/import-repair-mutation";
import type { PersistedImportRepairRecord } from "../ingestion/import-repair-record";
import type { PersistedRawBrokerCsvImport } from "../ingestion/persisted-raw-broker-csv-import";

function statement(): PersistedImportRepairRecord {
  const values = Object.freeze({
    symbol: "AAPL",
    timestamp: "2026-07-20T14:30:00.000Z",
    side: "buy",
    quantity: "10",
    price: "200",
    currency: "USD",
    commission: null,
    fees: null,
    orderId: "order-1",
    executionId: "execution-1",
  });
  return {
    schemaVersion: "ti_v3_import_repair_record_v2",
    canonicalOwnerKey: "owner_test",
    canonicalAccountKey: "account_test",
    persistenceDigest: "old-digest",
    brokerCode: "test",
    originalCsvBase64: "",
    originalCsvDigest: "source",
    rows: [{
      sourceRowNumber: "2",
      status: "accepted",
      ...values,
      issues: [{ code: "fees_missing", message: "fees", severity: "warning", field: "fees" }],
      originalValues: values,
      currentValues: values,
      decision: "needs_attention",
    }],
    documentIssues: [],
  };
}

function source(): PersistedRawBrokerCsvImport {
  return {
    acceptedExecutions: [{
      content: {
        rawBrokerSymbol: "AAPL",
        executedAt: "2026-07-20T14:30:00.000000000Z",
        side: "buy",
        quantity: "10",
        price: "200",
        currency: "USD",
        charges: [],
        orderId: "order-1",
        executionId: "execution-1",
      },
    }],
  } as PersistedRawBrokerCsvImport;
}

describe("Import Repair mutation", () => {
  it("rejects a stale statement digest", () => {
    const result = validateImportRepairMutation({
      contractVersion: IMPORT_REPAIR_MUTATION_VERSION,
      persistenceDigest: "other-digest",
      rows: [{ sourceRowNumber: "2", action: "exclude_row", values: null }],
    }, statement());
    expect(result).toMatchObject({
      ok: false,
      error: { code: "import_repair_statement_mismatch" },
    });
  });

  it("builds a corrected replacement and preserves immutable originals", () => {
    const current = statement();
    const validated = validateImportRepairMutation({
      contractVersion: IMPORT_REPAIR_MUTATION_VERSION,
      persistenceDigest: current.persistenceDigest,
      rows: [{
        sourceRowNumber: "2",
        action: "save_correction",
        values: {
          timestamp: "2026-07-20T14:30:00.000Z",
          symbol: "AAPL",
          side: "buy",
          quantity: "10",
          price: "200",
          currency: "USD",
          commission: "-1.25",
          fees: "0.15",
          orderId: "order-1",
          executionId: "execution-1",
        },
      }],
    }, current);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const replacement = buildImportRepairReplacement({
      source: source(),
      statement: current,
      mutation: validated.value,
    });
    expect(replacement.rows[0]).toMatchObject({
      decision: "corrected",
      commission: "-1.25",
      fees: "0.15",
      originalValues: { commission: null, fees: null },
    });
    expect(replacement.normalizedCsv).toContain("AAPL,2026-07-20T14:30:00.000Z,buy,10,200,USD,-1.25,0.15");
  });

  it("excludes a row from V3 while retaining its companion evidence", () => {
    const current = statement();
    const validated = validateImportRepairMutation({
      contractVersion: IMPORT_REPAIR_MUTATION_VERSION,
      persistenceDigest: current.persistenceDigest,
      rows: [{ sourceRowNumber: "2", action: "exclude_row", values: null }],
    }, current);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const replacement = buildImportRepairReplacement({
      source: source(),
      statement: current,
      mutation: validated.value,
    });
    expect(replacement.rows[0]?.decision).toBe("excluded");
    expect(replacement.rows[0]?.originalValues.symbol).toBe("AAPL");
    expect(replacement.normalizedCsv.split(/\r?\n/)).toHaveLength(1);
  });
});
