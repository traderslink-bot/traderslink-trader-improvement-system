import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  listNewsArticlesByTicker,
  resetNewsDatabaseForTests,
  upsertNewsArticle,
} from "../news-article-store";

describe("news article source canonicalization", () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), "traderslink-news-store-"));

  beforeAll(async () => {
    process.env.TRADERSLINK_NEWS_DB_PATH = join(tempDirectory, "news.sqlite");
    delete process.env.NEWS_DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    await resetNewsDatabaseForTests();
  });

  afterAll(async () => {
    await resetNewsDatabaseForTests();
    delete process.env.TRADERSLINK_NEWS_DB_PATH;
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  it("keeps one paid article per source and never lets a market-cap copy remove levels", async () => {
    const sourceUrl = "https://news.nuntiobot.com/article/shared-release";
    const marketCapArticle = await upsertNewsArticle({
      sourceEventId: "market-cap-event",
      ticker: "IQST",
      headline: "Market-cap generated headline",
      sourceUrl,
      routeTag: "market_cap_under_30m",
      metadata: {},
    });

    const paidArticle = await upsertNewsArticle({
      sourceEventId: "spike-event",
      ticker: "IQST",
      headline: "Canonical paid headline",
      sourceUrl,
      routeTag: "spike",
      metadata: {
        supportResistanceLevels: "Support: $1.10\nResistance: $1.40",
      },
    });

    const laterMarketCapCopy = await upsertNewsArticle({
      sourceEventId: "later-market-cap-event",
      ticker: "IQST",
      headline: "A later market-cap rewrite",
      sourceUrl,
      routeTag: "market_cap_under_30m",
      metadata: {},
    });

    expect(paidArticle.id).toBe(marketCapArticle.id);
    expect(paidArticle.slug).toBe(marketCapArticle.slug);
    expect(laterMarketCapCopy.id).toBe(marketCapArticle.id);
    expect(laterMarketCapCopy.headline).toBe("Canonical paid headline");
    expect(laterMarketCapCopy.routeTag).toBe("spike");
    expect(laterMarketCapCopy.metadata.supportResistanceLevels).toBe(
      "Support: $1.10\nResistance: $1.40",
    );

    const articles = await listNewsArticlesByTicker("IQST");
    expect(articles).toHaveLength(1);
  });
});
