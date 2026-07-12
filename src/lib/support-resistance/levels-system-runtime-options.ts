import { existsSync } from "node:fs";
import { join } from "node:path";

import type { BuildLevelsSystemSupportResistanceContextOptions } from "./build-support-resistance-context";

export type LevelsSystemProviderName = NonNullable<
  BuildLevelsSystemSupportResistanceContextOptions["preferredProvider"]
>;

type AppSupportedLevelsSystemProviderName = Extract<
  NonNullable<
    BuildLevelsSystemSupportResistanceContextOptions["preferredProvider"]
  >,
  "ibkr" | "eodhd" | "yahoo" | "stub"
>;

export interface LevelsSystemRuntimeConfig {
  preferredProvider?: LevelsSystemProviderName;
  warehouseDirectoryPath?: string;
  warehouseMode?: "read_write" | "refresh" | "replay";
  lookbackBars?: BuildLevelsSystemSupportResistanceContextOptions["lookbackBars"];
  fetchService?: BuildLevelsSystemSupportResistanceContextOptions["fetchService"];
  fetchServiceOptions?: BuildLevelsSystemSupportResistanceContextOptions["fetchServiceOptions"];
  sessionDate?: BuildLevelsSystemSupportResistanceContextOptions["sessionDate"];
  asOfTimestamp?: BuildLevelsSystemSupportResistanceContextOptions["asOfTimestamp"];
  config?: BuildLevelsSystemSupportResistanceContextOptions["config"];
  runtimeOptions?: BuildLevelsSystemSupportResistanceContextOptions["runtimeOptions"];
}

export type LevelsSystemRuntimeEnv = Partial<Record<string, string | undefined>>;

export const DEFAULT_LEVELS_SYSTEM_LOOKBACK_BARS = {
  daily: 520,
  "4h": 180,
  "5m": 120,
} satisfies NonNullable<
  BuildLevelsSystemSupportResistanceContextOptions["lookbackBars"]
>;

const VALID_PROVIDER_NAMES = new Set<AppSupportedLevelsSystemProviderName>([
  "ibkr",
  "eodhd",
  "yahoo",
  "stub",
]);

const ON_DEMAND_HYDRATION_ENABLED_VALUES = new Set([
  "1",
  "true",
  "yes",
  "on",
  "enabled",
]);

const DEFAULT_IBKR_HOST = "127.0.0.1";
const DEFAULT_IBKR_PORT = 7497;
const DEFAULT_IBKR_CLIENT_ID = 101;
const DEFAULT_IBKR_HISTORICAL_TIMEOUT_MS = 30_000;
const DEFAULT_IBKR_CONNECTION_TIMEOUT_MS = 10_000;
const SHARED_IBKR_DISPOSE_GLOBAL_KEY =
  "__traderIntelligenceDisposeLevelsSystemIbkrClients";

function findBundledLevelsSystemWarehouseDirectory(): string | undefined {
  const candidates = [
    join(process.cwd(), "..", "levels-system", "data", "candles"),
    join(
      process.cwd(),
      "..",
      "levels-system-post-mtf-handoff-stability",
      "data",
      "candles",
    ),
  ];

  return candidates.find(
    (candidate) =>
      existsSync(join(candidate, "eodhd")) ||
      existsSync(join(candidate, "ibkr")) ||
      existsSync(join(candidate, "stub")),
  );
}

function findSiblingLevelsSystemWarehouseDirectory(
  provider: AppSupportedLevelsSystemProviderName,
): string | undefined {
  const candidate = join(process.cwd(), "..", "levels-system", "data", "candles");

  return existsSync(join(candidate, provider)) ? candidate : undefined;
}

function parseProviderName(
  value: string | undefined,
): LevelsSystemProviderName | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const providerName = value.trim() as AppSupportedLevelsSystemProviderName;

  if (!VALID_PROVIDER_NAMES.has(providerName)) {
    throw new Error(
      `Unsupported LEVELS_SYSTEM_PROVIDER value: ${value}. Expected ibkr, eodhd, yahoo, or stub.`,
    );
  }

  return providerName;
}

