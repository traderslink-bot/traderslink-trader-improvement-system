import {
  parseBrokerExecutionCsv,
  type BrokerExecutionCsvCanonicalField,
  type BrokerExecutionCsvColumnMapping,
  type BrokerExecutionCsvImportResult,
  type BrokerExecutionCsvOptionsHandling,
  type BrokerExecutionCsvTradeGroupingRules,
} from "./broker-execution-csv-import";

export type CsvFieldInferenceConfidence = "high" | "medium" | "low" | "none";
export type CsvMappingReviewStatus = "ready" | "needs_review" | "blocked";

export interface CsvColumnProfile {
  header: string;
  normalizedHeader: string;
  sampleValues: string[];
  nonEmptyCount: number;
  numericRatio: number;
  positiveNumericRatio: number;
  integerRatio: number;
  dateTimeRatio: number;
  symbolRatio: number;
  sideRatio: number;
  currencyRatio: number;
}

export interface CsvFieldCandidate {
  field: BrokerExecutionCsvCanonicalField;
  score: number;
  confidence: CsvFieldInferenceConfidence;
  reasons: string[];
}

export interface CsvColumnInference {
  header: string;
  profile: CsvColumnProfile;
  candidates: CsvFieldCandidate[];
  suggestedField: BrokerExecutionCsvCanonicalField | null;
  confidence: CsvFieldInferenceConfidence;
  requiresReview: boolean;
}

export interface CsvValueMappingSuggestion {
  field: "side";
  sourceValue: string;
  normalizedValue: "buy" | "sell" | null;
  confidence: CsvFieldInferenceConfidence;
}

export interface CsvMappingConflict {
  code:
    | "required_field_unmapped"
    | "duplicate_destination_field"
    | "ambiguous_required_field"
    | "timestamp_unresolved"
    | "side_unresolved";
  field?: BrokerExecutionCsvCanonicalField;
  headers: string[];
  message: string;
}

export interface CsvSchemaInferenceResult {
  contractVersion: "generic_csv_schema_inference_v1";
  delimiter: "," | ";" | "\t";
  headerRowIndex: number;
  headers: string[];
  profiles: CsvColumnProfile[];
  columns: CsvColumnInference[];
  proposedMapping: BrokerExecutionCsvColumnMapping;
  valueMappings: CsvValueMappingSuggestion[];
  conflicts: CsvMappingConflict[];
  status: CsvMappingReviewStatus;
  overallConfidence: CsvFieldInferenceConfidence;
}

export interface CsvSavedMappingTemplate {
  contractVersion: "generic_csv_mapping_template_v1";
  id: string;
  name: string;
  normalizedHeaders: string[];
  delimiter: "," | ";" | "\t";
  columnMapping: BrokerExecutionCsvColumnMapping;
  sideValueMapping: Record<string, "buy" | "sell">;
  timestampTimezone?: string;
  optionsHandling?: BrokerExecutionCsvOptionsHandling;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyCsvMappingReviewArgs {
  csvText: string;
  inference?: CsvSchemaInferenceResult;
  corrections?: BrokerExecutionCsvColumnMapping;
  ignoredHeaders?: string[];
  sideValueMapping?: Record<string, "buy" | "sell">;
  timestampTimezone?: string;
  optionsHandling?: BrokerExecutionCsvOptionsHandling;
  tradeGroupingRules?: BrokerExecutionCsvTradeGroupingRules;
}

export interface CsvMappingReviewResult {
  contractVersion: "generic_csv_mapping_review_v1";
  inference: CsvSchemaInferenceResult;
  effectiveMapping: BrokerExecutionCsvColumnMapping;
  sideValueMapping: Record<string, "buy" | "sell">;
  status: CsvMappingReviewStatus;
  conflicts: CsvMappingConflict[];
  importResult: BrokerExecutionCsvImportResult | null;
}

export interface ResolveCsvMappingTimestampTimezoneArgs {
  importOverride?: string;
  savedTemplateOverride?: string;
  accountImportDefault?: string;
  accountTimezone?: string;
}

const REQUIRED_EXECUTION_FIELDS: BrokerExecutionCsvCanonicalField[] = [
  "symbol",
  "quantity",
  "price",
];

const HEADER_HINTS: Record<BrokerExecutionCsvCanonicalField, string[]> = {
  symbol: ["symbol", "ticker", "stock", "instrument", "security", "code", "symb"],
  timestamp: ["timestamp", "datetime", "executedat", "executiontime", "filltime", "tradetime", "transactiontime", "exectime"],
  date: ["date", "tradedate", "executiondate", "filldate", "rundate", "activitydate"],
  time: ["time", "executiontime", "filltime", "tradetime", "exectime"],
  side: ["side", "action", "instruction", "buysell", "direction", "transactiontype"],
  quantity: ["quantity", "qty", "shares", "size", "filledqty", "fillqty", "executedqty"],
  price: ["price", "avgprice", "averageprice", "fillprice", "executionprice", "rate", "unitprice"],
  status: ["status", "state", "orderstatus", "activitytype"],
  orderId: ["orderid", "ordernumber", "orderref", "order"],
  executionId: ["executionid", "execid", "tradeid", "fillid", "transactionid"],
  assetType: ["assettype", "securitytype", "instrumenttype", "product", "spread"],
  description: ["description", "securitydescription", "instrumentname", "name", "notes"],
  commission: ["commission", "commissions", "comm", "brokerage"],
  fees: ["fee", "fees", "charges", "costs", "regfee", "ecnfee", "transactionfee"],
  netAmount: ["netamount", "amount", "netproceeds", "cashamount", "totalvalue", "value"],
  currency: ["currency", "curr", "ccy"],
};

const SIDE_VALUES: Record<string, "buy" | "sell"> = {
  buy: "buy",
  bought: "buy",
  bot: "buy",
  b: "buy",
  long: "buy",
  cover: "buy",
  buytocover: "buy",
  sell: "sell",
  sold: "sell",
  sld: "sell",
  s: "sell",
  short: "sell",
  sellshort: "sell",
};

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/u, "")
    .trim()
    .toLowerCase()
    .replace(/[$#]/gu, "")
    .replace(/[^a-z0-9]+/gu, "");
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9+-]+/gu, "");
}

