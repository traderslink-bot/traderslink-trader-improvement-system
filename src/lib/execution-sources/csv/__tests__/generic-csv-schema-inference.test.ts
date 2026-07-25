import { describe, expect, it } from "vitest";
import {
  applyGenericCsvMappingReview,
  createCsvSavedMappingTemplate,
  inferGenericCsvSchema,
  matchCsvSavedMappingTemplate,
} from "../generic-csv-schema-inference";

describe("generic CSV schema inference", () => {
  it("infers a conventional execution ledger without manual mapping", () => {
    const csvText = [
      "Trading Symbol,Executed At,Instruction,Filled Shares,Average Fill,Commission Paid,Other Fees",
      "AAPL,2026-07-24 09:35:00,BOT,100,182.10,1.00,0.05",
      "AAPL,2026-07-24 10:05:00,SLD,100,184.25,1.00,0.05",
    ].join("\n");

    const inference = inferGenericCsvSchema(csvText);

    expect(inference.proposedMapping).toMatchObject({
      symbol: ["Trading Symbol"],
      timestamp: ["Executed At"],
      side: ["Instruction"],
      quantity: ["Filled Shares"],
      price: ["Average Fill"],
      commission: ["Commission Paid"],
      fees: ["Other Fees"],
    });
    expect(inference.status).not.toBe("blocked");
    expect(inference.valueMappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceValue: "BOT", normalizedValue: "buy" }),
        expect.objectContaining({ sourceValue: "SLD", normalizedValue: "sell" }),
      ]),
    );
  });

  it("requires correction when a required field cannot be identified", () => {
    const inference = inferGenericCsvSchema([
      "Thing,When,Direction,Units,Money",
      "AAPL,2026-07-24 09:35:00,BUY,100,10.00",
      "AAPL,2026-07-24 10:05:00,SELL,100,10.50",
    ].join("\n"));

    expect(inference.status).toBe("blocked");
    expect(inference.conflicts.map((conflict) => conflict.code)).toContain(
      "required_field_unmapped",
    );
  });

  it("applies user corrections and runs the hardened deterministic parser", () => {
    const csvText = [
      "Thing,When,Direction,Units,Money,Charges",
      "AAPL,2026-07-24 09:35:00,1,100,10.00,1.25",
      "AAPL,2026-07-24 10:05:00,-1,100,10.50,1.25",
    ].join("\n");

    const reviewed = applyGenericCsvMappingReview({
      csvText,
      corrections: {
        symbol: "Thing",
        timestamp: "When",
        side: "Direction",
        quantity: "Units",
        price: "Money",
        commission: "Charges",
      },
      sideValueMapping: {
        "1": "buy",
        "-1": "sell",
      },
      timestampTimezone: "America/New_York",
    });

    expect(reviewed.status).not.toBe("blocked");
    expect(reviewed.importResult?.acceptedExecutionCount).toBe(2);
    expect(reviewed.importResult?.rejectedRowCount).toBe(0);
    expect(reviewed.importResult?.requests).toHaveLength(1);
    expect(reviewed.importResult?.requests[0]).toMatchObject({
      symbol: "AAPL",
      tradeDirection: "long",
    });
    expect(reviewed.importResult?.executions).toMatchObject([
      { side: "buy", shares: 100, price: 10, commission: 1.25 },
      { side: "sell", shares: 100, price: 10.5, commission: 1.25 },
    ]);
  });

  it("allows uncertain optional columns to be ignored", () => {
    const csvText = [
      "Ticker,Date,Time,Action,Quantity,Price,Amount",
      "MSFT,2026-07-24,09:35:00,BUY,10,510.00,-5101.00",
      "MSFT,2026-07-24,10:05:00,SELL,10,512.00,5119.00",
    ].join("\n");
    const inference = inferGenericCsvSchema(csvText);
    const reviewed = applyGenericCsvMappingReview({
      csvText,
      inference,
      ignoredHeaders: ["Amount"],
      timestampTimezone: "America/New_York",
    });

    expect(reviewed.effectiveMapping.netAmount).toBeUndefined();
    expect(reviewed.importResult?.acceptedExecutionCount).toBe(2);
  });

  it("detects semicolon-delimited exports and report preambles", () => {
    const inference = inferGenericCsvSchema([
      "Broker report generated 2026-07-25",
      "Account;TEST",
      "Date;Time;Ticker;Action;Shares;Unit Price;Costs;Currency",
      "2026-07-24;09:35:00;IBM;BUY;10;280.00;1.00;USD",
      "2026-07-24;10:05:00;IBM;SELL;10;282.00;1.00;USD",
    ].join("\n"));

    expect(inference.delimiter).toBe(";");
    expect(inference.headerRowIndex).toBe(2);
    expect(inference.proposedMapping).toMatchObject({
      date: ["Date"],
      time: ["Time"],
      symbol: ["Ticker"],
      side: ["Action"],
      quantity: ["Shares"],
      price: ["Unit Price"],
      fees: ["Costs"],
      currency: ["Currency"],
    });
  });

  it("creates and matches a reusable mapping template", () => {
    const csvText = [
      "Ticker,Executed At,Side,Fill Size,Rate",
      "PLTR,2026-07-24 09:35:00,BUY,100,150.00",
      "PLTR,2026-07-24 10:05:00,SELL,100,152.00",
    ].join("\n");
    const inference = inferGenericCsvSchema(csvText);
    const template = createCsvSavedMappingTemplate({
      name: "My broker executions",
      inference,
      effectiveMapping: inference.proposedMapping,
      timestampTimezone: "America/New_York",
      now: "2026-07-25T12:00:00.000Z",
    });
    const reorderedInference = inferGenericCsvSchema([
      "Executed At,Ticker,Side,Fill Size,Rate",
      "2026-07-25 09:35:00,PLTR,BUY,50,151.00",
      "2026-07-25 10:05:00,PLTR,SELL,50,153.00",
    ].join("\n"));
    const match = matchCsvSavedMappingTemplate(reorderedInference, [template]);

    expect(template.id).toMatch(/^csv-map-[a-f0-9]{8}$/u);
    expect(template.createdAt).toBe("2026-07-25T12:00:00.000Z");
    expect(match?.template.id).toBe(template.id);
    expect(match?.score).toBe(1);
  });

  it("does not match an unrelated template", () => {
    const first = inferGenericCsvSchema([
      "Ticker,Executed At,Side,Fill Size,Rate",
      "PLTR,2026-07-24 09:35:00,BUY,100,150.00",
    ].join("\n"));
    const template = createCsvSavedMappingTemplate({
      name: "First format",
      inference: first,
      effectiveMapping: first.proposedMapping,
      now: "2026-07-25T12:00:00.000Z",
    });
    const unrelated = inferGenericCsvSchema([
      "Security Code,Trade Day,Trade Clock,Instruction,Executed Quantity,Execution Price,Fee,Currency",
      "AAPL,2026-07-24,09:35:00,BUY,10,200.00,1.00,USD",
    ].join("\n"));

    expect(matchCsvSavedMappingTemplate(unrelated, [template])).toBeNull();
  });
});
