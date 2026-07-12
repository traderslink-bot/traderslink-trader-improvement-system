import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import {
  buildLevelsSystemSupportResistanceOptions,
  readLevelsSystemRuntimeConfigFromEnv,
} from "../../support-resistance/levels-system-runtime-options";
import {
  runTradeAnalysis,
  runTradeAnalysisFromLevelsSystemCandles,
  runTradeAnalysisWithProvidedCandlesOnly,
} from "../run-trade-analysis";

describe("runTradeAnalysis", () => {
  it("uses the shared levels-system support/resistance path by default for app-facing analysis", async () => {
    const result = await runTradeAnalysis({
      trade: sampleCreateRawTradeTimelineInput,
      supportResistance: {
        levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      },
    });

    const detectedPatternIds = result.detectedPatterns.detectedPatterns.map(
      (pattern) => pattern.patternId,
    );

    expect(result.supportResistanceMode).toBe("levels_system");
    expect(result.rawTradeTimeline.supportLevels?.length).toBeGreaterThanOrEqual(3);
    expect(result.rawTradeTimeline.resistanceLevels?.length).toBeGreaterThanOrEqual(2);
    expect(result.rawTradeTimeline.experimentalMarketStructure).toEqual(
      expect.objectContaining({
        state: expect.any(String),
      }),
    );
    expect(
      result.patternInput.supportResistanceContext
        .hadSupportResistanceContextAvailable,
    ).toBe(true);
    expect(
      result.patternInput.supportResistanceContext
        .hadInsufficientCandleDataForStructuralContext,
    ).toBe(false);
    expect(detectedPatternIds).toContain("advantaged_entry_structure");
    expect(detectedPatternIds).toContain("balanced_position_management");
  });

  it("keeps the provided-candles-only path explicit without building local market structure", async () => {
    const result = await runTradeAnalysisWithProvidedCandlesOnly(
      sampleCreateRawTradeTimelineInput,
    );

    expect(result.supportResistanceMode).toBe("provided_candles_only");
    expect(result.rawTradeTimeline.supportLevels).toBeUndefined();
    expect(result.rawTradeTimeline.resistanceLevels).toBeUndefined();
    expect(result.rawTradeTimeline.dynamicLevels).toBeUndefined();
    expect(result.rawTradeTimeline.executionLevelRelations).toBeUndefined();
    expect(result.rawTradeTimeline.experimentalMarketStructure).toBeUndefined();
    expect(
      result.patternInput.supportResistanceContext
        .hadSupportResistanceContextAvailable,
    ).toBe(false);
  });

  it("hydrates trade-window candles through the configured v2 fetch service", async () => {
    const result = await runTradeAnalysisFromLevelsSystemCandles({
      trade: {
        symbol: sampleCreateRawTradeTimelineInput.symbol,
        tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
        executions: sampleCreateRawTradeTimelineInput.executions,
        sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
        tradeWindow: {
          timeframe: "1m",
          preTradeMinutes: 60,
          postTradeMinutes: 60,
        },
      },
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    });

    expect(result.supportResistanceMode).toBe("levels_system");
    expect(result.rawTradeTimeline.timeline.preTradeCandles.length).toBeGreaterThan(0);
    expect(result.rawTradeTimeline.timeline.tradeCandles.length).toBeGreaterThan(0);
    expect(result.rawTradeTimeline.timeline.postTradeCandles.length).toBeGreaterThan(0);
    expect(result.rawTradeTimeline.supportLevels?.length).toBeGreaterThan(0);
    expect(result.rawTradeTimeline.resistanceLevels?.length).toBeGreaterThan(0);
    expect(result.rawTradeTimeline.experimentalMarketStructure).toEqual(
      expect.objectContaining({
        state: expect.any(String),
      }),
    );
    expect(result.rawTradeTimeline.warnings ?? []).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("old trade-window candle-fetching API"),
      ]),
    );
    expect(
      result.detectedPatterns.detectedPatterns.map(
        (pattern) => pattern.patternId,
      ),
    ).toContain("advantaged_entry_structure");
    expect(
      "experimentalMarketStructure" in
        result.patternInput.supportResistanceContext,
    ).toBe(false);
  });
});

