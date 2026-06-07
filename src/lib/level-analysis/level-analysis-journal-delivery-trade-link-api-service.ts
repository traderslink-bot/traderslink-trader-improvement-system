import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
  SqliteImportCommitRepository,
  type SavedTradeJournalIdentity,
} from "../trader-analytics/product/import-commit/sqlite-import-commit-repository";
import {
  type JournalLevelAnalysisDeliveryRecord,
  type JournalLevelAnalysisDeliverySymbolSummary,
} from "./level-analysis-journal-delivery-persistence-contract";
import {
  SqliteJournalLevelAnalysisDeliveryRepository,
  type JournalLevelAnalysisDeliveryRepository,
} from "./level-analysis-journal-delivery-persistence-storage";
import {
  createDefaultJournalLevelAnalysisTradeLinkMatchPolicy,
  createJournalLevelAnalysisTradeLinkRecord,
  JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
  JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_RESOLUTION_API_CONTRACT_VERSION,
  JOURNAL_TRADE_LEVEL_ANALYSIS_API_CONTRACT_VERSION,
  type JournalLevelAnalysisTradeLinkApiResponse,
  type JournalLevelAnalysisTradeLinkMatchPolicy,
  type JournalLevelAnalysisTradeLinkMatchResult,
  type JournalLevelAnalysisTradeLinkRecord,
  type JournalLevelAnalysisTradeLinkResolution,
  type JournalTradeLevelAnalysisApiResponse,
} from "./level-analysis-journal-delivery-trade-link-contract";
import {
  buildTradeDetailLevelFactsReadModel,
  type TradeDetailLevelFactsReadModel,
} from "./level-analysis-trade-detail-level-facts-contract";
import {
  SqliteJournalLevelAnalysisTradeLinkRepository,
  type JournalLevelAnalysisTradeLinkRepository,
  type TradeLinkJournalScope,
} from "./level-analysis-journal-delivery-trade-link-storage";

type JsonRecord = Record<string, unknown>;

export interface JournalLevelAnalysisTradeLinkApiRequest {
  savedTradeId: string;
  symbol: string;
  provider: string;
  workspaceId?: string;
  accountId?: string;
  userId?: string;
  importBatchId?: string;
  deliveryId?: string;
  tradeEndedAt?: string;
  asOfBoundaryTimestamp?: number;
  matchPolicy?: Partial<JournalLevelAnalysisTradeLinkMatchPolicy>;
  linkSource?: "manual_review" | "import_batch_hint" | "resolver";
  createdAt?: string;
}

export interface JournalLevelAnalysisTradeLinkServiceOptions {
  deliveryRepository?: JournalLevelAnalysisDeliveryRepository;
  tradeLinkRepository?: JournalLevelAnalysisTradeLinkRepository;
  now?: () => Date;
}

export interface JournalLevelAnalysisTradeLinkAdminApiResponse {
  contractVersion: typeof JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION;
  status: "found" | "not_found";
  linkId?: string;
  savedTradeId?: string;
  deliveryId?: string;
  rawPayloadHash?: string;
  link?: JournalLevelAnalysisTradeLinkRecord;
}

export type JournalLevelAnalysisTradeLinkReadScope = TradeLinkJournalScope;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function readRequiredString(body: JsonRecord, field: string): string {
  const value = readOptionalString(body[field]);
  if (!value) {
    throw new Error(`${field} is required.`);
  }

  return value;
}

function readOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function deliveryRepositoryFromOptions(
  options: JournalLevelAnalysisTradeLinkServiceOptions,
): JournalLevelAnalysisDeliveryRepository {
  return options.deliveryRepository ?? new SqliteJournalLevelAnalysisDeliveryRepository();
}

function tradeLinkRepositoryFromOptions(
  options: JournalLevelAnalysisTradeLinkServiceOptions,
): JournalLevelAnalysisTradeLinkRepository {
  return options.tradeLinkRepository ?? new SqliteJournalLevelAnalysisTradeLinkRepository();
}

