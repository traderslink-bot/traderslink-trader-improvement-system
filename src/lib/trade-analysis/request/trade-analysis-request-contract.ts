import type { TradeAnalysisCandleWindowOptions } from "levels-system-v2/support-resistance-engine";
import type { ProviderExecution } from "../../execution-sources/types/provider-execution";
import type { NormalizeCandleInput } from "../../raw-trade-timeline/normalizers/normalize-candle";
import type { NormalizeExecutionInput } from "../../raw-trade-timeline/normalizers/normalize-execution";
import { normalizeRequiredSessionBucketValue } from "../../raw-trade-timeline/session/normalize-session-bucket";
import type { SessionContextInput } from "../../raw-trade-timeline/types/session-context";
import type { TradeDirection } from "../../raw-trade-timeline/types/trade-timeline-input";
import type { LevelsSystemRuntimeConfig } from "../../support-resistance/levels-system-runtime-options";
import type { TradeAnalysisEngineLevelsSystemCandleArgs } from "../../trade-analysis-engine";

export type TradeAnalysisRequestProviderName =
  | "eodhd"
  | "ibkr"
  | "yahoo"
  | "stub";

export type TradeAnalysisRequestIssueSeverity = "error" | "warning";

export type TradeAnalysisRequestIssueCode =
  | "invalid_document"
  | "missing_symbol"
  | "invalid_symbol"
  | "invalid_trade_direction"
  | "missing_session_context"
  | "invalid_session_date"
  | "invalid_session_bucket"
  | "missing_executions"
  | "invalid_execution_symbol"
  | "mixed_execution_symbols"
  | "invalid_execution_timestamp"
  | "invalid_execution_side"
  | "invalid_execution_shares"
  | "invalid_execution_price"
  | "execution_order_will_be_normalized"
  | "exit_before_entry"
  | "open_position"
  | "unsupported_provider"
  | "invalid_as_of_timestamp"
  | "invalid_lookback_bars"
  | "invalid_trade_window";

export interface TradeAnalysisRequestIssue {
  severity: TradeAnalysisRequestIssueSeverity;
  code: TradeAnalysisRequestIssueCode;
  message: string;
  path: string;
}

export interface TradeAnalysisProviderRequestOptions {
  preferredProvider?: TradeAnalysisRequestProviderName | string;
  asOfTimestamp?: string | number | Date | null;
  lookbackBars?: {
    daily?: number | string | null;
    "4h"?: number | string | null;
    "5m"?: number | string | null;
  };
}

export interface UserTradeAnalysisRequest {
  symbol: string;
  tradeDirection: TradeDirection | string;
  executions: ProviderExecution[];
  sessionContext: SessionContextInput;
  provider?: TradeAnalysisProviderRequestOptions;
  tradeWindow?: TradeAnalysisCandleWindowOptions;
  preTradeCandles?: NormalizeCandleInput[];
  tradeCandles?: NormalizeCandleInput[];
  postTradeCandles?: NormalizeCandleInput[];
  executionWindowCandlesBeforeCount?: number;
  executionWindowCandlesAfterCount?: number;
}

export interface ValidatedTradeAnalysisRequest {
  symbol: string;
  tradeDirection: TradeDirection;
  executions: NormalizeExecutionInput[];
  sessionContext: SessionContextInput;
  tradeWindow?: TradeAnalysisCandleWindowOptions;
  preTradeCandles?: NormalizeCandleInput[];
  tradeCandles?: NormalizeCandleInput[];
  postTradeCandles?: NormalizeCandleInput[];
  executionWindowCandlesBeforeCount?: number;
  executionWindowCandlesAfterCount?: number;
  levelsSystem: LevelsSystemRuntimeConfig;
}

export interface TradeAnalysisRequestValidationResult {
  valid: boolean;
  issues: TradeAnalysisRequestIssue[];
  request?: ValidatedTradeAnalysisRequest;
}

export interface TradeAnalysisRequestDocumentParseResult {
  requests: UserTradeAnalysisRequest[];
}

