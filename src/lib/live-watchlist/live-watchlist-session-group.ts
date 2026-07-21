import type { LiveWatchlistSymbolState } from "./live-watchlist-types";

export type LiveWatchlistEntryGroup = "main" | "postmarket";

export function shouldShowReversalWatchlist(visible: boolean, symbolCount: number): boolean {
  return visible && symbolCount > 0;
}

const entryTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: "America/New_York",
});

export function getLiveWatchlistEntryGroup(
  symbol: Pick<LiveWatchlistSymbolState, "firstPostedAt">,
): LiveWatchlistEntryGroup {
  if (!symbol.firstPostedAt) return "main";
  const parts = Object.fromEntries(
    entryTimeFormatter
      .formatToParts(new Date(symbol.firstPostedAt))
      .map((part) => [part.type, part.value]),
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return minutes >= 16 * 60 && minutes < 20 * 60 ? "postmarket" : "main";
}
