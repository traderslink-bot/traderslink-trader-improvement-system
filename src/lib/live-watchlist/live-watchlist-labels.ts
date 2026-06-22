import type {
  LiveWatchlistMarketDataStatus,
  LiveWatchlistStatus,
} from "./live-watchlist-types";

export function formatMarketDataStatusLabel(status: LiveWatchlistMarketDataStatus): string {
  switch (status) {
    case "live":
      return "Live Data: ON";
    case "stale":
      return "Live Data: ON";
    case "starting":
    case "offline":
      return "Live Data: OFF";
    default:
      return "Live Data: OFF";
  }
}

export function formatTickerStatusLabel(status: LiveWatchlistStatus | LiveWatchlistMarketDataStatus): string {
  switch (status) {
    case "live":
      return "Live Ticker Data: On";
    case "stale":
      return "Live Ticker Data: On";
    case "starting":
    case "offline":
    case "deactivated":
      return "Live Ticker Data: Off";
    default:
      return "Live Ticker Data: Off";
  }
}

export function formatTickerStatusTone(status: LiveWatchlistStatus | LiveWatchlistMarketDataStatus): "live" | "off" {
  switch (status) {
    case "live":
    case "stale":
      return "live";
    case "starting":
    case "offline":
    case "deactivated":
      return "off";
    default:
      return "off";
  }
}
