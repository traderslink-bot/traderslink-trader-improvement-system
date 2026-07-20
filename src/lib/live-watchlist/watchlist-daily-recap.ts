import type {
  LiveWatchlistArchiveSnapshot,
  LiveWatchlistSymbolState,
} from "./live-watchlist-types";

export type WatchlistDailyRecapTicker = {
  symbol: string;
  postedAt: number;
  startingPrice: number;
  startingPriceAt: number;
  highPrice: number;
  highPriceAt: number;
  potentialGainPct: number;
};

const NEW_YORK_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function newYorkDateKey(timestamp: number): string {
  const parts = NEW_YORK_DATE_FORMATTER.formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function validPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function recapTickerFromState(
  state: LiveWatchlistSymbolState,
  dateKey: string,
  minimumGainPct: number,
): WatchlistDailyRecapTicker | null {
  const gain = state.potentialGain;
  if (
    !gain ||
    newYorkDateKey(gain.postedAt) !== dateKey ||
    !validPositiveNumber(gain.startingPrice) ||
    !validPositiveNumber(gain.highPrice) ||
    !Number.isFinite(gain.potentialGainPct) ||
    gain.potentialGainPct <= minimumGainPct
  ) {
    return null;
  }

  return {
    symbol: state.symbol.trim().toUpperCase(),
    postedAt: gain.postedAt,
    startingPrice: gain.startingPrice,
    startingPriceAt: gain.startingPriceAt,
    highPrice: gain.highPrice,
    highPriceAt: gain.highPriceAt,
    potentialGainPct: gain.potentialGainPct,
  };
}

export function buildWatchlistDailyRecapTickers(args: {
  dateKey: string;
  symbols: LiveWatchlistSymbolState[];
  archives: LiveWatchlistArchiveSnapshot[];
  minimumGainPct?: number;
}): WatchlistDailyRecapTicker[] {
  const minimumGainPct = args.minimumGainPct ?? 5;
  const bestBySymbol = new Map<string, WatchlistDailyRecapTicker>();
  const states = [
    ...args.symbols,
    ...args.archives.map((archive) => archive.state),
  ];

  for (const state of states) {
    const ticker = recapTickerFromState(state, args.dateKey, minimumGainPct);
    if (!ticker) {
      continue;
    }
    const existing = bestBySymbol.get(ticker.symbol);
    if (
      !existing ||
      ticker.potentialGainPct > existing.potentialGainPct ||
      (ticker.potentialGainPct === existing.potentialGainPct &&
        ticker.highPriceAt > existing.highPriceAt)
    ) {
      bestBySymbol.set(ticker.symbol, ticker);
    }
  }

  return [...bestBySymbol.values()].sort(
    (left, right) =>
      right.potentialGainPct - left.potentialGainPct ||
      left.symbol.localeCompare(right.symbol),
  );
}