function nowIso(options: JournalLevelAnalysisTradeLinkServiceOptions): string {
  return (options.now ?? (() => new Date()))().toISOString();
}

function linkIdFor(args: {
  workspaceId: string;
  accountId: string;
  userId: string;
  savedTradeId: string;
  deliveryId: string;
  symbol: string;
}): string {
  return `jlatl_${args.workspaceId}_${args.accountId}_${args.userId}_${args.savedTradeId}_${args.deliveryId}_${normalizeSymbol(args.symbol)}`;
}

function scopeFromRequest(
  request: JournalLevelAnalysisTradeLinkApiRequest,
): JournalLevelAnalysisTradeLinkReadScope {
  return {
    workspaceId: request.workspaceId ?? DEMO_WORKSPACE_ID,
    accountId: request.accountId ?? DEMO_ACCOUNT_ID,
    userId: request.userId ?? DEMO_USER_ID,
  };
}

export function resolveLocalDemoJournalTradeContextForApi(
  savedTradeId: string,
  repository = new SqliteImportCommitRepository(),
): SavedTradeJournalIdentity | null {
  return repository.getSavedTradeJournalIdentity({
    tradeId: savedTradeId,
    userId: DEMO_USER_ID,
  });
}

function timestampFromRequest(
  request: JournalLevelAnalysisTradeLinkApiRequest,
): number | null {
  if (request.asOfBoundaryTimestamp !== undefined) {
    return request.asOfBoundaryTimestamp;
  }

  if (!request.tradeEndedAt) {
    return null;
  }

  const timestamp = Date.parse(request.tradeEndedAt);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function blockedResolution(args: {
  request: JournalLevelAnalysisTradeLinkApiRequest;
  policy: JournalLevelAnalysisTradeLinkMatchPolicy;
  matchResult: JournalLevelAnalysisTradeLinkMatchResult;
  limitations?: JournalLevelAnalysisTradeLinkResolution["limitations"];
}): JournalLevelAnalysisTradeLinkResolution {
  return {
    contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_RESOLUTION_API_CONTRACT_VERSION,
    status: args.matchResult.status,
    savedTradeId: args.request.savedTradeId,
    symbol: normalizeSymbol(args.request.symbol),
    provider: args.request.provider,
    matchPolicy: args.policy,
    matchResult: args.matchResult,
    limitations: args.limitations ?? [],
  };
}

function matchedResolution(args: {
  request: JournalLevelAnalysisTradeLinkApiRequest;
  policy: JournalLevelAnalysisTradeLinkMatchPolicy;
  deliveryRecord: JournalLevelAnalysisDeliveryRecord;
  symbolSummary: JournalLevelAnalysisDeliverySymbolSummary;
  checkedAt: string;
}): JournalLevelAnalysisTradeLinkResolution {
  return {
    contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_RESOLUTION_API_CONTRACT_VERSION,
    status: "matched",
    savedTradeId: args.request.savedTradeId,
    symbol: normalizeSymbol(args.request.symbol),
    provider: args.request.provider,
    matchPolicy: args.policy,
    matchResult: {
      status: "matched",
      reason: "symbol_provider_asof_match",
      candidateDeliveryId: args.deliveryRecord.id,
      candidateSummaryAsOfTimestamp: args.symbolSummary.asOfTimestamp,
      checkedAt: args.checkedAt,
    },
    candidate: {
      deliveryId: args.deliveryRecord.id,
      rawPayloadHash: args.deliveryRecord.rawPayloadHash,
      sourceKind: args.deliveryRecord.sourceKind,
      asOfTimestamp: args.symbolSummary.asOfTimestamp,
      asOfIso: args.symbolSummary.asOfIso,
      fifteenMinuteContextOnlyStatus:
        args.symbolSummary.fifteenMinuteContextOnlyStatus,
    },
    limitations: args.symbolSummary.limitations,
  };
}

function findSymbolSummary(
  record: JournalLevelAnalysisDeliveryRecord,
  symbol: string,
  provider: string,
): JournalLevelAnalysisDeliverySymbolSummary | null {
  if (record.validationStatus !== "accepted") {
    return null;
  }

  const normalized = normalizeSymbol(symbol);
  return (
    record.perSymbolSummary.find(
      (summary) =>
        normalizeSymbol(summary.symbol) === normalized && summary.provider === provider,
    ) ?? null
  );
}

function packagedSummaryHasContextOnly15m(args: {
  deliveryRecord: JournalLevelAnalysisDeliveryRecord;
  symbolSummary: JournalLevelAnalysisDeliverySymbolSummary;
}): boolean {
  if (args.deliveryRecord.sourceKind !== "packaged_review_delivery") {
    return true;
  }

  return args.symbolSummary.fifteenMinuteContextOnlyStatus === "context_only";
}

export async function readJournalLevelAnalysisTradeLinkApiRequest(
  request: Request,
): Promise<JournalLevelAnalysisTradeLinkApiRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!isRecord(body)) {
    throw new Error("Request body must be an object.");
  }

  const matchPolicy = isRecord(body.matchPolicy)
    ? (body.matchPolicy as Partial<JournalLevelAnalysisTradeLinkMatchPolicy>)
    : undefined;

  return {
    savedTradeId: readRequiredString(body, "savedTradeId"),
    symbol: readRequiredString(body, "symbol"),
    provider: readRequiredString(body, "provider"),
    workspaceId: readOptionalString(body.workspaceId),
    accountId: readOptionalString(body.accountId),
    userId: readOptionalString(body.userId),
    importBatchId: readOptionalString(body.importBatchId),
    deliveryId: readOptionalString(body.deliveryId),
    tradeEndedAt: readOptionalString(body.tradeEndedAt),
    asOfBoundaryTimestamp: readOptionalNumber(body.asOfBoundaryTimestamp),
    matchPolicy,
    linkSource: readOptionalString(body.linkSource) as
      | JournalLevelAnalysisTradeLinkApiRequest["linkSource"]
      | undefined,
    createdAt: readOptionalString(body.createdAt),
  };
}

