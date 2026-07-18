import { Buffer } from "node:buffer";
import { expect, test, type Page } from "@playwright/test";
import deliveryFixture from "../../src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json";

const UNSAFE_LEVEL_FACTS_PHRASES = [
  "raw payload",
  "rawpayload",
  "raw payload hash",
  "rawpayloadhash",
  "recommendation",
  "trade advice",
  "buy",
  "sell",
  "hold",
  "coaching",
  "coach",
  "grading",
  "trade grade",
  "p/l",
  "pnl",
  "giveback",
  "behavior score",
  "behavior scoring",
];

async function openDisclosure(page: Page, testId: string, label: string) {
  const details = page.getByTestId(testId);

  if ((await details.count()) === 0) {
    return;
  }

  const trigger = details.getByText(label, { exact: true });
  const isOpen = (await details.getAttribute("open")) !== null;

  if (!isOpen && (await trigger.isVisible())) {
    await trigger.click();
  }
}

async function saveSeedTrade(page: Page): Promise<{ id: string; symbol: string }> {
  const symbol = "DEVS";
  const csv = [
    "Ticker,Executed At,Action,Qty,Fill Price,Status,Commission,Fees,Net Amount",
    `${symbol},06/01/2026 11:55:00 AM,BOT,60,$10.00,Filled,$0.50,$0.02,-600.52`,
    `${symbol},2026-06-01 11:59:00,BOT,40,10.10,Filled,0.50,0.02,-404.52`,
    `${symbol},2026-06-01 12:02:00,SLD,50,10.35,Filled,0.50,0.02,516.98`,
    `${symbol},2026-06-01 12:05:00,SLD,50,10.45,Filled,0.50,0.02,521.98`,
  ].join("\n");

  await page.goto("/intelligence/import-dry-run");
  await page.waitForLoadState("networkidle");
  await openDisclosure(
    page,
    "import-dry-run-advanced-upload-settings",
    "Show advanced import settings",
  );
  await page.getByTestId("local-csv-input").setInputFiles({
    buffer: Buffer.from(csv),
    mimeType: "text/csv",
    name: "level-analysis-seeded-devs.csv",
  });
  const brokerSelect = page.getByTestId("broker-select");
  await brokerSelect.selectOption({ label: "Generic execution CSV" });
  await expect(brokerSelect).toHaveValue("generic_execution_csv");
  await expect(page.getByText("4 accepted").first()).toBeVisible();
  await expect(page.getByTestId("save-import-button")).toBeEnabled();
  await page.getByTestId("save-import-button").click();
  await page.waitForURL(/\/intelligence\/imports\/.+/, { timeout: 30_000 });

  const savedTrades = await (await page.request.get("/api/trades")).json();
  const savedTrade = savedTrades.trades.find(
    (trade: { symbol: string }) => trade.symbol === symbol,
  ) as { id: string; symbol: string } | undefined;

  expect(savedTrade).toBeTruthy();
  return savedTrade!;
}

async function seedAcceptedLevelFactsLink(page: Page, savedTradeId: string) {
  const ingestResponse = await page.request.post("/api/level-analysis/deliveries", {
    data: {
      payload: deliveryFixture,
      createdAt: "2026-06-06T21:00:00.000Z",
    },
    headers: { Origin: "http://127.0.0.1:3101" },
  });
  expect(ingestResponse.status()).toBe(200);
  const ingestBody = await ingestResponse.json();
  expect(ingestBody).toMatchObject({
    status: "accepted",
    compactSummary: {
      provider: "ibkr",
    },
  });

  const linkResponse = await page.request.post("/api/level-analysis/trade-links", {
    data: {
      savedTradeId,
      symbol: "DEVS",
      provider: "ibkr",
      tradeEndedAt: "2026-06-01T16:05:00.000Z",
      createdAt: "2026-06-06T21:05:00.000Z",
    },
    headers: { Origin: "http://127.0.0.1:3101" },
  });
  expect(linkResponse.status()).toBe(200);
  const linkBody = await linkResponse.json();
  expect(linkBody).toMatchObject({
    status: "linked",
    symbol: "DEVS",
    provider: "ibkr",
  });

  const factsResponse = await page.request.get(
    `/api/trades/${encodeURIComponent(savedTradeId)}/level-analysis/facts`,
  );
  expect(factsResponse.status()).toBe(200);
  const factsBody = await factsResponse.json();
  expect(factsBody).toMatchObject({
    availability: {
      availability: "attached",
      sourceKind: "packaged_review_delivery",
      fifteenMinuteContextOnlyStatus: "context_only",
    },
    display: {
      shouldShowFactsPanel: true,
    },
    attachedFacts: {
      symbol: "DEVS",
      densityMetricSummary: {
        classification: "dense_clustered",
      },
      candidateInventoryGapSummary: {
        overall: "no_gap",
      },
      cacheFingerprintSourceIntegrity: {
        mismatchCount: 0,
        prohibitedLanguageHitCount: 0,
      },
    },
  });
}

test.describe("level-analysis trade detail seeded flow", () => {
  test("renders accepted packaged delivery facts on a saved trade detail page", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const savedTrade = await saveSeedTrade(page);
    await seedAcceptedLevelFactsLink(page, savedTrade.id);

    const pageResponse = await page.goto(
      `/intelligence/trades/${encodeURIComponent(savedTrade.id)}`,
    );
    expect(pageResponse?.headers()["cache-control"]).toContain("no-store");
    const varyTokens = (pageResponse?.headers().vary ?? "")
      .split(",")
      .map((token) => token.trim().toLowerCase());
    expect(varyTokens).toContain("cookie");
    expect(varyTokens).toContain("rsc");
    await expect(page.getByTestId("trade-review-page")).toBeVisible();
    await expect(
      page.getByTestId("trade-detail-level-facts-availability"),
    ).toContainText("Level facts attached");

    const supportingDetails = page.getByTestId("trade-supporting-details");
    if ((await supportingDetails.getAttribute("open")) === null) {
      await supportingDetails
        .getByText("More evidence, comparisons, and writing prompts", {
          exact: true,
        })
        .click();
    }

    const panel = page.getByTestId("trade-detail-level-facts-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Level Facts");
    await expect(panel).toContainText("DEVS");
    await expect(panel).toContainText("packaged review delivery");
    await expect(panel).toContainText("dense_clustered");
    await expect(panel).toContainText("no_gap");
    await expect(panel).toContainText("context_only");
    await expect(panel).toContainText("0");

    const panelText = (await panel.innerText()).toLowerCase();
    for (const phrase of UNSAFE_LEVEL_FACTS_PHRASES) {
      expect(panelText, `Unsafe level-facts phrase surfaced: ${phrase}`).not.toContain(
        phrase,
      );
    }
  });
});
