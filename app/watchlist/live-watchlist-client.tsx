"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";

import type {
  LiveWatchlistArchiveSnapshot,
  LiveWatchlistCardContent,
  LiveWatchlistLevelMap,
  LiveWatchlistLevelMapLevel,
  LiveWatchlistMarketDataStatus,
  LiveWatchlistStatePayload,
  LiveWatchlistSymbolState,
} from "@/src/lib/live-watchlist/live-watchlist-types";
import {
  formatMarketDataStatusLabel,
  formatTickerStatusLabel,
  formatTickerStatusTone,
} from "@/src/lib/live-watchlist/live-watchlist-labels";

const watchlistDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/Toronto",
});

const watchlistTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "America/Toronto",
});

const watchlistReadTextStyle: CSSProperties = {
  display: "-webkit-box",
  overflow: "hidden",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  fontSize: "0.84rem",
  lineHeight: 1.35,
};

const watchlistTimeCellStyle: CSSProperties = {
  fontSize: "0.78rem",
  lineHeight: 1.35,
};

const detailCardHelpText: Record<string, string> = {
  "Closest Levels to Watch":
    "These levels are not price targets. They are nearby support and resistance areas for context, usually mapped roughly 30% from the current price when enough levels are available.",
  "Level Map":
    "A compact map of nearby support and resistance levels, using the existing level ladder with distance, strength, and source labels.",
  "Live Trader Read":
    "This read is generated from live market data, levels, and market structure. It is a planning aid, not a prediction or advice. Small-cap stocks are volatile, and the system can be wrong, delayed, or miss context.",
};

