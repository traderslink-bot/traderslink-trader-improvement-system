import { createHash } from "node:crypto";

import { TRADER_INTELLIGENCE_SYNTHETIC_FIXTURE_SHA256 } from "./synthetic-fixture-manifest";

export type TraderIntelligencePrivateDataFindingCode =
  | "ti_v3_private_path"
  | "ti_v3_broker_export_filename"
  | "ti_v3_private_screenshot"
  | "ti_v3_real_broker_csv_rows"
  | "ti_v3_synthetic_fixture_unapproved"
  | "ti_v3_synthetic_fixture_hash_mismatch"
  | "ti_v3_private_scan_oversized"
  | "ti_v3_account_identifier"
  | "ti_v3_personal_financial_identifier"
  | "ti_v3_api_key"
  | "ti_v3_access_token"
  | "ti_v3_secret";

export interface TraderIntelligencePrivateDataRecord {
  path: string;
  content: string;
  sourceKind: "worktree" | "staged" | "pr_history" | "synthetic_test";
  commit?: string | null;
  scanStatus?: "text" | "binary" | "oversized";
}

export interface TraderIntelligencePrivateDataFinding {
  code: TraderIntelligencePrivateDataFindingCode;
  path: string;
  line: number | null;
  sourceKind: TraderIntelligencePrivateDataRecord["sourceKind"];
  commit: string | null;
}

const FIXTURE_DIRECTORY_PATTERN =
  /^(?:src\/docs\/trade-execution-import-fixtures|src\/lib\/execution-sources\/csv\/__fixtures__|src\/lib\/trader-analytics\/__fixtures__)\//;

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function fixtureApproval(path: string, content: string) {
  const expected =
    TRADER_INTELLIGENCE_SYNTHETIC_FIXTURE_SHA256[
      path as keyof typeof TRADER_INTELLIGENCE_SYNTHETIC_FIXTURE_SHA256
    ];
  if (!expected) {
    return { listed: false, hashMatches: false };
  }
  const canonicalContent = content.replace(/\r\n?/g, "\n");
  const actual = createHash("sha256")
    .update(canonicalContent, "utf8")
    .digest("hex");
  return { listed: true, hashMatches: actual === expected };
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function addFinding(
  findings: TraderIntelligencePrivateDataFinding[],
  record: TraderIntelligencePrivateDataRecord,
  code: TraderIntelligencePrivateDataFindingCode,
  line: number | null,
): void {
  findings.push({
    code,
    path: normalizedPath(record.path),
    line,
    sourceKind: record.sourceKind,
    commit: record.commit ?? null,
  });
}

function addContentFindings(
  findings: TraderIntelligencePrivateDataFinding[],
  record: TraderIntelligencePrivateDataRecord,
  code: TraderIntelligencePrivateDataFindingCode,
  pattern: RegExp,
): void {
  for (const match of record.content.matchAll(pattern)) {
    addFinding(findings, record, code, lineNumberAt(record.content, match.index ?? 0));
  }
}

function hasLikelyBrokerRows(content: string): boolean {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return false;
  }
  const header = lines[0].toLowerCase();
  const hasExecutionHeader =
    (header.includes("symbol") || header.includes("ticker")) &&
    (header.includes("quantity") ||
      header.includes("qty") ||
      header.includes("shares")) &&
    (header.includes("price") || header.includes("amount")) &&
    (header.includes("time") || header.includes("date"));
  return (
    hasExecutionHeader &&
    lines.slice(1).some((line) => line.split(",").length >= 4)
  );
}

export function scanTraderIntelligencePrivateData(
  records: readonly TraderIntelligencePrivateDataRecord[],
): readonly TraderIntelligencePrivateDataFinding[] {
  const findings: TraderIntelligencePrivateDataFinding[] = [];

  for (const record of records) {
    const path = normalizedPath(record.path);
    const fixture = fixtureApproval(path, record.content);
    const brokerFilename =
      /(?:trade|order|execution|account)[-_ ]?(?:history|statement|export).*\.csv$/i.test(
        path,
      );
    const brokerRows = path.toLowerCase().endsWith(".csv")
      ? hasLikelyBrokerRows(record.content)
      : false;

    if (/(^|\/)(?:private|private-data|private-fixtures|broker-exports)(\/|$)/i.test(path)) {
      addFinding(findings, record, "ti_v3_private_path", null);
    }
    if (/(?:private|broker|account|portfolio).*(?:png|jpe?g|webp)$/i.test(path)) {
      addFinding(findings, record, "ti_v3_private_screenshot", null);
    }
    if (record.scanStatus === "oversized" && /\.(?:csv|txt|jsonl?|env|log|sql|sqlite|db|ya?ml|tsx?|jsx?|md)$/i.test(path)) {
      addFinding(findings, record, "ti_v3_private_scan_oversized", null);
    }

    if (FIXTURE_DIRECTORY_PATTERN.test(path) && (brokerFilename || brokerRows)) {
      if (!fixture.listed) {
        addFinding(findings, record, "ti_v3_synthetic_fixture_unapproved", null);
      } else if (!fixture.hashMatches) {
        addFinding(findings, record, "ti_v3_synthetic_fixture_hash_mismatch", null);
      }
    }
    const approvedSyntheticFixture = fixture.listed && fixture.hashMatches;
    if (brokerFilename && !approvedSyntheticFixture) {
      addFinding(findings, record, "ti_v3_broker_export_filename", null);
    }
    if (brokerRows && !approvedSyntheticFixture) {
      addFinding(findings, record, "ti_v3_real_broker_csv_rows", 1);
    }

    if (record.scanStatus === "binary" || record.scanStatus === "oversized") {
      continue;
    }
    addContentFindings(
      findings,
      record,
      "ti_v3_account_identifier",
      /\baccount(?:\s+(?:number|id))?\s*[,=:]\s*(?=[A-Z0-9-]*\d[A-Z0-9-]*\d[A-Z0-9-]*\d[A-Z0-9-]*\d)[A-Z0-9-]{6,}\b/gi,
    );
    addContentFindings(
      findings,
      record,
      "ti_v3_personal_financial_identifier",
      /\b\d{3}-\d{2}-\d{4}\b/g,
    );
    addContentFindings(
      findings,
      record,
      "ti_v3_api_key",
      /\b(?:sk-[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})\b/g,
    );
    addContentFindings(
      findings,
      record,
      "ti_v3_access_token",
      /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
    );
    addContentFindings(
      findings,
      record,
      "ti_v3_secret",
      /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][^"'\r\n]{16,}["']/gi,
    );
  }

  const deduplicated = new Map<string, TraderIntelligencePrivateDataFinding>();
  for (const finding of findings) {
    deduplicated.set(
      `${finding.code}:${finding.path}:${finding.line ?? "path"}:${finding.sourceKind}:${finding.commit ?? "worktree"}`,
      finding,
    );
  }
  return [...deduplicated.values()].sort((left, right) =>
    `${left.path}:${left.commit ?? ""}:${left.line ?? 0}:${left.code}`.localeCompare(
      `${right.path}:${right.commit ?? ""}:${right.line ?? 0}:${right.code}`,
    ),
  );
}
