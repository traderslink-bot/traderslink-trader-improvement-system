import type {
  Candle,
  CandleProviderResponse,
  CandleTimeframe,
  HistoricalFetchRequest,
  SupportResistanceCandleMap,
  SupportResistanceContext as LevelsSystemV2BaseSupportResistanceContext,
  SupportResistanceSymbolContext as LevelsSystemV2SupportResistanceContext,
  TradeAnalysisCandleContext,
  TradeAnalysisCandleWindowOptions,
} from "levels-system-v2/support-resistance-engine";
import type { Candle as TimelineCandle } from "../types/candle";
import type {
  NormalizeCandleInput,
} from "../normalizers/normalize-candle";
import type { NormalizeExecutionInput } from "../normalizers/normalize-execution";
import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { SessionContextInput } from "../types/session-context";
import type { TradeDirection } from "../types/trade-timeline-input";
import {
  buildLevelsSystemSupportResistanceOptions,
  type LevelsSystemRuntimeConfig,
} from "../../support-resistance/levels-system-runtime-options";
import { LevelsSystemWarehouseBackedFetchService } from "../../support-resistance/levels-system-warehouse-fetch-service";
import {
  createRawTradeTimeline,
  createRawTradeTimelineWithLevelsSystem,
  type CreateRawTradeTimelineArgs,
} from "./create-raw-trade-timeline";
import {
  mapSupportResistanceSymbolContextToLocalContext,
} from "../../support-resistance/levels-system-adapter";

const DEFAULT_REQUESTED_LOOKBACK_BARS = 0;
const DEFAULT_POST_TRADE_MINUTES = 60;
const DEFAULT_PADDING_MINUTES = 5;
const DEFAULT_TRADE_WINDOW_LOOKBACK_BARS = 120;
const ONE_MINUTE_MS = 60_000;
const FIVE_MINUTES_MS = 300_000;

type LevelsSystemV2EngineModule =
  typeof import("levels-system-v2/support-resistance-engine");

type IbApiRuntimeClient = {
  connect: () => void;
  disconnect?: () => void;
  isConnected?: boolean;
  on: (eventName: string, listener: (...args: unknown[]) => void) => void;
  off: (eventName: string, listener: (...args: unknown[]) => void) => void;
};

type IbApiRuntimeModule = {
  IBApi: new (options: {
    clientId: number;
    host: string;
    port: number;
  }) => IbApiRuntimeClient;
};

const sharedIbkrClientByConnection = new Map<
  string,
  Promise<IbApiRuntimeClient>
>();
const SHARED_IBKR_DISPOSE_GLOBAL_KEY =
  "__traderIntelligenceDisposeLevelsSystemIbkrClients";

async function loadLevelsSystemV2Engine(): Promise<
  Pick<
    LevelsSystemV2EngineModule,
    "CandleFetchService" | "buildSupportResistanceContextFromCandles"
  >
> {
  return (await import(
    /* webpackIgnore: true */ "levels-system-v2/support-resistance-engine"
  )) as Pick<
    LevelsSystemV2EngineModule,
    "CandleFetchService" | "buildSupportResistanceContextFromCandles"
  >;
}

async function loadIbApiRuntime(): Promise<IbApiRuntimeModule> {
  return (await import("@stoqey/ib")) as IbApiRuntimeModule;
}

type LevelsSystemV2CandleFetchClient = {
  fetchCandles(
    request: HistoricalFetchRequest,
  ): Promise<CandleProviderResponse>;
  getProviderName?: () => CandleProviderResponse["provider"];
};

type HydratedLevelsSystemCandles = {
  preTradeCandles: NormalizeCandleInput[];
  tradeCandles: NormalizeCandleInput[];
  postTradeCandles: NormalizeCandleInput[];
  candlesByTimeframe: Partial<Record<CandleTimeframe, Candle[]>>;
  tradeWindowFetch: CandleProviderResponse;
  warnings: string[];
};

export interface CreateRawTradeTimelineWithLevelsSystemCandlesArgs {
  symbol: string;
  tradeDirection: TradeDirection;
  executions: NormalizeExecutionInput[];
  sessionContext: SessionContextInput;
  levelsSystem?: LevelsSystemRuntimeConfig;
  tradeWindow?: TradeAnalysisCandleWindowOptions;
  preTradeCandles?: NormalizeCandleInput[];
  tradeCandles?: NormalizeCandleInput[];
  postTradeCandles?: NormalizeCandleInput[];
  executionWindowCandlesBeforeCount?: number;
  executionWindowCandlesAfterCount?: number;
}

export interface RawTradeTimelineWithLevelsSystemCandlesBuildResult
  extends RawTradeTimelineBuildResult {
  levelsSystemTradeAnalysisCandleContext: TradeAnalysisCandleContext;
}

function parseExecutionTimestamp(timestamp: string | Date): number | null {
  const parsed =
    timestamp instanceof Date ? timestamp.getTime() : Date.parse(timestamp);

  return Number.isFinite(parsed) ? parsed : null;
}

function resolveExecutionTradeBounds(
  executions: NormalizeExecutionInput[],
): { tradeStartTimestamp: number; tradeEndTimestamp: number } {
  const timestamps = executions
    .map((execution) => parseExecutionTimestamp(execution.timestamp))
    .filter((timestamp): timestamp is number => timestamp !== null)
    .sort((left, right) => left - right);

  return {
    tradeStartTimestamp: timestamps[0] ?? 0,
    tradeEndTimestamp: timestamps[timestamps.length - 1] ?? 0,
  };
}

function normalizeAsOfTimestamp(
  timestamp: LevelsSystemRuntimeConfig["asOfTimestamp"],
): number | null {
  if (timestamp === undefined) {
    return null;
  }

  const parsed =
    timestamp instanceof Date
      ? timestamp.getTime()
      : typeof timestamp === "string"
        ? Date.parse(timestamp)
        : timestamp;

  return Number.isFinite(parsed) ? parsed : null;
}

function resolveAsOfTimestamp(args: {
  explicitAsOfTimestamp: LevelsSystemRuntimeConfig["asOfTimestamp"];
  tradeEndTimestamp: number;
  tradeWindow: TradeAnalysisCandleWindowOptions | undefined;
}): number | null {
  const explicit = normalizeAsOfTimestamp(args.explicitAsOfTimestamp);

  if (explicit !== null) {
    return explicit;
  }

  if (!Number.isFinite(args.tradeEndTimestamp) || args.tradeEndTimestamp <= 0) {
    return null;
  }

  const postTradeMinutes =
    args.tradeWindow?.postTradeMinutes ?? DEFAULT_POST_TRADE_MINUTES;
  const paddingMinutes =
    args.tradeWindow?.paddingMinutes ?? DEFAULT_PADDING_MINUTES;

  return (
    args.tradeEndTimestamp +
    (postTradeMinutes + paddingMinutes) * ONE_MINUTE_MS
  );
}