export function resolveJournalLevelAnalysisTradeLinkForApi(
  request: JournalLevelAnalysisTradeLinkApiRequest,
  options: JournalLevelAnalysisTradeLinkServiceOptions = {},
): JournalLevelAnalysisTradeLinkResolution {
  const deliveryRepository = deliveryRepositoryFromOptions(options);
  const checkedAt = nowIso(options);
  const policy = createDefaultJournalLevelAnalysisTradeLinkMatchPolicy(
    request.matchPolicy,
  );
  const boundaryTimestamp = timestampFromRequest(request);

  if (
    policy.asOfPolicy === "latest_before_or_equal_trade_end" &&
    boundaryTimestamp === null
  ) {
    return blockedResolution({
      request,
      policy,
      matchResult: {
        status: "blocked",
        reason: "trade_timestamp_missing",
        checkedAt,
      },
      limitations: [
        {
          code: "trade_timestamp_missing",
          field: "tradeEndedAt",
          message: "A trade end timestamp is required for as-of matching.",
        },
      ],
    });
  }

  const symbol = normalizeSymbol(request.symbol);
  const summary =
    boundaryTimestamp === null
      ? deliveryRepository.getLatestAcceptedSymbolSummary({
          symbol,
          provider: request.provider,
        })
      : deliveryRepository.getLatestAcceptedSymbolSummaryAtOrBefore({
          symbol,
          provider: request.provider,
          asOfTimestamp: boundaryTimestamp,
        });

  if (!summary) {
    const latest = deliveryRepository.getLatestAcceptedSymbolSummary({
      symbol,
      provider: request.provider,
    });

    if (latest && boundaryTimestamp !== null && latest.asOfTimestamp > boundaryTimestamp) {
      return blockedResolution({
        request,
        policy,
        matchResult: {
          status: "blocked",
          reason: "as_of_after_allowed_boundary",
          candidateDeliveryId: latest.deliveryId,
          candidateSummaryAsOfTimestamp: latest.asOfTimestamp,
          checkedAt,
        },
        limitations: [
          {
            code: "as_of_after_allowed_boundary",
            field: "symbolSummaryAsOfTimestamp",
            message: "Candidate symbol facts are after the selected trade boundary.",
          },
        ],
      });
    }

    return blockedResolution({
      request,
      policy,
      matchResult: {
        status: "not_found",
        reason: "no_accepted_symbol_summary",
        checkedAt,
      },
    });
  }

  const deliveryRecord = deliveryRepository.getDeliveryRecord(summary.deliveryId);
  if (!deliveryRecord || deliveryRecord.validationStatus !== "accepted") {
    return blockedResolution({
      request,
      policy,
      matchResult: {
        status: "blocked",
        reason: "delivery_quarantined",
        candidateDeliveryId: summary.deliveryId,
        candidateSummaryAsOfTimestamp: summary.asOfTimestamp,
        checkedAt,
      },
    });
  }

  if (!packagedSummaryHasContextOnly15m({ deliveryRecord, symbolSummary: summary })) {
    return blockedResolution({
      request,
      policy,
      matchResult: {
        status: "blocked",
        reason: "fifteen_minute_not_context_only",
        candidateDeliveryId: summary.deliveryId,
        candidateSummaryAsOfTimestamp: summary.asOfTimestamp,
        checkedAt,
      },
    });
  }

  return matchedResolution({
    request,
    policy,
    deliveryRecord,
    symbolSummary: summary,
    checkedAt,
  });
}

