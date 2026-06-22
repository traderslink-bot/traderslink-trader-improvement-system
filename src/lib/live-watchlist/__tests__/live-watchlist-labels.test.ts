import { describe, expect, it } from "vitest";

import {
  formatMarketDataStatusLabel,
  formatTickerStatusLabel,
  formatTickerStatusTone,
} from "../live-watchlist-labels";

describe("live watchlist labels", () => {
  it("formats trader-facing market data status labels", () => {
    expect(formatMarketDataStatusLabel("live")).toBe("Live Data: ON");
    expect(formatMarketDataStatusLabel("stale")).toBe("Live Data: ON");
    expect(formatMarketDataStatusLabel("offline")).toBe("Live Data: OFF");
    expect(formatMarketDataStatusLabel("starting")).toBe("Live Data: OFF");
  });

  it("formats ticker status labels without exposing internal stream state", () => {
    expect(formatTickerStatusLabel("live")).toBe("Live Ticker Data: On");
    expect(formatTickerStatusLabel("stale")).toBe("Live Ticker Data: On");
    expect(formatTickerStatusLabel("offline")).toBe("Live Ticker Data: Off");
    expect(formatTickerStatusLabel("starting")).toBe("Live Ticker Data: Off");
    expect(formatTickerStatusLabel("deactivated")).toBe("Live Ticker Data: Off");
    expect(formatTickerStatusTone("live")).toBe("live");
    expect(formatTickerStatusTone("stale")).toBe("live");
    expect(formatTickerStatusTone("offline")).toBe("off");
    expect(formatTickerStatusTone("starting")).toBe("off");
    expect(formatTickerStatusTone("deactivated")).toBe("off");
  });
});
