import { afterEach, describe, expect, it } from "vitest";

import {
  applyPatch,
  LiveWatchlistStore,
  normalizeLiveWatchlistTimestamp,
  resetLiveWatchlistStoreForTests,
} from "../live-watchlist-store";
import type { LiveWatchlistCardPatch, LiveWatchlistExtendedQuote } from "../live-watchlist-types";

const exampleLevelMap = {
  currentPrice: 1.18,
  rangeState: "tight" as const,
  nearestSupport: {
    side: "support" as const,
    price: 1.1,
    distancePct: -0.0678,
    strengthLabel: "moderate" as const,
    sourceLabel: "intraday",
    label: "1.10 (-6.8%, moderate, intraday)",
  },
  nearestResistance: {
    side: "resistance" as const,
    price: 1.25,
    distancePct: 0.0593,
    strengthLabel: "moderate" as const,
    sourceLabel: "intraday",
    label: "1.25 (+5.9%, moderate, intraday)",
  },
  nextStrongSupport: null,
  nextStrongResistance: null,
  supportLevels: [
    {
      side: "support" as const,
      price: 1.1,
      distancePct: -0.0678,
      strengthLabel: "moderate" as const,
      sourceLabel: "intraday",
      marketDataProvenance: {
        formedAt: 1_780_000_000_000,
        sourceLastSeenAt: 1_780_000_000_000,
        lastTestedAt: 1_780_000_300_000,
        lastConfirmedAt: 1_780_000_300_000,
      },
      label: "1.10 (-6.8%, moderate, intraday)",
    },
  ],
  resistanceLevels: [
    {
      side: "resistance" as const,
      price: 1.25,
      distancePct: 0.0593,
      strengthLabel: "moderate" as const,
      sourceLabel: "intraday",
      label: "1.25 (+5.9%, moderate, intraday)",
    },
  ],
};

const exampleExtendedQuote: LiveWatchlistExtendedQuote = {
  source: "eodhd_live_v2",
  symbol: "ABCD",
  providerSymbol: "ABCD.US",
  updatedAt: 3000,
  fetchedAt: 3010,
  name: "Example Corp",
  exchange: "XNAS",
  currency: "USD",
  open: 1.1,
  high: 1.25,
  low: 1.05,
  lastTradePrice: 1.18,
  lastTradeSize: 100,
  lastTradeTime: 3000,
  bidPrice: 1.17,
  bidSize: 4,
  bidTime: 3001,
  askPrice: 1.19,
  askSize: 5,
  askTime: 3002,
  volume: 123_456,
  change: 0.08,
  changePercent: 7.27,
  previousClosePrice: 1.1,
  ethPrice: null,
  ethVolume: null,
  ethTime: null,
  marketCap: 50_000_000,
  sharesOutstanding: 20_000_000,
  sharesFloat: 12_000_000,
  timestamp: 3000,
};

function buildCorePatch(symbol: string, updatedAt: number): LiveWatchlistCardPatch {
  return {
    symbol,
    status: "live",
    updatedAt,
    levelMap: exampleLevelMap,
    cards: {
      levelMap: {
        title: "Level Map",
        body: "Resistance:\n1.25\n\nSupport:\n1.10",
        updatedAt,
        priceWhenPosted: 1.18,
        source: "level_snapshot",
      },
      nearestSupportResistance: {
        title: "Closest Levels to Watch",
        body: "Closest levels to watch:\nResistance:\n1.25\n\nSupport:\n1.10",
        updatedAt,
        priceWhenPosted: 1.18,
        source: "level_snapshot",
          metadata: {
            nearestSupport: 1.1,
            nearestResistance: 1.25,
            nearestSupportLabel: "1.10 (-6.8%, moderate, intraday)",
            nearestResistanceLabel: "1.25 (+5.9%, moderate, intraday)",
          },
      },
      liveTraderRead: {
        title: "Live Trader Read",
        body: "Trade map:\nCurrent structure: ABCD is holding a range.",
        updatedAt,
        priceWhenPosted: 1.18,
        source: "live_alert",
      },
      companyInfo: {
        title: "Example Corp",
        body: "Country: United States\nMarket cap: 12M",
        updatedAt,
        priceWhenPosted: 1.18,
        source: "stock_context",
        metadata: { company: "Example Corp" },
      },
      fullLadder: {
        title: "Full Ladder",
        body: "Resistance:\n1.25\n\nSupport:\n1.10",
        updatedAt,
        priceWhenPosted: 1.18,
        source: "level_snapshot",
      },
    },
  };
}

