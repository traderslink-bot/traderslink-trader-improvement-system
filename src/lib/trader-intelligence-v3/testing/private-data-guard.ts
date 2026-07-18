export type TraderIntelligencePrivateDataFindingCode =
  | "ti_v3_private_path"
  | "ti_v3_broker_export_filename"
  | "ti_v3_private_screenshot"
  | "ti_v3_real_broker_csv_rows"
  | "ti_v3_account_identifier"
  | "ti_v3_personal_financial_identifier"
  | "ti_v3_api_key"
  | "ti_v3_access_token"
  | "ti_v3_secret";

export interface TraderIntelligencePrivateDataRecord {
  path: string;
  content: string;
  sourceKind: "worktree" | "staged" | "synthetic_test";
}

export interface TraderIntelligencePrivateDataFinding {
  code: TraderIntelligencePrivateDataFindingCode;
  path: string;
  line: number | null;
  sourceKind: TraderIntelligencePrivateDataRecord["sourceKind"];
}

const SYNTHETIC_FIXTURE_ALLOWLIST = [
  "src/docs/trade-execution-import-fixtures/",
  "src/lib/execution-sources/csv/__fixtures__/",
  "src/lib/trader-analytics/__fixtures__/",
] as const;

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function isSyntheticFixtureAllowed(path: string): boolean {
  return SYNTHETIC_FIXTURE_ALLOWLIST.some((prefix) => path.startsWith(prefix));
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function addContentFindings(
  findings: TraderIntelligencePrivateDataFinding[],
  record: TraderIntelligencePrivateDataRecord,
  code: TraderIntelligencePrivateDataFindingCode,
  pattern: RegExp,
): void {
  for (const match of record.content.matchAll(pattern)) {
    findings.push({
      code,
      path: normalizedPath(record.path),
      line: lineNumberAt(record.content, match.index ?? 0),
      sourceKind: record.sourceKind,
    });
  }
}

function hasLikelyBrokerRows(content: string): boolean {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return false;
  }
  const header = lines[0].toLowerCase();
  const hasExecutionHeader =
    header.includes("symbol") &&
    (header.includes("quantity") || header.includes("qty")) &&
    header.includes("price") &&
    (header.includes("time") || header.includes("date"));
  return hasExecutionHeader && lines.slice(1).some((line) => line.split(",").length >= 4);
}

export function scanTraderIntelligencePrivateData(
  records: readonly TraderIntelligencePrivateDataRecord[],
): readonly TraderIntelligencePrivateDataFinding[] {
  const findings: TraderIntelligencePrivateDataFinding[] = [];

  for (const record of records) {
    const path = normalizedPath(record.path);
    const allowedSyntheticFixture = isSyntheticFixtureAllowed(path);

    if (/(^|\/)(?:private|private-data|private-fixtures|broker-exports)(\/|$)/i.test(path)) {
      findings.push({
        code: "ti_v3_private_path",
        path,
        line: null,
        sourceKind: record.sourceKind,
      });
    }
    if (
      !allowedSyntheticFixture &&
      /(?:trade|order|execution|account)[-_ ]?(?:history|statement|export).*\.csv$/i.test(
        path,
      )
    ) {
      findings.push({
        code: "ti_v3_broker_export_filename",
        path,
        line: null,
        sourceKind: record.sourceKind,
      });
    }
    if (
      /(?:private|broker|account|portfolio).*(?:png|jpe?g|webp)$/i.test(path)
    ) {
      findings.push({
        code: "ti_v3_private_screenshot",
        path,
        line: null,
        sourceKind: record.sourceKind,
      });
    }
    if (
      path.toLowerCase().endsWith(".csv") &&
      !allowedSyntheticFixture &&
      hasLikelyBrokerRows(record.content)
    ) {
      findings.push({
        code: "ti_v3_real_broker_csv_rows",
        path,
        line: 1,
        sourceKind: record.sourceKind,
      });
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
      `${finding.code}:${finding.path}:${finding.line ?? "path"}:${finding.sourceKind}`,
      finding,
    );
  }
  return [...deduplicated.values()].sort((left, right) =>
    `${left.path}:${left.line ?? 0}:${left.code}`.localeCompare(
      `${right.path}:${right.line ?? 0}:${right.code}`,
    ),
  );
}