export function persistJournalLevelAnalysisTradeLinkForApi(
  request: JournalLevelAnalysisTradeLinkApiRequest,
  options: JournalLevelAnalysisTradeLinkServiceOptions = {},
): JournalLevelAnalysisTradeLinkApiResponse & { duplicate?: boolean } {
  const deliveryRepository = deliveryRepositoryFromOptions(options);
  const tradeLinkRepository = tradeLinkRepositoryFromOptions(options);
  const createdAt = request.createdAt ?? nowIso(options);
  const journalScope = scopeFromRequest(request);
  const policy = createDefaultJournalLevelAnalysisTradeLinkMatchPolicy(
    request.matchPolicy,
  );
  const deliveryRecord = request.deliveryId
    ? deliveryRepository.getDeliveryRecord(request.deliveryId)
    : null;
  let selectedDeliveryRecord = deliveryRecord;
  let selectedSymbolSummary =
    deliveryRecord && deliveryRecord.validationStatus === "accepted"
      ? findSymbolSummary(deliveryRecord, request.symbol, request.provider)
      : null;
  let matchResult: JournalLevelAnalysisTradeLinkMatchResult | null = null;

  if (!selectedDeliveryRecord || !selectedSymbolSummary) {
    const resolution = resolveJournalLevelAnalysisTradeLinkForApi(request, options);
    if (resolution.status !== "matched" || !resolution.candidate) {
      return {
        contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
        status: "blocked",
        savedTradeId: request.savedTradeId,
        symbol: normalizeSymbol(request.symbol),
        provider: request.provider,
        matchResult: resolution.matchResult,
      };
    }

    selectedDeliveryRecord = deliveryRepository.getDeliveryRecord(
      resolution.candidate.deliveryId,
    );
    selectedSymbolSummary =
      selectedDeliveryRecord && selectedDeliveryRecord.validationStatus === "accepted"
        ? findSymbolSummary(selectedDeliveryRecord, request.symbol, request.provider)
        : null;
    matchResult = resolution.matchResult;
  }

  if (
    !selectedDeliveryRecord ||
    selectedDeliveryRecord.validationStatus !== "accepted" ||
    !selectedSymbolSummary
  ) {
    return {
      contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
      status: "blocked",
      savedTradeId: request.savedTradeId,
      symbol: normalizeSymbol(request.symbol),
      provider: request.provider,
      matchResult: {
        status: "blocked",
        reason: "delivery_quarantined",
        candidateDeliveryId: request.deliveryId,
        checkedAt: createdAt,
      },
    };
  }

  const record = createJournalLevelAnalysisTradeLinkRecord({
    id: linkIdFor({
      workspaceId: journalScope.workspaceId,
      accountId: journalScope.accountId,
      userId: journalScope.userId,
      savedTradeId: request.savedTradeId,
      deliveryId: selectedDeliveryRecord.id,
      symbol: selectedSymbolSummary.symbol,
    }),
    createdAt,
    workspaceId: journalScope.workspaceId,
    accountId: journalScope.accountId,
    userId: journalScope.userId,
    savedTradeId: request.savedTradeId,
    importBatchId: request.importBatchId,
    linkSource: request.linkSource ?? "resolver",
    deliveryRecord: selectedDeliveryRecord,
    symbolSummary: selectedSymbolSummary,
    matchPolicy: policy,
    matchResult:
      matchResult && matchResult.status === "matched"
        ? {
            status: "matched",
            reason: "symbol_provider_asof_match",
            candidateDeliveryId: selectedDeliveryRecord.id,
            candidateSummaryAsOfTimestamp: selectedSymbolSummary.asOfTimestamp,
            checkedAt: matchResult.checkedAt,
          }
        : undefined,
  });
  const saveResult = tradeLinkRepository.saveTradeLinkRecord(record);

  return {
    contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
    status: saveResult.record.linkStatus,
    linkId: saveResult.record.id,
    savedTradeId: saveResult.record.savedTradeId,
    deliveryId: saveResult.record.deliveryId,
    symbol: saveResult.record.symbol,
    provider: saveResult.record.provider,
    matchResult: saveResult.record.matchResult,
    duplicate: saveResult.status === "duplicate",
  };
}