function countDelimiterOutsideQuotes(line: string, delimiter: "," | ";" | "\t"): number {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') index += 1;
      else inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }

  return count;
}

function detectDelimiter(csvText: string): "," | ";" | "\t" {
  const lines = csvText.split(/\r?\n/u).filter((line) => line.trim() !== "").slice(0, 12);
  const scores = ([",", ";", "\t"] as const).map((delimiter) => ({
    delimiter,
    score: lines.reduce((sum, line) => sum + countDelimiterOutsideQuotes(line, delimiter), 0),
  }));
  return scores.sort((left, right) => right.score - left.score)[0]?.delimiter ?? ",";
}

function parseRows(csvText: string, delimiter: "," | ";" | "\t"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function isNumeric(value: string): boolean {
  const cleaned = value.trim().replace(/[,$£€¥()\s]/gu, "");
  if (cleaned === "") return false;
  return Number.isFinite(Number(cleaned));
}

function numericValue(value: string): number | null {
  const negativeByParentheses = /^\s*\(.+\)\s*$/u.test(value);
  const cleaned = value.trim().replace(/[,$£€¥()\s]/gu, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return negativeByParentheses ? -Math.abs(parsed) : parsed;
}

function looksLikeDateTime(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "" || /^\d+(\.\d+)?$/u.test(trimmed)) return false;
  return /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/u.test(trimmed) && !Number.isNaN(Date.parse(trimmed));
}

function looksLikeSymbol(value: string): boolean {
  const trimmed = value.trim().toUpperCase();
  return /^[A-Z][A-Z0-9.\-]{0,11}$/u.test(trimmed) && !SIDE_VALUES[trimmed.toLowerCase()];
}

function looksLikeCurrency(value: string): boolean {
  return /^(USD|CAD|EUR|GBP|JPY|CHF|AUD|NZD|HKD)$/iu.test(value.trim());
}

function ratio(values: string[], predicate: (value: string) => boolean): number {
  const nonEmpty = values.filter((value) => value.trim() !== "");
  if (nonEmpty.length === 0) return 0;
  return nonEmpty.filter(predicate).length / nonEmpty.length;
}

function profileColumn(header: string, values: string[]): CsvColumnProfile {
  const nonEmpty = values.filter((value) => value.trim() !== "");
  return {
    header,
    normalizedHeader: normalizeHeader(header),
    sampleValues: [...new Set(nonEmpty)].slice(0, 5),
    nonEmptyCount: nonEmpty.length,
    numericRatio: ratio(values, isNumeric),
    positiveNumericRatio: ratio(values, (value) => (numericValue(value) ?? 0) > 0),
    integerRatio: ratio(values, (value) => {
      const numeric = numericValue(value);
      return numeric !== null && Number.isInteger(Math.abs(numeric));
    }),
    dateTimeRatio: ratio(values, looksLikeDateTime),
    symbolRatio: ratio(values, looksLikeSymbol),
    sideRatio: ratio(values, (value) => SIDE_VALUES[normalizeValue(value)] !== undefined),
    currencyRatio: ratio(values, looksLikeCurrency),
  };
}

function confidenceFromScore(score: number): CsvFieldInferenceConfidence {
  if (score >= 85) return "high";
  if (score >= 65) return "medium";
  if (score >= 40) return "low";
  return "none";
}

function scoreCandidate(profile: CsvColumnProfile, field: BrokerExecutionCsvCanonicalField): CsvFieldCandidate {
  const reasons: string[] = [];
  let score = 0;
  const hints = HEADER_HINTS[field];
  const exact = hints.some((hint) => profile.normalizedHeader === normalizeHeader(hint));
  const contains = hints.some((hint) => profile.normalizedHeader.includes(normalizeHeader(hint)));
  if (exact) {
    score += 72;
    reasons.push("header_exact_match");
  } else if (contains) {
    score += 52;
    reasons.push("header_partial_match");
  }

  if (field === "symbol" && profile.symbolRatio >= 0.8) {
    score += 32;
    reasons.push("values_look_like_symbols");
  }
  if (field === "side" && profile.sideRatio >= 0.8) {
    score += 40;
    reasons.push("values_look_like_trade_sides");
  }
  if ((field === "timestamp" || field === "date") && profile.dateTimeRatio >= 0.8) {
    score += 35;
    reasons.push("values_parse_as_dates");
  }
  if (field === "currency" && profile.currencyRatio >= 0.8) {
    score += 40;
    reasons.push("values_look_like_currency_codes");
  }
  if (field === "quantity" && profile.numericRatio >= 0.9 && profile.integerRatio >= 0.75) {
    score += 24;
    reasons.push("values_look_like_share_counts");
  }
  if ((field === "price" || field === "commission" || field === "fees" || field === "netAmount") && profile.numericRatio >= 0.9) {
    score += 18;
    reasons.push("values_are_numeric");
  }
  if (field === "price" && profile.positiveNumericRatio >= 0.9) {
    score += 10;
    reasons.push("values_are_positive");
  }

  return {
    field,
    score: Math.min(100, score),
    confidence: confidenceFromScore(score),
    reasons,
  };
}

function chooseHeaderRow(rows: string[][]): number {
  let bestIndex = 0;
  let bestScore = -1;
  rows.slice(0, 15).forEach((row, index) => {
    const normalized = row.map(normalizeHeader);
    const distinct = new Set(normalized.filter(Boolean)).size;
    const hintMatches = normalized.reduce(
      (sum, header) => sum + Object.values(HEADER_HINTS).flat().filter((hint) => header.includes(normalizeHeader(hint))).length,
      0,
    );
    const score = hintMatches * 4 + distinct;
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });
  return bestIndex;
}

function buildConflicts(
  columns: CsvColumnInference[],
  mapping: BrokerExecutionCsvColumnMapping,
  confirmedHeaders: ReadonlySet<string> = new Set(),
): CsvMappingConflict[] {
  const conflicts: CsvMappingConflict[] = [];
  const mappedHeaders = new Map<BrokerExecutionCsvCanonicalField, string[]>();
  const fieldsByHeader = new Map<string, BrokerExecutionCsvCanonicalField[]>();
  for (const field of Object.keys(mapping) as BrokerExecutionCsvCanonicalField[]) {
    const value = mapping[field];
    const headers = Array.isArray(value) ? value : value ? [value] : [];
    if (headers.length > 0) {
      mappedHeaders.set(field, headers);
      for (const header of headers) {
        const normalized = normalizeHeader(header);
        const fields = fieldsByHeader.get(normalized) ?? [];
        if (!fields.includes(field)) fields.push(field);
        fieldsByHeader.set(normalized, fields);
      }
    }
  }

  for (const [normalizedHeader, fields] of fieldsByHeader) {
    if (fields.length < 2) continue;
    const header =
      columns.find(
        (column) => normalizeHeader(column.header) === normalizedHeader,
      )?.header ?? normalizedHeader;
    conflicts.push({
      code: "duplicate_destination_field",
      headers: [header],
      message: `${header} cannot map to more than one destination (${fields.join(", ")}).`,
    });
  }

  for (const field of REQUIRED_EXECUTION_FIELDS) {
    if (!mappedHeaders.has(field)) {
      conflicts.push({
        code: "required_field_unmapped",
        field,
        headers: [],
        message: `Select the CSV column that represents ${field}.`,
      });
    }
  }

  if (!mappedHeaders.has("timestamp") && !(mappedHeaders.has("date") && mappedHeaders.has("time")) && !mappedHeaders.has("date")) {
    conflicts.push({
      code: "timestamp_unresolved",
      headers: [],
      message: "Select a timestamp column or date and time columns.",
    });
  }

  const quantityHeader = mappedHeaders.get("quantity")?.[0];
  if (!mappedHeaders.has("side") && quantityHeader) {
    const profile = columns.find((column) => column.header === quantityHeader)?.profile;
    if (!profile || profile.numericRatio < 0.8) {
      conflicts.push({
        code: "side_unresolved",
        headers: [],
        message: "Select a buy/sell column because side cannot be inferred from signed quantity.",
      });
    }
  }

  for (const column of columns) {
    const mappedToSuggestion = column.suggestedField
      ? (mappedHeaders.get(column.suggestedField) ?? []).some(
          (header) => normalizeHeader(header) === normalizeHeader(column.header),
        )
      : false;
    if (
      column.requiresReview &&
      column.suggestedField &&
      REQUIRED_EXECUTION_FIELDS.includes(column.suggestedField) &&
      mappedToSuggestion &&
      !confirmedHeaders.has(normalizeHeader(column.header))
    ) {
      conflicts.push({
        code: "ambiguous_required_field",
        field: column.suggestedField,
        headers: [column.header],
        message: `Confirm whether ${column.header} represents ${column.suggestedField}.`,
      });
    }
  }

  return conflicts;
}

function statusFromConflicts(
  conflicts: CsvMappingConflict[],
  columns: CsvColumnInference[],
  confirmedHeaders: ReadonlySet<string> = new Set(),
): CsvMappingReviewStatus {
  if (
    conflicts.some(
      (conflict) =>
        conflict.code === "required_field_unmapped" ||
        conflict.code === "duplicate_destination_field" ||
        conflict.code === "timestamp_unresolved" ||
        conflict.code === "side_unresolved",
    )
  ) {
    return "blocked";
  }
  if (
    conflicts.length > 0 ||
    columns.some(
      (column) =>
        column.requiresReview &&
        !confirmedHeaders.has(normalizeHeader(column.header)),
    )
  ) {
    return "needs_review";
  }
  return "ready";
}

export function inferGenericCsvSchema(csvText: string): CsvSchemaInferenceResult {
  const delimiter = detectDelimiter(csvText);
  const rows = parseRows(csvText, delimiter);
  const headerRowIndex = chooseHeaderRow(rows);
  const headers = rows[headerRowIndex] ?? [];
  const dataRows = rows.slice(headerRowIndex + 1).filter((row) => row.some((value) => value.trim() !== ""));
  const profiles = headers.map((header, columnIndex) => profileColumn(header, dataRows.map((row) => row[columnIndex] ?? "")));
  const usedFields = new Set<BrokerExecutionCsvCanonicalField>();
  const columns = profiles.map((profile): CsvColumnInference => {
    const candidates = (Object.keys(HEADER_HINTS) as BrokerExecutionCsvCanonicalField[])
      .map((field) => scoreCandidate(profile, field))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.field.localeCompare(right.field));
    let selected: CsvFieldCandidate | null =
      candidates.find((candidate) => !usedFields.has(candidate.field)) ??
      candidates[0] ??
      null;
    if (selected && selected.score >= 40) usedFields.add(selected.field);
    else selected = null;
    const runnerUp = candidates[1];
    const ambiguous = Boolean(selected && runnerUp && selected.score - runnerUp.score < 15);
    return {
      header: profile.header,
      profile,
      candidates,
      suggestedField: selected?.field ?? null,
      confidence: selected?.confidence ?? "none",
      requiresReview: Boolean(selected && (selected.confidence === "low" || ambiguous)),
    };
  });

  const proposedMapping: BrokerExecutionCsvColumnMapping = {};
  for (const column of columns) {
    if (column.suggestedField && column.confidence !== "none") proposedMapping[column.suggestedField] = column.header;
  }

  const sideColumn = columns.find((column) => column.suggestedField === "side");
  const valueMappings: CsvValueMappingSuggestion[] = (sideColumn?.profile.sampleValues ?? []).map((sourceValue) => ({
    field: "side",
    sourceValue,
    normalizedValue: SIDE_VALUES[normalizeValue(sourceValue)] ?? null,
    confidence: SIDE_VALUES[normalizeValue(sourceValue)] ? "high" : "low",
  }));
  const conflicts = buildConflicts(columns, proposedMapping);
  const status = statusFromConflicts(conflicts, columns);
  const confidenceValues = columns.filter((column) => column.suggestedField).map((column) => column.confidence);
  const overallConfidence: CsvFieldInferenceConfidence = confidenceValues.includes("low")
    ? "low"
    : confidenceValues.includes("medium")
      ? "medium"
      : confidenceValues.length > 0
        ? "high"
        : "none";

  return {
    contractVersion: "generic_csv_schema_inference_v1",
    delimiter,
    headerRowIndex,
    headers,
    profiles,
    columns,
    proposedMapping,
    valueMappings,
    conflicts,
    status,
    overallConfidence,
  };
}

