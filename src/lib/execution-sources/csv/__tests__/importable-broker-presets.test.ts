import { describe, expect, it } from "vitest";
import {
  IMPORTABLE_BROKER_PRESETS,
  parseImportableBrokerCsv,
  type ImportableBrokerPresetId,
} from "../importable-broker-presets";

const scenarios: Array<{
  broker: ImportableBrokerPresetId;
  csvText: string;
  symbol: string;
}> = [
  {
    broker: "das_trader_pro",
    symbol: "AAPL",
    csvText: [
      "Date,Time,Symbol,Side,Price,Qty,ECNFee",
      "2026-07-24,09:35:00,AAPL,BUY,182.10,100,0.25",
      "2026-07-24,10:05:00,AAPL,SELL,184.25,100,0.25",
    ].join("\n"),
  },
  {
    broker: "sterling_trader_pro",
    symbol: "MSFT",
    csvText: [
      "Date,Time,Symbol,Shares (Qty),Exe Price,Side",
      "2026-07-24,09:36:00,MSFT,50,510.00,BUY",
      "2026-07-24,10:06:00,MSFT,50,512.00,SELL",
    ].join("\n"),
  },
  {
    broker: "thinkorswim_trade_history",
    symbol: "NVDA",
    csvText: [
      "Exec Time,Spread,Side,Qty,Symbol,Exp,Strike,Type,Price",
      "2026-07-24 09:37:00,STOCK,BUY,25,NVDA,,,STOCK,170.00",
      "2026-07-24 10:07:00,STOCK,SELL,25,NVDA,,,STOCK,172.00",
    ].join("\n"),
  },
  {
    broker: "questrade_iq_edge",
    symbol: "AMD",
    csvText: [
      "Symbol,Description,Action,Fill price,Fill qty,Account,Commission,Total Value,Time Placed,Exec time",
      "AMD,ADVANCED MICRO DEVICES,Buy,160.00,40,TEST,1.00,-6401.00,2026-07-24 09:38:00,2026-07-24 09:38:01",
      "AMD,ADVANCED MICRO DEVICES,Sell,162.00,40,TEST,1.00,6479.00,2026-07-24 10:08:00,2026-07-24 10:08:01",
    ].join("\n"),
  },
  {
    broker: "alpaca_trade_activities",
    symbol: "META",
    csvText: [
      "activity_type,cum_qty,id,leaves_qty,price,qty,side,symbol,transaction_time,order_id,type",
      "FILL,10,ALP-1,0,700.00,10,buy,META,2026-07-24T13:39:00Z,ORDER-1,fill",
      "FILL,10,ALP-2,0,702.00,10,sell,META,2026-07-24T14:09:00Z,ORDER-2,fill",
    ].join("\n"),
  },
  {
    broker: "tradezero_historical_fills",
    symbol: "TSLA",
    csvText: [
      "tradeId,accountId,symbol,securityType,side,qty,price,grossProceeds,netProceeds,commission,totalFees,currency,tradeDate,settleDate,entryDate,execTime,canceled,mLegId,spreadType,notes",
      "TZ-1,TEST,TSLA,STOCK,BUY,5,320.00,-1600.00,-1601.00,0.50,0.50,USD,2026-07-24,2026-07-25,2026-07-24,09:40:00,false,,,",
      "TZ-2,TEST,TSLA,STOCK,SELL,5,323.00,1615.00,1614.00,0.50,0.50,USD,2026-07-24,2026-07-25,2026-07-24,10:10:00,false,,,",
    ].join("\n"),
  },
  {
    broker: "tradervue_generic_executions",
    symbol: "AMZN",
    csvText: [
      "Date,Time,Symbol,Quantity,Price,Side,Commission,TransFee,ECNFee",
      "2026-07-24,09:41:00,AMZN,8,230.00,BUY,0.50,0.05,0.02",
      "2026-07-24,10:11:00,AMZN,8,232.00,SELL,0.50,0.05,0.02",
    ].join("\n"),
  },
  {
    broker: "fidelity_account_history",
    symbol: "GOOGL",
    csvText: [
      "Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date",
      "2026-07-24,BUY,GOOGL,ALPHABET INC,STOCK,190.00,12,0.00,0.01,0.00,-2280.01,10000.00,2026-07-25",
      "2026-07-24,SELL,GOOGL,ALPHABET INC,STOCK,192.00,12,0.00,0.01,0.00,2303.99,12303.99,2026-07-25",
    ].join("\n"),
  },
  {
    broker: "tastytrade_transaction_history",
    symbol: "NFLX",
    csvText: [
      "Date,Type,Action,Symbol,Instrument Type,Description,Value,Quantity,Average Price,Commissions,Fees,Multiplier,Root Symbol,Underlying Symbol,Expiration Date,Strike Price,Call or Put,Order #",
      "2026-07-24,Trade,BUY,NFLX,Stock,NETFLIX,-1200.00,1,1200.00,0.00,0.01,1,NFLX,NFLX,,,,TT-1",
      "2026-07-24,Trade,SELL,NFLX,Stock,NETFLIX,1210.00,1,1210.00,0.00,0.01,1,NFLX,NFLX,,,,TT-2",
    ].join("\n"),
  },
  {
    broker: "trading212_history",
    symbol: "PLTR",
    csvText: [
      "Action,Time,ISIN,Ticker,Name,Notes,ID,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Currency (Result),Total,Currency (Total)",
      "BUY,2026-07-24 09:44:00,US69608A1088,PLTR,Palantir,,T212-1,20,150.00,USD,1.00,,USD,-3000.00,USD",
      "SELL,2026-07-24 10:14:00,US69608A1088,PLTR,Palantir,,T212-2,20,152.00,USD,1.00,40.00,USD,3040.00,USD",
    ].join("\n"),
  },
  {
    broker: "swissquote_transaction_history",
    symbol: "IBM",
    csvText: [
      "Date;Order #;Transaction;Symbol;ISIN;Quantity;Unit Price;Costs;Accrued Interest;Net Amount;Balance;Currency",
      "2026-07-24;SQ-1;BUY;IBM;US4592001014;10;280.00;1.00;0.00;-2801.00;10000.00;USD",
      "2026-07-24;SQ-2;SELL;IBM;US4592001014;10;282.00;1.00;0.00;2819.00;12819.00;USD",
    ].join("\n"),
  },
];

describe("importable broker presets", () => {
  it("registers every supported expanded broker format", () => {
    expect(Object.keys(IMPORTABLE_BROKER_PRESETS)).toHaveLength(scenarios.length);
  });

  it.each(scenarios)("simulates a complete $broker round-trip trade", ({ broker, csvText, symbol }) => {
    const result = parseImportableBrokerCsv({
      broker,
      csvText,
      timestampTimezone: "America/New_York",
      optionsHandling: "reject",
    });

    expect(result.brokerLabel).toBe(IMPORTABLE_BROKER_PRESETS[broker].label);
    expect(result.acceptedExecutionCount).toBe(2);
    expect(result.rejectedRowCount).toBe(0);
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]).toMatchObject({
      symbol,
      tradeDirection: "long",
    });
    expect(result.requests[0].executions.map((execution) => execution.side)).toEqual([
      "buy",
      "sell",
    ]);
  });
});
