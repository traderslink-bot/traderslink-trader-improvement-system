import { describe, expect, it } from "vitest";
import {
  applyGenericCsvMappingReview,
  createCsvSavedMappingTemplate,
  inferGenericCsvSchema,
  matchCsvSavedMappingTemplate,
  resolveCsvMappingTimestampTimezone,
} from "../generic-csv-schema-inference";

describe("generic CSV schema inference", () => {
  it("infers a conventional execution ledger without manual mapping", () => {
    const csvText = [
      "Trading Symbol,Executed At,Instruction,Filled Shares,Average Price,Commission Paid,Other Fees",
      "AAPL,2026-07-24 09:35:00,BOT,100,182.10,1.00,0.05",
      "AAPL,2026-07-24 10:05:00,SLD,100,184.25,1.00,0.05",
    ].join("\n");
    const inference = inferGenericCsvSchema(csvText);
    expect(inference.proposedMapping).toMatchObject({
      symbol: "Trading Symbol",
      timestamp: "Executed At",
      side: "Instruction",
      quantity: "Filled Shares",
      price: "Average Price",
      commission: "Commission Paid",
      fees: "Other Fees",
    });
    expect(inference.status).not.toBe("blocked");
  });

  it("requires correction when a required field cannot be identified", () => {
    const inference = inferGenericCsvSchema([
      "Thing,When,Direction,Units,Money",
      "AAPL,2026-07-24 09:35:00,BUY,100,10.00",
      "AAPL,2026-07-24 10:05:00,SELL,100,10.50",
    ].join("\n"));
    expect(inference.status).toBe("blocked");
    expect(inference.conflicts.map((conflict) => conflict.code)).toContain("required_field_unmapped");
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
      sideValueMapping: { "1": "buy", "-1": "sell" },
      timestampTimezone: "America/New_York",
    });
    expect(reviewed.status).not.toBe("blocked");
    expect(reviewed.effectiveMapping.fees).toBeUndefined();
    expect(reviewed.effectiveMapping.commission).toEqual(["Charges"]);
    expect(reviewed.importResult?.acceptedExecutionCount).toBe(2);
    expect(reviewed.importResult?.rejectedRowCount).toBe(0);
    expect(reviewed.importResult?.requests).toHaveLength(1);
  });

  it("blocks an explicit source column collision before parsing", () => {
    const csvText = [
      "Ticker,Executed At,Side,Quantity,Price,Charges",
      "AAPL,2026-07-24 09:35:00,BUY,100,10.00,1.25",
    ].join("\n");
    const reviewed = applyGenericCsvMappingReview({
      csvText,
      corrections: {
        commission: "Charges",
        fees: "Charges",
      },
      timestampTimezone: "America/New_York",
    });
    expect(reviewed.status).toBe("blocked");
    expect(reviewed.conflicts).toContainEqual(
      expect.objectContaining({
        code: "duplicate_destination_field",
        headers: ["Charges"],
      }),
    );
    expect(reviewed.importResult).toBeNull();
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
    expect(match?.template.id).toBe(template.id);
    expect(match?.score).toBe(1);
    expect(match?.columnMapping).toMatchObject({
      symbol: ["Ticker"],
      timestamp: ["Executed At"],
      side: ["Side"],
      quantity: ["Fill Size"],
      price: ["Rate"],
    });
  });

  it("reuses saved mappings across harmless header formatting changes", () => {
    const inference = inferGenericCsvSchema([
      "Trading Symbol,Executed At,Side,Fill Size,Rate",
      "PLTR,2026-07-24 09:35:00,BUY,100,150.00",
    ].join("\n"));
    const template = createCsvSavedMappingTemplate({
      name: "Normalized headers",
      inference,
      effectiveMapping: inference.proposedMapping,
      now: "2026-07-25T12:00:00.000Z",
    });
    const changedHeaders = inferGenericCsvSchema([
      " trading-symbol ,executed_at,SIDE,fill-size,RATE",
      "PLTR,2026-07-25 09:35:00,BUY,50,151.00",
    ].join("\n"));
    const match = matchCsvSavedMappingTemplate(changedHeaders, [template]);
    expect(match?.score).toBe(1);
    expect(match?.columnMapping).toMatchObject({
      symbol: [" trading-symbol "],
      timestamp: ["executed_at"],
      side: ["SIDE"],
      quantity: ["fill-size"],
      price: ["RATE"],
    });
  });

  it("leaves timezone unset when a saved format should inherit account defaults", () => {
    const inference = inferGenericCsvSchema([
      "Ticker,Executed At,Side,Fill Size,Rate",
      "PLTR,2026-07-24 09:35:00,BUY,100,150.00",
    ].join("\n"));
    const template = createCsvSavedMappingTemplate({
      name: "Account inherited timezone",
      inference,
      effectiveMapping: inference.proposedMapping,
      now: "2026-07-25T12:00:00.000Z",
    });
    expect(template.timestampTimezone).toBeUndefined();
  });

  it("persists a deliberate broker-specific timezone override", () => {
    const inference = inferGenericCsvSchema([
      "Ticker,Executed At,Side,Fill Size,Rate",
      "PLTR,2026-07-24 09:35:00,BUY,100,150.00",
    ].join("\n"));
    const template = createCsvSavedMappingTemplate({
      name: "Pacific broker export",
      inference,
      effectiveMapping: inference.proposedMapping,
      timestampTimezone: "America/Los_Angeles",
      now: "2026-07-25T12:00:00.000Z",
    });
    expect(template.timestampTimezone).toBe("America/Los_Angeles");
  });

  it("resolves timestamp timezone authority in the documented order", () => {
    expect(
      resolveCsvMappingTimestampTimezone({
        importOverride: "America/Halifax",
        savedTemplateOverride: "America/Los_Angeles",
        accountImportDefault: "America/Chicago",
        accountTimezone: "America/Toronto",
      }),
    ).toBe("America/Halifax");
    expect(
      resolveCsvMappingTimestampTimezone({
        savedTemplateOverride: "America/Los_Angeles",
        accountImportDefault: "America/Chicago",
        accountTimezone: "America/Toronto",
      }),
    ).toBe("America/Los_Angeles");
    expect(
      resolveCsvMappingTimestampTimezone({
        accountImportDefault: "America/Chicago",
        accountTimezone: "America/Toronto",
      }),
    ).toBe("America/Chicago");
    expect(
      resolveCsvMappingTimestampTimezone({
        accountTimezone: "America/Toronto",
      }),
    ).toBe("America/Toronto");
    expect(resolveCsvMappingTimestampTimezone({})).toBeUndefined();
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
