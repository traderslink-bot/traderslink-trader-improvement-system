import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getTraderIntelligenceDatabase,
  resetTraderIntelligenceDatabaseForTests,
} from "../../trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { resolveTraderIntelligenceLocalPersistence } from "../deployment";

let durableRoot = "";
let originalEnvironment: Record<string, string | undefined>;

beforeEach(() => {
  durableRoot = mkdtempSync(join(homedir(), ".ti-v3-persistence-test-"));
  originalEnvironment = {
    TRADER_INTELLIGENCE_DATA_MODE: process.env.TRADER_INTELLIGENCE_DATA_MODE,
    TRADER_INTELLIGENCE_DB_PATH: process.env.TRADER_INTELLIGENCE_DB_PATH,
    TRADER_INTELLIGENCE_PRIVATE_DATA_ROOT:
      process.env.TRADER_INTELLIGENCE_PRIVATE_DATA_ROOT,
  };
  resetTraderIntelligenceDatabaseForTests();
});

afterEach(() => {
  resetTraderIntelligenceDatabaseForTests();
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  rmSync(durableRoot, { recursive: true, force: true });
});

function resolveReal(path: string | undefined, extra = {}) {
  return resolveTraderIntelligenceLocalPersistence({
    environment: {
      TRADER_INTELLIGENCE_DB_PATH: path,
      ...extra,
    },
    dataMode: "real_owner_data",
  });
}