function buildEmptyTradeWindowFacts(
  executions: NormalizeExecutionInput[],
): TradeAnalysisCandleContext["tradeWindowFacts"] {
  const firstExecution = executions[0];
  const firstExecutionTimestamp = firstExecution
    ? parseExecutionTimestamp(firstExecution.timestamp)
    : null;
  const side = firstExecution?.side.trim().toLowerCase();

  return {
    referenceExecutionTimestamp: firstExecutionTimestamp,
    referenceExecutionTimestampIso:
      firstExecutionTimestamp === null
        ? null
        : new Date(firstExecutionTimestamp).toISOString(),
    referencePrice:
      firstExecution?.price === undefined ? null : Number(firstExecution.price),
    referenceSide: side === "buy" || side === "sell" ? side : "unknown",
    highestHighDuringTrade: null,
    lowestLowDuringTrade: null,
    highestHighAfterExit: null,
    lowestLowAfterExit: null,
    maxFavorableMovePct: null,
    maxAdverseMovePct: null,
    postExitContinuationPct: null,
    postExitReliefPct: null,
  };
}

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function hasSuppliedCandles(
  args: CreateRawTradeTimelineWithLevelsSystemCandlesArgs,
): boolean {
  return (
    (args.preTradeCandles?.length ?? 0) > 0 ||
    (args.tradeCandles?.length ?? 0) > 0 ||
    (args.postTradeCandles?.length ?? 0) > 0
  );
}

function toLevelsSystemCandle(candle: TimelineCandle): Candle {
  return {
    timestamp: Date.parse(candle.timestamp),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

function aggregateCandlesToFiveMinutes(candles: Candle[]): Candle[] {
  const groups = new Map<number, Candle[]>();

  for (const candle of candles) {
    const bucket = Math.floor(candle.timestamp / 300_000) * 300_000;
    const group = groups.get(bucket) ?? [];

    group.push(candle);
    groups.set(bucket, group);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([timestamp, group]) => {
      const sorted = [...group].sort(
        (left, right) => left.timestamp - right.timestamp,
      );

      return {
        timestamp,
        open: sorted[0].open,
        high: Math.max(...sorted.map((candle) => candle.high)),
        low: Math.min(...sorted.map((candle) => candle.low)),
        close: sorted[sorted.length - 1].close,
        volume: sorted.reduce((sum, candle) => sum + candle.volume, 0),
      };
    });
}

function buildFiveMinuteCandles(timelineCandles: TimelineCandle[]): Candle[] {
  const candles = timelineCandles
    .map(toLevelsSystemCandle)
    .filter((candle) => Number.isFinite(candle.timestamp));

  return aggregateCandlesToFiveMinutes(candles);
}

function shouldTryEodhdOneMinuteFallback(response: CandleProviderResponse): boolean {
  if (response.provider !== "eodhd") {
    return false;
  }

  return (
    response.completenessStatus === "empty" ||
    response.stale ||
    response.validationIssues.some((issue) =>
      issue.code === "zero_results" ||
      issue.code === "stale_final_candle" ||
      issue.code === "missing_recent_candles" ||
      issue.code === "incomplete_current_session_data"
    )
  );
}

function buildAggregatedFiveMinuteResponse(args: {
  lookbackBars: number;
  oneMinuteResponse: CandleProviderResponse;
}): CandleProviderResponse {
  const candles = aggregateCandlesToFiveMinutes(args.oneMinuteResponse.candles)
    .slice(-args.lookbackBars);
  const expectedIntervalMs = FIVE_MINUTES_MS;
  const lastCandle = candles[candles.length - 1];
  const stale =
    lastCandle === undefined
      ? false
      : args.oneMinuteResponse.requestedEndTimestamp - lastCandle.timestamp >
        expectedIntervalMs * 3;
  const validationIssues = lastCandle === undefined
    ? [
        {
          code: "zero_results" as const,
          severity: "error" as const,
          message: `Provider ${args.oneMinuteResponse.provider} returned zero candles for ${args.oneMinuteResponse.symbol} 5m.`,
        },
      ]
    : stale
      ? [
          {
            code: "stale_final_candle" as const,
            severity: "warning" as const,
            message: `Final candle appears stale for ${args.oneMinuteResponse.symbol} 5m.`,
          },
        ]
      : [];

  return {
    ...args.oneMinuteResponse,
    timeframe: "5m",
    requestedLookbackBars: args.lookbackBars,
    candles,
    actualBarsReturned: candles.length,
    completenessStatus:
      candles.length === 0
        ? "empty"
        : candles.length >= args.lookbackBars
          ? "complete"
          : "partial",
    stale,
    validationIssues,
    providerMetadata: {
      ...(args.oneMinuteResponse.providerMetadata ?? {}),
      sourceTimeframe: "1m",
      derivedTimeframe: "5m",
      aggregationMethod: "ohlcv_1m_to_5m",
      sourceActualBarsReturned: args.oneMinuteResponse.actualBarsReturned,
    },
  };
}

function toTimelineCandleInput(args: {
  candle: Candle;
  symbol: string;
  timeframe: string;
}): NormalizeCandleInput {
  return {
    symbol: args.symbol,
    timeframe: args.timeframe,
    timestamp: new Date(args.candle.timestamp).toISOString(),
    open: args.candle.open,
    high: args.candle.high,
    low: args.candle.low,
    close: args.candle.close,
    volume: args.candle.volume,
  };
}

function splitFiveMinuteCandlesForTrade(args: {
  candles: Candle[];
  symbol: string;
  timeframe: string;
  tradeStartTimestamp: number;
  tradeEndTimestamp: number;
}): Pick<
  HydratedLevelsSystemCandles,
  "postTradeCandles" | "preTradeCandles" | "tradeCandles"
> {
  const preTradeCandles: NormalizeCandleInput[] = [];
  const tradeCandles: NormalizeCandleInput[] = [];
  const postTradeCandles: NormalizeCandleInput[] = [];

  for (const candle of args.candles) {
    const candleEndTimestamp = candle.timestamp + FIVE_MINUTES_MS;
    const normalized = toTimelineCandleInput({
      candle,
      symbol: args.symbol,
      timeframe: args.timeframe,
    });

    if (candleEndTimestamp <= args.tradeStartTimestamp) {
      preTradeCandles.push(normalized);
    } else if (
      candle.timestamp <= args.tradeEndTimestamp &&
      candleEndTimestamp >= args.tradeStartTimestamp
    ) {
      tradeCandles.push(normalized);
    } else if (candle.timestamp > args.tradeEndTimestamp) {
      postTradeCandles.push(normalized);
    }
  }

  return {
    preTradeCandles,
    tradeCandles,
    postTradeCandles,
  };
}

function asCandleFetchClient(
  value: unknown,
): LevelsSystemV2CandleFetchClient | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "fetchCandles" in value &&
    typeof value.fetchCandles === "function"
  ) {
    return value as LevelsSystemV2CandleFetchClient;
  }

  return null;
}

