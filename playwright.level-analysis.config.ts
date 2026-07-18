import { join } from "node:path";
import { homedir } from "node:os";
import { defineConfig } from "@playwright/test";

const githubRunId = [process.env.GITHUB_RUN_ID, process.env.GITHUB_RUN_ATTEMPT]
  .filter(Boolean)
  .join("-");
const runId =
  process.env.LEVEL_ANALYSIS_E2E_RUN_ID ??
  (githubRunId.length > 0 ? githubRunId : `${Date.now()}-${process.pid}`);
const safeRunId = runId.replace(/[^A-Za-z0-9_.-]/g, "-") || "local";
const databaseDir = join(
  homedir(),
  ".trader-intelligence-e2e",
  "level-analysis",
  safeRunId,
);
const databasePath =
  process.env.LEVEL_ANALYSIS_E2E_DB_PATH ??
  join(databaseDir, "trade-detail-level-facts.sqlite");

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "artifacts/playwright-results/level-analysis",
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  retries: process.env.CI ? 1 : 0,
  testDir: "./tests/e2e",
  testMatch: /.*level-analysis-trade-detail-seeded-flow\.spec\.ts/,
  timeout: 90_000,
  use: {
    baseURL: "http://127.0.0.1:3101",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        browserName: "chromium",
        viewport: {
          height: 1200,
          width: 1440,
        },
      },
    },
  ],
  workers: 1,
  webServer: {
    command: "npm run start -- --port 3101",
    env: {
      ...process.env,
      LEVEL_ANALYSIS_JOURNAL_DELIVERY_API_ENABLED: "1",
      LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED: "1",
      LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED: "1",
      LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED: "1",
      TRADER_INTELLIGENCE_APPROVED_ORIGINS: "http://127.0.0.1:3101",
      TRADER_INTELLIGENCE_DATA_MODE: "real_owner_data",
      TRADER_INTELLIGENCE_DB_PATH: databasePath,
      TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE: "private_owner_alpha",
      TRADER_INTELLIGENCE_HOSTING_MODE: "local_only",
      TRADER_INTELLIGENCE_OWNER_ID: "synthetic-level-analysis-e2e-owner",
      TRADER_INTELLIGENCE_STORAGE_MODE: "local_sqlite",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:3101/intelligence/import-dry-run",
  },
});