describe("Trader Intelligence local persistence path boundary", () => {
  it("uses isolated in-memory persistence for sample mode", () => {
    expect(
      resolveTraderIntelligenceLocalPersistence({
        environment: {},
        dataMode: "sample_data",
      }),
    ).toEqual({ ok: true, kind: "in_memory", databaseTarget: ":memory:" });
  });

  it("does not allow sample mode to select an existing owner database", () => {
    expect(
      resolveTraderIntelligenceLocalPersistence({
        environment: {
          TRADER_INTELLIGENCE_DB_PATH: join(durableRoot, "owner.sqlite"),
        },
        dataMode: "sample_data",
      }),
    ).toEqual({
      ok: false,
      code: "ti_v3_sample_data_db_path_forbidden",
    });
  });

  it("cannot reuse an already-open owner database after switching to sample mode", () => {
    process.env.TRADER_INTELLIGENCE_DATA_MODE = "real_owner_data";
    process.env.TRADER_INTELLIGENCE_DB_PATH = join(durableRoot, "owner.sqlite");
    const ownerDatabase = getTraderIntelligenceDatabase();
    ownerDatabase.exec("CREATE TABLE owner_only_probe (value TEXT NOT NULL)");

    process.env.TRADER_INTELLIGENCE_DATA_MODE = "sample_data";
    delete process.env.TRADER_INTELLIGENCE_DB_PATH;
    const sampleDatabase = getTraderIntelligenceDatabase();
    expect(() =>
      sampleDatabase.prepare("SELECT value FROM owner_only_probe").all(),
    ).toThrow();
  });

  it("accepts an explicit durable absolute path in development and optimized local runs", () => {
    const databasePath = join(durableRoot, "owner.sqlite");
    expect(resolveReal(databasePath)).toMatchObject({
      ok: true,
      kind: "file",
      databaseTarget: databasePath,
    });
  });

  it("allows a relative path only under an explicit absolute private-data root", () => {
    expect(
      resolveReal("journal/owner.sqlite", {
        TRADER_INTELLIGENCE_PRIVATE_DATA_ROOT: durableRoot,
      }),
    ).toMatchObject({
      ok: true,
      kind: "file",
      databaseTarget: join(durableRoot, "journal", "owner.sqlite"),
    });
  });

  it.each([
    [undefined, "ti_v3_db_path_missing"],
    ["", "ti_v3_db_path_empty"],
    ["relative.sqlite", "ti_v3_db_path_relative_ambiguous"],
  ])("rejects unsafe real-data path %s", (path, code) => {
    expect(resolveReal(path)).toEqual({ ok: false, code });
  });

  it("rejects the operating-system temporary directory", () => {
    expect(resolveReal(join(tmpdir(), "owner.sqlite"))).toEqual({
      ok: false,
      code: "ti_v3_db_path_temp_forbidden",
    });
  });

  it("rejects tracked or ignored paths anywhere under the repository", () => {
    expect(resolveReal(resolve("data", "owner.sqlite"))).toEqual({
      ok: false,
      code: "ti_v3_db_path_repository_forbidden",
    });
    expect(resolveReal(resolve(".private", "owner.sqlite"))).toEqual({
      ok: false,
      code: "ti_v3_db_path_repository_forbidden",
    });
  });

  it("persists the same real database across repository instance resets", () => {
    const databasePath = join(durableRoot, "restart", "owner.sqlite");
    process.env.TRADER_INTELLIGENCE_DATA_MODE = "real_owner_data";
    process.env.TRADER_INTELLIGENCE_DB_PATH = databasePath;

    const first = getTraderIntelligenceDatabase();
    first.exec("CREATE TABLE restart_probe (value TEXT NOT NULL)");
    first.prepare("INSERT INTO restart_probe (value) VALUES (?)").run("persisted");
    resetTraderIntelligenceDatabaseForTests();

    const second = getTraderIntelligenceDatabase();
    expect(
      second.prepare("SELECT value FROM restart_probe").get(),
    ).toEqual({ value: "persisted" });
  });

  it(
    "persists the same real database across separate optimized Node processes",
    () => {
      const databasePath = join(
        durableRoot,
        "process-restart",
        "owner.sqlite",
      );
      const moduleUrl = pathToFileURL(
        resolve(
          "src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository.ts",
        ),
      ).href;
      const childSource = `
      const imported = await import(process.env.TI_REPOSITORY_MODULE_URL);
      const repository = imported.default ?? imported;
      const database = repository.getTraderIntelligenceDatabase();
      if (process.env.TI_PROCESS_PHASE === "write") {
        database.exec("CREATE TABLE process_restart_probe (value TEXT NOT NULL)");
        database.prepare("INSERT INTO process_restart_probe (value) VALUES (?)").run("persisted");
      } else {
        const row = database.prepare("SELECT value FROM process_restart_probe").get();
        if (row?.value !== "persisted") {
          throw new Error("ti_v3_process_restart_persistence_failed");
        }
      }
      repository.resetTraderIntelligenceDatabaseForTests();
    `;
      const runProcess = (phase: "write" | "read") =>
        spawnSync(
          process.execPath,
          ["--import", "tsx", "--input-type=module", "--eval", childSource],
          {
            cwd: process.cwd(),
            encoding: "utf8",
            env: {
              ...process.env,
              NODE_ENV: "production",
              TI_PROCESS_PHASE: phase,
              TI_REPOSITORY_MODULE_URL: moduleUrl,
              TRADER_INTELLIGENCE_DATA_MODE: "real_owner_data",
              TRADER_INTELLIGENCE_DB_PATH: databasePath,
            },
          },
        );

      const writeProcess = runProcess("write");
      expect(writeProcess.status, writeProcess.stderr).toBe(0);
      const readProcess = runProcess("read");
      expect(readProcess.status, readProcess.stderr).toBe(0);
    },
    15_000,
  );

  it("rejects an unsafe path before creating its parent directory", () => {
    const unsafeParent = resolve(".ti-v3-unsafe-parent");
    rmSync(unsafeParent, { recursive: true, force: true });
    process.env.TRADER_INTELLIGENCE_DATA_MODE = "real_owner_data";
    process.env.TRADER_INTELLIGENCE_DB_PATH = join(unsafeParent, "owner.sqlite");

    expect(() => getTraderIntelligenceDatabase()).toThrow(
      "ti_v3_db_path_repository_forbidden",
    );
    expect(existsSync(unsafeParent)).toBe(false);
  });

  it("never reuses an open sample database when real mode lacks a path", () => {
    process.env.TRADER_INTELLIGENCE_DATA_MODE = "sample_data";
    delete process.env.TRADER_INTELLIGENCE_DB_PATH;
    const sampleDatabase = getTraderIntelligenceDatabase();
    sampleDatabase.exec("CREATE TABLE sample_only_probe (value TEXT NOT NULL)");

    process.env.TRADER_INTELLIGENCE_DATA_MODE = "real_owner_data";
    expect(() => getTraderIntelligenceDatabase()).toThrow(
      "ti_v3_db_path_missing",
    );
  });
});