function parseWarehouseMode(
  value: string | undefined,
): LevelsSystemRuntimeConfig["warehouseMode"] {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const mode = value.trim();

  if (mode !== "read_write" && mode !== "refresh" && mode !== "replay") {
    throw new Error(
      `Unsupported LEVELS_SYSTEM_WAREHOUSE_MODE value: ${value}. Expected read_write, refresh, or replay.`,
    );
  }

  return mode;
}

function parseBoolean(value: string | undefined): boolean {
  return ON_DEMAND_HYDRATION_ENABLED_VALUES.has(
    value?.trim().toLowerCase() ?? "",
  );
}

function firstEnvText(
  env: LevelsSystemRuntimeEnv,
  ...names: string[]
): string | undefined {
  return names
    .map((name) => env[name]?.trim())
    .find((value): value is string => value !== undefined && value !== "");
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  envName: string,
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${envName} must be a positive integer.`);
  }

  return parsed;
}

function optionalPositiveInteger(
  env: LevelsSystemRuntimeEnv,
  fallback: number,
  envName: string,
  ...names: string[]
): number {
  return parsePositiveInteger(firstEnvText(env, ...names), fallback, envName);
}

function buildOnDemandHydrationFetchServiceOptions(
  env: LevelsSystemRuntimeEnv,
  providerName: AppSupportedLevelsSystemProviderName,
): LevelsSystemRuntimeConfig["fetchServiceOptions"] {
  if (providerName === "eodhd") {
    return {
      providerName,
      eodhdApiToken: firstEnvText(env, "EODHD_API_TOKEN", "LEVEL_EODHD_API_TOKEN"),
      eodhdExchangeSuffix: firstEnvText(
        env,
        "EODHD_EXCHANGE_SUFFIX",
        "LEVEL_EODHD_EXCHANGE_SUFFIX",
      ),
      eodhdBaseUrl: firstEnvText(env, "EODHD_BASE_URL", "LEVEL_EODHD_BASE_URL"),
    };
  }

  if (providerName === "yahoo" || providerName === "stub") {
    return {
      providerName,
    };
  }

  return {
    providerName,
    ibkrTimeoutMs: optionalPositiveInteger(
      env,
      DEFAULT_IBKR_HISTORICAL_TIMEOUT_MS,
      "LEVELS_SYSTEM_IBKR_TIMEOUT_MS",
      "LEVELS_SYSTEM_IBKR_TIMEOUT_MS",
      "LEVEL_BACKFILL_IBKR_TIMEOUT_MS",
      "LEVEL_VALIDATION_IBKR_TIMEOUT_MS",
    ),
    host:
      firstEnvText(
        env,
        "LEVELS_SYSTEM_IBKR_HOST",
        "LEVEL_BACKFILL_IBKR_HOST",
        "LEVEL_VALIDATION_IBKR_HOST",
      ) ?? DEFAULT_IBKR_HOST,
    port: optionalPositiveInteger(
      env,
      DEFAULT_IBKR_PORT,
      "LEVELS_SYSTEM_IBKR_PORT",
      "LEVELS_SYSTEM_IBKR_PORT",
      "LEVEL_BACKFILL_IBKR_PORT",
      "LEVEL_VALIDATION_IBKR_PORT",
    ),
    clientId: optionalPositiveInteger(
      env,
      DEFAULT_IBKR_CLIENT_ID,
      "LEVELS_SYSTEM_IBKR_CLIENT_ID",
      "LEVELS_SYSTEM_IBKR_CLIENT_ID",
      "LEVEL_BACKFILL_IBKR_CLIENT_ID",
      "LEVEL_VALIDATION_IBKR_CLIENT_ID",
    ),
    historicalTimeoutMs: optionalPositiveInteger(
      env,
      DEFAULT_IBKR_HISTORICAL_TIMEOUT_MS,
      "LEVELS_SYSTEM_IBKR_TIMEOUT_MS",
      "LEVELS_SYSTEM_IBKR_TIMEOUT_MS",
      "LEVEL_BACKFILL_IBKR_TIMEOUT_MS",
      "LEVEL_VALIDATION_IBKR_TIMEOUT_MS",
    ),
    connectionTimeoutMs: optionalPositiveInteger(
      env,
      DEFAULT_IBKR_CONNECTION_TIMEOUT_MS,
      "LEVELS_SYSTEM_IBKR_CONNECTION_TIMEOUT_MS",
      "LEVELS_SYSTEM_IBKR_CONNECTION_TIMEOUT_MS",
      "LEVEL_BACKFILL_IBKR_CONNECTION_TIMEOUT_MS",
      "LEVEL_VALIDATION_IBKR_CONNECTION_TIMEOUT_MS",
    ),
  };
}

export function readLevelsSystemRuntimeConfigFromEnv(
  env: LevelsSystemRuntimeEnv = process.env,
): LevelsSystemRuntimeConfig {
  const warehouseMode = parseWarehouseMode(env.LEVELS_SYSTEM_WAREHOUSE_MODE);
  const enableOnDemandHydration = parseBoolean(
    env.LEVELS_SYSTEM_ON_DEMAND_HYDRATION,
  );
  const configuredProvider = parseProviderName(env.LEVELS_SYSTEM_PROVIDER);
  const hydrationProvider = configuredProvider ?? "eodhd";
  const configuredWarehouseDirectory =
    env.LEVELS_SYSTEM_WAREHOUSE_DIRECTORY?.trim() || undefined;
  const bundledWarehouseDirectory =
    configuredProvider === undefined && configuredWarehouseDirectory === undefined
      ? findBundledLevelsSystemWarehouseDirectory()
      : undefined;
  const autoDiscoveredWarehouseDirectory =
    configuredWarehouseDirectory === undefined &&
    configuredProvider !== undefined
      ? findSiblingLevelsSystemWarehouseDirectory(configuredProvider)
      : undefined;
  const warehouseDirectoryPath =
    configuredWarehouseDirectory ??
    autoDiscoveredWarehouseDirectory ??
    bundledWarehouseDirectory;
  const shouldUseBundledReplay =
    !enableOnDemandHydration && bundledWarehouseDirectory !== undefined;
  const shouldUseWarehouseBackedProvider =
    configuredProvider !== undefined && warehouseDirectoryPath !== undefined;

  return {
    preferredProvider: enableOnDemandHydration
      ? hydrationProvider
      : configuredProvider ?? (shouldUseBundledReplay ? "ibkr" : undefined),
    warehouseDirectoryPath,
    warehouseMode: enableOnDemandHydration
      ? warehouseMode === "refresh"
        ? "refresh"
        : "read_write"
      : warehouseMode ??
        (shouldUseBundledReplay
          ? "replay"
          : shouldUseWarehouseBackedProvider
            ? "read_write"
            : undefined),
    fetchServiceOptions: enableOnDemandHydration || shouldUseWarehouseBackedProvider
      ? buildOnDemandHydrationFetchServiceOptions(env, hydrationProvider)
      : undefined,
    lookbackBars: {
      daily: parsePositiveInteger(
        env.LEVELS_SYSTEM_DAILY_LOOKBACK_BARS,
        DEFAULT_LEVELS_SYSTEM_LOOKBACK_BARS.daily,
        "LEVELS_SYSTEM_DAILY_LOOKBACK_BARS",
      ),
      "4h": parsePositiveInteger(
        env.LEVELS_SYSTEM_4H_LOOKBACK_BARS,
        DEFAULT_LEVELS_SYSTEM_LOOKBACK_BARS["4h"],
        "LEVELS_SYSTEM_4H_LOOKBACK_BARS",
      ),
      "5m": parsePositiveInteger(
        env.LEVELS_SYSTEM_5M_LOOKBACK_BARS,
        DEFAULT_LEVELS_SYSTEM_LOOKBACK_BARS["5m"],
        "LEVELS_SYSTEM_5M_LOOKBACK_BARS",
      ),
    },
  };
}

export function buildLevelsSystemSupportResistanceOptions(
  config: LevelsSystemRuntimeConfig = {},
): BuildLevelsSystemSupportResistanceContextOptions {
  return {
    ...config,
    lookbackBars: {
      ...DEFAULT_LEVELS_SYSTEM_LOOKBACK_BARS,
      ...config.lookbackBars,
    },
  };
}

export function disposeLevelsSystemRuntimeConfig(
  config: LevelsSystemRuntimeConfig | undefined,
): void {
  if (config?.fetchServiceOptions?.providerName !== "ibkr") {
    return;
  }

  const dispose = (globalThis as Record<string, unknown>)[
    SHARED_IBKR_DISPOSE_GLOBAL_KEY
  ];

  if (typeof dispose === "function") {
    dispose();
  }
}
