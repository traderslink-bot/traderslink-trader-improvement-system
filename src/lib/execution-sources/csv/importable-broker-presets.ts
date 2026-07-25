import {
  parseBrokerExecutionCsv,
  type BrokerExecutionCsvColumnMapping,
  type BrokerExecutionCsvImportResult,
  type BrokerExecutionCsvOptionsHandling,
  type BrokerExecutionCsvTradeGroupingRules,
} from "./broker-execution-csv-import";

export type ImportableBrokerPresetId =
  | "das_trader_pro"
  | "sterling_trader_pro"
  | "thinkorswim_trade_history"
  | "questrade_iq_edge"
  | "alpaca_trade_activities"
  | "tradezero_historical_fills"
  | "tradervue_generic_executions"
  | "fidelity_account_history"
  | "tastytrade_transaction_history"
  | "trading212_history"
  | "swissquote_transaction_history";

export interface ImportableBrokerPreset {
  id: ImportableBrokerPresetId;
  label: string;
  confidence: "official" | "observed" | "best_effort";
  delimiter?: "," | ";" | "\t";
  executionLevel: boolean;
  columnMapping: BrokerExecutionCsvColumnMapping;
  notes: readonly string[];
}

export interface ParseImportableBrokerCsvArgs {
  csvText: string;
  broker: ImportableBrokerPresetId;
  timestampTimezone?: string;
  defaultSessionBucket?: string;
  optionsHandling?: BrokerExecutionCsvOptionsHandling;
  tradeGroupingRules?: BrokerExecutionCsvTradeGroupingRules;
}

export const IMPORTABLE_BROKER_PRESETS: Record<
  ImportableBrokerPresetId,
  ImportableBrokerPreset