function mergeMappings(
  proposed: BrokerExecutionCsvColumnMapping,
  corrections: BrokerExecutionCsvColumnMapping | undefined,
  ignoredHeaders: string[],
): BrokerExecutionCsvColumnMapping {
  const ignored = new Set(ignoredHeaders.map(normalizeHeader));
  const correctedHeaders = new Set(
    Object.values(corrections ?? {})
      .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
      .map(normalizeHeader),
  );
  const merged: BrokerExecutionCsvColumnMapping = {};
  for (const field of Object.keys(proposed) as BrokerExecutionCsvCanonicalField[]) {
    const value = proposed[field];
    const headers = (Array.isArray(value) ? value : value ? [value] : []).filter(
      (header) => !correctedHeaders.has(normalizeHeader(header)),
    );
    if (headers.length > 0) merged[field] = headers;
  }
  Object.assign(merged, corrections ?? {});
  for (const field of Object.keys(merged) as BrokerExecutionCsvCanonicalField[]) {
    const value = merged[field];
    const seen = new Set<string>();
    const headers = (Array.isArray(value) ? value : value ? [value] : []).filter(
      (header) => {
        const normalized = normalizeHeader(header);
        if (ignored.has(normalized) || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      },
    );
    if (headers.length === 0) delete merged[field];
    else merged[field] = headers;
  }
  return merged;
}

function rewriteSideValues(
  csvText: string,
  inference: CsvSchemaInferenceResult,
  mapping: BrokerExecutionCsvColumnMapping,
  sideValueMapping: Record<string, "buy" | "sell">,
): string {
  const sideHeaderValue = mapping.side;
  const sideHeader = Array.isArray(sideHeaderValue) ? sideHeaderValue[0] : sideHeaderValue;
  if (!sideHeader || Object.keys(sideValueMapping).length === 0) return csvText;
  const rows = parseRows(csvText, inference.delimiter);
  const headerRow = rows[inference.headerRowIndex] ?? [];
  const index = headerRow.findIndex((header) => normalizeHeader(header) === normalizeHeader(sideHeader));
  if (index < 0) return csvText;
  for (let rowIndex = inference.headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const source = rows[rowIndex]?.[index] ?? "";
    const replacement = sideValueMapping[normalizeValue(source)] ?? sideValueMapping[source];
    if (replacement && rows[rowIndex]) rows[rowIndex][index] = replacement;
  }
  const quote = (value: string) => /["\r\n,;\t]/u.test(value) ? `"${value.replace(/"/gu, '""')}"` : value;
  return rows.map((row) => row.map(quote).join(inference.delimiter)).join("\n");
}

export function applyGenericCsvMappingReview(args: ApplyCsvMappingReviewArgs): CsvMappingReviewResult {
  const inference = args.inference ?? inferGenericCsvSchema(args.csvText);
  const effectiveMapping = mergeMappings(inference.proposedMapping, args.corrections, args.ignoredHeaders ?? []);
  const confirmedHeaders = new Set(
    [
      ...Object.values(args.corrections ?? {}).flatMap((value) =>
        Array.isArray(value) ? value : value ? [value] : [],
      ),
      ...(args.ignoredHeaders ?? []),
    ].map(normalizeHeader),
  );
  const conflicts = buildConflicts(
    inference.columns,
    effectiveMapping,
    confirmedHeaders,
  );
  const status = statusFromConflicts(
    conflicts,
    inference.columns,
    confirmedHeaders,
  );
  const sideValueMapping = Object.fromEntries(
    Object.entries(args.sideValueMapping ?? {}).map(([key, value]) => [normalizeValue(key), value]),
  );
  if (status === "blocked") {
    return {
      contractVersion: "generic_csv_mapping_review_v1",
      inference,
      effectiveMapping,
      sideValueMapping,
      status,
      conflicts,
      importResult: null,
    };
  }
  const normalizedCsvText = rewriteSideValues(args.csvText, inference, effectiveMapping, sideValueMapping);
  const importResult = parseBrokerExecutionCsv({
    broker: "generic_execution_csv",
    csvText: normalizedCsvText,
    columnMapping: effectiveMapping,
    timestampTimezone: args.timestampTimezone,
    optionsHandling: args.optionsHandling,
    tradeGroupingRules: args.tradeGroupingRules,
  });
  return {
    contractVersion: "generic_csv_mapping_review_v1",
    inference,
    effectiveMapping,
    sideValueMapping,
    status: importResult.rejectedRowCount > 0 || importResult.mappingConfidence.level === "low" ? "needs_review" : status,
    conflicts,
    importResult,
  };
}

export function createCsvSavedMappingTemplate(args: {
  name: string;
  inference: CsvSchemaInferenceResult;
  effectiveMapping: BrokerExecutionCsvColumnMapping;
  sideValueMapping?: Record<string, "buy" | "sell">;
  timestampTimezone?: string;
  optionsHandling?: BrokerExecutionCsvOptionsHandling;
  now?: string;
}): CsvSavedMappingTemplate {
  const now = args.now ?? new Date().toISOString();
  const signature = args.inference.headers.map(normalizeHeader).join("|");
  let hash = 2166136261;
  for (let index = 0; index < signature.length; index += 1) {
    hash ^= signature.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return {
    contractVersion: "generic_csv_mapping_template_v1",
    id: `csv-map-${(hash >>> 0).toString(16).padStart(8, "0")}`,
    name: args.name.trim() || "Saved CSV format",
    normalizedHeaders: args.inference.headers.map(normalizeHeader),
    delimiter: args.inference.delimiter,
    columnMapping: args.effectiveMapping,
    sideValueMapping: Object.fromEntries(Object.entries(args.sideValueMapping ?? {}).map(([key, value]) => [normalizeValue(key), value])),
    timestampTimezone: args.timestampTimezone,
    optionsHandling: args.optionsHandling,
    createdAt: now,
    updatedAt: now,
  };
}

export function matchCsvSavedMappingTemplate(
  inference: CsvSchemaInferenceResult,
  templates: readonly CsvSavedMappingTemplate[],
): {
  template: CsvSavedMappingTemplate;
  columnMapping: BrokerExecutionCsvColumnMapping;
  score: number;
} | null {
  const incoming = new Set(inference.headers.map(normalizeHeader));
  const ranked = templates.map((template) => {
    const expected = new Set(template.normalizedHeaders);
    const intersection = [...incoming].filter((header) => expected.has(header)).length;
    const union = new Set([...incoming, ...expected]).size;
    const score = union === 0 ? 0 : intersection / union;
    return { template, score };
  }).sort((left, right) => right.score - left.score || left.template.id.localeCompare(right.template.id));
  const match = ranked[0];
  if (!match || match.score < 0.75) return null;
  const incomingHeaderByNormalized = new Map(
    inference.headers.map((header) => [normalizeHeader(header), header]),
  );
  const columnMapping: BrokerExecutionCsvColumnMapping = {};
  for (const field of Object.keys(
    match.template.columnMapping,
  ) as BrokerExecutionCsvCanonicalField[]) {
    const value = match.template.columnMapping[field];
    const headers = (Array.isArray(value) ? value : value ? [value] : [])
      .map((header) => incomingHeaderByNormalized.get(normalizeHeader(header)))
      .filter((header): header is string => header !== undefined);
    if (headers.length > 0) columnMapping[field] = headers;
  }
  return { ...match, columnMapping };
}

export function resolveCsvMappingTimestampTimezone(
  args: ResolveCsvMappingTimestampTimezoneArgs,
): string | undefined {
  return [
    args.importOverride,
    args.savedTemplateOverride,
    args.accountImportDefault,
    args.accountTimezone,
  ]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));
}