describe("levels-system runtime options", () => {
  it("discovers the sibling canonical candle warehouse when no env override is set", () => {
    const config = readLevelsSystemRuntimeConfigFromEnv({});

    if (config.warehouseDirectoryPath === undefined) {
      expect(config.preferredProvider).toBeUndefined();
      expect(config.warehouseMode).toBeUndefined();
    } else {
      expect(config.preferredProvider).toBe("ibkr");
      expect(config.warehouseMode).toBe("replay");
      expect(config.warehouseDirectoryPath).toContain("levels-system");
    }
    expect(config.lookbackBars).toEqual({
      daily: 520,
      "4h": 180,
      "5m": 120,
    });
    expect(existsSync("vendor/levels-system-phase1")).toBe(false);
  });

  it("normalizes provider and lookback runtime config with sibling warehouse support", () => {
    const config = readLevelsSystemRuntimeConfigFromEnv({
      LEVELS_SYSTEM_PROVIDER: "stub",
      LEVELS_SYSTEM_DAILY_LOOKBACK_BARS: "260",
      LEVELS_SYSTEM_4H_LOOKBACK_BARS: "120",
      LEVELS_SYSTEM_5M_LOOKBACK_BARS: "90",
      LEVELS_SYSTEM_WAREHOUSE_DIRECTORY: "C:\\levels-system\\data\\candles",
    });

    expect(config).toMatchObject({
      preferredProvider: "stub",
      fetchServiceOptions: {
        providerName: "stub",
      },
      lookbackBars: {
        daily: 260,
        "4h": 120,
        "5m": 90,
      },
      warehouseMode: "read_write",
    });
    expect(config.warehouseDirectoryPath).toContain("levels-system");
    expect(buildLevelsSystemSupportResistanceOptions(config)).toMatchObject(
      config,
    );
  });

  it("defaults on-demand warehouse hydration to EODHD from runtime env", () => {
    const config = readLevelsSystemRuntimeConfigFromEnv({
      LEVELS_SYSTEM_ON_DEMAND_HYDRATION: "true",
      LEVELS_SYSTEM_WAREHOUSE_MODE: "replay",
      EODHD_API_TOKEN: "test-token",
      EODHD_EXCHANGE_SUFFIX: "US",
    });

    expect(config.preferredProvider).toBe("eodhd");
    expect(config.warehouseMode).toBe("read_write");
    expect(config.fetchServiceOptions?.providerName).toBe("eodhd");
    expect(config.fetchServiceOptions?.eodhdApiToken).toBe("test-token");
    expect(config.fetchServiceOptions?.eodhdExchangeSuffix).toBe("US");
  });

  it("uses an explicit IBKR candle warehouse before live fetching missing candles", () => {
    const config = readLevelsSystemRuntimeConfigFromEnv({
      LEVELS_SYSTEM_PROVIDER: "ibkr",
      LEVELS_SYSTEM_WAREHOUSE_DIRECTORY: "C:\\levels-system\\data\\candles",
      LEVELS_SYSTEM_IBKR_CLIENT_ID: "177",
    });

    expect(config.preferredProvider).toBe("ibkr");
    expect(config.warehouseDirectoryPath).toBe("C:\\levels-system\\data\\candles");
    expect(config.warehouseMode).toBe("read_write");
    expect(config.fetchServiceOptions).toMatchObject({
      clientId: 177,
      providerName: "ibkr",
    });
  });

  it("rejects unsupported provider names before calling the shared package", () => {
    expect(() =>
      readLevelsSystemRuntimeConfigFromEnv({
        LEVELS_SYSTEM_PROVIDER: "local_chart_reader",
      }),
    ).toThrow(/Expected ibkr, eodhd, yahoo, or stub/);
    expect(() =>
      readLevelsSystemRuntimeConfigFromEnv({
        LEVELS_SYSTEM_PROVIDER: "external_vendor",
      }),
    ).toThrow(/Expected ibkr, eodhd, yahoo, or stub/);
  });
});
