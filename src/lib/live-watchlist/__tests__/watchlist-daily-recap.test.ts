import { describe, expect, it } from "vitest";

import type {
  LiveWatchlistArchiveSnapshot,
  LiveWatchlistSymbolState,
} from "../live-watchlist-types";
import {
  buildWatchlistDailyRecapTickers,
  newYorkDateKey,
} from "../watchlist-daily-recap";

function state(args: {
  symbol: string;
  postedAt: string;
  startingPrice: number;
  highPrice: number;
  gain: number;
  highPriceAt?: string;
}): LiveWatchlistSymbolState {
  const postedAt = Date.parse(args.postedAt);
  return {
    symbol: args.symbol,
    status: "live",
    updatedAt: Date.parse(args.highPriceAt ?? args.postedAt),
    firstPostedAt: postedAt,
    companyName: null,
    latestPrice: null,
    nearestSupport: null,
    nearestResistance: null,
    latestTraderReadHeadline: null,
    cards: {},
    potentialGain: {
      postedAt,
      startingPrice: args.startingPrice,
      startingPriceAt: postedAt,
      highPrice: args.highPrice,
      highPriceAt: Date.parse(args.highPriceAt ?? args.postedAt),
      potentialGainPct: args.gain,
    },
  };
}

function archive(value: LiveWatchlistSymbolState): LiveWatchlistArchiveSnapshot {
  return {
    archiveId: `${value.symbol}-archive`,
    symbol: value.symbol,
    archivedAt: value.updatedAt,
    firstPostedAt: value.firstPostedAt,
    lastActiveUpdatedAt: value.updatedAt,
    state: value,
  };
}

describe("watchlist daily recap", () => {
  it("uses Eastern dates across UTC day boundaries", () => {
    expect(newYorkDateKey(Date.parse("2026-07-21T00:30:00Z"))).toBe("2026-07-20");
  });

  it("keeps only gains strictly above 5 percent and sorts highest first", () => {
    const tickers = buildWatchlistDailyRecapTickers({
      dateKey: "2026-07-20",
      symbols: [
        state({ symbol: "FIVE", postedAt: "2026-07-20T14:00:00Z", startingPrice: 1, highPrice: 1.05, gain: 5 }),
        state({ symbol: "SIX", postedAt: "2026-07-20T15:00:00Z", startingPrice: 2, highPrice: 2.12, gain: 6 }),
        state({ symbol: "TOP", postedAt: "2026-07-20T13:00:00Z", startingPrice: 0.5, highPrice: 0.75, gain: 50 }),
        state({ symbol: "OLD", postedAt: "2026-07-17T15:00:00Z", startingPrice: 1, highPrice: 2, gain: 100 }),
      ],
      archives: [],
    });

    expect(tickers.map((ticker) => ticker.symbol)).toEqual(["TOP", "SIX"]);
  });

  it("includes removed tickers from archives and deduplicates each symbol at its best move", () => {
    const active = state({
      symbol: "MOVE",
      postedAt: "2026-07-20T14:00:00Z",
      startingPrice: 1,
      highPrice: 1.2,
      gain: 20,
    });
    const removed = state({
      symbol: "MOVE",
      postedAt: "2026-07-20T13:00:00Z",
      startingPrice: 0.8,
      highPrice: 1.2,
      gain: 50,
      highPriceAt: "2026-07-20T13:30:00Z",
    });

    const [ticker] = buildWatchlistDailyRecapTickers({
      dateKey: "2026-07-20",
      symbols: [active],
      archives: [archive(removed)],
    });

    expect(ticker).toMatchObject({
      symbol: "MOVE",
      startingPrice: 0.8,
      highPrice: 1.2,
      potentialGainPct: 50,
    });
  });
});
