import { describe, expect, it } from "vitest";

import { scanTraderIntelligencePrivateData } from "../testing";

describe("Trader Intelligence v3 private-data repository guard", () => {
  it("detects private paths, broker rows, identifiers, screenshots, and credentials", () => {
    const apiKey = "sk-" + "A".repeat(24);
    const accessToken = "ghp_" + "B".repeat(24);
    const findings = scanTraderIntelligencePrivateData([
      {
        path: "private/broker-exports/trade-history.csv",
        content: "Symbol,Quantity,Price,Time\nTEST,10,1.25,2026-01-01T10:00:00Z",
        sourceKind: "synthetic_test",
      },
      {
        path: "docs/account-private-screenshot.png",
        content: "",
        sourceKind: "synthetic_test",
      },
      {
        path: "config/local.txt",
        content: `account number: ${"ABCD" + "123456"}\n${apiKey}\n${accessToken}\n123-45-6789`,
        sourceKind: "synthetic_test",
      },
    ]);
    const codes = findings.map((finding) => finding.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        "ti_v3_private_path",
        "ti_v3_broker_export_filename",
        "ti_v3_real_broker_csv_rows",
        "ti_v3_private_screenshot",
        "ti_v3_account_identifier",
        "ti_v3_personal_financial_identifier",
        "ti_v3_api_key",
        "ti_v3_access_token",
      ]),
    );
  });

  it("does not return suspected secret or account values in findings", () => {
    const secret = "ghp_" + "C".repeat(24);
    const findings = scanTraderIntelligencePrivateData([
      {
        path: "config.txt",
        content: `access_token=${secret}`,
        sourceKind: "synthetic_test",
      },
    ]);

    expect(findings.length).toBeGreaterThan(0);
    expect(JSON.stringify(findings)).not.toContain(secret);
  });

  it("allows narrowly located synthetic fixtures and safe negative content", () => {
    expect(
      scanTraderIntelligencePrivateData([
        {
          path: "src/docs/trade-execution-import-fixtures/moomoo-trade-history-sample.csv",
          content: "Symbol,Quantity,Price,Time\nTEST,10,1.25,2026-01-01T10:00:00Z",
          sourceKind: "synthetic_test",
        },
        {
          path: "src/lib/trader-intelligence-v3/domain/safe.ts",
          content: 'const key = process.env.API_KEY; const accountLabel = "synthetic";',
          sourceKind: "synthetic_test",
        },
      ]),
    ).toEqual([]);
  });
});