function formatPrice(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function formatLevelCell(label: string | null | undefined, value: number | null): string {
  return label?.trim() || formatPrice(value);
}

function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function formatCompactLevelTags(level: LiveWatchlistLevelMapLevel | null): string | null {
  if (!level) {
    return null;
  }
  return [level.strengthLabel, level.sourceLabel].filter(Boolean).join(" · ") || null;
}

function formatLevelMapLevel(level: LiveWatchlistLevelMapLevel | null, fallback: string): string {
  if (!level) {
    return fallback;
  }
  const side = level.side === "resistance" ? "R" : "S";
  return `${side} ${formatPrice(level.price)} ${formatSignedPercent(level.distancePct)}`;
}

function selectIndexNextStrong(levelMap: LiveWatchlistLevelMap): LiveWatchlistLevelMapLevel | null {
  return levelMap.nextStrongResistance ?? levelMap.nextStrongSupport;
}

function LevelMapIndexCell({ symbol }: { symbol: LiveWatchlistSymbolState }) {
  const levelMap = symbol.levelMap ?? null;
  if (!levelMap) {
    return (
      <span className="watchlist-level-map-cell">
        <span>{formatLevelCell(symbol.nearestSupportLabel, symbol.nearestSupport)}</span>
        <span>{formatLevelCell(symbol.nearestResistanceLabel, symbol.nearestResistance)}</span>
      </span>
    );
  }

  const nextStrong = selectIndexNextStrong(levelMap);
  return (
    <span className="watchlist-level-map-cell">
      <span className="watchlist-level-map-primary">
        {levelMap.rangeState === "tight" && levelMap.nearestSupport && levelMap.nearestResistance
          ? `Tight zone: S ${formatPrice(levelMap.nearestSupport.price)} / R ${formatPrice(levelMap.nearestResistance.price)}`
          : `${formatLevelMapLevel(levelMap.nearestSupport, "S n/a")} / ${formatLevelMapLevel(levelMap.nearestResistance, "R n/a")}`}
      </span>
      <span className="watchlist-level-map-secondary">
        {nextStrong
          ? `Next stronger: ${formatLevelMapLevel(nextStrong, "n/a")}`
          : "Next stronger: n/a"}
        {nextStrong ? (
          <em>{formatCompactLevelTags(nextStrong)}</em>
        ) : null}
      </span>
    </span>
  );
}

function formatTime(value: number): string {
  return watchlistTimeFormatter.format(new Date(value));
}

function formatDate(value: number): string {
  return watchlistDateFormatter.format(new Date(value));
}

function formatDateTime(value: number | null): string {
  if (!value) {
    return "n/a";
  }
  return `${formatDate(value)} ${formatTime(value)}`;
}

function formatCardBody(value: string): string {
  return value
    .replace(/`r`n/g, "\n")
    .replace(/`n/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractCardSection(
  value: string,
  startHeading: string,
  endHeadings: string[],
): string | null {
  const body = formatCardBody(value).replace(/\r\n/g, "\n");
  const startPattern = new RegExp(`^${escapeRegExp(startHeading)}:\\s*$`, "im");
  const startMatch = body.match(startPattern);
  if (!startMatch || startMatch.index === undefined) {
    return null;
  }

  const rest = body.slice(startMatch.index + startMatch[0].length);
  const endIndexes = endHeadings
    .map((heading) => {
      const endPattern = new RegExp(`\\n${escapeRegExp(heading)}:\\s*`, "i");
      return rest.match(endPattern)?.index ?? -1;
    })
    .filter((index) => index >= 0);
  const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : rest.length;
  const section = rest.slice(0, endIndex).trim();
  return section || null;
}

function cleanCompanyInfoBody(value: string): string {
  return formatCardBody(value)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => !/^Current price:/i.test(line.trim()))
    .filter((line) => !/^Levels are loading\.?$/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLiveTraderReadBody(card: LiveWatchlistCardContent): string {
  const tradeMap = extractCardSection(card.body, "Trade map", [
    "Closest levels to watch",
    "More support and resistance",
  ]);
  return tradeMap ?? formatCardBody(card.body);
}

const liveTraderReadLabels = new Set([
  "current structure",
  "main resistance",
  "main support",
  "useful resistance",
  "useful support",
  "minor resistance reference",
  "minor support reference",
  "cleaner above",
  "support that matters",
  "broader support",
  "short-term momentum support",
  "setup quality",
]);

function parseLiveTraderReadLine(line: string): { label: string; body: string } | null {
  const sameAreaMatch = line.match(/^Short-term momentum support is the same area:\s*(.*)$/i);
  if (sameAreaMatch) {
    return {
      label: "Short-term momentum support",
      body: `same area as ${sameAreaMatch[1]}`,
    };
  }

  const match = line.match(/^([^:]{2,80}):\s*(.*)$/);
  if (!match) {
    return null;
  }
  const label = match[1].trim();
  if (!liveTraderReadLabels.has(label.toLowerCase())) {
    return null;
  }
  return {
    label,
    body: match[2],
  };
}

function LiveTraderReadCard({ card }: { card: LiveWatchlistCardContent }) {
  const lines = cleanLiveTraderReadBody(card)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="watchlist-trader-read">
      {lines.map((line, index) => {
        const parsed = parseLiveTraderReadLine(line);
        if (!parsed) {
          return <p key={`${line}-${index}`}>{line}</p>;
        }
        return (
          <p key={`${line}-${index}`}>
            <strong>{parsed.label}:</strong>{" "}
            <span>{parsed.body}</span>
          </p>
        );
      })}
    </div>
  );
}

function StructuredMarketStructureCard({ body }: { body: string }) {
  const lines = body
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  return (
    <div className="watchlist-trader-read watchlist-structured-card-body">
      {lines.map((line, index) => {
        if (!line) {
          return <span key={`blank-${index}`} className="watchlist-structured-spacer" />;
        }
        if (line.startsWith("- ")) {
          return (
            <p key={`${line}-${index}`} className="watchlist-structured-bullet">
              <span className="watchlist-structured-bullet-marker" aria-hidden="true">
                -
              </span>{" "}
              <span>{line.slice(2).trim()}</span>
            </p>
          );
        }
        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}

function cleanClosestLevelsBody(
  card: LiveWatchlistCardContent,
  liveTraderRead?: LiveWatchlistCardContent,
): string {
  return (
    extractCardSection(card.body, "Closest levels to watch", [
      "More support and resistance",
    ]) ??
    (liveTraderRead
      ? extractCardSection(liveTraderRead.body, "Closest levels to watch", [
          "More support and resistance",
        ])
      : null) ??
    formatCardBody(card.body)
  );
}

function cleanMarketStructureBody(
  card: LiveWatchlistCardContent,
  liveTraderRead?: LiveWatchlistCardContent,
): string {
  return (
    extractCardSection(card.body, "Market structure", [
      "Trade map",
      "Closest levels to watch",
      "More support and resistance",
    ]) ??
    (liveTraderRead
      ? extractCardSection(liveTraderRead.body, "Market structure", [
          "Trade map",
          "Closest levels to watch",
          "More support and resistance",
        ])
      : null) ??
    formatCardBody(card.body)
  );
}

function cleanGenericCardBody(card: LiveWatchlistCardContent): string {
  const body = formatCardBody(card.body).trim();
  const lines = body.split("\n");
  const withoutTitle =
    lines[0]?.trim().toLowerCase() === card.title.trim().toLowerCase()
      ? lines.slice(1)
      : lines;
  return withoutTitle
    .filter((line) => !/^Price:\s*/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type RecentNewsFilingArticle = {
  title: string;
  url: string;
  publishedAt: string | null;
  eventType: string | null;
  filingType: string | null;
};

function parseRecentNewsFilings(card: LiveWatchlistCardContent): RecentNewsFilingArticle[] {
  try {
    const parsed = JSON.parse(card.body) as { articles?: unknown };
    if (!Array.isArray(parsed.articles)) {
      return [];
    }

    return parsed.articles
      .map((article): RecentNewsFilingArticle | null => {
        if (typeof article !== "object" || article === null) {
          return null;
        }
        const candidate = article as Record<string, unknown>;
        if (typeof candidate.title !== "string" || typeof candidate.url !== "string") {
          return null;
        }
        return {
          title: candidate.title,
          url: candidate.url,
          publishedAt:
            typeof candidate.publishedAt === "string" ? candidate.publishedAt : null,
          eventType: typeof candidate.eventType === "string" ? candidate.eventType : null,
          filingType: typeof candidate.filingType === "string" ? candidate.filingType : null,
        };
      })
      .filter((article): article is RecentNewsFilingArticle => Boolean(article));
  } catch {
    return [];
  }
}

function formatArticleDate(value: string | null): string {
  if (!value) {
    return "Date pending";
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return value;
  }
  return formatDate(timestamp);
}

function formatNewsChipLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (upper === "SEC") {
        return "SEC";
      }
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function RecentNewsFilingsCard({ card }: { card: LiveWatchlistCardContent }) {
  const articles = parseRecentNewsFilings(card);
  if (articles.length === 0) {
    return <pre>{formatCardBody(card.body)}</pre>;
  }

  return (
    <div className="watchlist-news-list">
      {articles.map((article) => (
        <a
          key={`${article.url}-${article.publishedAt ?? ""}`}
          className="watchlist-news-link"
          href={article.url}
          target="_blank"
          rel="noreferrer"
        >
          <span className="watchlist-news-title">{article.title}</span>
          <span className="watchlist-news-meta">
            <span>{formatArticleDate(article.publishedAt)}</span>
            {article.filingType ? <em>{formatNewsChipLabel(article.filingType)}</em> : null}
            {article.eventType ? <em>{formatNewsChipLabel(article.eventType)}</em> : null}
          </span>
        </a>
      ))}
    </div>
  );
}

function levelMapCardFromState(symbol: LiveWatchlistSymbolState): LiveWatchlistCardContent | null {
  if (!symbol.levelMap) {
    return null;
  }
  const lines = [`Current price: ${formatPrice(symbol.levelMap.currentPrice)}`];
  if (
    symbol.levelMap.rangeState === "tight" &&
    symbol.levelMap.nearestSupport &&
    symbol.levelMap.nearestResistance
  ) {
    lines.push(
      `Tight decision zone: S ${formatPrice(symbol.levelMap.nearestSupport.price)} / R ${formatPrice(symbol.levelMap.nearestResistance.price)}`,
    );
  } else {
    lines.push(
      `Nearest support: ${symbol.levelMap.nearestSupport?.label ?? "none"}`,
      `Nearest resistance: ${symbol.levelMap.nearestResistance?.label ?? "none"}`,
    );
  }
  const nextStrong = selectIndexNextStrong(symbol.levelMap);
  if (nextStrong) {
    lines.push(`Next stronger: ${nextStrong.side === "resistance" ? "R" : "S"} ${nextStrong.label}`);
  }
  lines.push("", "Resistance:");
  lines.push(
    ...(symbol.levelMap.resistanceLevels.length
      ? symbol.levelMap.resistanceLevels.map((level) => level.label)
      : ["none"]),
  );
  lines.push("", "Support:");
  lines.push(
    ...(symbol.levelMap.supportLevels.length
      ? symbol.levelMap.supportLevels.map((level) => level.label)
      : ["none"]),
  );

  return {
    title: "Level Map",
    body: lines.join("\n"),
    updatedAt: symbol.updatedAt,
    priceWhenPosted: symbol.levelMap.currentPrice,
    source: "level_map",
  };
}

function LevelMapDetailCard({ card }: { card: LiveWatchlistCardContent }) {
  return <pre>{cleanGenericCardBody(card)}</pre>;
}

function normalizeCardTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\/&]/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shouldShowCardTitle(label: string, card: LiveWatchlistCardContent): boolean {
  if (label === "Known Recent News / SEC Filings") {
    return false;
  }
  if (
    label === "Closest Levels to Watch" ||
    label === "Level Map" ||
    label === "Live Trader Read" ||
    label === "Market Structure" ||
    label === "Company Info" ||
    label === "Full Ladder"
  ) {
    return false;
  }
  return normalizeCardTitle(label) !== normalizeCardTitle(card.title);
}

function WatchlistCardKicker({ label }: { label: string }) {
  const helpText = detailCardHelpText[label];

  return (
    <p className="academy-kicker watchlist-card-kicker">
      <span>{label}</span>
      {helpText ? (
        <button
          type="button"
          className="watchlist-card-help"
          aria-label={`${label} help`}
          data-tooltip={helpText}
          title={helpText}
        >
          ?
        </button>
      ) : null}
    </p>
  );
}

function mergeSymbol(
  symbols: LiveWatchlistSymbolState[],
  next: LiveWatchlistSymbolState,
): LiveWatchlistSymbolState[] {
  const without = symbols.filter((item) => item.symbol !== next.symbol);
  if (next.status === "deactivated") {
    return without;
  }
  return [next, ...without].sort((left, right) => right.updatedAt - left.updatedAt);
}

function WatchlistDetailCards({ symbol }: { symbol: LiveWatchlistSymbolState }) {
  const derivedMarketStructureCard =
    symbol.cards.marketStructure ??
    (symbol.cards.liveTraderRead &&
    extractCardSection(symbol.cards.liveTraderRead.body, "Market structure", [
      "Trade map",
      "Closest levels to watch",
      "More support and resistance",
    ])
      ? {
          ...symbol.cards.liveTraderRead,
          title: "Market Structure",
          source: "level_snapshot",
        }
      : null);
  const cards = [
    ["Level Map", symbol.cards.levelMap ?? levelMapCardFromState(symbol), false],
    ["Closest Levels to Watch", symbol.cards.nearestSupportResistance, false],
    ["Live Trader Read", symbol.cards.liveTraderRead, false],
    ["Market Structure", derivedMarketStructureCard, false],
    ["Company Info", symbol.cards.companyInfo, false],
    ["Known Recent News / SEC Filings", symbol.cards.recentNewsFilings, true],
    ["Full Ladder", symbol.cards.fullLadder, false],
  ] as const;
  const hasRecentNewsFilings = Boolean(symbol.cards.recentNewsFilings);

  return (
    <section
      className="watchlist-card-grid"
      data-has-recent-news={hasRecentNewsFilings ? "true" : "false"}
    >
      {cards
        .filter(([, card, hideWhenEmpty]) => card || !hideWhenEmpty)
        .map(([label, card]) => (
          <article
            key={label}
            className="academy-card watchlist-content-card"
            data-card-label={label}
          >
            <div className="academy-card-topline">
              <WatchlistCardKicker label={label} />
            </div>
            {card ? (
              <>
                {shouldShowCardTitle(label, card) ? (
                  <h2 className="academy-card-title">{card.title}</h2>
                ) : null}
                {label === "Known Recent News / SEC Filings" ? (
                  <RecentNewsFilingsCard card={card} />
                ) : label === "Level Map" ? (
                  <LevelMapDetailCard card={card} />
                ) : label === "Closest Levels to Watch" ? (
                  <pre>{cleanClosestLevelsBody(card, symbol.cards.liveTraderRead)}</pre>
                ) : label === "Live Trader Read" ? (
                  <LiveTraderReadCard card={card} />
                ) : label === "Market Structure" ? (
                  <StructuredMarketStructureCard
                    body={cleanMarketStructureBody(card, symbol.cards.liveTraderRead)}
                  />
                ) : label === "Company Info" ? (
                  <pre>{cleanCompanyInfoBody(card.body)}</pre>
                ) : (
                  <pre>{cleanGenericCardBody(card)}</pre>
                )}
                <p className="watchlist-card-meta">
                  Updated {formatTime(card.updatedAt)} | Price when posted{" "}
                  {formatPrice(card.priceWhenPosted)}
                </p>
              </>
            ) : (
              <>
                <h2 className="academy-card-title">Waiting for content</h2>
                <p className="academy-card-text">
                  This card will fill in when the runtime publishes the next
                  matching update.
                </p>
              </>
            )}
          </article>
        ))}
    </section>
  );
}

export function LiveWatchlistIndexClient({
  initialState,
}: {
  initialState: LiveWatchlistStatePayload;
}) {
  const [symbols, setSymbols] = useState(initialState.symbols);
  const [marketDataStatus, setMarketDataStatus] = useState<LiveWatchlistMarketDataStatus>(
    initialState.marketDataStatus,
  );
  const [marketDataUpdatedAt, setMarketDataUpdatedAt] = useState<number | null>(
    initialState.marketDataUpdatedAt,
  );

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;

    async function refresh() {
      const response = await fetch("/api/live-watchlist", { credentials: "same-origin" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as LiveWatchlistStatePayload;
      if (!cancelled) {
        setSymbols(payload.symbols);
        setMarketDataStatus(payload.marketDataStatus);
        setMarketDataUpdatedAt(payload.marketDataUpdatedAt);
      }
    }

    const stream = new EventSource("/api/live-watchlist/stream");
    stream.addEventListener("symbol", (event) => {
      const next = JSON.parse(event.data) as LiveWatchlistSymbolState;
      setSymbols((current) => mergeSymbol(current, next));
    });
    stream.addEventListener("health", (event) => {
      const next = JSON.parse(event.data) as {
        marketDataStatus: LiveWatchlistMarketDataStatus;
        marketDataUpdatedAt: number | null;
      };
      setMarketDataStatus(next.marketDataStatus);
      setMarketDataUpdatedAt(next.marketDataUpdatedAt);
    });

    pollTimer = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      cancelled = true;
      stream.close();
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
      }
    };
  }, []);

  return (
    <div className="watchlist-page">
      <section className="watchlist-hero">
        <div>
          <p className="academy-eyebrow">Beta Testing</p>
          <h1 className="academy-title">Live Ticker Watchlist</h1>
          <p className="academy-lede">
            Scan active tickers, level maps, and the latest trader read.
            Click or tap any ticker to view deeper market data and the full
            ticker details.
          </p>
          <p className="watchlist-testing-note">
            This watchlist is an experimental app. Ticker information is generated
            from the app&apos;s code and may use real-time market data when connected.
            During testing, live data may not always be active. When disconnected,
            ticker details, including support and resistance levels, will not update.
          </p>
          <Link href="/watchlist/archive" className="academy-card-action watchlist-hero-action">
            View archived tickers
          </Link>
        </div>
        <div className="watchlist-summary-panel" aria-label="Watchlist status">
          <span>{symbols.length} {symbols.length === 1 ? "ticker" : "tickers"}</span>
          <span
            data-market-data-status={marketDataStatus}
            title={marketDataUpdatedAt ? `Updated ${formatDateTime(marketDataUpdatedAt)}` : undefined}
          >
            {formatMarketDataStatusLabel(marketDataStatus)}
          </span>
        </div>
      </section>

      {symbols.length === 0 ? (
        <section className="academy-card watchlist-empty">
          <h2>No tickers are currently in the watchlist</h2>
        </section>
      ) : (
        <section className="watchlist-table" aria-label="Live watchlist tickers">
          <div className="watchlist-table-head">
            <span>Ticker</span>
            <span>Price</span>
            <span>Level Map</span>
            <span>Latest read</span>
            <span>Updated</span>
            <span>Added</span>
          </div>
          {symbols.map((symbol) => (
            <Link
              key={symbol.symbol}
              href={`/watchlist/${symbol.symbol}`}
              className="watchlist-row"
            >
              <span className="watchlist-symbol-cell">
                <strong>{symbol.symbol}</strong>
              </span>
              <span className="watchlist-mobile-field" data-mobile-label="Price">
                {formatPrice(symbol.latestPrice)}
              </span>
              <span className="watchlist-mobile-field" data-mobile-label="Level Map">
                <LevelMapIndexCell symbol={symbol} />
              </span>
              <span className="watchlist-read-cell">
                <span className="watchlist-read-text" style={watchlistReadTextStyle}>
                  {symbol.latestTraderReadHeadline ?? "Waiting for trader read"}
                </span>
              </span>
              <span
                className="watchlist-mobile-field"
                data-mobile-label="Updated"
                style={watchlistTimeCellStyle}
              >
                {formatTime(symbol.updatedAt)}
              </span>
              <span
                className="watchlist-mobile-field"
                data-mobile-label="Added"
                style={watchlistTimeCellStyle}
              >
                {formatDateTime(symbol.firstPostedAt)}
              </span>
              <em
                className="watchlist-ticker-status"
                data-status={formatTickerStatusTone(marketDataStatus)}
              >
                {formatTickerStatusLabel(marketDataStatus)}
              </em>
            </Link>
          ))}
        </section>
      )}
      <section className="academy-card watchlist-notice-card" aria-label="Watchlist notice">
        <h2>Watchlist Notice</h2>
        <p>
          Currently this watchlist is for <strong>day trading ideas only</strong>. Tickers
          are based on momentum, volume, chart setups, news, and current market
          activity. They are <strong>not long-term investment picks</strong>,
          may not be suitable for holding overnight, and company fundamentals
          have not been researched.
        </p>
        <p>
          Small cap stocks can move very quickly and carry high risk. A ticker
          may already be extended by the time you see it, so do not chase. Wait
          for your own setup, manage risk, use proper position sizing, take
          profit when it is there, and protect your capital with a stop loss or
          clear exit plan.
        </p>
        <p>
          This watchlist is for educational and informational purposes only. It
          is not financial advice or buy/sell advice. You are responsible for
          your own trades.
        </p>
      </section>
    </div>
  );
}

export function LiveWatchlistDetailClient({
  initialMarketDataStatus,
  initialSymbol,
}: {
  initialMarketDataStatus: LiveWatchlistMarketDataStatus;
  initialSymbol: LiveWatchlistSymbolState;
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [marketDataStatus, setMarketDataStatus] =
    useState<LiveWatchlistMarketDataStatus>(initialMarketDataStatus);

  useEffect(() => {
    let pollTimer: number | null = null;
    const stream = new EventSource("/api/live-watchlist/stream");
    stream.addEventListener("symbol", (event) => {
      const next = JSON.parse(event.data) as LiveWatchlistSymbolState;
      if (next.symbol === initialSymbol.symbol) {
        setSymbol(next);
      }
    });
    stream.addEventListener("health", (event) => {
      const next = JSON.parse(event.data) as {
        marketDataStatus: LiveWatchlistMarketDataStatus;
      };
      setMarketDataStatus(next.marketDataStatus);
    });

    pollTimer = window.setInterval(async () => {
      const response = await fetch(`/api/live-watchlist/symbols/${initialSymbol.symbol}`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { symbol: LiveWatchlistSymbolState };
      setSymbol(payload.symbol);
      const stateResponse = await fetch("/api/live-watchlist");
      if (stateResponse.ok) {
        const statePayload = (await stateResponse.json()) as LiveWatchlistStatePayload;
        setMarketDataStatus(statePayload.marketDataStatus);
      }
    }, 5000);

    return () => {
      stream.close();
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
      }
    };
  }, [initialSymbol.symbol]);

  if (symbol.status === "deactivated") {
    return (
      <div className="watchlist-page">
        <section className="watchlist-detail-hero">
          <div className="watchlist-detail-heading">
            <div>
              <p className="academy-eyebrow">Live Watchlist</p>
              <h1 className="academy-title">{symbol.symbol}</h1>
            </div>
            <Link href="/watchlist" className="academy-card-action watchlist-back-action">
              Back to watchlist
            </Link>
          </div>
        </section>
        <section className="academy-card watchlist-empty">
          <h2>This ticker is no longer active</h2>
          <p className="academy-card-text">
            It has been removed from the live watchlist. Return to the watchlist
            to view currently active tickers.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <section className="watchlist-detail-hero">
        <div className="watchlist-detail-heading">
          <div>
            <p className="academy-eyebrow">Live Watchlist</p>
            <h1 className="academy-title">{symbol.symbol}</h1>
          </div>
          <Link href="/watchlist" className="academy-card-action watchlist-back-action">
            Back to watchlist
          </Link>
        </div>
        <div className="watchlist-summary-panel">
          <span>Price {formatPrice(symbol.latestPrice)}</span>
          <span>Posted {formatDateTime(symbol.firstPostedAt)}</span>
          <span>Updated {formatTime(symbol.updatedAt)}</span>
          <span data-market-data-status={marketDataStatus}>
            {formatMarketDataStatusLabel(marketDataStatus)}
          </span>
        </div>
      </section>

      <WatchlistDetailCards symbol={symbol} />
    </div>
  );
}

export function LiveWatchlistArchiveIndex({
  archives,
}: {
  archives: LiveWatchlistArchiveSnapshot[];
}) {
  return (
    <div className="watchlist-page">
      <section className="watchlist-hero">
        <div>
          <p className="academy-eyebrow">Premium Watchlist</p>
          <h1 className="academy-title">Archived Tickers</h1>
          <p className="academy-lede">
            Review tickers that were removed from the live watchlist. Archived
            pages are frozen snapshots from when the ticker was last active.
          </p>
          <Link href="/watchlist" className="academy-card-action watchlist-hero-action">
            Back to live watchlist
          </Link>
        </div>
        <div className="watchlist-summary-panel" aria-label="Watchlist archive status">
          <span>{archives.length} {archives.length === 1 ? "archive" : "archives"}</span>
        </div>
      </section>

      {archives.length === 0 ? (
        <section className="academy-card watchlist-empty">
          <h2>No tickers have been archived yet</h2>
        </section>
      ) : (
        <section className="watchlist-table" aria-label="Archived watchlist tickers">
          <div className="watchlist-table-head watchlist-archive-table-head">
            <span>Ticker</span>
            <span>Archived</span>
            <span>Last active update</span>
            <span>Latest read</span>
          </div>
          {archives.map((archive) => (
            <Link
              key={archive.archiveId}
              href={`/watchlist/archive/${archive.archiveId}`}
              className="watchlist-row watchlist-archive-row"
            >
              <span className="watchlist-symbol-cell">
                <strong>{archive.symbol}</strong>
              </span>
              <span className="watchlist-mobile-field" data-mobile-label="Archived">
                {formatDateTime(archive.archivedAt)}
              </span>
              <span className="watchlist-mobile-field" data-mobile-label="Last active update">
                {formatDateTime(archive.lastActiveUpdatedAt)}
              </span>
              <span className="watchlist-read-cell">
                <span className="watchlist-read-text" style={watchlistReadTextStyle}>
                  {archive.state.latestTraderReadHeadline ?? "No trader read saved"}
                </span>
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

export function LiveWatchlistArchiveDetailClient({
  archive,
}: {
  archive: LiveWatchlistArchiveSnapshot;
}) {
  return (
    <div className="watchlist-page">
      <section className="watchlist-detail-hero">
        <div className="watchlist-detail-heading">
          <div>
            <p className="academy-eyebrow">Archived Watchlist Snapshot</p>
            <h1 className="academy-title">{archive.symbol}</h1>
          </div>
          <div className="watchlist-detail-actions">
            <Link href="/watchlist/archive" className="academy-card-action watchlist-back-action">
              Back to archive
            </Link>
            <Link href="/watchlist" className="academy-card-action watchlist-back-action">
              Live watchlist
            </Link>
          </div>
        </div>
        <div className="watchlist-summary-panel">
          <span>Archived {formatDateTime(archive.archivedAt)}</span>
          <span>Posted {formatDateTime(archive.firstPostedAt)}</span>
          <span>Last active update {formatTime(archive.lastActiveUpdatedAt)}</span>
        </div>
      </section>

      <section className="academy-card watchlist-archive-notice">
        <h2>This ticker is no longer live</h2>
        <p>
          This page shows the last saved information from when {archive.symbol}
          was active on the watchlist. It does not update with live market data.
        </p>
      </section>

      <WatchlistDetailCards symbol={archive.state} />
    </div>
  );
}