export function getJournalLevelAnalysisForTradeApi(
  args: {
    savedTradeId: string;
    journalScope: JournalLevelAnalysisTradeLinkReadScope;
  },
  options: JournalLevelAnalysisTradeLinkServiceOptions = {},
): JournalTradeLevelAnalysisApiResponse {
  const link = tradeLinkRepositoryFromOptions(
    options,
  ).getLatestTradeLinkForSavedTrade({
    savedTradeId: args.savedTradeId,
    ...args.journalScope,
  });

  if (!link) {
    return {
      contractVersion: JOURNAL_TRADE_LEVEL_ANALYSIS_API_CONTRACT_VERSION,
      status: "not_found",
      savedTradeId: args.savedTradeId,
    };
  }

  return {
    contractVersion: JOURNAL_TRADE_LEVEL_ANALYSIS_API_CONTRACT_VERSION,
    status: "found",
    savedTradeId: args.savedTradeId,
    link,
  };
}

export function getTradeDetailLevelFactsForApi(
  args: {
    savedTradeId: string;
    journalScope: JournalLevelAnalysisTradeLinkReadScope;
    featureEnabled?: boolean;
  },
  options: JournalLevelAnalysisTradeLinkServiceOptions = {},
): TradeDetailLevelFactsReadModel {
  const featureEnabled = args.featureEnabled ?? true;
  const link = featureEnabled
    ? tradeLinkRepositoryFromOptions(options).getLatestTradeLinkForSavedTrade({
        savedTradeId: args.savedTradeId,
        ...args.journalScope,
      })
    : null;

  return buildTradeDetailLevelFactsReadModel({
    savedTradeId: args.savedTradeId,
    featureEnabled,
    link,
  });
}

export function getJournalLevelAnalysisTradeLinkForAdminApi(
  args: {
    linkId: string;
  },
  options: JournalLevelAnalysisTradeLinkServiceOptions = {},
): JournalLevelAnalysisTradeLinkAdminApiResponse {
  const link = tradeLinkRepositoryFromOptions(options).getTradeLinkRecord(args.linkId);

  if (!link) {
    return {
      contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
      status: "not_found",
    };
  }

  return {
    contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
    status: "found",
    linkId: link.id,
    savedTradeId: link.savedTradeId,
    deliveryId: link.deliveryId,
    rawPayloadHash: link.rawPayloadHash,
    link,
  };
}

export function journalLevelAnalysisTradeLinkErrorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json({ ok: false, code, message }, { status });
}
