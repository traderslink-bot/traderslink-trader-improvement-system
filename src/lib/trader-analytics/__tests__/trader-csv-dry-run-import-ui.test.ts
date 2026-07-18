import { describe, expect, it } from "vitest";
import {
  auditTraderIntelligenceNoExportPolicy,
  buildCsvDryRunImportExperience,
  buildProductCopyQualitySystem,
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
  buildTraderIntelligenceRouteRegistry,
  getCsvDryRunSamplePresets,
} from "../index";

function buildAnalytics() {
  const sample = buildSampleSavedTraderAnalyticsData();

  return buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
  });
}

describe("CSV dry-run import UI workflow", () => {
  it("provides sample presets for supported dry-run brokers", () => {
    const presets = getCsvDryRunSamplePresets();

    expect(presets.map((preset) => preset.broker)).toEqual(
      expect.arrayContaining([
        "ibkr_activity_statement",
        "webull_order_history",
        "robinhood_transaction_history",
        "moomoo_trade_history",
        "schwab_transactions",
        "generic_execution_csv",
      ]),
    );
    expect(presets.every((preset) => preset.csvText.includes(","))).toBe(true);
  });

  it("builds a ready dry-run preview from a representative preset", () => {
    const preset = getCsvDryRunSamplePresets().find(
      (candidate) => candidate.id === "preset:ibkr",
    );

    expect(preset).toBeTruthy();

    const experience = buildCsvDryRunImportExperience({
      csvText: preset!.csvText,
      broker: preset!.broker,
      accountTimezone: "America/New_York",
      analytics: buildAnalytics(),
    });

    expect(experience.source).toBe("client_dry_run");
    expect(experience.marketContextUsedForConclusions).toBe(false);
    expect(experience.preview.importResult.acceptedExecutionCount).toBe(2);
    expect(experience.confidenceGate.status).toBe("ready");
    expect(experience.sessionState.status).toBe("ready_for_analysis");
    expect(experience.tradeGroupingReview.totalCount).toBe(1);
    expect(experience.costVisibility).toMatchObject({
      status: "costs_detected",
      hasCommission: true,
      hasBrokerNetAmount: false,
      totalCommission: 2,
      currencies: ["USD"],
    });
    expect(experience.preview.productDiagnostics.timezoneDiagnostic).toMatchObject({
      sourceTimestampTimezone: "America/New_York",
      marketSessionTimezone: "America/New_York",
      issueCount: 0,
    });
    expect(
      experience.preview.productDiagnostics.summaryCards.find(
        (card) => card.id === "timezone",
      )?.detail,
    ).toContain("session buckets use America/New_York");
    expect(experience.firstTradeWalkthrough.steps.length).toBeGreaterThan(0);
    expect(experience.evidenceDrillIn.records.length).toBeGreaterThan(0);
  });

  it("uses explicit column mapping to repair unknown broker headers", () => {
    const preset = getCsvDryRunSamplePresets().find(
      (candidate) => candidate.id === "preset:unknown-mapping",
    );

    expect(preset).toBeTruthy();

    const blocked = buildCsvDryRunImportExperience({
      csvText: preset!.csvText,
      broker: preset!.broker,
    });
    const mapped = buildCsvDryRunImportExperience({
      csvText: preset!.csvText,
      broker: preset!.broker,
      columnMapping: {
        symbol: "Trading Symbol",
        timestamp: "Executed At",
        side: "Instruction",
        quantity: "Filled Shares",
        price: "Fill Price",
      },
    });

    expect(blocked.columnMappingAssistant.status).toBe("blocked");
    expect(blocked.confidenceGate.status).toBe("blocked");
    expect(mapped.columnMappingAssistant.status).toBe("ready");
    expect(mapped.confidenceGate.status).toBe("ready");
    expect(mapped.preview.importResult.acceptedExecutionCount).toBe(2);
  });

  it("shows open-position grouping review before final analysis", () => {
    const preset = getCsvDryRunSamplePresets().find(
      (candidate) => candidate.id === "preset:open-position",
    );
    const experience = buildCsvDryRunImportExperience({
      csvText: preset!.csvText,
      broker: preset!.broker,
    });
    const item = experience.tradeGroupingReview.items[0];

    expect(item.lifecycleStatus).toBe("open");
    expect(item.needsReview).toBe(true);
    expect(item.finalPositionShares).toBe(75);
    expect(experience.tradeGroupingReview.needsReviewCount).toBe(1);
    expect(experience.firstTradeWalkthrough.steps.map((step) => step.id)).toEqual(
      expect.arrayContaining(["confirm_grouping", "review_warnings"]),
    );
  });

  it("covers richer generic fixture shapes for sell starts, partial exits, and extended hours", () => {
    const presets = Object.fromEntries(
      getCsvDryRunSamplePresets().map((preset) => [preset.id, preset]),
    );
    const shortCover = buildCsvDryRunImportExperience({
      csvText: presets["preset:generic-short-cover"].csvText,
      broker: presets["preset:generic-short-cover"].broker,
    });
    const partialExits = buildCsvDryRunImportExperience({
      csvText: presets["preset:generic-partial-exits"].csvText,
      broker: presets["preset:generic-partial-exits"].broker,
    });
    const extendedHours = buildCsvDryRunImportExperience({
      csvText: presets["preset:generic-extended-hours"].csvText,
      broker: presets["preset:generic-extended-hours"].broker,
    });

    expect(shortCover.tradeGroupingReview.items[0]).toMatchObject({
      symbol: "IWM",
      tradeDirection: "short",
      lifecycleStatus: "closed",
      finalPositionShares: 0,
    });
    expect(
      shortCover.preview.importResult.issues.map((item) => item.code),
    ).not.toContain("sell_starting_trade_skipped");

    expect(partialExits.tradeGroupingReview.items[0]).toMatchObject({
      symbol: "MSFT",
      tradeDirection: "long",
      lifecycleStatus: "closed",
      finalPositionShares: 0,
    });
    expect(
      partialExits.tradeGroupingReview.items[0]?.timeline.map(
        (step) => step.positionAfterExecution,
      ),
    ).toEqual([50, 100, 60, 0]);

    expect(extendedHours.tradeGroupingReview.totalCount).toBeGreaterThanOrEqual(2);
    expect(
      extendedHours.tradeGroupingReview.items.map((item) => item.entrySessionBucket),
    ).toEqual(expect.arrayContaining(["pre_market", "post_market"]));
    expect(
      extendedHours.tradeGroupingReview.items.map((item) => item.entryHourLabelEt),
    ).toEqual(expect.arrayContaining(["04:00-04:59 ET", "16:00-16:59 ET"]));
  });

  it("applies IBKR grouping rules after automatic broker detection", () => {
    const csvText = [
      "Statement,Account,SYNTHETIC-ACCOUNT",
      "Generated,2026-05-02",
      "Trades,Header,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Trade ID,Proceeds,Comm/Fee",
      'Trades,Data,Stocks,USD,SIDU,"2026-04-02, 18:00:57",200,3.03,IB-1,-606.00,-1.00',
      'Trades,Data,Stocks,USD,SIDU,"2026-04-02, 18:01:30",20,3.035,IB-2,-60.70,-1.00',
      'Trades,Data,Stocks,USD,SIDU,"2026-04-06, 12:43:35",-100,3.14,IB-3,314.00,-1.00',
      'Trades,Data,Stocks,USD,SIDU,"2026-04-08, 14:33:10",-120,3.92,IB-4,470.40,-1.00',
    ].join("\n");
    const experience = buildCsvDryRunImportExperience({
      csvText,
      broker: "auto",
      accountTimezone: "America/New_York",
    });

    expect(experience.broker).toBe("ibkr_activity_statement");
    expect(experience.tradeGroupingReview.items).toMatchObject([
      {
        symbol: "SIDU",
        lifecycleStatus: "closed",
        groupingReason: "flat_position",
        finalPositionShares: 0,
      },
    ]);
    expect(
      experience.executionAnomalyDetector.items.map((item) => item.type),
    ).not.toContain("open_leftover");
  });

  it("covers broker-specific synthetic fixtures for partial fills and mixed activity", () => {
    const presets = Object.fromEntries(
      getCsvDryRunSamplePresets().map((preset) => [preset.id, preset]),
    );
    const webull = buildCsvDryRunImportExperience({
      csvText: presets["preset:webull-partial-cancel"].csvText,
      broker: presets["preset:webull-partial-cancel"].broker,
    });
    const moomoo = buildCsvDryRunImportExperience({
      csvText: presets["preset:moomoo-partial-fills"].csvText,
      broker: presets["preset:moomoo-partial-fills"].broker,
    });
    const schwab = buildCsvDryRunImportExperience({
      csvText: presets["preset:schwab-mixed-activity"].csvText,
      broker: presets["preset:schwab-mixed-activity"].broker,
    });

    expect(webull.preview.importResult.acceptedExecutionCount).toBe(3);
    expect(webull.preview.importResult.skippedRowCount).toBe(1);
    expect(webull.tradeGroupingReview.items[0]).toMatchObject({
      symbol: "RBLX",
      lifecycleStatus: "closed",
      finalPositionShares: 0,
    });

    expect(moomoo.preview.importResult.acceptedExecutionCount).toBe(3);
    expect(moomoo.tradeGroupingReview.items[0]).toMatchObject({
      symbol: "UBER",
      lifecycleStatus: "closed",
      finalPositionShares: 0,
    });

    expect(schwab.preview.importResult.acceptedExecutionCount).toBe(3);
    expect(schwab.preview.importResult.skippedRowCount).toBe(2);
    expect(schwab.tradeGroupingReview.items[0]).toMatchObject({
      symbol: "AMD",
      lifecycleStatus: "closed",
      finalPositionShares: 0,
    });
  });

  it("lets IBKR monthly statements close stock positions across sessions", () => {
    const experience = buildCsvDryRunImportExperience({
      broker: "ibkr_activity_statement",
      accountTimezone: "America/Toronto",
      csvText: [
        "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,C. Price,Proceeds,Comm/Fee,Basis,Realized P/L,MTM P/L,Code",
        "Trades,Data,Order,Stocks,USD,ABCD,\"2026-04-01, 15:58:40\",100,5.00,5.00,-500.00,-1.00,500.00,0,0,O",
        "Trades,SubTotal,,Stocks,USD,ABCD,,100,,,-500.00,-1.00,500.00,0,0,",
        "Trades,Data,Order,Stocks,USD,ABCD,\"2026-04-02, 09:35:12\",-100,5.20,5.20,520.00,-1.00,-500.00,20.00,0,C",
      ].join("\n"),
    });

    expect(experience.preview.importResult.acceptedExecutionCount).toBe(2);
    expect(experience.preview.importResult.rejectedRowCount).toBe(0);
    expect(experience.tradeGroupingReview.totalCount).toBe(1);
    expect(experience.tradeGroupingReview.items[0]).toMatchObject({
      symbol: "ABCD",
      lifecycleStatus: "closed",
      groupingReason: "flat_position",
      finalPositionShares: 0,
      needsReview: false,
    });
    expect(experience.confidenceGate.status).toBe("ready");
  });

  it("surfaces fees, commissions, broker net amounts, and gross-only scoring policy", () => {
    const experience = buildCsvDryRunImportExperience({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00,1.25,0.08,-1001.33,USD",
        "2026-05-01,10:00:00,ABCD,Sell,100,10.50,1.25,0.10,1048.65,USD",
      ].join("\n"),
    });

    expect(experience.costVisibility).toMatchObject({
      status: "costs_detected",
      hasCommission: true,
      hasFees: true,
      hasBrokerNetAmount: true,
      totalCommission: 2.5,
      totalFees: 0.18,
      totalCosts: 2.68,
      currencies: ["USD"],
      mixedCurrencies: false,
      scoringPolicy: "gross_execution_pnl_only",
      marketContextUsed: false,
    });
    expect(experience.costVisibility.items[0]).toMatchObject({
      symbol: "ABCD",
      totalCosts: 2.68,
      brokerNetAmountTotal: 47.32,
      grossMinusKnownCosts: 47.32,
    });
    expect(experience.costVisibility.scoringPolicyDetail).toContain(
      "gross-only",
    );
    expect(
      experience.executionFeedbackPreview.items[0].limitations.join(" "),
    ).toContain("Gross realized P/L excludes commissions");
  });

  it("creates confidence, session-state, evidence, copy, and calibration outputs", () => {
    const preset = getCsvDryRunSamplePresets()[0];
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
      analytics: buildAnalytics(),
    });

    expect(experience.confidenceGate.score).toBeGreaterThanOrEqual(0);
    expect(experience.sessionState.stages.map((stage) => stage.id)).toEqual([
      "selected",
      "parsed",
      "mapped",
      "repaired",
      "grouped",
      "ready_for_analysis",
    ]);
    expect(experience.brokerCoverage.limitation).toContain("representative");
    expect(
      experience.evidenceDrillIn.records.some(
        (record) => record.source === "sample_mistake",
      ),
    ).toBe(true);
    expect(experience.copyAudit.passed).toBe(true);
    expect(experience.calibrationQueue.marketContextUsedNow).toBe(false);
    expect(
      experience.calibrationQueue.items.some((item) => item.marketContextRequired),
    ).toBe(true);
  });

  it("flags unsafe copy that would undermine the end-user product", () => {
    const audit = buildProductCopyQualitySystem({
      texts: [
        {
          sourceId: "unsafe-dry-run",
          text: "Export raw JSON because this is guaranteed broker support.",
        },
      ],
    });

    expect(audit.passed).toBe(false);
    expect(audit.issues.map((issue) => issue.phrase)).toEqual(
      expect.arrayContaining(["export", "raw json", "guaranteed"]),
    );
  });

  it("registers the dry-run route under no-export policy", () => {
    const routes = buildTraderIntelligenceRouteRegistry();
    const audit = auditTraderIntelligenceNoExportPolicy({ routes });
    const dryRun = routes.find((route) => route.routeId === "import_dry_run");

    expect(dryRun).toMatchObject({
      standalonePath: "/intelligence/import-dry-run",
      audience: "end_user",
      allowsRawJson: false,
      allowsExport: false,
    });
    expect(audit.passed).toBe(true);
  });
});
