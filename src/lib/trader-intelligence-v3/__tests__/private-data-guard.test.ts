import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  collectTraderIntelligenceFinalTreeRecords,
  collectTraderIntelligencePrHistoryRecords,
  scanTraderIntelligencePrivateData,
} from "../testing";

const temporaryRepositories: string[] = [];

afterEach(() => {
  for (const path of temporaryRepositories.splice(0)) {
    rmSync(path, { recursive: true, force: true });
  }
});

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
        commit: "synthetic-commit",
      },
    ]);

    expect(findings.length).toBeGreaterThan(0);
    expect(JSON.stringify(findings)).not.toContain(secret);
    expect(findings[0]).toMatchObject({
      path: "config.txt",
      commit: "synthetic-commit",
      sourceKind: "synthetic_test",
    });
  });

  it("accepts only the exact file-specific fixture hash", () => {
    const path =
      "src/docs/trade-execution-import-fixtures/moomoo-trade-history-sample.csv";
    const content = readFileSync(path, "utf8");
    expect(
      scanTraderIntelligencePrivateData([
        { path, content, sourceKind: "synthetic_test" },
      ]),
    ).toEqual([]);
    expect(
      scanTraderIntelligencePrivateData([
        {
          path,
          content: content.replace(/\r\n?/g, "\n"),
          sourceKind: "synthetic_test",
        },
      ]),
    ).toEqual([]);

    const changed = scanTraderIntelligencePrivateData([
      {
        path,
        content: `${content}\nREALX,2026-01-01,Buy,100,1.25`,
        sourceKind: "synthetic_test",
      },
    ]);
    expect(changed).toContainEqual(
      expect.objectContaining({
        code: "ti_v3_synthetic_fixture_hash_mismatch",
        path,
      }),
    );
  });

  it("rejects a broker-shaped CSV copied into an approved fixture directory", () => {
    const path =
      "src/docs/trade-execution-import-fixtures/copied-owner-export.csv";
    const findings = scanTraderIntelligencePrivateData([
      {
        path,
        content:
          "Symbol,Quantity,Price,Time\nREALX,100,1.25,2026-01-01T10:00:00Z",
        sourceKind: "synthetic_test",
      },
    ]);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ti_v3_synthetic_fixture_unapproved" }),
        expect.objectContaining({ code: "ti_v3_real_broker_csv_rows" }),
      ]),
    );
  });

  it("reports oversized sensitive text without loading unbounded content", () => {
    expect(
      scanTraderIntelligencePrivateData([
        {
          path: "artifacts/large-export.csv",
          content: "",
          sourceKind: "synthetic_test",
          scanStatus: "oversized",
        },
      ]),
    ).toContainEqual(
      expect.objectContaining({ code: "ti_v3_private_scan_oversized" }),
    );
  });

  it("scans tracked, staged, and non-ignored untracked local files", () => {
    const repository = mkdtempSync(join(tmpdir(), "ti-v3-final-tree-test-"));
    temporaryRepositories.push(repository);
    const git = (args: readonly string[]) =>
      execFileSync("git", [...args], { cwd: repository, encoding: "utf8" });

    git(["init", "-b", "main"]);
    git(["config", "user.name", "Synthetic Test"]);
    git(["config", "user.email", "synthetic@example.test"]);
    writeFileSync(join(repository, ".gitignore"), "ignored-export.csv\n");
    writeFileSync(join(repository, "tracked.csv"), "safe synthetic file\n");
    git(["add", ".gitignore", "tracked.csv"]);
    git(["commit", "-m", "base"]);

    const brokerRows =
      "Symbol,Quantity,Price,Time\nTEST,10,1.25,2026-01-01T10:00:00Z\n";
    writeFileSync(join(repository, "tracked.csv"), brokerRows);
    writeFileSync(join(repository, "staged.csv"), brokerRows);
    writeFileSync(join(repository, "untracked.csv"), brokerRows);
    writeFileSync(join(repository, "ignored-export.csv"), brokerRows);
    git(["add", "staged.csv"]);

    const records = collectTraderIntelligenceFinalTreeRecords(repository);
    const findings = scanTraderIntelligencePrivateData(records);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "ti_v3_real_broker_csv_rows",
          path: "tracked.csv",
          sourceKind: "worktree",
        }),
        expect.objectContaining({
          code: "ti_v3_real_broker_csv_rows",
          path: "staged.csv",
          sourceKind: "staged",
        }),
        expect.objectContaining({
          code: "ti_v3_real_broker_csv_rows",
          path: "untracked.csv",
          sourceKind: "worktree",
        }),
      ]),
    );
    expect(records.some((record) => record.path === "ignored-export.csv")).toBe(
      false,
    );
  }, 15_000);

  it("finds a private-looking blob committed and deleted later in PR history", () => {
    const repository = mkdtempSync(join(tmpdir(), "ti-v3-history-test-"));
    temporaryRepositories.push(repository);
    const git = (args: readonly string[]) =>
      execFileSync("git", [...args], { cwd: repository, encoding: "utf8" });

    git(["init", "-b", "main"]);
    git(["config", "user.name", "Synthetic Test"]);
    git(["config", "user.email", "synthetic@example.test"]);
    writeFileSync(join(repository, "README.md"), "synthetic base\n");
    git(["add", "README.md"]);
    git(["commit", "-m", "base"]);
    const base = git(["rev-parse", "HEAD"]).trim();
    git(["checkout", "-b", "feature"]);

    const privatePath = join(repository, "owner-export.csv");
    writeFileSync(
      privatePath,
      `Symbol,Quantity,Price,Time,Account\nTEST,10,1.25,2026-01-01T10:00:00Z,${"ZX" + "123456"}\n`,
    );
    git(["add", "owner-export.csv"]);
    git(["commit", "-m", "add synthetic private-looking blob"]);
    const addCommit = git(["rev-parse", "HEAD"]).trim();
    unlinkSync(privatePath);
    git(["add", "-u"]);
    git(["commit", "-m", "delete blob"]);

    const records = collectTraderIntelligencePrHistoryRecords({
      cwd: repository,
      baseRef: base,
      headRef: "HEAD",
    });
    const findings = scanTraderIntelligencePrivateData(records);
    expect(findings).toContainEqual(
      expect.objectContaining({
        code: "ti_v3_real_broker_csv_rows",
        path: "owner-export.csv",
        commit: addCommit,
        sourceKind: "pr_history",
      }),
    );
  }, 15_000);
});
