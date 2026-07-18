import type { LevelsSystemRuntimeConfig } from "../../support-resistance/levels-system-runtime-options";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import type { BrokerExecutionCsvFormat } from "../../execution-sources/csv";

export interface DecisionReviewCsvScenario {
  id: string;
  label: string;
  broker: BrokerExecutionCsvFormat;
  csvText: string;
  levelsSystem: LevelsSystemRuntimeConfig;
  expectedImportStatus?: "blocked" | "needs_review" | "ready";
  expectedCompletedReviewCount?: number;
  expectedInsightIds: string[];
  expectedMarketContextSource: "levels_system_daily_4h" | "none" | null;
  expectedDiagnosticCodes?: string[];
  requiredHeadlineFragments?: string[];
  requiredTitleFragments?: string[];
  requiredEvidenceFragments?: string[];
  forbiddenTextFragments?: string[];
}

export const decisionReviewCsvScenarios: DecisionReviewCsvScenario[] = [
  {
    id: "sample_daily_4h_context",
    label: "Sample daily/4h context review",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2024-04-12,09:33:30,ABCD,Buy,100,1.185",
      "2024-04-12,09:36:15,ABCD,Buy,50,1.255",
      "2024-04-12,09:39:10,ABCD,Sell,150,1.295",
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedInsightIds: ["trade_window_excursion_measured"],
    expectedMarketContextSource: "levels_system_daily_4h",
    requiredEvidenceFragments: ["tradeMfePct="],
  },
  {
    id: "ibkr_activity_statement_review",
    label: "IBKR activity statement decision review",
    broker: "ibkr_activity_statement",
    csvText: [
      "Statement,Account,SYNTHETIC-ACCOUNT",
      "Generated,2024-04-13",
      "Trades,Header,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Trade ID,Proceeds,Comm/Fee",
      'Trades,Data,Stocks,USD,ABCD,"2024-04-12, 09:33:30",100,1.1850,IB-1,-118.50,-1.00',
      'Trades,Data,Stocks,USD,ABCD,"2024-04-12, 09:39:10",-100,1.2950,IB-2,129.50,-1.00',
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedInsightIds: ["trade_window_excursion_measured"],
    expectedMarketContextSource: "levels_system_daily_4h",
    requiredEvidenceFragments: ["tradeMfePct="],
  },
  {
    id: "entry_near_major_resistance_limited_room",
    label: "Entry near major daily/4h resistance with limited room",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2024-04-12,09:33:30,ABCD,Buy,100,1.3097",
      "2024-04-12,09:39:10,ABCD,Sell,100,1.3150",
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedInsightIds: [
      "entry_near_daily_4h_resistance",
      "entry_limited_clean_room_to_resistance",
      "trade_window_excursion_measured",
    ],
    expectedMarketContextSource: "levels_system_daily_4h",
    requiredHeadlineFragments: [
      "major daily/4h resistance with limited room before overhead resistance",
    ],
    requiredTitleFragments: ["major daily/4h resistance"],
    requiredEvidenceFragments: [
      "nearestResistanceStrength=major",
      "distanceToResistance=0.02%",
    ],
  },
  {
    id: "failed_entry_near_major_resistance",
    label: "Failed entry near major daily/4h resistance",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2024-04-12,09:33:30,ABCD,Buy,100,1.3097",
      "2024-04-12,09:39:10,ABCD,Sell,100,1.2350",
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedInsightIds: [
      "entry_near_daily_4h_resistance",
      "entry_limited_clean_room_to_resistance",
      "trade_window_excursion_measured",
    ],
    expectedMarketContextSource: "levels_system_daily_4h",
    requiredHeadlineFragments: [
      "major daily/4h resistance with limited room before overhead resistance",
    ],
    requiredTitleFragments: ["major daily/4h resistance"],
    requiredEvidenceFragments: [
      "nearestResistanceStrength=major",
      "distanceToResistance=0.02%",
    ],
  },
  {
    id: "major_resistance_limited_room_late_add",
    label: "Major resistance, limited room, and late add",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2024-04-12,09:33:30,ABCD,Buy,100,1.3097",
      "2024-04-12,09:36:15,ABCD,Buy,100,1.3150",
      "2024-04-12,09:39:10,ABCD,Sell,200,1.3250",
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedInsightIds: [
      "entry_near_daily_4h_resistance",
      "entry_limited_clean_room_to_resistance",
      "adds_after_trade_already_used_range",
      "trade_window_excursion_measured",
    ],
    expectedMarketContextSource: "levels_system_daily_4h",
    requiredHeadlineFragments: [
      "major daily/4h resistance",
      "limited room before overhead resistance",
      "adds increased size after much of the move was already used",
    ],
    requiredTitleFragments: [
      "major daily/4h resistance",
      "Adds came after much of the move was already used",
    ],
    requiredEvidenceFragments: [
      "nearestResistanceStrength=major",
      "distanceToResistance=0.02%",
      "averageAddPricePositionInRecentRangePct=",
    ],
  },
  {
    id: "entry_near_support_premature_exit",
    label: "Entry near support with premature exit and failed protection",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2024-04-12,09:33:30,ABCD,Buy,100,1.1528",
      "2024-04-12,09:39:10,ABCD,Sell,100,1.2250",
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedInsightIds: [
      "entry_near_daily_4h_support",
      "profit_protection_failed",
      "trade_window_excursion_measured",
    ],
    expectedMarketContextSource: "levels_system_daily_4h",
    requiredTitleFragments: ["daily/4h support"],
    requiredEvidenceFragments: [
      "nearestSupportStrength=major",
      "distanceToSupport=0.24%",
    ],
  },
  {
    id: "partial_exit_near_support",
    label: "Partial exit from nearby support entry",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2024-04-12,09:33:30,ABCD,Buy,100,1.1528",
      "2024-04-12,09:36:15,ABCD,Sell,50,1.2050",
      "2024-04-12,09:39:10,ABCD,Sell,50,1.2250",
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedInsightIds: [
      "entry_near_daily_4h_support",
      "profit_protection_failed",
      "trade_window_excursion_measured",
    ],
    expectedMarketContextSource: "levels_system_daily_4h",
    requiredTitleFragments: ["daily/4h support"],
    requiredEvidenceFragments: [
      "nearestSupportStrength=major",
      "distanceToSupport=0.24%",
    ],
  },
  {
    id: "short_completed_trade_smoke",
    label: "Sell-starting trade uses limited sell-side review",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2024-04-12,09:33:30,ABCD,Sell,100,1.2950",
      "2024-04-12,09:39:10,ABCD,Buy,100,1.2500",
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedCompletedReviewCount: 1,
    expectedInsightIds: ["short_entry_had_room_to_support"],
    expectedMarketContextSource: "levels_system_daily_4h",
  },
  {
    id: "open_position_skipped",
    label: "Open position skipped with diagnostic",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2024-04-12,09:33:30,ABCD,Buy,100,1.1850",
      "2024-04-12,09:39:10,ABCD,Sell,25,1.2950",
    ].join("\n"),
    levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    expectedImportStatus: "needs_review",
    expectedCompletedReviewCount: 0,
    expectedInsightIds: [],
    expectedMarketContextSource: null,
    expectedDiagnosticCodes: ["trade_open"],
  },
  {
    id: "repeated_adds_after_extension",
    label: "Repeated adds after extension",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
      "2026-05-01,09:32:00,ABCD,Buy,100,9.50",
      "2026-05-01,09:34:00,ABCD,Buy,100,9.00",
      "2026-05-01,09:36:00,ABCD,Buy,100,8.50",
      "2026-05-01,10:05:00,ABCD,Sell,400,8.25",
    ].join("\n"),
    levelsSystem: {
      preferredProvider: "stub",
      asOfTimestamp: "2026-05-01T15:45:00.000Z",
      lookbackBars: {
        daily: 520,
        "4h": 180,
        "5m": 120,
      },
    },
    expectedInsightIds: [
      "market_context_unavailable",
      "trade_window_excursion_measured",
    ],
    expectedMarketContextSource: "none",
    requiredEvidenceFragments: ["tradeMfePct="],
  },
];