describe("LiveWatchlistStore", () => {
  const originalStorage = process.env.LIVE_WATCHLIST_STORAGE;
  const originalPath = process.env.LIVE_WATCHLIST_DB_PATH;

  afterEach(() => {
    process.env.LIVE_WATCHLIST_STORAGE = originalStorage;
    process.env.LIVE_WATCHLIST_DB_PATH = originalPath;
    resetLiveWatchlistStoreForTests();
  });

  it("normalizes Neon bigint timestamp strings for archive rows", () => {
    expect(normalizeLiveWatchlistTimestamp("1782069488260")).toBe(1782069488260);
    expect(normalizeLiveWatchlistTimestamp(1782069488260)).toBe(1782069488260);
    expect(normalizeLiveWatchlistTimestamp(BigInt(1782069488260))).toBe(1782069488260);
    expect(normalizeLiveWatchlistTimestamp("not-a-timestamp")).toBeNull();
  });

  it("replaces only the card section included in a patch", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        companyInfo: {
          title: "Example Corp",
          body: "Company: Example Corp",
          updatedAt: 1000,
          priceWhenPosted: 1.2,
          source: "stock_context",
          metadata: { company: "Example Corp" },
        },
      },
    });

    const updated = await store.upsertPatch({
      symbol: "ABCD",
      updatedAt: 2000,
      cards: {
        liveTraderRead: {
          title: "ABCD testing support",
          body: "Price is testing support.",
          updatedAt: 2000,
          priceWhenPosted: 1.1,
          source: "live_alert",
        },
      },
    });

    expect(updated.cards.companyInfo?.title).toBe("Example Corp");
    expect(updated.cards.liveTraderRead?.title).toBe("ABCD testing support");
    expect(updated.companyName).toBe("Example Corp");
    expect(updated.latestPrice).toBe(1.1);
    expect(updated.firstPostedAt).toBe(1000);
  });

  it("stores global market data health without changing ticker cards", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "ABCD testing support",
          body: "Price is testing support.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "live_alert",
        },
      },
    });

    await store.upsertHealth({
      type: "health",
      marketDataStatus: "live",
      marketDataUpdatedAt: 3000,
    });

    const state = await store.listSymbols();
    expect(state.marketDataStatus).toBe("live");
    expect(state.marketDataUpdatedAt).toBe(3000);
    expect(state.symbols[0]?.cards.liveTraderRead?.title).toBe("ABCD testing support");
  });

  it("stores recent news and SEC filings cards independently", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        recentNewsFilings: {
          title: "Known Recent News / SEC Filings",
          body: JSON.stringify({
            articles: [
              {
                title: "Example Corp files an 8-K",
                url: "https://traderslink.pro/news/example-corp-files-8-k",
                publishedAt: "2026-06-19T14:00:00.000Z",
                filingType: "8-K",
              },
            ],
          }),
          updatedAt: 1000,
          priceWhenPosted: null,
          source: "website_article_lookup",
          metadata: { articleCount: 1, businessDays: 5 },
        },
      },
    });

    const stored = await store.getSymbol("ABCD");
    expect(stored?.cards.recentNewsFilings?.title).toBe("Known Recent News / SEC Filings");
    expect(stored?.cards.recentNewsFilings?.metadata?.articleCount).toBe(1);
    expect(stored?.latestTraderReadHeadline).toBeNull();
  });

  it("stores technical context cards independently", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "ABCD trader read",
          body: "Trade map:\nCurrent structure: ABCD is holding support.",
          updatedAt: 1000,
          priceWhenPosted: 2,
          source: "level_snapshot",
        },
      },
    });

    const updated = await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 2000,
      cards: {
        technicalContext: {
          title: "Technical Context",
          body: [
            "EMA read: bullish short-term posture.",
            "VWAP read: bullish intraday posture.",
            "Pullback refs below: VWAP 1.90 (7.3% below).",
          ].join("\n"),
          updatedAt: 2000,
          priceWhenPosted: 2.05,
          source: "levels_system_intraday",
          metadata: {
            aboveVwap: true,
            aboveEma9: true,
            aboveEma20: true,
          },
        },
      },
    });

    expect(updated.cards.technicalContext?.title).toBe("Technical Context");
    expect(updated.cards.technicalContext?.body).toContain("Pullback refs below");
    expect(updated.cards.liveTraderRead?.title).toBe("ABCD trader read");
    expect(updated.latestTraderReadHeadline).toBe("ABCD trader read");
    expect(updated.latestPrice).toBe(2);
  });

  it("updates live ticker data without replacing card content", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "ABCD testing support",
          body: "Price is testing support.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "live_alert",
        },
        nearestSupportResistance: {
          title: "Nearest support and resistance",
          body: "Price: 1.10\nNearest support: 1.00\nNearest resistance: 1.20",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "level_snapshot",
          metadata: {
            nearestSupport: 1,
            nearestResistance: 1.2,
          },
        },
      },
    });

    const updated = await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 3000,
      latestPrice: 1.18,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
      volume: 123_456,
    });

    expect(updated.latestPrice).toBe(1.18);
    expect(updated.volume).toBe(123_456);
    expect(updated.nearestSupport).toBe(1.1);
    expect(updated.nearestResistance).toBe(1.25);
    expect(updated.nearestSupportLabel).toBeNull();
    expect(updated.nearestResistanceLabel).toBeNull();
    expect(updated.levelMap).toBeNull();
    expect(updated.updatedAt).toBe(3000);
    expect(updated.latestTraderReadHeadline).toBe("ABCD testing support");
    expect(updated.cards.liveTraderRead?.body).toBe("Price is testing support.");

    const preserved = await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 4000,
      latestPrice: 1.19,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
    });
    expect(preserved.volume).toBe(123_456);
  });

  it("does not let a historical AI Read price replace a newer live quote during card updates", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "BIYA",
      status: "live",
      updatedAt: 1000,
      cards: {
        tradersLinkAiRead: {
          title: "TradersLink AI Read",
          body: "Premarket plan",
          updatedAt: 1000,
          priceWhenPosted: 3.95,
          source: "openai",
        },
      },
    });
    await store.upsertTickerData({
      type: "tickerData",
      symbol: "BIYA",
      status: "live",
      updatedAt: 2000,
      latestPrice: 4.42,
      nearestSupport: 4.2,
      nearestResistance: 4.5,
    });

    const updated = await store.upsertPatch({
      symbol: "BIYA",
      status: "live",
      updatedAt: 3000,
      cards: {
        liveTraderRead: {
          title: "BIYA holding above breakout",
          body: "Live structure update",
          updatedAt: 3000,
          priceWhenPosted: 4.4,
          source: "levels_system_intraday",
        },
      },
    });

    expect(updated.latestPrice).toBe(4.42);
    expect(updated.cards.tradersLinkAiRead?.priceWhenPosted).toBe(3.95);
    expect(updated.cards.liveTraderRead?.priceWhenPosted).toBe(4.4);
  });

  it("migrates a legacy card fallback instead of locking it as a ticker quote", () => {
    const updated = applyPatch({
      symbol: "BIYA",
      status: "live",
      updatedAt: 1000,
      firstPostedAt: 1000,
      companyName: null,
      latestPrice: 3.95,
      nearestSupport: null,
      nearestResistance: null,
      latestTraderReadHeadline: null,
      cards: {
        tradersLinkAiRead: {
          title: "TradersLink AI Read",
          body: "Premarket plan",
          updatedAt: 1000,
          priceWhenPosted: 3.95,
          source: "openai",
        },
      },
    }, {
      symbol: "BIYA",
      status: "live",
      updatedAt: 2000,
      cards: {
        nearestSupportResistance: {
          title: "Potential Path Levels",
          body: "Live level map",
          updatedAt: 2000,
          priceWhenPosted: 4.29,
          source: "level_snapshot",
        },
      },
    });

    expect(updated.latestPrice).toBe(4.29);
    expect(updated.latestPriceSource).toBe("card");
  });

  it("stores nearest support and resistance display labels for the index", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        nearestSupportResistance: {
          title: "Closest Levels to Watch",
          body: "Closest levels to watch",
          updatedAt: 1000,
          priceWhenPosted: 1.18,
          source: "level_snapshot",
          metadata: {
            nearestSupport: 1.1,
            nearestResistance: 1.25,
            nearestSupportLabel: "1.10 (-6.8%, moderate, intraday)",
            nearestResistanceLabel: "1.25 (+5.9%, moderate, intraday)",
          },
        },
      },
    });

    let state = await store.listSymbols();
    expect(state.symbols[0]?.nearestSupportLabel).toBe("1.10 (-6.8%, moderate, intraday)");
    expect(state.symbols[0]?.nearestResistanceLabel).toBe("1.25 (+5.9%, moderate, intraday)");

    await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 2000,
      latestPrice: 1.2,
      nearestSupport: 1.15,
      nearestResistance: 1.3,
      nearestSupportLabel: "1.15 (-4.2%, strong, intraday)",
      nearestResistanceLabel: "1.30 (+8.3%, moderate, 4h structure)",
      levelMap: {
        ...exampleLevelMap,
        currentPrice: 1.2,
        rangeState: "normal",
      },
    });

    state = await store.listSymbols();
    expect(state.symbols[0]?.nearestSupport).toBe(1.15);
    expect(state.symbols[0]?.nearestResistance).toBe(1.3);
    expect(state.symbols[0]?.nearestSupportLabel).toBe("1.15 (-4.2%, strong, intraday)");
    expect(state.symbols[0]?.nearestResistanceLabel).toBe("1.30 (+8.3%, moderate, 4h structure)");
    expect(state.symbols[0]?.levelMap?.currentPrice).toBe(1.2);
    expect(state.symbols[0]?.levelMap?.rangeState).toBe("normal");
  });

  it("stores local extended quote data from ticker updates", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 3000,
      latestPrice: 1.18,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
      extendedQuote: exampleExtendedQuote,
    });

    let state = await store.listSymbols();
    expect(state.symbols[0]?.extendedQuote?.source).toBe("eodhd_live_v2");
    expect(state.symbols[0]?.extendedQuote?.bidPrice).toBe(1.17);
    expect(state.symbols[0]?.extendedQuote?.askPrice).toBe(1.19);

    await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 4000,
      latestPrice: 1.2,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
    });

    state = await store.listSymbols();
    expect(state.symbols[0]?.latestPrice).toBe(1.2);
    expect(state.symbols[0]?.extendedQuote?.providerSymbol).toBe("ABCD.US");
  });

  it("stores level map patches and keeps existing cards visible", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const updated = await store.upsertPatch(buildCorePatch("ABCD", 1000));

    expect(updated.levelMap?.rangeState).toBe("tight");
    expect(updated.cards.levelMap?.title).toBe("Level Map");
    expect(updated.cards.nearestSupportResistance?.title).toBe("Closest Levels to Watch");
    expect(updated.cards.liveTraderRead?.title).toBe("Live Trader Read");
    expect(updated.cards.fullLadder?.title).toBe("Full Ladder");
  });

  it("clears legacy level map cards from newer closest-level patches", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch(buildCorePatch("ABCD", 1000));

    const updated = await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 2000,
      levelMap: {
        ...exampleLevelMap,
        currentPrice: 1.2,
      },
      cards: {
        levelMap: null,
        nearestSupportResistance: {
          title: "Closest Levels to Watch",
          body: "Resistance:\n1.25\n\nSupport:\n1.10",
          updatedAt: 2000,
          priceWhenPosted: 1.2,
          source: "level_snapshot",
          metadata: {
            nearestSupport: 1.1,
            nearestResistance: 1.25,
            nearestSupportLabel: "1.10 (-6.8%, moderate, intraday)",
            nearestResistanceLabel: "1.25 (+5.9%, moderate, intraday)",
          },
        },
      },
    });

    expect(updated.cards.levelMap).toBeUndefined();
    expect(updated.cards.nearestSupportResistance?.title).toBe("Closest Levels to Watch");
    expect(updated.nearestSupport).toBe(1.1);
    expect(updated.nearestResistance).toBe(1.25);
    expect(updated.nearestSupportLabel).toBe("1.10 (-6.8%, moderate, intraday)");
    expect(updated.nearestResistanceLabel).toBe("1.25 (+5.9%, moderate, intraday)");
  });

  it("derives nearest level display labels from older closest-level card bodies", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "CAST",
      status: "live",
      updatedAt: 1000,
      cards: {
        nearestSupportResistance: {
          title: "Closest Levels to Watch",
          body: [
            "Resistance:",
            "7.45 (+2.8%, moderate, intraday)",
            "7.58 (+4.6%, moderate, 4h structure)",
            "",
            "Support:",
            "7.15 (-1.4%, moderate, intraday)",
            "4.70 (-35.2%, moderate, daily structure)",
          ].join("\n"),
          updatedAt: 1000,
          priceWhenPosted: 7.25,
          source: "level_snapshot",
          metadata: {
            nearestSupport: 7.15,
            nearestResistance: 7.45,
          },
        },
      },
    });

    const state = await store.listSymbols();
    expect(state.symbols[0]?.nearestSupportLabel).toBe("7.15 (-1.4%, moderate, intraday)");
    expect(state.symbols[0]?.nearestResistanceLabel).toBe("7.45 (+2.8%, moderate, intraday)");
  });

  it("derives an index headline from generic live trader read cards", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const updated = await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "Live Trader Read",
          body: [
            "Trade map:",
            "Current structure: ABCD is range-bound between support and resistance.",
            "Useful resistance: buyers need acceptance above resistance.",
          ].join("\n"),
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "level_snapshot",
        },
      },
    });

    expect(updated.latestTraderReadHeadline).toBe(
      "Current structure: ABCD is range-bound between support and resistance.",
    );
  });

  it("prefers explicit live trader read headline metadata", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const updated = await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "Live Trader Read",
          body: "Current structure: fallback headline.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "level_snapshot",
          metadata: {
            headline: "ABCD is holding the key support area.",
          },
        },
      },
    });

    expect(updated.latestTraderReadHeadline).toBe(
      "ABCD is holding the key support area.",
    );
  });

  it("does not treat ticker data as the first posted content time", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const dataOnly = await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      latestPrice: 1.18,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
    });
    expect(dataOnly.firstPostedAt).toBeNull();

    const withContent = await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 2000,
      cards: {
        liveTraderRead: {
          title: "ABCD first read",
          body: "First published trader read.",
          updatedAt: 2000,
          priceWhenPosted: 1.2,
          source: "live_alert",
        },
      },
    });

    expect(withContent.firstPostedAt).toBe(2000);
    expect(withContent.updatedAt).toBe(2000);
  });

  it("tracks the best observed live move from the posted price through pullbacks", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const posted = await store.upsertPatch({
      symbol: "GAIN",
      status: "live",
      updatedAt: 1000,
      firstPostedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "Live Trader Read",
          body: "First published read.",
          updatedAt: 1000,
          priceWhenPosted: 1,
          source: "live_alert",
        },
      },
    });
    expect(posted.potentialGain).toMatchObject({
      postedAt: 1000,
      startingPrice: 1,
      highPrice: 1,
      potentialGainPct: 0,
    });

    const firstHigh = await store.upsertTickerData({
      type: "tickerData",
      symbol: "GAIN",
      updatedAt: 2000,
      latestPrice: 1.4,
      nearestSupport: null,
      nearestResistance: null,
    });
    expect(firstHigh.potentialGain).toMatchObject({
      highPrice: 1.4,
      highPriceAt: 2000,
    });
    expect(firstHigh.potentialGain?.potentialGainPct).toBeCloseTo(40);

    const pullback = await store.upsertTickerData({
      type: "tickerData",
      symbol: "GAIN",
      updatedAt: 3000,
      latestPrice: 1.2,
      nearestSupport: null,
      nearestResistance: null,
    });
    expect(pullback.potentialGain?.highPrice).toBe(1.4);
    expect(pullback.potentialGain?.potentialGainPct).toBeCloseTo(40);

    const newHigh = await store.upsertTickerData({
      type: "tickerData",
      symbol: "GAIN",
      updatedAt: 4000,
      latestPrice: 1.55,
      nearestSupport: null,
      nearestResistance: null,
    });
    expect(newHigh.potentialGain?.highPrice).toBe(1.55);
    expect(newHigh.potentialGain?.potentialGainPct).toBeCloseTo(55);
  });

  it("preserves the Potential Gain card visibility across live ticker updates", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const hidden = await store.upsertPatch({
      symbol: "GAIN",
      status: "live",
      updatedAt: 1000,
      potentialGainCardVisible: false,
      cards: {},
    });
    expect(hidden.potentialGainCardVisible).toBe(false);

    const preserved = await store.upsertTickerData({
      type: "tickerData",
      symbol: "GAIN",
      updatedAt: 2000,
      latestPrice: 1.2,
      nearestSupport: null,
      nearestResistance: null,
    });
    expect(preserved.potentialGainCardVisible).toBe(false);

    const visible = await store.upsertPatch({
      symbol: "GAIN",
      status: "live",
      updatedAt: 3000,
      potentialGainCardVisible: true,
      cards: {},
    });
    expect(visible.potentialGainCardVisible).toBe(true);
  });

  it("rejects older and equal-revision ticker data while accepting a higher revision at the same observation time", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertTickerData({
      type: "tickerData",
      symbol: "ORDER",
      updatedAt: 2_000,
      marketDataObservedAt: 2_000,
      marketDataRevision: 10,
      latestPrice: 3,
      nearestSupport: 2.8,
      nearestResistance: 3.2,
    });

    const older = await store.upsertTickerData({
      type: "tickerData",
      symbol: "ORDER",
      updatedAt: 1_000,
      marketDataObservedAt: 1_000,
      marketDataRevision: 99,
      latestPrice: 2.5,
      nearestSupport: 2.3,
      nearestResistance: 2.7,
    });
    expect(older.latestPrice).toBe(3);
    expect(older.nearestResistance).toBe(3.2);

    const lowerRevision = await store.upsertTickerData({
      type: "tickerData",
      symbol: "ORDER",
      updatedAt: 2_000,
      marketDataObservedAt: 2_000,
      marketDataRevision: 9,
      latestPrice: 2.9,
      nearestSupport: 2.7,
      nearestResistance: 3.1,
    });
    expect(lowerRevision.latestPrice).toBe(3);

    const higherRevision = await store.upsertTickerData({
      type: "tickerData",
      symbol: "ORDER",
      updatedAt: 2_000,
      marketDataObservedAt: 2_000,
      marketDataRevision: 11,
      latestPrice: 3.1,
      nearestSupport: 2.9,
      nearestResistance: 3.3,
    });
    expect(higherRevision.latestPrice).toBe(3.1);
    expect(higherRevision.latestPriceObservedAt).toBe(2_000);
    expect(higherRevision.marketDataRevision).toBe(11);
  });

  it("stores the TradersLink AI Read separately and preserves its visibility across ticker updates", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const published = await store.upsertPatch({
      symbol: "TGHL",
      status: "live",
      updatedAt: 1000,
      tradersLinkAiReadCardVisible: true,
      tradersLinkAiReadDipBuyPlanVisible: true,
      cards: {
        tradersLinkAiRead: {
          title: "TradersLink AI Read",
          body: JSON.stringify({ version: 1, symbol: "TGHL" }),
          updatedAt: 1000,
          priceWhenPosted: 1.36,
          source: "OpenAI",
        },
      },
    });
    expect(published.cards.tradersLinkAiRead?.title).toBe("TradersLink AI Read");
    expect(published.tradersLinkAiReadCardVisible).toBe(true);
    expect(published.tradersLinkAiReadDipBuyPlanVisible).toBe(true);

    const hidden = await store.upsertPatch({
      symbol: "TGHL",
      updatedAt: 1100,
      tradersLinkAiReadCardVisible: false,
      tradersLinkAiReadDipBuyPlanVisible: false,
      cards: {},
    });
    expect(hidden.tradersLinkAiReadCardVisible).toBe(false);
    expect(hidden.tradersLinkAiReadDipBuyPlanVisible).toBe(false);
    expect(hidden.cards.tradersLinkAiRead?.priceWhenPosted).toBe(1.36);

    const preserved = await store.upsertTickerData({
      type: "tickerData",
      symbol: "TGHL",
      updatedAt: 1200,
      latestPrice: 1.4,
      nearestSupport: 1.25,
      nearestResistance: 1.5,
    });
    expect(preserved.tradersLinkAiReadCardVisible).toBe(false);
    expect(preserved.tradersLinkAiReadDipBuyPlanVisible).toBe(false);
    expect(preserved.cards.tradersLinkAiRead?.title).toBe("TradersLink AI Read");
  });

  it("keeps lifecycle labels off by default and preserves operator visibility across ticker updates", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const initial = await store.upsertPatch({
      symbol: "NXXT",
      status: "live",
      updatedAt: 1000,
      cards: {},
    });
    expect(initial.watchlistLifecycleLabelsVisible).toBe(false);

    const labeled = await store.upsertPatch({
      symbol: "NXXT",
      status: "live",
      updatedAt: 1100,
      watchlistLifecycleLabelsVisible: true,
      watchlistLifecycle: {
        status: "pullback_watch",
        label: "Pullback Watch",
        reason: "Holding VWAP and mapped support.",
        updatedAt: 1100,
      },
      cards: {},
    });
    expect(labeled.watchlistLifecycleLabelsVisible).toBe(true);
    expect(labeled.watchlistLifecycle?.status).toBe("pullback_watch");

    const preserved = await store.upsertTickerData({
      type: "tickerData",
      symbol: "NXXT",
      updatedAt: 1200,
      latestPrice: 0.33,
      nearestSupport: 0.32,
      nearestResistance: 0.35,
    });
    expect(preserved.watchlistLifecycleLabelsVisible).toBe(true);
    expect(preserved.watchlistLifecycle?.label).toBe("Pullback Watch");

    const hidden = await store.upsertPatch({
      symbol: "NXXT",
      updatedAt: 1300,
      watchlistLifecycleLabelsVisible: false,
      cards: {},
    });
    expect(hidden.watchlistLifecycleLabelsVisible).toBe(false);
    expect(hidden.watchlistLifecycle?.status).toBe("pullback_watch");
  });

  it("allows a new activation patch to reset a stale first posted time", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "GETY",
      status: "live",
      updatedAt: 1000,
      cards: {
        companyInfo: {
          title: "GETY",
          body: "Old activation.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "stock_context",
        },
      },
    });

    const updated = await store.upsertPatch({
      symbol: "GETY",
      status: "live",
      updatedAt: 5000,
      firstPostedAt: 5000,
      cards: {
        companyInfo: {
          title: "GETY",
          body: "New activation.",
          updatedAt: 5000,
          priceWhenPosted: 1.3,
          source: "stock_context",
        },
      },
    });

    expect(updated.firstPostedAt).toBe(5000);
    expect(updated.updatedAt).toBe(5000);
  });

  it("orders active symbols by first posted time instead of latest update time", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      ...buildCorePatch("OLD", 1000),
      firstPostedAt: 1000,
    });
    await store.upsertPatch({
      ...buildCorePatch("NEW", 2000),
      firstPostedAt: 2000,
    });
    await store.upsertTickerData({
      type: "tickerData",
      symbol: "OLD",
      status: "live",
      updatedAt: 9000,
      latestPrice: 1.2,
      nearestSupport: 1.1,
      nearestResistance: 1.3,
    });

    const state = await store.listSymbols();

    expect(state.symbols.map((symbol) => symbol.symbol)).toEqual(["NEW", "OLD"]);
    expect(state.symbols.find((symbol) => symbol.symbol === "OLD")?.updatedAt).toBe(9000);
  });

  it("applies status-only patches without clearing ticker content", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "ABCD testing support",
          body: "Price is testing support.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "live_alert",
        },
      },
    });
    await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 2000,
      latestPrice: 1.18,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
    });

    const deactivated = await store.upsertPatch({
      symbol: "ABCD",
      status: "deactivated",
      updatedAt: 3000,
      cards: {},
    });

    expect(deactivated.status).toBe("deactivated");
    expect(deactivated.latestPrice).toBe(1.18);
    expect(deactivated.nearestSupport).toBe(1.1);
    expect(deactivated.nearestResistance).toBe(1.25);
    expect(deactivated.levelMap).toBeNull();
    expect(deactivated.latestTraderReadHeadline).toBe("ABCD testing support");
    expect(deactivated.cards.liveTraderRead?.body).toBe("Price is testing support.");
  });

  it("keeps deactivated symbols out of the user-facing watchlist list", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "LIVE",
      status: "live",
      updatedAt: 2000,
      cards: {
        liveTraderRead: {
          title: "LIVE active read",
          body: "Active ticker content.",
          updatedAt: 2000,
          priceWhenPosted: 2,
          source: "live_alert",
        },
      },
    });
    await store.upsertPatch({
      symbol: "GONE",
      status: "deactivated",
      updatedAt: 3000,
      cards: {
        liveTraderRead: {
          title: "GONE old read",
          body: "Old ticker content.",
          updatedAt: 3000,
          priceWhenPosted: 3,
          source: "live_alert",
        },
      },
    });

    const state = await store.listSymbols();
    expect(state.symbols.map((symbol) => symbol.symbol)).toEqual(["LIVE"]);
    expect(await store.getSymbol("GONE")).not.toBeNull();
  });

  it("creates an archive snapshot when a fully loaded ticker is deactivated", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch(buildCorePatch("ABCD", 1000));
    await store.upsertPatch({
      symbol: "ABCD",
      status: "deactivated",
      updatedAt: 2000,
      cards: {},
    });

    const archives = await store.listArchives();
    expect(archives).toHaveLength(1);
    expect(archives[0]?.archiveId).toBe("ABCD-19700101-000002-000");
    expect(archives[0]?.symbol).toBe("ABCD");
    expect(archives[0]?.archivedAt).toBe(2000);
    expect(archives[0]?.firstPostedAt).toBe(1000);
    expect(archives[0]?.lastActiveUpdatedAt).toBe(2000);
    expect(archives[0]?.state.status).toBe("deactivated");
    expect(archives[0]?.state.levelMap?.rangeState).toBe("tight");
    expect(
      archives[0]?.state.levelMap?.supportLevels[0]?.marketDataProvenance?.lastConfirmedAt,
    ).toBe(1_780_000_300_000);
    expect(archives[0]?.state.cards.levelMap?.title).toBe("Level Map");
    expect(archives[0]?.state.cards.fullLadder?.title).toBe("Full Ladder");
    await expect(store.getLatestArchiveForSymbol("ABCD")).resolves.toEqual(archives[0]);
    await expect(store.getArchive("ABCD-19700101-000002-000")).resolves.toEqual(archives[0]);
  });

  it("does not archive deactivated tickers until core cards are loaded", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "Live Trader Read",
          body: "Current structure: only a trader read exists.",
          updatedAt: 1000,
          priceWhenPosted: 1.18,
          source: "live_alert",
        },
      },
    });
    await store.upsertPatch({
      symbol: "ABCD",
      status: "deactivated",
      updatedAt: 2000,
      cards: {},
    });

    await expect(store.listArchives()).resolves.toEqual([]);
  });

  it("archives deactivated tickers with level snapshot cards even before company info arrives", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const patch = buildCorePatch("ABCD", 1000);
    delete patch.cards.companyInfo;
    await store.upsertPatch(patch);
    await store.upsertPatch({
      symbol: "ABCD",
      status: "deactivated",
      updatedAt: 2000,
      cards: {},
    });

    const archives = await store.listArchives();
    expect(archives).toHaveLength(1);
    expect(archives[0]?.state.cards.companyInfo).toBeUndefined();
    expect(archives[0]?.state.cards.fullLadder?.title).toBe("Full Ladder");
  });

  it("does not duplicate archives when a deactivation patch is replayed", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch(buildCorePatch("ABCD", 1000));
    const deactivation = {
      symbol: "ABCD",
      status: "deactivated" as const,
      updatedAt: 2000,
      cards: {},
    };
    await store.upsertPatch(deactivation);
    await store.upsertPatch(deactivation);

    const archives = await store.listArchives();
    expect(archives).toHaveLength(1);
    expect(archives[0]?.archiveId).toBe("ABCD-19700101-000002-000");
  });

  it("keeps old archive snapshots immutable when the same symbol is reactivated", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch(buildCorePatch("ABCD", 1000));
    await store.upsertPatch({
      symbol: "ABCD",
      status: "deactivated",
      updatedAt: 2000,
      cards: {},
    });
    const firstArchive = await store.getLatestArchiveForSymbol("ABCD");

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 3000,
      cards: {
        liveTraderRead: {
          title: "Live Trader Read",
          body: "Trade map:\nCurrent structure: ABCD is live again.",
          updatedAt: 3000,
          priceWhenPosted: 1.3,
          source: "live_alert",
        },
      },
    });

    const liveState = await store.getSymbol("ABCD");
    const archives = await store.listArchives();
    expect(liveState?.status).toBe("live");
    expect(liveState?.firstPostedAt).toBe(3000);
    expect(liveState?.updatedAt).toBe(3000);
    expect(liveState?.cards.liveTraderRead?.body).toContain("live again");
    expect(liveState?.cards.fullLadder).toBeUndefined();
    expect(archives).toHaveLength(1);
    expect(archives[0]).toEqual(firstArchive);
    expect(archives[0]?.state.cards.liveTraderRead?.body).toContain("holding a range");
  });

  it("keeps same-day cards and Added time when a removed ticker is reactivated from preserved context", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch(buildCorePatch("NXXT", 1000));
    await store.upsertPatch({
      symbol: "NXXT",
      status: "live",
      updatedAt: 1500,
      watchlistSlotState: "followup",
      cards: {},
    });
    expect((await store.getSymbol("NXXT"))?.watchlistSlotState).toBe("followup");

    await store.upsertPatch({
      symbol: "NXXT",
      status: "deactivated",
      updatedAt: 2000,
      cards: {},
    });
    await store.upsertPatch({
      symbol: "NXXT",
      status: "live",
      updatedAt: 3000,
      firstPostedAt: 1000,
      watchlistSlotState: "active",
      preserveExistingOnReactivation: true,
      cards: {},
    });

    const reactivated = await store.getSymbol("NXXT");
    expect(reactivated?.firstPostedAt).toBe(1000);
    expect(reactivated?.watchlistSlotState).toBe("active");
    expect(reactivated?.cards.fullLadder).toBeDefined();
    expect(reactivated?.cards.liveTraderRead?.body).toContain("holding a range");
  });
});
