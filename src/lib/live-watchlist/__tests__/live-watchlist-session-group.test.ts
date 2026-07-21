import { describe, expect, it } from "vitest";

import {
  getLiveWatchlistEntryGroup,
  shouldShowReversalWatchlist,
} from "../live-watchlist-session-group";

describe("getLiveWatchlistEntryGroup", () => {
  it("keeps premarket and regular-hour additions in the main group", () => {
    expect(getLiveWatchlistEntryGroup({ firstPostedAt: Date.parse("2026-07-16T12:00:00Z") })).toBe("main");
    expect(getLiveWatchlistEntryGroup({ firstPostedAt: Date.parse("2026-07-16T19:59:00Z") })).toBe("main");
  });

  it("places 4:00-8:00 PM ET additions in the post-market group", () => {
    expect(getLiveWatchlistEntryGroup({ firstPostedAt: Date.parse("2026-07-16T20:00:00Z") })).toBe("postmarket");
    expect(getLiveWatchlistEntryGroup({ firstPostedAt: Date.parse("2026-07-16T23:59:00Z") })).toBe("postmarket");
  });

  it("defaults missing timestamps and after-hours-late manual adds to main", () => {
    expect(getLiveWatchlistEntryGroup({ firstPostedAt: null })).toBe("main");
    expect(getLiveWatchlistEntryGroup({ firstPostedAt: Date.parse("2026-07-17T00:01:00Z") })).toBe("main");
  });
});

describe("shouldShowReversalWatchlist", () => {
  it("shows the list only when it is enabled and contains a ticker", () => {
    expect(shouldShowReversalWatchlist(true, 1)).toBe(true);
    expect(shouldShowReversalWatchlist(true, 0)).toBe(false);
    expect(shouldShowReversalWatchlist(false, 1)).toBe(false);
  });
});