> = {
  das_trader_pro: {
    id: "das_trader_pro",
    label: "DAS Trader Pro Executions",
    confidence: "observed",
    executionLevel: true,
    columnMapping: {
      time: ["Time"],
      symbol: ["Symbol", "Symb"],
      side: ["Side"],
      quantity: ["Qty"],
      price: ["Price"],
      fees: ["ECNFee"],
    },
    notes: [
      "DAS session exports may omit the trade date; the user must supply a dated export or map a date column when available.",
      "Supports both Symbol and Symb header variants.",
    ],
  },
  sterling_trader_pro: {
    id: "sterling_trader_pro",
    label: "Sterling Trader Pro Executions",
    confidence: "observed",
    executionLevel: true,
    columnMapping: {
      date: ["Date"],
      time: ["Time"],
      symbol: ["Symbol"],
      side: ["Side"],
      quantity: ["Shares (Qty)", "Qty", "Shares"],
      price: ["Exe Price", "Execution Price"],
    },
    notes: ["Sterling exports are user-configurable, so the preset recognizes common selected execution columns."],
  },
  thinkorswim_trade_history: {
    id: "thinkorswim_trade_history",
    label: "thinkorswim Trade Account History",
    confidence: "observed",
    executionLevel: true,
    columnMapping: {
      timestamp: ["Exec Time"],
      side: ["Side"],
      quantity: ["Qty"],
      symbol: ["Symbol"],
      price: ["Price"],
      assetType: ["Type"],
      description: ["Spread"],
    },
    notes: ["Options rows remain governed by the importer's optionsHandling policy."],
  },
  questrade_iq_edge: {
    id: "questrade_iq_edge",
    label: "Questrade IQ Edge Executions",
    confidence: "observed",
    executionLevel: true,
    columnMapping: {
      symbol: ["Symbol"],
      description: ["Description"],
      side: ["Action"],
      price: ["Fill price"],
      quantity: ["Fill qty"],
      commission: ["Commission"],
      netAmount: ["Total Value"],
      timestamp: ["Exec time"],
    },
    notes: ["Exec time is preferred over Time Placed because it represents the fill."],
  },
  alpaca_trade_activities: {
    id: "alpaca_trade_activities",
    label: "Alpaca Trade Activities",
    confidence: "official",
    executionLevel: true,
    columnMapping: {
      timestamp: ["transaction_time"],
      side: ["side"],
      quantity: ["qty"],
      symbol: ["symbol"],
      price: ["price"],
      executionId: ["id"],
      orderId: ["order_id"],
    },
    notes: [
      "Designed for CSV serialization of Alpaca's documented trade-activity records.",
      "activity_type identifies the activity record kind and is not treated as an order fill-status column.",
    ],
  },
  tradezero_historical_fills: {
    id: "tradezero_historical_fills",
    label: "TradeZero Historical Fills",
    confidence: "official",
    executionLevel: true,
    columnMapping: {
      executionId: ["tradeId"],
      symbol: ["symbol"],
      assetType: ["securityType"],
      side: ["side"],
      quantity: ["qty"],
      price: ["price"],
      netAmount: ["netProceeds"],
      commission: ["commission"],
      fees: ["totalFees"],
      currency: ["currency"],
      date: ["tradeDate"],
      time: ["execTime"],
      description: ["notes"],
    },
    notes: ["Canceled records are expected to be excluded by the source or filtered before import."],
  },
  tradervue_generic_executions: {
    id: "tradervue_generic_executions",
    label: "Tradervue Generic Execution Format",
    confidence: "official",
    executionLevel: true,
    columnMapping: {
      date: ["Date"],
      time: ["Time"],
      symbol: ["Symbol"],
      quantity: ["Quantity"],
      price: ["Price"],
      side: ["Side"],
      commission: ["Commission"],
      fees: ["TransFee", "ECNFee"],
      assetType: ["Option"],
    },
    notes: ["The six core execution columns are Date, Time, Symbol, Quantity, Price, and Side."],
  },
  fidelity_account_history: {
    id: "fidelity_account_history",
    label: "Fidelity Account History",
    confidence: "observed",
    executionLevel: false,
    columnMapping: {
      date: ["Run Date"],
      side: ["Action"],
      symbol: ["Symbol"],
      description: ["Description"],
      assetType: ["Type"],
      price: ["Price ($)"],
      quantity: ["Quantity"],
      commission: ["Commission ($)"],
      fees: ["Fees ($)"],
      netAmount: ["Amount ($)"],
    },
    notes: ["Non-trade account activity is skipped when Action does not describe a buy or sell."],
  },
  tastytrade_transaction_history: {
    id: "tastytrade_transaction_history",
    label: "tastytrade Transaction History",
    confidence: "observed",
    executionLevel: false,
    columnMapping: {
      date: ["Date"],
      side: ["Action"],
      symbol: ["Symbol", "Underlying Symbol", "Root Symbol"],
      assetType: ["Instrument Type"],
      description: ["Description"],
      netAmount: ["Value"],
      quantity: ["Quantity"],
      price: ["Average Price"],
      commission: ["Commissions"],
      fees: ["Fees"],
      orderId: ["Order #"],
    },
    notes: [
      "Options rows remain governed by the importer's optionsHandling policy.",
      "Type identifies the transaction category and is not treated as an order fill-status column.",
    ],
  },
  trading212_history: {
    id: "trading212_history",
    label: "Trading 212 History",
    confidence: "observed",
    executionLevel: false,
    columnMapping: {
      side: ["Action"],
      timestamp: ["Time"],
      symbol: ["Ticker"],
      description: ["Name", "Notes"],
      executionId: ["ID"],
      quantity: ["No. of shares"],
      price: ["Price / share"],
      currency: ["Currency (Price / share)", "Currency (Total)"],
      netAmount: ["Total"],
    },
    notes: ["The importer skips non-trade actions and accepts localized extra columns that are not required."],
  },
  swissquote_transaction_history: {
    id: "swissquote_transaction_history",
    label: "Swissquote Transaction History",
    confidence: "observed",
    delimiter: ";",
    executionLevel: false,
    columnMapping: {
      date: ["Date"],
      orderId: ["Order #"],
      side: ["Transaction"],
      symbol: ["Symbol"],
      quantity: ["Quantity"],
      price: ["Unit Price"],
      fees: ["Costs"],
      netAmount: ["Net Amount"],
      currency: ["Currency"],
    },
    notes: ["Swissquote examples commonly use semicolon-delimited CSV files."],
  },
};

export function parseImportableBrokerCsv(
  args: ParseImportableBrokerCsvArgs,
): BrokerExecutionCsvImportResult {
  const preset = IMPORTABLE_BROKER_PRESETS[args.broker];
  const result = parseBrokerExecutionCsv({
    csvText: args.csvText,
    broker: "generic_execution_csv",
    sourceLabel: `broker_csv:${preset.id}`,
    timestampTimezone: args.timestampTimezone,
    defaultSessionBucket: args.defaultSessionBucket,
    optionsHandling: args.optionsHandling,
    columnMapping: preset.columnMapping,
    tradeGroupingRules: args.tradeGroupingRules,
  });

  return {
    ...result,
    brokerLabel: preset.label,
    stableHeaderConfidence: preset.confidence,
    diagnostics: {
      ...result.diagnostics,
      brokerNotes: [...preset.notes],
    },
  };
}
