import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseBrokerExecutionCsv,
  type BrokerExecutionCsvFormat,
} from "../broker-execution-csv-import";
import { previewBrokerExecutionCsvImport } from "../../../trader-analytics";
import { validateTradeAnalysisRequest } from "../../../trade-analysis/request/trade-analysis-request-contract";

function expectRequestsValid(
  csvText: string,
  broker: BrokerExecutionCsvFormat,
): ReturnType<typeof parseBrokerExecutionCsv> {
  const result = parseBrokerExecutionCsv({
    broker,
    csvText,
    defaultSessionBucket: "unknown",
  });

  expect(result.requests.length).toBeGreaterThan(0);

  for (const request of result.requests) {
    const validation = validateTradeAnalysisRequest(request);

    expect(validation.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  }

  return result;
}

describe("broker execution CSV imports", () => {
  it("maps IBKR activity statement rows with signed quantity into trade requests", () => {
    const result = expectRequestsValid(
      [
        "Symbol,Date/Time,Quantity,T. Price,Trade ID",
        "AAPL,\"2026-05-01, 09:35:00\",100,182.10,IB-1",
        "AAPL,\"2026-05-01, 10:05:00\",-100,184.25,IB-2",
      ].join("\n"),
      "ibkr_activity_statement",
    );

    expect(result.broker).toBe("ibkr_activity_statement");
    expect(result.fileFingerprint).toMatch(/^broker_csv_file_v1:/);
    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.requestFingerprints[0]).toMatch(/^trade_request_v1:/);
    expect(result.mappingConfidence).toMatchObject({
      level: "high",
      matchedRequiredFieldCount: 3,
      requiredFieldCount: 3,
    });
    expect(result.diagnostics.mappingConfidence).toEqual(
      result.mappingConfidence,
    );
    expect(result.diagnostics.detectedColumns.map((column) => column.field)).toEqual(
      expect.arrayContaining(["symbol", "timestamp", "quantity", "price"]),
    );
    expect(result.requests).toHaveLength(1);
    expect(result.groupingDiagnostics).toHaveLength(1);
    expect(result.groupingDiagnostics[0]).toMatchObject({
      requestIndex: 0,
      symbol: "AAPL",
      tradeDirection: "long",
      lifecycleStatus: "closed",
      groupingReason: "flat_position",
      rowIndexes: [2, 3],
      executionCount: 2,
      finalPositionShares: 0,
    });
    expect(result.requests[0]).toMatchObject({
      symbol: "AAPL",
      tradeDirection: "long",
    });
    expect(result.requests[0]).not.toHaveProperty("provider");
    expect(result.requests[0].executions.map((execution) => execution.side)).toEqual([
      "buy",
      "sell",
    ]);
  });

  it("finds an execution header after broker report preamble rows", () => {
    const result = expectRequestsValid(
      [
        "Statement,Account,SYNTHETIC-ACCOUNT",
        "Generated,2026-05-02",
        "Trades,Header,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Trade ID",
        "Trades,Data,Stocks,USD,AAPL,\"2026-05-01, 09:35:00\",100,182.10,IB-1",
        "Trades,Data,Stocks,USD,AAPL,\"2026-05-01, 10:05:00\",-100,184.25,IB-2",
      ].join("\n"),
      "ibkr_activity_statement",
    );

    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.requests).toHaveLength(1);
    expect(result.diagnostics.headerRowNumber).toBe(3);
    expect(result.diagnostics.rowOutcomes.map((outcome) => outcome.rowIndex)).toEqual([
      4,
      5,
    ]);
  });

  it("captures realistic IBKR activity statement costs without treating gross proceeds as net amount", () => {
    const result = expectRequestsValid(
      [
        "Statement,Account,SYNTHETIC-ACCOUNT",
        "Generated,2026-05-02",
        "Trades,Header,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Trade ID,Proceeds,Comm/Fee",
        "Trades,Data,Stocks,USD,AAPL,\"2026-05-01, 09:35:00\",100,182.10,IB-1,-18210.00,-1.00",
        "Trades,Data,Stocks,USD,AAPL,\"2026-05-01, 10:05:00\",-100,184.25,IB-2,18425.00,-1.00",
      ].join("\n"),
      "ibkr_activity_statement",
    );

    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.diagnostics.headerRowNumber).toBe(3);
    expect(result.diagnostics.detectedColumns.map((column) => column.field)).toEqual(
      expect.arrayContaining([
        "currency",
        "symbol",
        "timestamp",
        "quantity",
        "price",
        "executionId",
        "commission",
      ]),
    );
    expect(result.executions[0]).toMatchObject({
      currency: "USD",
      commission: -1,
      brokerExecutionId: "IB-1",
    });
    expect(result.executions[0].netAmount).toBeUndefined();
    expect(result.executions[1]).toMatchObject({
      side: "sell",
      shares: 100,
      commission: -1,
    });
    expect(result.executions[1].netAmount).toBeUndefined();
  });

  it("does not invent a new short when IBKR marks a sell as closing a prior position", () => {
    const result = parseBrokerExecutionCsv({
      broker: "ibkr_activity_statement",
      csvText: [
        "Trades,Header,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Trade ID,Proceeds,Comm/Fee,Code",
        'Trades,Data,Stocks,USD,ANNA,"2026-04-01, 07:35:06",-100,7.4031,IB-1,740.31,-1.0195,C;P',
        'Trades,Data,Stocks,USD,ANNA,"2026-04-21, 11:52:58",80,4.19,IB-2,-335.20,-1.00,O',
        'Trades,Data,Stocks,USD,ANNA,"2026-04-21, 16:11:09",-80,4.20,IB-3,336.00,-1.02,C',
      ].join("\n"),
      defaultSessionBucket: "unknown",
    });

    expect(result.acceptedExecutionCount).toBe(3);
    expect(result.requests).toHaveLength(1);
    expect(result.groupingDiagnostics).toHaveLength(1);
    expect(result.groupingDiagnostics[0]).toMatchObject({
      symbol: "ANNA",
      tradeDirection: "long",
      lifecycleStatus: "closed",
      groupingReason: "flat_position",
      rowIndexes: [3, 4],
      finalPositionShares: 0,
    });
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "prior_position_close_skipped",
          rowIndex: 2,
        }),
      ]),
    );
  });

  it("skips non-stock execution sections in full IBKR monthly activity statements", () => {
    const result = expectRequestsValid(
      [
        "Account Information,Header,Field Name,Field Value",
        "Account Information,Data,Account,SYNTHETIC-ACCOUNT",
        "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,C. Price,Proceeds,Comm/Fee,Basis,Realized P/L,MTM P/L,Code",
        "Trades,Data,Order,Stocks,USD,AAPL,\"2026-05-01, 09:35:00\",100,182.10,182.10,-18210.00,-1.00,18210.00,0,0,O",
        "Trades,SubTotal,,Stocks,USD,AAPL,,100,,,-18210.00,-1.00,18210.00,0,0,",
        "Trades,Data,Order,Forex,USD,USD.CAD,\"2026-05-01, 09:40:00\",1000,1.3500,1.3500,-1350.00,0,0,0,0,O",
        "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,C. Price,Proceeds,Comm/Fee,Basis,Realized P/L,MTM P/L,Code",
        "Trades,Data,Order,Stocks,USD,AAPL,\"2026-05-01, 10:05:00\",-100,184.25,184.25,18425.00,-1.00,-18210.00,215.00,0,C",
        "Trades,Total,,Stocks,USD,,,,,215.00,-2.00,,215.00,0,",
        "Deposits & Withdrawals,Header,Currency,Settle Date,Description,Amount",
        "Deposits & Withdrawals,Data,CAD,2026-05-01,Funds Transfer,1000",
        "Financial Instrument Information,Header,Asset Category,Symbol,Description",
        "Financial Instrument Information,Data,Stocks,AAPL,Apple Inc",
      ].join("\n"),
      "ibkr_activity_statement",
    );

    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.rejectedRowCount).toBe(0);
    expect(result.skippedRowCount).toBeGreaterThan(0);
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]).toMatchObject({
      symbol: "AAPL",
      tradeDirection: "long",
    });
    expect(result.issues.map((issue) => issue.code)).toContain(
      "non_trade_row_skipped",
    );
    expect(result.issues.map((issue) => issue.code)).not.toContain(
      "row_invalid_timestamp",
    );
    expect(result.issues.map((issue) => issue.code)).not.toContain(
      "row_missing_price",
    );
  });

  it("maps Webull filled order rows and skips cancelled rows", () => {
    const result = expectRequestsValid(
      [
        "Symbol,Side,Filled Qty,Avg Price,Filled Time,Status,Order ID",
        "TSLA,Buy,10,175.25,2026-05-01 09:45:00,Filled,WB-1",
        "TSLA,Sell,10,176.50,2026-05-01 10:15:00,Filled,WB-2",
        "TSLA,Buy,5,177.00,2026-05-01 10:30:00,Cancelled,WB-3",
      ].join("\n"),
      "webull_order_history",
    );

    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.skippedRowCount).toBe(1);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "non_filled_order_skipped",
    );
  });

  it("can interpret broker-local timestamps with an account timezone", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      timestampTimezone: "America/New_York",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,SPY,Buy,100,510.00",
        "2026-05-01,10:00:00,SPY,Sell,100,511.25",
      ].join("\n"),
    });

    expect(result.diagnostics.timestampTimezone).toBe("America/New_York");
    expect(result.executions[0].timestamp).toBe("2026-05-01T13:30:00.000Z");
    expect(result.executions[1].timestamp).toBe("2026-05-01T14:00:00.000Z");
  });

  it("falls back to UTC when an unsupported timezone is provided", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      timestampTimezone: "No/Such_Zone",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,SPY,Buy,100,510.00",
      ].join("\n"),
    });

    expect(result.diagnostics.timestampTimezone).toBe("UTC");
    expect(result.issues.map((issue) => issue.code)).toContain(
      "invalid_timestamp_timezone",
    );
  });

  it("captures fees, commissions, net amount, and currency when present", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00,1.25,0.08,-1001.33,USD",
        "2026-05-01,10:00:00,ABCD,Sell,100,10.50,1.25,0.10,1048.65,USD",
      ].join("\n"),
    });

    expect(result.executions[0]).toMatchObject({
      commission: 1.25,
      fees: 0.08,
      netAmount: -1001.33,
      currency: "USD",
    });
  });

  it("rejects options rows by default so stock analytics do not misread contracts", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price,Asset Type,Description",
        "2026-05-01,09:30:00,AAPL240621C00185000,Buy,1,2.50,Option,AAPL Jun Call",
      ].join("\n"),
    });

    expect(result.acceptedExecutionCount).toBe(0);
    expect(result.rejectedRowCount).toBe(1);
    expect(result.diagnostics.optionsHandling).toBe("reject");
    expect(result.issues.map((issue) => issue.code)).toContain(
      "options_row_rejected",
    );
  });

  it("can skip options rows without treating them as hard import failures", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      optionsHandling: "skip",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price,Asset Type,Description",
        "2026-05-01,09:30:00,AAPL240621C00185000,Buy,1,2.50,Option,AAPL Jun Call",
      ].join("\n"),
    });

    expect(result.rejectedRowCount).toBe(0);
    expect(result.skippedRowCount).toBe(1);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "options_row_skipped",
    );
  });

  it("maps Robinhood transaction history rows with transaction type labels", () => {
    const result = expectRequestsValid(
      [
        "Activity Date,Instrument,Transaction Type,Quantity,Average Price",
        "05/01/2026,NVDA,Market Buy,25,875.50",
        "05/01/2026,NVDA,Market Sell,25,889.10",
      ].join("\n"),
      "robinhood_transaction_history",
    );

    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].sessionContext.sessionDate).toBe("2026-05-01");
    expect(result.requests[0].executions[0]).toMatchObject({
      symbol: "NVDA",
      side: "buy",
      shares: 25,
      price: 875.5,
    });
  });

  it("maps Moomoo trade history rows with regional-style instrument headers", () => {
    const result = expectRequestsValid(
      [
        "Date of Trade,Instrument Code,Transaction Type,Filled Quantity,Average Price",
        "2026/05/01,META,Buy,8,312.40",
        "2026/05/01,META,Sell,8,318.75",
      ].join("\n"),
      "moomoo_trade_history",
    );

    expect(result.brokerLabel).toContain("Moomoo");
    expect(result.requests[0].executions).toHaveLength(2);
  });

  it("maps Schwab transaction rows and ignores non-trade account activity", () => {
    const result = expectRequestsValid(
      [
        "Date,Action,Symbol,Description,Quantity,Price,Fees & Comm,Amount",
        "05/01/2026,Buy,AMD,ADVANCED MICRO DEVICES INC,50,95.00,0,-4750.00",
        "05/01/2026,Sell,AMD,ADVANCED MICRO DEVICES INC,50,97.50,0,4875.00",
        "05/01/2026,Dividend,AMD,QUALIFIED DIVIDEND,0,0,0,12.00",
      ].join("\n"),
      "schwab_transactions",
    );

    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.skippedRowCount).toBe(1);
  });

  it("skips sell-starting rows by default because short-side review is not enabled", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Ticker,Action,Shares,Price",
        "2026-05-01,09:30:00,SPY,Sell,100,510.00",
        "2026-05-01,10:00:00,SPY,Buy,100,508.25",
      ].join("\n"),
    });

    expect(result.requests).toHaveLength(0);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "sell_starting_trade_skipped",
    );
  });

  it("can map sell-starting rows into short trades when an internal fixture opts in", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      tradeGroupingRules: {
        allowSellStartingTrades: true,
      },
      csvText: [
        "Date,Time,Ticker,Action,Shares,Price",
        "2026-05-01,09:30:00,SPY,Sell,100,510.00",
        "2026-05-01,10:00:00,SPY,Buy,100,508.25",
      ].join("\n"),
    });

    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].tradeDirection).toBe("short");
  });

  it("auto-detects semicolon-delimited generic execution exports", () => {
    const result = expectRequestsValid(
      [
        "Date;Time;Ticker;Action;Shares;Price",
        "2026-05-01;09:30:00;SPY;Buy;100;510.00",
        "2026-05-01;10:00:00;SPY;Sell;100;511.25",
      ].join("\n"),
      "generic_execution_csv",
    );

    expect(result.diagnostics.delimiter).toBe(";");
    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.requests).toHaveLength(1);
  });

  it("auto-detects tab-delimited generic exports with execution-date aliases", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      tradeGroupingRules: {
        allowSellStartingTrades: true,
      },
      csvText: [
        [
          "Execution Date",
          "Execution Time",
          "Ticker",
          "Instruction",
          "Filled Shares",
          "Average Fill Price",
          "Order Number",
          "Execution ID",
        ].join("\t"),
        [
          "2026-05-01",
          "09:30:00",
          "TSLA",
          "Short Sale",
          "10",
          "175.25",
          "ORDER-1",
          "EXEC-1",
        ].join("\t"),
        [
          "2026-05-01",
          "10:15:00",
          "TSLA",
          "Cover",
          "10",
          "173.50",
          "ORDER-2",
          "EXEC-2",
        ].join("\t"),
      ].join("\n"),
    });

    expect(result.diagnostics.delimiter).toBe("\t");
    expect(result.requests[0]).toMatchObject({
      symbol: "TSLA",
      tradeDirection: "short",
    });
    expect(result.executions.map((execution) => execution.side)).toEqual([
      "sell",
      "buy",
    ]);
    expect(result.executions[0]).toMatchObject({
      orderId: "ORDER-1",
      brokerExecutionId: "EXEC-1",
    });
  });

  it("aggregates split broker fee columns in generic imports", () => {
    const result = expectRequestsValid(
      [
        "Date,Time,Symbol,Side,Quantity,Price,Commission,SEC Fee,TAF Fee,Clearing Fee,Net Amount,Currency",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00,1.00,0.02,0.01,0.03,-1001.06,USD",
        "2026-05-01,10:00:00,ABCD,Sell,100,10.50,1.00,0.02,0.01,0.03,1048.94,USD",
      ].join("\n"),
      "generic_execution_csv",
    );

    expect(result.executions[0]).toMatchObject({
      commission: 1,
      fees: 0.06,
      netAmount: -1001.06,
      currency: "USD",
    });
    expect(result.executions[1]).toMatchObject({
      commission: 1,
      fees: 0.06,
      netAmount: 1048.94,
    });
  });

  it("accepts explicit column mappings for unknown broker CSV headers", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      columnMapping: {
        symbol: "Trading Symbol",
        timestamp: "Executed At",
        side: "Instruction",
        quantity: "Filled Shares",
        price: "Fill Price",
      },
      csvText: [
        "Trading Symbol,Executed At,Instruction,Filled Shares,Fill Price",
        "PLTR,2026-05-01 09:30:00,Buy,100,20.00",
        "PLTR,2026-05-01 10:00:00,Sell,100,21.00",
      ].join("\n"),
    });

    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.requests).toHaveLength(1);
    expect(result.diagnostics.columnMapping).toMatchObject({
      symbol: ["Trading Symbol"],
      timestamp: ["Executed At"],
      side: ["Instruction"],
      quantity: ["Filled Shares"],
      price: ["Fill Price"],
    });
    expect(result.diagnostics.detectedColumns.map((column) => column.field)).toEqual(
      expect.arrayContaining(["symbol", "timestamp", "side", "quantity", "price"]),
    );
  });

  it("hardens generic imports for odd headers, mixed date text, and cost columns", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      columnMapping: {
        symbol: "Ticker / Contract",
        timestamp: "Executed Local Time",
        side: "Buy Sell",
        quantity: "Fill Size",
        price: "Average Fill",
        status: "Order State",
        commission: "Commission Paid",
        fees: "Other Fees",
      },
      timestampTimezone: "America/New_York",
      csvText: [
        "Ticker / Contract,Executed Local Time,Buy Sell,Fill Size,Average Fill,Order State,Commission Paid,Other Fees",
        "ODDH,05/01/2026 09:30:00 AM,BUY,100,$10.00,Filled,$1.25,$0.08",
        "ODDH,2026-05-01 10:00:00,Sell,100,10.50,Filled,1.25,0.08",
        "ODDH,2026-05-01 10:05:00,Sell,100,10.55,Cancelled,0,0",
      ].join("\n"),
    });

    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.skippedRowCount).toBe(1);
    expect(result.rejectedRowCount).toBe(0);
    expect(result.requests).toHaveLength(1);
    expect(result.diagnostics.timestampTimezone).toBe("America/New_York");
    expect(result.diagnostics.columnMapping).toMatchObject({
      symbol: ["Ticker / Contract"],
      timestamp: ["Executed Local Time"],
      side: ["Buy Sell"],
      quantity: ["Fill Size"],
      price: ["Average Fill"],
      status: ["Order State"],
      commission: ["Commission Paid"],
      fees: ["Other Fees"],
    });
    expect(result.executions).toMatchObject([
      { symbol: "ODDH", commission: 1.25, fees: 0.08 },
      { symbol: "ODDH", commission: 1.25, fees: 0.08 },
    ]);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "non_filled_order_skipped",
    );
  });

  it("auto-detects a known broker format when enough headers match", () => {
    const result = parseBrokerExecutionCsv({
      broker: "auto",
      csvText: [
        "Symbol,Side,Filled Qty,Avg Price,Filled Time,Status",
        "MSFT,Buy,10,400,2026-05-01 09:30:00,Filled",
        "MSFT,Sell,10,402,2026-05-01 09:40:00,Filled",
      ].join("\n"),
    });

    expect(result.broker).toBe("webull_order_history");
    expect(result.issues.map((issue) => issue.code)).toContain(
      "auto_detected_format",
    );
  });

  it("skips an over-reducing sell remainder when it would create an unsupported short trade", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,QQQ,Buy,100,420.00",
        "2026-05-01,10:00:00,QQQ,Sell,150,421.00",
        "2026-05-01,10:30:00,QQQ,Buy,50,419.00",
      ].join("\n"),
    });

    expect(result.requests).toHaveLength(1);
    expect(result.requests.map((request) => request.tradeDirection)).toEqual([
      "long",
    ]);
    expect(result.groupingDiagnostics.map((item) => item.groupingReason)).toEqual([
      "over_reduction_split",
    ]);
    expect(
      result.groupingDiagnostics.map((item) => item.lifecycleStatus),
    ).toEqual(["closed"]);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "over_reducing_execution_split",
    );
    expect(result.issues.map((issue) => issue.code)).toContain(
      "sell_starting_trade_skipped",
    );
  });

  it("records open grouping diagnostics when an import leaves shares active", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,QQQ,Buy,100,420.00",
        "2026-05-01,10:00:00,QQQ,Sell,25,421.00",
      ].join("\n"),
    });

    expect(result.requests).toHaveLength(1);
    expect(result.groupingDiagnostics[0]).toMatchObject({
      lifecycleStatus: "open",
      groupingReason: "end_of_symbol",
      finalPositionShares: 75,
    });
  });

  it("can split grouped trades when executions exceed a configured time gap", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      tradeGroupingRules: {
        maxGapMinutes: 30,
      },
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,QQQ,Buy,100,420.00",
        "2026-05-01,09:40:00,QQQ,Sell,50,421.00",
        "2026-05-01,13:00:00,QQQ,Sell,50,419.00",
        "2026-05-01,13:10:00,QQQ,Buy,50,418.00",
      ].join("\n"),
    });

    expect(result.requests).toHaveLength(1);
    expect(result.groupingDiagnostics[0]).toMatchObject({
      lifecycleStatus: "open",
      groupingReason: "time_gap_split",
      finalPositionShares: 50,
    });
    expect(result.issues.map((issue) => issue.code)).toContain(
      "trade_grouping_time_gap_split",
    );
    expect(result.issues.map((issue) => issue.code)).toContain(
      "sell_starting_trade_skipped",
    );
  });

  it("can split grouped trades at a session boundary before saving", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      tradeGroupingRules: {
        splitAtSessionBoundary: true,
      },
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,15:55:00,IWM,Buy,100,202.00",
        "2026-05-02,09:35:00,IWM,Sell,100,203.00",
      ].join("\n"),
    });

    expect(result.requests).toHaveLength(1);
    expect(result.groupingDiagnostics[0]).toMatchObject({
      lifecycleStatus: "open",
      groupingReason: "session_boundary_split",
    });
    expect(result.diagnostics.tradeGroupingRules).toEqual({
      splitAtSessionBoundary: true,
    });
  });

  it("returns rejected row issues for incomplete CSV rows", () => {
    const result = parseBrokerExecutionCsv({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,,Buy,100,10.00",
        "2026-05-01,09:35:00,ABCD,Sell,100,11.00",
      ].join("\n"),
    });

    expect(result.rejectedRowCount).toBe(1);
    expect(result.acceptedExecutionCount).toBe(1);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "row_missing_symbol",
    );
  });

  it("feeds parsed CSV requests into the saved-trade import preview", () => {
    const preview = previewBrokerExecutionCsvImport({
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
        "2026-05-01,09:45:00,ABCD,Sell,100,10.50",
      ].join("\n"),
      existingFileFingerprints: ["not-this-file"],
    });

    expect(preview.importResult.requests).toHaveLength(1);
    expect(preview.importResult.diagnostics.timestampTimezone).toBe(
      "America/New_York",
    );
    expect(preview.fileFingerprint).toBe(preview.importResult.fileFingerprint);
    expect(preview.fileAlreadyImported).toBe(false);
    expect(preview.savedTradePreview).toMatchObject({
      totalCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
    });
    expect(preview.productDiagnostics.confidenceLevel).toBe(
      preview.importResult.mappingConfidence.level,
    );
    expect(preview.productDiagnostics.qualityScore).toMatchObject({
      status: "high_confidence",
      blockerCount: 0,
    });
    expect(preview.productDiagnostics.reconstructionPreview.items[0]).toMatchObject({
      symbol: "ABCD",
      lifecycleStatus: "closed",
      needsReview: false,
    });
    expect(
      preview.productDiagnostics.reconstructionPreview.items[0].timeline.map(
        (step) => step.positionAfterExecution,
      ),
    ).toEqual([100, 0]);
    expect(preview.productDiagnostics.summaryCards.map((card) => card.id)).toEqual(
      expect.arrayContaining(["rows", "trades", "confidence", "timezone"]),
    );
  });

  it("flags a previously uploaded CSV file fingerprint", () => {
    const csvText = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
      "2026-05-01,09:45:00,ABCD,Sell,100,10.50",
    ].join("\n");
    const firstPreview = previewBrokerExecutionCsvImport({
      broker: "generic_execution_csv",
      csvText,
    });
    const secondPreview = previewBrokerExecutionCsvImport({
      broker: "generic_execution_csv",
      csvText,
      existingFileFingerprints: [firstPreview.fileFingerprint],
    });

    expect(secondPreview.fileAlreadyImported).toBe(true);
  });

  it("builds product diagnostics with repair actions and net P/L preview", () => {
    const preview = previewBrokerExecutionCsvImport({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00,1.25,0.08,-1001.33,USD",
        "2026-05-01,10:00:00,ABCD,Sell,100,10.50,1.25,0.10,1048.65,USD",
        "2026-05-01,10:15:00,,Buy,5,10.20,0,0,-51.00,USD",
      ].join("\n"),
    });

    expect(preview.importResult.acceptedExecutionCount).toBe(2);
    expect(preview.importResult.rejectedRowCount).toBe(1);
    expect(preview.productDiagnostics.repairWorkflow.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionKind: "edit_row_field",
          issueCode: "row_missing_symbol",
          severity: "fix_required",
        }),
      ]),
    );
    const netPnlItem = preview.productDiagnostics.netPnlPreview.items[0];

    expect(netPnlItem).toMatchObject({
      symbol: "ABCD",
      lifecycleStatus: "closed",
      source: "broker_net_amount",
      currency: "USD",
    });
    expect(netPnlItem.brokerNetAmountTotal).toBeCloseTo(47.32);
    expect(netPnlItem.estimatedNetPnl).toBeCloseTo(47.32);
    expect(preview.productDiagnostics.pnlReconciliation.items[0]).toMatchObject({
      status: "matched",
      symbol: "ABCD",
    });
    expect(preview.productDiagnostics.mappingLearningSignal.shouldCapture).toBe(
      true,
    );
    expect(preview.productDiagnostics.reviewDashboard.batchStatus).toBe(
      "blocked",
    );
    expect(preview.productDiagnostics.qualityScore.status).toBe("blocked");
    expect(preview.productDiagnostics.qualityScore.score).toBeLessThan(85);
    expect(preview.productDiagnostics.commitPlan.canCommitNow).toBe(false);
    expect(preview.productDiagnostics.summaryCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "fees",
          tone: "good",
        }),
      ]),
    );
  });

  it("flags broker/app P/L mismatches before committing an import", () => {
    const preview = previewBrokerExecutionCsvImport({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00,0.00,0.00,-1000.00,USD",
        "2026-05-01,10:00:00,ABCD,Sell,100,10.50,0.00,0.00,1040.00,USD",
      ].join("\n"),
    });

    expect(preview.productDiagnostics.pnlReconciliation.items[0]).toMatchObject({
      status: "mismatch",
      difference: -10,
    });
    expect(preview.productDiagnostics.repairWorkflow.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionKind: "review_pnl_reconciliation",
          issueCode: "pnl_reconciliation_mismatch",
        }),
      ]),
    );
    expect(preview.productDiagnostics.commitPlan.status).toBe(
      "needs_user_review",
    );
    expect(preview.productDiagnostics.qualityScore.status).toBe("needs_review");
  });

  it("keeps options rows in a quarantine contract for future workflows", () => {
    const preview = previewBrokerExecutionCsvImport({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price,Asset Type,Description",
        "2026-05-01,09:30:00,AAPL240621C00185000,Buy,1,2.50,Option,AAPL Jun Call",
      ].join("\n"),
    });

    expect(preview.productDiagnostics.optionsQuarantine).toMatchObject({
      totalCount: 1,
      rejectedCount: 1,
    });
    expect(preview.productDiagnostics.optionsQuarantine.items[0]).toMatchObject({
      action: "rejected",
      issueCode: "options_row_rejected",
    });
  });

  it("parses the expanded representative broker fixture pack through the generic mapper", () => {
    const fixtureNames = [
      "fidelity-account-history-sample.csv",
      "etrade-transactions-sample.csv",
      "tastytrade-transactions-sample.csv",
      "tradestation-trade-history-sample.csv",
      "thinkorswim-account-statement-sample.csv",
    ];

    for (const fixtureName of fixtureNames) {
      const csvText = readFileSync(
        join(process.cwd(), "src/docs/trade-execution-import-fixtures", fixtureName),
        "utf8",
      );
      const result = parseBrokerExecutionCsv({
        broker: "generic_execution_csv",
        csvText,
        timestampTimezone: "America/New_York",
      });

      expect(result.acceptedExecutionCount, fixtureName).toBe(2);
      expect(result.requests, fixtureName).toHaveLength(1);
      expect(result.groupingDiagnostics[0], fixtureName).toMatchObject({
        lifecycleStatus: "closed",
        groupingReason: "flat_position",
      });
    }
  });
});