function waitForIbkrConnection(
  ib: IbApiRuntimeClient,
  timeoutMs: number,
): Promise<IbApiRuntimeClient> {
  if (ib.isConnected === true) {
    return Promise.resolve(ib);
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = (): void => {
      clearTimeout(timeoutHandle);
      ib.off("connected", onConnected);
      ib.off("error", onError);
    };
    const settleResolve = (): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(ib);
    };
    const settleReject = (error: Error): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };
    const onConnected = (): void => {
      settleResolve();
    };
    const onError = (error: unknown, code?: unknown): void => {
      if (code === 502 || code === 504) {
        settleReject(
          new Error(
            `IBKR connection failed before candle hydration could start: ${String(error)}`,
          ),
        );
      }
    };
    const timeoutHandle = setTimeout(() => {
      settleReject(
        new Error(
          `Timed out connecting to IBKR for candle hydration after ${timeoutMs}ms.`,
        ),
      );
    }, timeoutMs);

    ib.on("connected", onConnected);
    ib.on("error", onError);

    try {
      ib.connect();
    } catch (error) {
      settleReject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

async function getSharedIbkrClient(args: {
  clientId: number;
  connectionTimeoutMs: number;
  host: string;
  port: number;
}): Promise<IbApiRuntimeClient> {
  const key = `${args.host}:${args.port}:${args.clientId}`;
  const existing = sharedIbkrClientByConnection.get(key);

  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const { IBApi } = await loadIbApiRuntime();
    const ib = new IBApi({
      clientId: args.clientId,
      host: args.host,
      port: args.port,
    });

    return waitForIbkrConnection(ib, args.connectionTimeoutMs);
  })();

  sharedIbkrClientByConnection.set(key, promise);

  try {
    return await promise;
  } catch (error) {
    sharedIbkrClientByConnection.delete(key);
    throw error;
  }
}

async function resolveV2CandleFetchClient(
  levelsSystem: LevelsSystemRuntimeConfig,
): Promise<LevelsSystemV2CandleFetchClient | null> {
  const suppliedClient = asCandleFetchClient(levelsSystem.fetchService);

  if (suppliedClient) {
    return suppliedClient;
  }

  if (!levelsSystem.fetchServiceOptions) {
    return null;
  }

  const { CandleFetchService } = await loadLevelsSystemV2Engine();
  const configuredFetchOptions = levelsSystem.fetchServiceOptions as Record<
    string,
    unknown
  >;
  const fetchServiceOptions: Record<string, unknown> = {
    providerName: configuredFetchOptions.providerName,
    ibkrTimeoutMs: configuredFetchOptions.ibkrTimeoutMs,
    eodhdApiToken: configuredFetchOptions.eodhdApiToken,
    eodhdExchangeSuffix: configuredFetchOptions.eodhdExchangeSuffix,
    eodhdBaseUrl: configuredFetchOptions.eodhdBaseUrl,
    yahooBaseUrl: configuredFetchOptions.yahooBaseUrl,
  };

  if (configuredFetchOptions.providerName === "ibkr") {
    fetchServiceOptions.ib = await getSharedIbkrClient({
      clientId: Number(configuredFetchOptions.clientId ?? 101),
      connectionTimeoutMs:
        Number(configuredFetchOptions.connectionTimeoutMs ?? 10_000),
      host: String(configuredFetchOptions.host ?? "127.0.0.1"),
      port: Number(configuredFetchOptions.port ?? 7497),
    });
  }

  const delegate = asCandleFetchClient(new CandleFetchService(fetchServiceOptions));

  if (!delegate) {
    return null;
  }

  if (levelsSystem.warehouseDirectoryPath) {
    return new LevelsSystemWarehouseBackedFetchService({
      delegate,
      mode: levelsSystem.warehouseMode ?? "read_write",
      warehouseDirectoryPath: levelsSystem.warehouseDirectoryPath,
    });
  }

  return delegate;
}

function wrapCandleContextAsSymbolContext(
  context: LevelsSystemV2BaseSupportResistanceContext,
): LevelsSystemV2SupportResistanceContext {
  return {
    ...context,
    mode: "symbol",
    candleFetchingOwnedBy: "levels-system",
    requestedTimeframes: ["daily", "4h", "5m"],
    fetches: [],
    diagnostics: [],
  };
}

function hasRequiredHigherTimeframeCandles(
  candlesByTimeframe: Partial<Record<CandleTimeframe, readonly unknown[]>>,
): boolean {
  return (
    (candlesByTimeframe.daily?.length ?? 0) > 0 &&
    (candlesByTimeframe["4h"]?.length ?? 0) > 0
  );
}

function buildEmptyLevelsSystemSymbolContext(args: {
  asOfTimestamp: number | null;
  sessionDate?: string;
  symbol: string;
}): LevelsSystemV2SupportResistanceContext {
  const symbol = args.symbol.trim().toUpperCase();

  return {
    symbol,
    mode: "symbol",
    candleFetchingOwnedBy: "levels-system",
    requestedTimeframes: ["daily", "4h", "5m"],
    fetches: [],
    diagnostics: [
      {
        code: "missing_required_higher_timeframe",
        severity: "error",
        message:
          "Daily and 4h candles are required before support/resistance context can be built.",
      },
    ],
    candleFilterDiagnostics: [],
    levels: {
      symbol,
      generatedAt: args.asOfTimestamp ?? Date.now(),
      metadata: {
        providerByTimeframe: {},
        dataQualityFlags: ["missing_required_higher_timeframe"],
        freshness: "stale",
      },
      majorSupport: [],
      majorResistance: [],
      intermediateSupport: [],
      intermediateResistance: [],
      intradaySupport: [],
      intradayResistance: [],
      extensionLevels: {
        support: [],
        resistance: [],
      },
      specialLevels: {},
    },
    referenceLevels: {
      sessionDate: args.sessionDate ?? null,
      previousDayHigh: null,
      previousDayLow: null,
      previousDayClose: null,
      premarketHigh: null,
      premarketLow: null,
      premarketBase: null,
      openingRangeHigh: null,
      openingRangeLow: null,
      currentSessionHigh: null,
      currentSessionLow: null,
      diagnostics: [
        {
          code: "missing_daily_candles",
          message:
            "Daily candles are required before reference levels can be built.",
        },
      ],
    },
    gapStructure: {
      nearestGapAbove: null,
      nearestGapBelow: null,
      recentGaps: [],
      diagnostics: [
        {
          code: "missing_candles",
          message:
            "Daily candles are required before gap structure can be built.",
        },
      ],
    },
    dynamicLevels: {
      vwap: null,
      emaByPeriod: {},
      ema9: null,
      ema20: null,
      priceContext: null,
      diagnostics: [
        {
          code: "missing_intraday_candles",
          message:
            "Support/resistance context did not have enough candle data for dynamic levels.",
        },
      ],
    },
    marketStructure: {
      symbol,
      timeframe: "5m",
      asOfTimestamp: args.asOfTimestamp,
      state: "insufficient_data",
      confidence: {
        score: 0,
        label: "low",
        reasons: ["Daily and 4h candles are required."],
      },
      pivots: {
        confirmedHighs: [],
        confirmedLows: [],
        latestSwingHigh: null,
        latestSwingLow: null,
        priorSwingHigh: null,
        priorSwingLow: null,
      },
      trend: {
        direction: "unknown",
        higherLowCount: 0,
        lowerHighCount: 0,
        higherHighCount: 0,
        lowerLowCount: 0,
        latestHigherLow: null,
        latestLowerHigh: null,
      },
      range: null,
      pivotEvent: null,
      diagnostics: [
        {
          code: "insufficient_candles",
          severity: "warning",
          message:
            "Not enough higher-timeframe candles to build market structure.",
        },
      ],
    },
    traderContext: {} as LevelsSystemV2BaseSupportResistanceContext["traderContext"],
  };
}

function isMissingRequiredHigherTimeframeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("requires daily candles") ||
    message.includes("requires 4h candles") ||
    message.includes("missing_required_higher_timeframe")
  );
}