const VALID_PROVIDER_NAMES = new Set<TradeAnalysisRequestProviderName>([
  "eodhd",
  "ibkr",
  "yahoo",
  "stub",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pushIssue(
  issues: TradeAnalysisRequestIssue[],
  issue: TradeAnalysisRequestIssue,
): void {
  issues.push(issue);
}

function normalizeSymbol(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const symbol = value.trim().toUpperCase();

  return symbol.length > 0 ? symbol : null;
}

function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9._-]{1,24}$/.test(symbol);
}

function normalizeTradeDirection(value: unknown): TradeDirection | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return normalized === "long" || normalized === "short" ? normalized : null;
}

function parseTimestamp(value: unknown): string | null {
  if (value instanceof Date) {
    const timestamp = value.getTime();

    return Number.isNaN(timestamp) ? null : value.toISOString();
  }

  if (typeof value === "number") {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function parsePositiveNumber(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalPositiveInteger(
  value: unknown,
  path: string,
  issues: TradeAnalysisRequestIssue[],
): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    pushIssue(issues, {
      severity: "error",
      code: "invalid_lookback_bars",
      message: `${path} must be a positive integer.`,
      path,
    });
    return undefined;
  }

  return parsed;
}

function isValidSessionDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeProviderOptions(
  provider: TradeAnalysisProviderRequestOptions | undefined,
  issues: TradeAnalysisRequestIssue[],
): LevelsSystemRuntimeConfig {
  const levelsSystem: LevelsSystemRuntimeConfig = {};

  if (!provider) {
    return levelsSystem;
  }

  if (
    provider.preferredProvider !== undefined &&
    provider.preferredProvider !== null &&
    String(provider.preferredProvider).trim() !== ""
  ) {
    const preferredProvider = String(provider.preferredProvider).trim();

    if (!VALID_PROVIDER_NAMES.has(preferredProvider as TradeAnalysisRequestProviderName)) {
      pushIssue(issues, {
        severity: "error",
        code: "unsupported_provider",
        message:
          "provider.preferredProvider must be one of ibkr, eodhd, yahoo, or stub.",
        path: "provider.preferredProvider",
      });
    } else {
      levelsSystem.preferredProvider =
        preferredProvider as TradeAnalysisRequestProviderName;
    }
  }

  if (provider.asOfTimestamp !== undefined && provider.asOfTimestamp !== null) {
    const asOfTimestamp = parseTimestamp(provider.asOfTimestamp);

    if (!asOfTimestamp) {
      pushIssue(issues, {
        severity: "error",
        code: "invalid_as_of_timestamp",
        message: "provider.asOfTimestamp must be a valid date/time.",
        path: "provider.asOfTimestamp",
      });
    } else {
      levelsSystem.asOfTimestamp = asOfTimestamp;
    }
  }

  if (provider.lookbackBars) {
    levelsSystem.lookbackBars = {
      daily: parseOptionalPositiveInteger(
        provider.lookbackBars.daily,
        "provider.lookbackBars.daily",
        issues,
      ),
      "4h": parseOptionalPositiveInteger(
        provider.lookbackBars["4h"],
        "provider.lookbackBars.4h",
        issues,
      ),
      "5m": parseOptionalPositiveInteger(
        provider.lookbackBars["5m"],
        "provider.lookbackBars.5m",
        issues,
      ),
    };
  }

  return levelsSystem;
}

function validateSessionContext(
  value: unknown,
  issues: TradeAnalysisRequestIssue[],
): SessionContextInput | null {
  if (!isRecord(value)) {
    pushIssue(issues, {
      severity: "error",
      code: "missing_session_context",
      message: "sessionContext with sessionDate and sessionBucket is required.",
      path: "sessionContext",
    });
    return null;
  }

  const sessionDate =
    typeof value.sessionDate === "string" ? value.sessionDate.trim() : "";
  const sessionBucket =
    typeof value.sessionBucket === "string" ? value.sessionBucket.trim() : "";

  if (!isValidSessionDate(sessionDate)) {
    pushIssue(issues, {
      severity: "error",
      code: "invalid_session_date",
      message: "sessionContext.sessionDate must use YYYY-MM-DD.",
      path: "sessionContext.sessionDate",
    });
  }

  try {
    const normalizedSessionBucket =
      normalizeRequiredSessionBucketValue(sessionBucket);

    if (
      normalizedSessionBucket === "unknown" &&
      sessionBucket.trim().toLowerCase() !== "unknown"
    ) {
      pushIssue(issues, {
        severity: "warning",
        code: "invalid_session_bucket",
        message:
          "sessionContext.sessionBucket was not recognized and will be treated as unknown.",
        path: "sessionContext.sessionBucket",
      });
    }
  } catch {
    pushIssue(issues, {
      severity: "error",
      code: "invalid_session_bucket",
      message: "sessionContext.sessionBucket is not recognized.",
      path: "sessionContext.sessionBucket",
    });
  }

  return {
    sessionDate,
    sessionBucket,
  };
}

function validateExecutions(args: {
  executions: unknown;
  expectedSymbol: string;
  tradeDirection: TradeDirection;
  issues: TradeAnalysisRequestIssue[];
}): NormalizeExecutionInput[] {
  const { executions, expectedSymbol, tradeDirection, issues } = args;

  if (!Array.isArray(executions) || executions.length === 0) {
    pushIssue(issues, {
      severity: "error",
      code: "missing_executions",
      message: "At least one execution is required.",
      path: "executions",
    });
    return [];
  }

  const normalizedExecutions: NormalizeExecutionInput[] = [];

  for (const [index, execution] of executions.entries()) {
    const path = `executions[${index}]`;

    if (!isRecord(execution)) {
      pushIssue(issues, {
        severity: "error",
        code: "invalid_document",
        message: "Execution must be an object.",
        path,
      });
      continue;
    }

    const symbol = normalizeSymbol(execution.symbol);
    const timestamp = parseTimestamp(execution.timestamp);
    const side =
      typeof execution.side === "string"
        ? execution.side.trim().toLowerCase()
        : "";
    const shares = parsePositiveNumber(execution.shares);
    const price = parsePositiveNumber(execution.price);

    if (!symbol) {
      pushIssue(issues, {
        severity: "error",
        code: "invalid_execution_symbol",
        message: "Execution symbol is required.",
        path: `${path}.symbol`,
      });
    } else if (symbol !== expectedSymbol) {
      pushIssue(issues, {
        severity: "error",
        code: "mixed_execution_symbols",
        message: `Execution symbol ${symbol} does not match trade symbol ${expectedSymbol}.`,
        path: `${path}.symbol`,
      });
    }

    if (!timestamp) {
      pushIssue(issues, {
        severity: "error",
        code: "invalid_execution_timestamp",
        message: "Execution timestamp must be a valid date/time.",
        path: `${path}.timestamp`,
      });
    }

    if (side !== "buy" && side !== "sell") {
      pushIssue(issues, {
        severity: "error",
        code: "invalid_execution_side",
        message: "Execution side must be buy or sell.",
        path: `${path}.side`,
      });
    }

    if (shares === null) {
      pushIssue(issues, {
        severity: "error",
        code: "invalid_execution_shares",
        message: "Execution shares must be greater than zero.",
        path: `${path}.shares`,
      });
    }

    if (price === null) {
      pushIssue(issues, {
        severity: "error",
        code: "invalid_execution_price",
        message: "Execution price must be greater than zero.",
        path: `${path}.price`,
      });
    }

    if (!symbol || !timestamp || (side !== "buy" && side !== "sell") || shares === null || price === null) {
      continue;
    }

    normalizedExecutions.push({
      symbol,
      timestamp,
      side,
      shares,
      price,
      executionIndex:
        typeof execution.executionIndex === "string" ||
        typeof execution.executionIndex === "number"
          ? execution.executionIndex
          : undefined,
      orderId:
        typeof execution.orderId === "string" ? execution.orderId : undefined,
      brokerExecutionId:
        typeof execution.brokerExecutionId === "string"
          ? execution.brokerExecutionId
          : undefined,
      notes: typeof execution.notes === "string" ? execution.notes : undefined,
      source:
        typeof execution.source === "string" ? execution.source : undefined,
    });
  }

  const sorted = [...normalizedExecutions].sort((left, right) => {
    const timeDelta =
      Date.parse(String(left.timestamp)) - Date.parse(String(right.timestamp));

    if (timeDelta !== 0) {
      return timeDelta;
    }

    return Number(left.executionIndex ?? 0) - Number(right.executionIndex ?? 0);
  });

  if (
    normalizedExecutions.some(
      (execution, index) => execution !== sorted[index],
    )
  ) {
    pushIssue(issues, {
      severity: "warning",
      code: "execution_order_will_be_normalized",
      message: "Executions will be sorted by timestamp before analysis.",
      path: "executions",
    });
  }

  validateDirectionalSequence({
    executions: sorted,
    tradeDirection,
    issues,
  });

  return sorted;
}

function validateDirectionalSequence(args: {
  executions: NormalizeExecutionInput[];
  tradeDirection: TradeDirection;
  issues: TradeAnalysisRequestIssue[];
}): void {
  const { executions, tradeDirection, issues } = args;
  let directionalPosition = 0;

  for (const [index, execution] of executions.entries()) {
    const side = String(execution.side).trim().toLowerCase();
    const shares = Number(execution.shares);
    const delta =
      tradeDirection === "long"
        ? side === "buy"
          ? shares
          : -shares
        : side === "sell"
          ? shares
          : -shares;

    if (directionalPosition === 0 && delta < 0) {
      pushIssue(issues, {
        severity: "error",
        code: "exit_before_entry",
        message:
          tradeDirection === "long"
            ? "Long trades must open with buy-side position before sell-side reductions."
            : "Short trades must open with sell-side position before buy-side covers.",
        path: `executions[${index}].side`,
      });
    }

    directionalPosition += delta;

    if (directionalPosition < 0) {
      pushIssue(issues, {
        severity: "error",
        code: "exit_before_entry",
        message: "Execution sequence reduces more shares than the open position.",
        path: `executions[${index}].shares`,
      });
    }
  }

  if (directionalPosition > 0) {
    pushIssue(issues, {
      severity: "warning",
      code: "open_position",
      message:
        "Execution sequence leaves an open position; full-exit patterns may not apply.",
      path: "executions",
    });
  }
}

function validateTradeWindow(
  tradeWindow: TradeAnalysisCandleWindowOptions | undefined,
  issues: TradeAnalysisRequestIssue[],
): TradeAnalysisCandleWindowOptions | undefined {
  if (!tradeWindow) {
    return undefined;
  }

  if (
    tradeWindow.timeframe !== undefined &&
    tradeWindow.timeframe !== "1m" &&
    tradeWindow.timeframe !== "5m"
  ) {
    pushIssue(issues, {
      severity: "error",
      code: "invalid_trade_window",
      message: "tradeWindow.timeframe must be 1m or 5m when provided.",
      path: "tradeWindow.timeframe",
    });
  }

  for (const field of [
    "preTradeMinutes",
    "postTradeMinutes",
    "paddingMinutes",
    "lookbackBars",
  ] as const) {
    const value = tradeWindow[field];

    if (
      value !== undefined &&
      (!Number.isFinite(Number(value)) || Number(value) < 0)
    ) {
      pushIssue(issues, {
        severity: "error",
        code: "invalid_trade_window",
        message: `tradeWindow.${field} must be zero or greater when provided.`,
        path: `tradeWindow.${field}`,
      });
    }
  }

  return {
    ...tradeWindow,
    timeframe: tradeWindow.timeframe,
  };
}

export function validateTradeAnalysisRequest(
  input: unknown,
): TradeAnalysisRequestValidationResult {
  const issues: TradeAnalysisRequestIssue[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      issues: [
        {
          severity: "error",
          code: "invalid_document",
          message: "Trade analysis request must be an object.",
          path: "",
        },
      ],
    };
  }

  const symbol = normalizeSymbol(input.symbol);
  const tradeDirection = normalizeTradeDirection(input.tradeDirection);
  const sessionContext = validateSessionContext(input.sessionContext, issues);
  const levelsSystem = normalizeProviderOptions(
    input.provider as TradeAnalysisProviderRequestOptions | undefined,
    issues,
  );

  if (!symbol) {
    pushIssue(issues, {
      severity: "error",
      code: "missing_symbol",
      message: "symbol is required.",
      path: "symbol",
    });
  } else if (!isValidSymbol(symbol)) {
    pushIssue(issues, {
      severity: "error",
      code: "invalid_symbol",
      message:
        "symbol may only contain letters, numbers, dot, underscore, or dash.",
      path: "symbol",
    });
  }

  if (!tradeDirection) {
    pushIssue(issues, {
      severity: "error",
      code: "invalid_trade_direction",
      message: "tradeDirection must be long or short.",
      path: "tradeDirection",
    });
  }

  const executions =
    symbol && tradeDirection
      ? validateExecutions({
          executions: input.executions,
          expectedSymbol: symbol,
          tradeDirection,
          issues,
        })
      : [];
  const tradeWindow = validateTradeWindow(
    input.tradeWindow as TradeAnalysisCandleWindowOptions | undefined,
    issues,
  );
  const hasErrors = issues.some((issue) => issue.severity === "error");

  if (hasErrors || !symbol || !tradeDirection || !sessionContext) {
    return {
      valid: false,
      issues,
    };
  }

  return {
    valid: true,
    issues,
    request: {
      symbol,
      tradeDirection,
      executions,
      sessionContext,
      tradeWindow,
      preTradeCandles: Array.isArray(input.preTradeCandles)
        ? (input.preTradeCandles as NormalizeCandleInput[])
        : undefined,
      tradeCandles: Array.isArray(input.tradeCandles)
        ? (input.tradeCandles as NormalizeCandleInput[])
        : undefined,
      postTradeCandles: Array.isArray(input.postTradeCandles)
        ? (input.postTradeCandles as NormalizeCandleInput[])
        : undefined,
      executionWindowCandlesBeforeCount:
        typeof input.executionWindowCandlesBeforeCount === "number"
          ? input.executionWindowCandlesBeforeCount
          : undefined,
      executionWindowCandlesAfterCount:
        typeof input.executionWindowCandlesAfterCount === "number"
          ? input.executionWindowCandlesAfterCount
          : undefined,
      levelsSystem,
    },
  };
}