async function buildLevelsSystemSymbolContextFromCandles(args: {
  asOfTimestamp: number | null;
  candlesByTimeframe: Partial<Record<CandleTimeframe, Candle[]>>;
  levelsSystem: LevelsSystemRuntimeConfig | undefined;
  sessionDate?: string;
  symbol: string;
}): Promise<LevelsSystemV2SupportResistanceContext> {
  const { buildSupportResistanceContextFromCandles } =
    await loadLevelsSystemV2Engine();
  const candlesByTimeframe: SupportResistanceCandleMap = {
    daily: args.candlesByTimeframe.daily ?? [],
    "4h": args.candlesByTimeframe["4h"] ?? [],
    "5m": args.candlesByTimeframe["5m"] ?? [],
  };

  if (!hasRequiredHigherTimeframeCandles(candlesByTimeframe)) {
    return buildEmptyLevelsSystemSymbolContext({
      symbol: args.symbol,
      sessionDate: args.levelsSystem?.sessionDate ?? args.sessionDate,
      asOfTimestamp: args.asOfTimestamp,
    });
  }

  let context: LevelsSystemV2BaseSupportResistanceContext;

  try {
    context = await buildSupportResistanceContextFromCandles({
      symbol: args.symbol,
      sessionDate: args.levelsSystem?.sessionDate ?? args.sessionDate,
      asOfTimestamp: args.asOfTimestamp ?? undefined,
      candlesByTimeframe,
      config: args.levelsSystem?.config,
      runtimeOptions: args.levelsSystem?.runtimeOptions,
    });
  } catch (error) {
    if (!isMissingRequiredHigherTimeframeError(error)) {
      throw error;
    }

    return buildEmptyLevelsSystemSymbolContext({
      symbol: args.symbol,
      sessionDate: args.levelsSystem?.sessionDate ?? args.sessionDate,
      asOfTimestamp: args.asOfTimestamp,
    });
  }

  return wrapCandleContextAsSymbolContext(context);
}

export function disposeSharedLevelsSystemIbkrClients(): void {
  const clients = [...sharedIbkrClientByConnection.values()];
  sharedIbkrClientByConnection.clear();

  for (const clientPromise of clients) {
    void clientPromise.then((client) => {
      client.disconnect?.();
    });
  }
}

(globalThis as Record<string, unknown>)[SHARED_IBKR_DISPOSE_GLOBAL_KEY] =
  disposeSharedLevelsSystemIbkrClients;

function providerWarningLines(response: CandleProviderResponse): string[] {
  const metadata = response.providerMetadata ?? {};
  const warnings: string[] = [];
  const requestedSymbol =
    typeof metadata.ibkrRequestedSymbol === "string"
      ? metadata.ibkrRequestedSymbol
      : response.symbol;
  const resolvedSymbol =
    typeof metadata.ibkrResolvedSymbol === "string"
      ? metadata.ibkrResolvedSymbol
      : null;
  const resolvedExchange =
    typeof metadata.ibkrResolvedPrimaryExchange === "string"
      ? metadata.ibkrResolvedPrimaryExchange
      : null;

  if (metadata.ibkrContractAliasUsed === true && resolvedSymbol) {
    warnings.push(
      `levels-system v2 candle note: validated IBKR alias ${resolvedSymbol} for ${requestedSymbol}.`,
    );
  }

  if (resolvedSymbol && resolvedExchange) {
    warnings.push(
      `levels-system v2 candle note: ${requestedSymbol} resolved through ${resolvedSymbol} on ${resolvedExchange}.`,
    );
  }

  if (resolvedExchange === "PINK") {
    warnings.push(
      "levels-system v2 candle note: OTC/PINK data path was used; review candle basis before relying on fine-grained movement coaching.",
    );
  }

  return warnings;
}

function priceBasisWarningLines(args: {
  executions: NormalizeExecutionInput[];
  tradeWindowCandles: Candle[];
}): string[] {
  const executionPrices = args.executions
    .map((execution) => Number(execution.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  const candlePrices = args.tradeWindowCandles.flatMap((candle) => [
    candle.open,
    candle.high,
    candle.low,
    candle.close,
  ]).filter((price) => Number.isFinite(price) && price > 0);

  if (executionPrices.length === 0 || candlePrices.length === 0) {
    return [];
  }

  let largestDistancePct = 0;
  let largestRatio = 1;

  for (const executionPrice of executionPrices) {
    const nearestCandlePrice = candlePrices.reduce((nearest, candidate) =>
      Math.abs(candidate - executionPrice) < Math.abs(nearest - executionPrice)
        ? candidate
        : nearest,
    candlePrices[0]);
    const distancePct =
      Math.abs(nearestCandlePrice - executionPrice) / executionPrice * 100;

    if (distancePct > largestDistancePct) {
      largestDistancePct = distancePct;
      largestRatio = nearestCandlePrice / executionPrice;
    }
  }

  if (largestDistancePct >= 25) {
    return [
      `levels-system v2 candle warning: possible split/adjustment or symbol price-basis disconnect; largest execution/candle distance ${round(largestDistancePct, 2)}%; adjustment multiple approximately ${round(largestRatio, 3)}x.`,
      "Trade-window candle basis status: basis_adjustment_multiple_likely; basis is proven aligned: false.",
    ];
  }

  return ["Trade-window candle basis status: basis_aligned."];
}

function hasUnsafeTradeWindowPriceBasis(warnings: string[]): boolean {
  return warnings.some((warning) => {
    const normalized = warning.toLowerCase();

    return (
      normalized.includes("basis_adjustment_multiple_likely") ||
      normalized.includes("basis_mismatch") ||
      normalized.includes("price-basis disconnect") ||
      normalized.includes("basis is proven aligned: false")
    );
  });
}

async function hydrateCandlesFromLevelsSystemV2(args: {
  symbol: string;
  executions: NormalizeExecutionInput[];
  levelsSystem: LevelsSystemRuntimeConfig;
  tradeWindow: TradeAnalysisCandleWindowOptions | undefined;
}): Promise<HydratedLevelsSystemCandles | null> {
  const fetchClient = await resolveV2CandleFetchClient(args.levelsSystem);

  if (!fetchClient) {
    return null;
  }

  const { tradeStartTimestamp, tradeEndTimestamp } =
    resolveExecutionTradeBounds(args.executions);
  const endTimeMs =
    resolveAsOfTimestamp({
      explicitAsOfTimestamp: args.levelsSystem.asOfTimestamp,
      tradeEndTimestamp,
      tradeWindow: args.tradeWindow,
    }) ?? tradeEndTimestamp;
  const lookbackBars = {
    daily: args.levelsSystem.lookbackBars?.daily ?? 520,
    "4h": args.levelsSystem.lookbackBars?.["4h"] ?? 180,
    "5m":
      args.tradeWindow?.lookbackBars ??
      args.levelsSystem.lookbackBars?.["5m"] ??
      DEFAULT_TRADE_WINDOW_LOOKBACK_BARS,
  } satisfies Record<CandleTimeframe, number>;
  const fetch = async (
    timeframe: CandleTimeframe,
  ): Promise<CandleProviderResponse> => {
    const request: HistoricalFetchRequest = {
      symbol: args.symbol,
      timeframe,
      lookbackBars: lookbackBars[timeframe],
      endTimeMs,
      preferredProvider: args.levelsSystem.preferredProvider,
    };

    return fetchClient.fetchCandles(request);
  };
  let daily: CandleProviderResponse;
  let fourHour: CandleProviderResponse;

  try {
    [daily, fourHour] = await Promise.all([
      fetch("daily"),
      fetch("4h"),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Cannot build full support/resistance context for ${args.symbol}: daily and 4h candles are required. Higher-timeframe diagnostics: ${message}`,
    );
  }

  const fiveMinute = await fetch("5m");
  let tradeWindowFiveMinute = fiveMinute;

  if (shouldTryEodhdOneMinuteFallback(fiveMinute)) {
    const oneMinuteRequest: HistoricalFetchRequest = {
      symbol: args.symbol,
      timeframe: "1m",
      lookbackBars: lookbackBars["5m"] * 5,
      endTimeMs,
      preferredProvider: args.levelsSystem.preferredProvider,
    };
    const oneMinute = await fetchClient.fetchCandles(oneMinuteRequest);
    const aggregated = buildAggregatedFiveMinuteResponse({
      lookbackBars: lookbackBars["5m"],
      oneMinuteResponse: oneMinute,
    });

    if (aggregated.actualBarsReturned > 0 && !aggregated.stale) {
      tradeWindowFiveMinute = aggregated;
    }
  }

  if (daily.candles.length === 0 || fourHour.candles.length === 0) {
    throw new Error(
      `Cannot build full support/resistance context for ${args.symbol}: daily and 4h candles are required.`,
    );
  }

  const split = splitFiveMinuteCandlesForTrade({
    candles: tradeWindowFiveMinute.candles,
    symbol: args.symbol,
    timeframe: "5m",
    tradeStartTimestamp,
    tradeEndTimestamp,
  });

  return {
    ...split,
    candlesByTimeframe: {
      daily: daily.candles,
      "4h": fourHour.candles,
      "5m": tradeWindowFiveMinute.candles,
    },
    tradeWindowFetch: tradeWindowFiveMinute,
    warnings: [
      ...providerWarningLines(tradeWindowFiveMinute),
      ...(tradeWindowFiveMinute.providerMetadata?.aggregationMethod ===
      "ohlcv_1m_to_5m"
        ? [
            "levels-system info: EODHD 1m candles were aggregated into 5m trade-window candles.",
          ]
        : []),
      ...priceBasisWarningLines({
        executions: args.executions,
        tradeWindowCandles: tradeWindowFiveMinute.candles,
      }),
    ],
  };
}

function getMaxHigh(
  candles: TimelineCandle[],
): { price: number; timestamp: string } | null {
  if (candles.length === 0) {
    return null;
  }

  return candles.reduce((best, candle) =>
    candle.high > best.price
      ? { price: candle.high, timestamp: candle.timestamp }
      : best,
  { price: candles[0].high, timestamp: candles[0].timestamp });
}

function getMinLow(
  candles: TimelineCandle[],
): { price: number; timestamp: string } | null {
  if (candles.length === 0) {
    return null;
  }

  return candles.reduce((best, candle) =>
    candle.low < best.price
      ? { price: candle.low, timestamp: candle.timestamp }
      : best,
  { price: candles[0].low, timestamp: candles[0].timestamp });
}

function buildMoveWindowFact(args: {
  referenceTimestamp: number | null;
  referencePrice: number | null;
  point: { price: number; timestamp: string } | null;
}): NonNullable<
  TradeAnalysisCandleContext["tradeWindowFacts"]["highestHighDuringTrade"]
> | null {
  if (
    args.referenceTimestamp === null ||
    args.referencePrice === null ||
    args.referencePrice <= 0 ||
    args.point === null
  ) {
    return null;
  }

  const endTimestamp = Date.parse(args.point.timestamp);

  if (!Number.isFinite(endTimestamp)) {
    return null;
  }

  return {
    startTimestamp: args.referenceTimestamp,
    startTimestampIso: new Date(args.referenceTimestamp).toISOString(),
    endTimestamp,
    endTimestampIso: new Date(endTimestamp).toISOString(),
    price: args.point.price,
    movePctFromReference: round(
      ((args.point.price - args.referencePrice) / args.referencePrice) * 100,
    ),
  };
}

function positiveMovePct(args: {
  tradeDirection: TradeDirection;
  referencePrice: number | null;
  favorablePoint: { price: number } | null;
  adversePoint: { price: number } | null;
  kind: "favorable" | "adverse";
}): number | null {
  if (args.referencePrice === null || args.referencePrice <= 0) {
    return null;
  }

  const point =
    args.kind === "favorable" ? args.favorablePoint : args.adversePoint;

  if (point === null) {
    return null;
  }

  return round((Math.abs(point.price - args.referencePrice) /
    args.referencePrice) * 100);
}

function buildTradeWindowFactsFromResult(
  result: RawTradeTimelineBuildResult,
): TradeAnalysisCandleContext["tradeWindowFacts"] {
  const firstExecution = result.timeline.executions[0];
  const lastExecution =
    result.timeline.executions[result.timeline.executions.length - 1];

  if (!firstExecution) {
    return buildEmptyTradeWindowFacts([]);
  }

  const referenceTimestamp = Date.parse(firstExecution.timestamp);
  const referenceExecutionTimestamp = Number.isFinite(referenceTimestamp)
    ? referenceTimestamp
    : null;
  const highDuringTrade = getMaxHigh(result.timeline.tradeCandles);
  const lowDuringTrade = getMinLow(result.timeline.tradeCandles);
  const highAfterExit = getMaxHigh(result.timeline.postTradeCandles);
  const lowAfterExit = getMinLow(result.timeline.postTradeCandles);
  const favorableDuringTrade =
    result.timeline.tradeDirection === "short" ? lowDuringTrade : highDuringTrade;
  const adverseDuringTrade =
    result.timeline.tradeDirection === "short" ? highDuringTrade : lowDuringTrade;
  const exitReferencePrice = lastExecution?.price ?? null;
  const continuationAfterExit =
    result.timeline.tradeDirection === "short" ? lowAfterExit : highAfterExit;
  const reliefAfterExit =
    result.timeline.tradeDirection === "short" ? highAfterExit : lowAfterExit;

  return {
    referenceExecutionTimestamp,
    referenceExecutionTimestampIso:
      referenceExecutionTimestamp === null
        ? null
        : new Date(referenceExecutionTimestamp).toISOString(),
    referencePrice: firstExecution.price,
    referenceSide: firstExecution.side,
    highestHighDuringTrade: buildMoveWindowFact({
      referenceTimestamp: referenceExecutionTimestamp,
      referencePrice: firstExecution.price,
      point: highDuringTrade,
    }),
    lowestLowDuringTrade: buildMoveWindowFact({
      referenceTimestamp: referenceExecutionTimestamp,
      referencePrice: firstExecution.price,
      point: lowDuringTrade,
    }),
    highestHighAfterExit: buildMoveWindowFact({
      referenceTimestamp:
        lastExecution === undefined ? null : Date.parse(lastExecution.timestamp),
      referencePrice: exitReferencePrice,
      point: highAfterExit,
    }),
    lowestLowAfterExit: buildMoveWindowFact({
      referenceTimestamp:
        lastExecution === undefined ? null : Date.parse(lastExecution.timestamp),
      referencePrice: exitReferencePrice,
      point: lowAfterExit,
    }),
    maxFavorableMovePct: positiveMovePct({
      tradeDirection: result.timeline.tradeDirection,
      referencePrice: firstExecution.price,
      favorablePoint: favorableDuringTrade,
      adversePoint: adverseDuringTrade,
      kind: "favorable",
    }),
    maxAdverseMovePct: positiveMovePct({
      tradeDirection: result.timeline.tradeDirection,
      referencePrice: firstExecution.price,
      favorablePoint: favorableDuringTrade,
      adversePoint: adverseDuringTrade,
      kind: "adverse",
    }),
    postExitContinuationPct: positiveMovePct({
      tradeDirection: result.timeline.tradeDirection,
      referencePrice: exitReferencePrice,
      favorablePoint: continuationAfterExit,
      adversePoint: reliefAfterExit,
      kind: "favorable",
    }),
    postExitReliefPct: positiveMovePct({
      tradeDirection: result.timeline.tradeDirection,
      referencePrice: exitReferencePrice,
      favorablePoint: continuationAfterExit,
      adversePoint: reliefAfterExit,
      kind: "adverse",
    }),
  };
}

function mapExecutionRelations(
  result: RawTradeTimelineBuildResult,
): TradeAnalysisCandleContext["executionRelations"] {
  const relations = (result.executionLevelRelations ?? []).map((relation) => {
    const execution = result.timeline.executions.find(
      (candidate) => candidate.executionIndex === relation.executionIndex,
    );

    return {
      timestamp: Date.parse(relation.executionTimestamp),
      timestampIso: relation.executionTimestamp,
      price: relation.executionPrice,
      quantity: execution?.shares,
      side: execution?.side ?? "unknown",
      levelRelations: {
        nearestSupportBelow:
          relation.nearestSupportBelow === null
            ? null
            : { id: relation.nearestSupportBelow.levelId },
        nearestResistanceAbove:
          relation.nearestResistanceAbove === null
            ? null
            : { id: relation.nearestResistanceAbove.levelId },
        isNearSupport: relation.isNearSupport,
        isNearResistance: relation.isNearResistance,
      },
      dynamicLevelRelations: null,
      marketStructureState: null,
      marketStructureConfidence: null,
      diagnostics: [],
    };
  });

  return relations as unknown as TradeAnalysisCandleContext["executionRelations"];
}

function buildMarketFacts(args: {
  symbol: string;
  asOfTimestamp: number | null;
  executionRelations: TradeAnalysisCandleContext["executionRelations"];
}): TradeAnalysisCandleContext["marketFacts"] {
  const marketFacts = {
    contractVersion: "market_facts.trade_review.v2",
    symbol: args.symbol.trim().toUpperCase(),
    asOfTimestamp:
      args.asOfTimestamp === null
        ? null
        : new Date(args.asOfTimestamp).toISOString(),
    candleFetchingOwnedBy: "levels-system",
    executionSnapshots: args.executionRelations.map((relation) => ({
      relations: [
        relation.levelRelations?.nearestSupportBelow
          ? { benchmarkId: "nearest_daily_4h_support" }
          : null,
        relation.levelRelations?.nearestResistanceAbove
          ? { benchmarkId: "nearest_daily_4h_resistance" }
          : null,
      ].filter((value): value is { benchmarkId: string } => value !== null),
    })),
    diagnostics: [],
  };

  return marketFacts as unknown as TradeAnalysisCandleContext["marketFacts"];
}

async function buildLevelsSystemV2UnavailableCandleContext(args: {
  symbol: string;
  executions: NormalizeExecutionInput[];
  levelsSystem: LevelsSystemRuntimeConfig | undefined;
  tradeWindow: TradeAnalysisCandleWindowOptions | undefined;
}): Promise<TradeAnalysisCandleContext> {
  const { tradeStartTimestamp, tradeEndTimestamp } =
    resolveExecutionTradeBounds(args.executions);
  const asOfTimestamp = resolveAsOfTimestamp({
    explicitAsOfTimestamp: args.levelsSystem?.asOfTimestamp,
    tradeEndTimestamp,
    tradeWindow: args.tradeWindow,
  });
  const supportResistanceContext =
    await buildLevelsSystemSymbolContextFromCandles({
      symbol: args.symbol,
      candlesByTimeframe: {},
      levelsSystem: args.levelsSystem,
      asOfTimestamp: asOfTimestamp ?? tradeEndTimestamp,
    });
  const requestedLookbackBars =
    args.tradeWindow?.lookbackBars ?? DEFAULT_REQUESTED_LOOKBACK_BARS;

  const context = {
    symbol: args.symbol.trim().toUpperCase(),
    mode: "trade_analysis",
    candleFetchingOwnedBy: "levels-system",
    asOfTimestamp,
    supportResistanceContext,
    tradeWindow: {
      timeframe: "5m",
      requestedTimeframe: "5m",
      fallbackUsed: false,
      requestedStartTimestamp: tradeStartTimestamp,
      requestedEndTimestamp: tradeEndTimestamp,
      tradeStartTimestamp,
      tradeEndTimestamp,
      preTradeCandles: [],
      tradeCandles: [],
      postTradeCandles: [],
      allCandles: [],
      dynamicLevels: {
        vwap: null,
        ema9: null,
        ema20: null,
      },
      fetch: {
        provider: "stub",
        freshnessStatus: "missing",
        requestedLookbackBars,
        actualBarsReturned: 0,
        requestedStartTimestamp: tradeStartTimestamp,
        requestedEndTimestamp: tradeEndTimestamp,
        newestCandleTimestamp: null,
        completenessStatus: "empty",
        stale: true,
        validationIssues: [],
      },
    },
    tradeWindowFacts: buildEmptyTradeWindowFacts(args.executions),
    executionRelations: [],
    marketFacts: {
      contractVersion: "market_facts.trade_review.v2",
      symbol: args.symbol.trim().toUpperCase(),
      asOfTimestamp:
        asOfTimestamp === null ? null : new Date(asOfTimestamp).toISOString(),
      candleFetchingOwnedBy: "levels-system",
      executionSnapshots: [],
      diagnostics: [],
    },
    diagnostics: [
      {
        code: "v2_supplied_candles_required",
        severity: "warning",
        message:
          "levels-system v2 is active. Trade-window candle fetching from the old v1 API is disabled; provide candles to Trader Intelligence before using candle-window facts.",
      },
    ],
  } as unknown as TradeAnalysisCandleContext;

  return context;
}

async function buildLevelsSystemV2UnsafeBasisCandleContext(args: {
  symbol: string;
  executions: NormalizeExecutionInput[];
  levelsSystem: LevelsSystemRuntimeConfig | undefined;
  tradeWindow: TradeAnalysisCandleWindowOptions | undefined;
  hydrated: HydratedLevelsSystemCandles;
}): Promise<TradeAnalysisCandleContext> {
  const context = await buildLevelsSystemV2UnavailableCandleContext({
    symbol: args.symbol,
    executions: args.executions,
    levelsSystem: args.levelsSystem,
    tradeWindow: args.tradeWindow,
  });
  const fetch = args.hydrated.tradeWindowFetch;

  return {
    ...context,
    tradeWindow: {
      ...context.tradeWindow,
      fetch: {
        ...context.tradeWindow.fetch,
        provider: fetch.provider,
        freshnessStatus: "missing",
        requestedLookbackBars: fetch.requestedLookbackBars,
        actualBarsReturned: 0,
        requestedStartTimestamp: fetch.requestedStartTimestamp,
        requestedEndTimestamp: fetch.requestedEndTimestamp,
        newestCandleTimestamp: fetch.candles.at(-1)?.timestamp ?? null,
        completenessStatus: "empty",
        stale: true,
        validationIssues: fetch.validationIssues,
      },
    },
    diagnostics: [
      {
        code: "trade_window_price_basis_unverified",
        severity: "warning",
        message:
          "levels-system fetched trade-window candles, but execution prices and candle prices appear to be on different split-adjustment bases. Trader Intelligence treated those candles as unavailable for chart-context feedback.",
      },
    ],
  } as unknown as TradeAnalysisCandleContext;
}

async function buildLevelsSystemV2SuppliedCandleContext(args: {
  symbol: string;
  result: RawTradeTimelineBuildResult;
  levelsSystem: LevelsSystemRuntimeConfig | undefined;
  tradeWindow: TradeAnalysisCandleWindowOptions | undefined;
}): Promise<TradeAnalysisCandleContext> {
  const { tradeStartTimestamp, tradeEndTimestamp } =
    resolveExecutionTradeBounds(args.result.timeline.executions);
  const allCandles = args.result.timeline.allCandles;
  const fiveMinuteCandles = buildFiveMinuteCandles(allCandles);
  const newestCandleTimestamp =
    fiveMinuteCandles.length === 0
      ? null
      : fiveMinuteCandles[fiveMinuteCandles.length - 1].timestamp;
  const requestedStartTimestamp =
    allCandles.length === 0
      ? tradeStartTimestamp
      : Date.parse(allCandles[0].timestamp);
  const requestedEndTimestamp =
    allCandles.length === 0
      ? tradeEndTimestamp
      : Date.parse(allCandles[allCandles.length - 1].timestamp);
  const asOfTimestamp =
    normalizeAsOfTimestamp(args.levelsSystem?.asOfTimestamp) ??
    newestCandleTimestamp ??
    resolveAsOfTimestamp({
      explicitAsOfTimestamp: undefined,
      tradeEndTimestamp,
      tradeWindow: args.tradeWindow,
    });
  const supportResistanceContext =
    await buildLevelsSystemSymbolContextFromCandles({
      symbol: args.symbol,
      candlesByTimeframe: {
        "5m": fiveMinuteCandles,
      },
      levelsSystem: args.levelsSystem,
      asOfTimestamp: asOfTimestamp ?? tradeEndTimestamp,
    });
  const executionRelations = mapExecutionRelations(args.result);
  const requestedLookbackBars =
    args.tradeWindow?.lookbackBars ?? DEFAULT_REQUESTED_LOOKBACK_BARS;

  const context = {
    symbol: args.symbol.trim().toUpperCase(),
    mode: "trade_analysis",
    candleFetchingOwnedBy: "levels-system",
    asOfTimestamp,
    supportResistanceContext,
    tradeWindow: {
      timeframe: "5m",
      requestedTimeframe: "5m",
      fallbackUsed: false,
      requestedStartTimestamp,
      requestedEndTimestamp,
      tradeStartTimestamp,
      tradeEndTimestamp,
      preTradeCandles: buildFiveMinuteCandles(
        args.result.timeline.preTradeCandles,
      ),
      tradeCandles: buildFiveMinuteCandles(args.result.timeline.tradeCandles),
      postTradeCandles: buildFiveMinuteCandles(
        args.result.timeline.postTradeCandles,
      ),
      allCandles: fiveMinuteCandles,
      dynamicLevels: {
        vwap: null,
        ema9: null,
        ema20: null,
      },
      fetch: {
        provider: "supplied",
        freshnessStatus: "supplied",
        requestedLookbackBars,
        actualBarsReturned: fiveMinuteCandles.length,
        requestedStartTimestamp,
        requestedEndTimestamp,
        newestCandleTimestamp,
        completenessStatus: fiveMinuteCandles.length > 0 ? "complete" : "empty",
        stale: false,
        validationIssues: [],
      },
    },
    tradeWindowFacts: buildTradeWindowFactsFromResult(args.result),
    executionRelations,
    marketFacts: buildMarketFacts({
      symbol: args.symbol,
      asOfTimestamp,
      executionRelations,
    }),
    diagnostics: [
      {
        code: "v2_supplied_candles_used",
        severity: "info",
        message:
          "levels-system v2 used supplied Trader Intelligence candles for trade-window facts.",
      },
    ],
  } as unknown as TradeAnalysisCandleContext;

  return context;
}

async function buildLevelsSystemV2FetchedCandleContext(args: {
  symbol: string;
  result: RawTradeTimelineBuildResult;
  levelsSystem: LevelsSystemRuntimeConfig | undefined;
  tradeWindow: TradeAnalysisCandleWindowOptions | undefined;
  hydrated: HydratedLevelsSystemCandles;
}): Promise<{
  context: TradeAnalysisCandleContext;
  supportResistanceContext: LevelsSystemV2SupportResistanceContext;
}> {
  const { tradeStartTimestamp, tradeEndTimestamp } =
    resolveExecutionTradeBounds(args.result.timeline.executions);
  const allCandles = args.result.timeline.allCandles;
  const fiveMinuteCandles = args.hydrated.candlesByTimeframe["5m"] ?? [];
  const newestCandleTimestamp =
    fiveMinuteCandles.length === 0
      ? null
      : fiveMinuteCandles[fiveMinuteCandles.length - 1].timestamp;
  const requestedStartTimestamp =
    fiveMinuteCandles[0]?.timestamp ?? tradeStartTimestamp;
  const requestedEndTimestamp =
    fiveMinuteCandles[fiveMinuteCandles.length - 1]?.timestamp ??
    tradeEndTimestamp;
  const asOfTimestamp =
    normalizeAsOfTimestamp(args.levelsSystem?.asOfTimestamp) ??
    newestCandleTimestamp ??
    resolveAsOfTimestamp({
      explicitAsOfTimestamp: undefined,
      tradeEndTimestamp,
      tradeWindow: args.tradeWindow,
    });
  const supportResistanceContext =
    await buildLevelsSystemSymbolContextFromCandles({
      symbol: args.symbol,
      candlesByTimeframe: args.hydrated.candlesByTimeframe,
      levelsSystem: args.levelsSystem,
      asOfTimestamp: asOfTimestamp ?? tradeEndTimestamp,
    });
  const executionRelations = mapExecutionRelations(args.result);
  const requestedLookbackBars =
    args.tradeWindow?.lookbackBars ??
    args.levelsSystem?.lookbackBars?.["5m"] ??
    DEFAULT_TRADE_WINDOW_LOOKBACK_BARS;
  const fetch = args.hydrated.tradeWindowFetch;

  return {
    supportResistanceContext,
    context: {
      symbol: args.symbol.trim().toUpperCase(),
      mode: "trade_analysis",
      candleFetchingOwnedBy: "levels-system",
      asOfTimestamp,
      supportResistanceContext,
      tradeWindow: {
        timeframe: "5m",
        requestedTimeframe: "5m",
        fallbackUsed: false,
        requestedStartTimestamp,
        requestedEndTimestamp,
        tradeStartTimestamp,
        tradeEndTimestamp,
        preTradeCandles: buildFiveMinuteCandles(
          args.result.timeline.preTradeCandles,
        ),
        tradeCandles: buildFiveMinuteCandles(args.result.timeline.tradeCandles),
        postTradeCandles: buildFiveMinuteCandles(
          args.result.timeline.postTradeCandles,
        ),
        allCandles: fiveMinuteCandles.length > 0
          ? fiveMinuteCandles
          : buildFiveMinuteCandles(allCandles),
        dynamicLevels: {
          vwap: null,
          ema9: null,
          ema20: null,
        },
        fetch: {
          provider: fetch.provider,
          freshnessStatus: "fresh",
          requestedLookbackBars,
          actualBarsReturned: fetch.actualBarsReturned,
          requestedStartTimestamp: fetch.requestedStartTimestamp,
          requestedEndTimestamp: fetch.requestedEndTimestamp,
          newestCandleTimestamp,
          completenessStatus: fetch.completenessStatus,
          stale: fetch.stale,
          validationIssues: [],
        },
      },
      tradeWindowFacts: buildTradeWindowFactsFromResult(args.result),
      executionRelations,
      marketFacts: buildMarketFacts({
        symbol: args.symbol,
        asOfTimestamp,
        executionRelations,
      }),
      diagnostics: [
        {
          code: "v2_trade_window_candles_fetched",
          severity: "info",
          message:
            "levels-system v2 fetched trade-window candles for Trader Intelligence feedback.",
        },
      ],
    } as unknown as TradeAnalysisCandleContext,
  };
}

function withMappedSupportResistanceContext(args: {
  result: RawTradeTimelineBuildResult;
  context: LevelsSystemV2SupportResistanceContext;
}): RawTradeTimelineBuildResult {
  const mapped = mapSupportResistanceSymbolContextToLocalContext({
    timeline: args.result.timeline,
    context: args.context,
  });
  const sharedWarnings = mapped.sharedEngineDiagnostics.map(
    (diagnostic) =>
      `levels-system ${diagnostic.severity}: ${diagnostic.message}`,
  );

  return {
    ...args.result,
    structuralContextWindow: mapped.structuralContextWindow,
    referenceLevels: mapped.referenceLevels,
    dynamicLevels: mapped.dynamicLevels,
    supportLevels: mapped.supportLevels,
    resistanceLevels: mapped.resistanceLevels,
    gapStructure: mapped.gapStructure,
    executionLevelRelations: mapped.executionLevelRelations,
    experimentalMarketStructure: mapped.experimentalMarketStructure,
    hadInsufficientCandleDataForStructure:
      mapped.hadInsufficientCandleDataForStructure,
    warnings:
      args.result.warnings || sharedWarnings.length > 0
        ? [...(args.result.warnings ?? []), ...sharedWarnings]
        : undefined,
  };
}

function buildTradeTimelineArgs(
  args: CreateRawTradeTimelineWithLevelsSystemCandlesArgs,
): CreateRawTradeTimelineArgs {
  return {
    symbol: args.symbol,
    timeframe: args.tradeWindow?.timeframe ?? "5m",
    tradeDirection: args.tradeDirection,
    preTradeCandles: args.preTradeCandles ?? [],
    tradeCandles: args.tradeCandles ?? [],
    postTradeCandles: args.postTradeCandles ?? [],
    executions: args.executions,
    sessionContext: args.sessionContext,
    executionWindowCandlesBeforeCount:
      args.executionWindowCandlesBeforeCount,
    executionWindowCandlesAfterCount: args.executionWindowCandlesAfterCount,
  };
}

export async function createRawTradeTimelineWithLevelsSystemCandles(
  args: CreateRawTradeTimelineWithLevelsSystemCandlesArgs,
): Promise<RawTradeTimelineWithLevelsSystemCandlesBuildResult> {
  const levelsSystem = buildLevelsSystemSupportResistanceOptions(
    args.levelsSystem,
  );
  const suppliedCandles = hasSuppliedCandles(args);
  const hydrated = suppliedCandles
    ? null
    : await hydrateCandlesFromLevelsSystemV2({
        symbol: args.symbol,
        executions: args.executions,
        levelsSystem,
        tradeWindow: args.tradeWindow,
      });
  const hasHydratedUnsafeBasis =
    hydrated !== null && hasUnsafeTradeWindowPriceBasis(hydrated.warnings);
  const usableHydrated = hydrated !== null && !hasHydratedUnsafeBasis
    ? hydrated
    : null;
  const timelineArgs = buildTradeTimelineArgs(
    usableHydrated
      ? {
          ...args,
          preTradeCandles: usableHydrated.preTradeCandles,
          tradeCandles: usableHydrated.tradeCandles,
          postTradeCandles: usableHydrated.postTradeCandles,
          tradeWindow: {
            ...args.tradeWindow,
            timeframe: "5m",
          },
        }
      : args,
  );
  const result =
    suppliedCandles || usableHydrated
      ? await createRawTradeTimelineWithLevelsSystem(timelineArgs, levelsSystem)
      : createRawTradeTimeline(timelineArgs);
  const v2Warning =
    "levels-system v2 warning: The old trade-window candle-fetching API is no longer used. Candle-window facts are unavailable until candles are supplied through a v2-compatible path.";

  if (suppliedCandles) {
    const context = await buildLevelsSystemV2SuppliedCandleContext({
        symbol: args.symbol,
        result,
        levelsSystem,
        tradeWindow: args.tradeWindow,
      });

    return {
      ...result,
      levelsSystemTradeWindowFacts: context.tradeWindowFacts,
      levelsSystemExecutionRelations: context.executionRelations,
      levelsSystemMarketFacts: context.marketFacts,
      levelsSystemTradeAnalysisCandleContext: context,
    };
  }

  if (usableHydrated) {
    const fetched = await buildLevelsSystemV2FetchedCandleContext({
      symbol: args.symbol,
      result,
      levelsSystem,
      tradeWindow: args.tradeWindow,
      hydrated: usableHydrated,
    });
    const mappedResult = withMappedSupportResistanceContext({
      result,
      context: fetched.supportResistanceContext,
    });

    return {
      ...mappedResult,
      levelsSystemTradeWindowFacts: fetched.context.tradeWindowFacts,
      levelsSystemExecutionRelations: fetched.context.executionRelations,
      levelsSystemMarketFacts: fetched.context.marketFacts,
      warnings: [
        ...(mappedResult.warnings ?? []),
        ...usableHydrated.warnings,
      ],
      levelsSystemTradeAnalysisCandleContext: fetched.context,
    };
  }

  if (hydrated && hasHydratedUnsafeBasis) {
    const context = await buildLevelsSystemV2UnsafeBasisCandleContext({
      symbol: args.symbol,
      executions: args.executions,
      levelsSystem,
      tradeWindow: args.tradeWindow,
      hydrated,
    });

    return {
      ...result,
      levelsSystemTradeWindowFacts: undefined,
      levelsSystemExecutionRelations: undefined,
      levelsSystemMarketFacts: context.marketFacts,
      warnings: [...(result.warnings ?? []), ...hydrated.warnings],
      levelsSystemTradeAnalysisCandleContext: context,
    };
  }

  const context = await buildLevelsSystemV2UnavailableCandleContext({
    symbol: args.symbol,
    executions: args.executions,
    levelsSystem,
    tradeWindow: args.tradeWindow,
  });

  return {
    ...result,
    levelsSystemTradeWindowFacts: undefined,
    levelsSystemExecutionRelations: undefined,
    levelsSystemMarketFacts: context.marketFacts,
    warnings: [...(result.warnings ?? []), v2Warning],
    levelsSystemTradeAnalysisCandleContext: context,
  };
}