export function assertValidTradeAnalysisRequest(
  input: unknown,
): ValidatedTradeAnalysisRequest {
  const validation = validateTradeAnalysisRequest(input);

  if (validation.valid && validation.request) {
    return validation.request;
  }

  const issueText = validation.issues
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join(" | ");

  throw new Error(`Invalid trade analysis request. ${issueText}`);
}

export function toLevelsSystemCandleTradeRequest(
  request: ValidatedTradeAnalysisRequest,
): Omit<TradeAnalysisEngineLevelsSystemCandleArgs, "levelsSystem"> {
  return {
    symbol: request.symbol,
    tradeDirection: request.tradeDirection,
    executions: request.executions,
    sessionContext: request.sessionContext,
    tradeWindow: request.tradeWindow,
    preTradeCandles: request.preTradeCandles,
    tradeCandles: request.tradeCandles,
    postTradeCandles: request.postTradeCandles,
    executionWindowCandlesBeforeCount:
      request.executionWindowCandlesBeforeCount,
    executionWindowCandlesAfterCount:
      request.executionWindowCandlesAfterCount,
  };
}

export function parseTradeAnalysisRequestDocument(
  document: unknown,
): TradeAnalysisRequestDocumentParseResult {
  if (Array.isArray(document)) {
    return { requests: document as UserTradeAnalysisRequest[] };
  }

  if (isRecord(document) && Array.isArray(document.requests)) {
    return { requests: document.requests as UserTradeAnalysisRequest[] };
  }

  if (isRecord(document) && Array.isArray(document.trades)) {
    return { requests: document.trades as UserTradeAnalysisRequest[] };
  }

  if (isRecord(document) && document.request !== undefined) {
    return { requests: [document.request as UserTradeAnalysisRequest] };
  }

  if (isRecord(document) && document.trade !== undefined) {
    return { requests: [document.trade as UserTradeAnalysisRequest] };
  }

  return { requests: [document as UserTradeAnalysisRequest] };
}
