"use client";

import "flag-icons/css/flag-icons.min.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import type {
  LiveWatchlistArchiveSnapshot,
  LiveWatchlistCardContent,
  LiveWatchlistLevelMap,
  LiveWatchlistMarketDataStatus,
  LiveWatchlistStatePayload,
  LiveWatchlistSymbolState,
  LiveWatchlistVolumeContext,
  TradersLinkAiReadLevel,
  TradersLinkAiReadPayload,
  TradersLinkAiReadPullbackScenario,
} from "@/src/lib/live-watchlist/live-watchlist-types";
import {
  formatMarketDataStatusLabel,
} from "@/src/lib/live-watchlist/live-watchlist-labels";
import { formatLevelMarketDataProvenance } from "@/src/lib/live-watchlist/live-watchlist-level-provenance";
import {
  buildWatchlistV2LevelRows,
  formatWatchlistV2LevelDistance,
  formatWatchlistV2LevelPrice,
  type WatchlistV2LevelRow,
} from "@/src/lib/live-watchlist/watchlist-v2-levels";
import {
  getLiveWatchlistEntryGroup,
  shouldShowReversalWatchlist,
} from "@/src/lib/live-watchlist/live-watchlist-session-group";
import { getWatchlistCountryFlag } from "@/src/lib/live-watchlist/watchlist-country-flag";
import { buildWatchlistHighRiskWarning } from "@/src/lib/live-watchlist/watchlist-high-risk-warning";
import {
  isNewerLiveWatchlistSymbolState,
  reconcileLiveWatchlistSnapshot,
} from "@/src/lib/live-watchlist/live-watchlist-reconciliation";
import {
  deriveTradersLinkAiPullbackPlan,
  describeTradersLinkAiLiveVolumeContext,
  formatAiReadSession,
  parseTradersLinkAiRead,
  resolveTradersLinkAiPullbackScenarioState,
  type TradersLinkAiPullbackPlan,
} from "@/src/lib/live-watchlist/traderslink-ai-read";

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

const watchlistTimeCellStyle: CSSProperties = {
  fontSize: "0.78rem",
  lineHeight: 1.35,
};

const tradingViewExchangePrefixes: Record<string, string> = {
  AMEX: "AMEX",
  ARCA: "AMEX",
  ARCX: "AMEX",
  NASDAQ: "NASDAQ",
  NASDAQCAPITALMARKET: "NASDAQ",
  NASDAQGLOBALMARKET: "NASDAQ",
  NYSE: "NYSE",
  NYSEAMERICAN: "AMEX",
  NYSEARCA: "AMEX",
  NYSEMKT: "AMEX",
  OTC: "OTC",
  OTCMARKETS: "OTC",
  OTCQB: "OTC",
  OTCQX: "OTC",
  XASE: "AMEX",
  XNAS: "NASDAQ",
  XNYS: "NYSE",
};

const detailCardHelpText: Record<string, string> = {
  "Potential Gain":
    "Potential gain compares the ticker's price when tracking began with the highest live price observed afterward. It shows the best observed move, not what every trader captured.",
  "Potential Path Levels":
    "These levels are not price targets. They are filtered support and resistance map areas for context, usually mapped roughly 30% from the current price when enough useful levels are available.",
  "Trader Read":
    "This read is generated from live market data, levels, and market structure. It is a planning aid, not a prediction or advice. Small-cap stocks are volatile, and the system can be wrong, delayed, or miss context.",
  "Full Ladder":
    "This is the broader support and resistance ladder for the ticker. It gives extra context beyond the nearest levels, not automatic targets.",
  "Technical Context":
    "VWAP, EMA, and market-structure reads show where price is trading compared with intraday references and the current structure. They are planning context, not automatic entries.",
  "Extended Quote":
    "Live quote context from the market-data provider, including bid, ask, session range, volume, and other current ticker facts when available.",
  "Market Structure":
    "This summarizes the current price structure, such as range, breakout, reclaim, or support-test behavior. It is context for planning, not a trade call.",
  "Company Info":
    "Basic company and risk context for the ticker. Use it to understand what the company is and whether there are higher-risk profile flags.",
  "Known Recent News / SEC Filings":
    "Recent company news and SEC filings that may explain attention or volatility. Always open the source before relying on the headline.",
  "TradersLink AI Read":
    "An AI-assisted day-trade preparation read derived from full-session price action across premarket, regular hours, and after-hours. Optional catalyst, SEC, dilution, and web-research context appears only when that admin setting is enabled.",
};

function formatPrice(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function formatPercentPoints(value: number): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function buildTradingViewSymbol(symbol: string, exchange: string | null | undefined): string {
  const normalizedSymbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const normalizedExchange = exchange?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  const exchangePrefix = tradingViewExchangePrefixes[normalizedExchange];
  return exchangePrefix ? `${exchangePrefix}:${normalizedSymbol}` : normalizedSymbol;
}

function TradingViewChart({ symbol }: { symbol: LiveWatchlistSymbolState }) {
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const tradingViewSymbol = buildTradingViewSymbol(
    symbol.symbol,
    symbol.extendedQuote?.exchange,
  );

  useEffect(() => {
    const container = widgetContainerRef.current;
    if (!container) {
      return;
    }

    container.replaceChildren();

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.width = "100%";
    widget.style.height = "100%";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({
      allow_symbol_change: false,
      autosize: true,
      backgroundColor: "rgba(8, 15, 28, 1)",
      calendar: false,
      details: false,
      gridColor: "rgba(255, 255, 255, 0.06)",
      hide_legend: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_volume: false,
      hotlist: false,
      interval: "5",
      locale: "en",
      save_image: false,
      style: "1",
      support_host: "https://www.tradingview.com",
      symbol: tradingViewSymbol,
      theme: "dark",
      timezone: "exchange",
      withdateranges: true,
    });

    container.append(widget, script);

    return () => {
      container.replaceChildren();
    };
  }, [tradingViewSymbol]);

  return (
    <section
      className="watchlist-tradingview-card"
      aria-label={`${symbol.symbol} TradingView chart`}
    >
      <div
        ref={widgetContainerRef}
        className="tradingview-widget-container watchlist-tradingview-widget"
      />
    </section>
  );
}

function stripInternalAtrLevelWording(value: string): string {
  return value.replace(
    /[ \t]+(?:—|-)[ \t]+(?:inside normal 5m movement|meaningful room|meaningful separation)[ \t]+\(\d+(?:\.\d+)?[ \t]+ATR\)[ \t]*$/gim,
    "",
  );
}

function formatLevelMeta(level: WatchlistV2LevelRow): string {
  return [level.strengthLabel, level.sourceLabel].filter(Boolean).join(" / ") || "level";
}

function WatchlistV2LevelRowItem({ level }: { level: WatchlistV2LevelRow }) {
  const provenance = formatLevelMarketDataProvenance(level);
  return (
    <li
      className="watchlist-v2-level-row"
      data-side={level.side}
      data-nearest={level.isNearest ? "true" : "false"}
    >
      <span className="watchlist-v2-level-price">{formatWatchlistV2LevelPrice(level)}</span>
      <span className="watchlist-v2-level-distance">
        {formatWatchlistV2LevelDistance(level)}
      </span>
      <span className="watchlist-v2-level-meta">
        <span>{formatLevelMeta(level)}</span>
        {provenance ? (
          <span className="watchlist-level-provenance">{provenance}</span>
        ) : null}
      </span>
    </li>
  );
}

function WatchlistV2LevelSection({
  title,
  side,
  levels,
}: {
  title: string;
  side: "support" | "resistance";
  levels: WatchlistV2LevelRow[];
}) {
  return (
    <section className="watchlist-v2-level-section" data-side={side}>
      <h3>{title}</h3>
      {levels.length > 0 ? (
        <ul className="watchlist-v2-level-list">
          {levels.map((level) => (
            <WatchlistV2LevelRowItem
              key={`${level.side}-${level.price}-${level.distancePct}-${level.label}`}
              level={level}
            />
          ))}
        </ul>
      ) : (
        <p className="watchlist-v2-level-empty">No curated {side} levels yet.</p>
      )}
    </section>
  );
}

function WatchlistV2NearestLevels({ levelMap }: { levelMap: LiveWatchlistLevelMap }) {
  return (
    <div className="watchlist-v2-nearest" aria-label="Nearest levels">
      <div className="watchlist-v2-nearest-item" data-side="support">
        <span>Nearest support</span>
        <strong>
          {levelMap.nearestSupport
            ? stripInternalAtrLevelWording(levelMap.nearestSupport.label)
            : "n/a"}
        </strong>
      </div>
      <div className="watchlist-v2-nearest-item" data-side="resistance">
        <span>Nearest resistance</span>
        <strong>
          {levelMap.nearestResistance
            ? stripInternalAtrLevelWording(levelMap.nearestResistance.label)
            : "n/a"}
        </strong>
      </div>
    </div>
  );
}

function WatchlistV2FallbackLevels({ symbol }: { symbol: LiveWatchlistSymbolState }) {
  const card = symbol.cards.nearestSupportResistance;
  return (
    <div className="watchlist-v2-fallback-levels">
      {card ? (
        <pre>{cleanLevelMapCardBody(card)}</pre>
      ) : (
        <p>Closest levels are still loading for this ticker.</p>
      )}
    </div>
  );
}

function WatchlistV2PotentialPathCard({
  symbol,
  fullLadderCard,
}: {
  symbol: LiveWatchlistSymbolState;
  fullLadderCard?: LiveWatchlistCardContent;
}) {
  const levelMap = symbol.levelMap ?? null;
  const levelRows = buildWatchlistV2LevelRows(levelMap);
  const fullLadderBody = fullLadderCard
    ? cleanGenericCardBody(fullLadderCard)
        .replace(/\bheavy\b/gi, "strong")
        .replace(/\blight\b/gi, "weak")
    : null;

  return (
    <div className="watchlist-v2-potential-path-card">
      <article className="watchlist-v2-card">
        <header className="watchlist-v2-card-header">
          <div className="watchlist-v2-card-title">
            <h2>{symbol.symbol}</h2>
            <span>{formatPrice(symbol.latestPrice)}</span>
            <small className="watchlist-price-delay-note">(prices may be slightly delayed)</small>
          </div>
        </header>

        <dl className="watchlist-v2-card-meta">
          <div>
            <dt>Updated</dt>
            <dd>{formatTime(symbol.updatedAt)}</dd>
          </div>
        </dl>

        {levelMap ? (
          <>
            <WatchlistV2NearestLevels levelMap={levelMap} />
            <div className="watchlist-v2-level-columns">
              <WatchlistV2LevelSection
                title="Support"
                side="support"
                levels={levelRows.support}
              />
              <WatchlistV2LevelSection
                title="Resistance"
                side="resistance"
                levels={levelRows.resistance}
              />
            </div>
          </>
        ) : (
          <WatchlistV2FallbackLevels symbol={symbol} />
        )}
      </article>

      {fullLadderBody ? (
        <details className="watchlist-more-levels">
          <summary>Full ladder</summary>
          <div className="watchlist-full-ladder-detail">
            <h3>Full level ladder</h3>
            <pre>{fullLadderBody}</pre>
          </div>
        </details>
      ) : null}
    </div>
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

function LiveTraderReadCard({ card }: { card: LiveWatchlistCardContent }) {
  const lines = cleanLiveTraderReadBody(card)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="watchlist-trader-read">
      {lines.map((line, index) => (
        <p key={`${line}-${index}`}>{line}</p>
      ))}
    </div>
  );
}

function TradersLinkAiReadLevelBlock({
  heading,
  level,
}: {
  heading: string;
  level: TradersLinkAiReadLevel;
}) {
  return (
    <div className="watchlist-ai-read-level">
      <span>{heading}</span>
      <strong>{level.price === null ? level.label : `$${formatPrice(level.price)}`}</strong>
      <p>{level.rationale}</p>
    </div>
  );
}

function formatAiReadTag(value: string): string {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatDilutionDate(value: string | null): string {
  if (!value) {
    return "No source-backed date";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function DilutionTimingRow({
  label,
  lane,
}: {
  label: string;
  lane: NonNullable<TradersLinkAiReadPayload["dilutionRisk"]["companyIssuance"]>;
}) {
  return (
    <div className="watchlist-ai-read-dilution-row">
      <div>
        <strong>{label}</strong>
        <span>{formatAiReadTag(lane.status)}</span>
      </div>
      <p>{lane.summary}</p>
      <small>
        Earliest: {formatDilutionDate(lane.earliestDate)} · Trigger: {formatAiReadTag(lane.trigger)}
      </small>
    </div>
  );
}

function pullbackPlanStateCopy(plan: TradersLinkAiPullbackPlan): string {
  switch (plan.state) {
    case "watch":
      return `Price is above this area. A usable pullback requires buyers to defend $${formatPrice(plan.zoneLow)}-$${formatPrice(plan.zoneHigh)}; the first touch alone is not confirmation.`;
    case "testing":
      return `Price is testing the mapped pullback area. Confirmation requires a rejection of lower prices and a reclaim of $${formatPrice(plan.reclaimPrice)}.`;
    case "reclaim_required":
      return `Price is below the mapped pullback area but has not yet reached momentum failure. The pullback thesis requires a new base, a reclaim of $${formatPrice(plan.reclaimPrice)}, and a hold.`;
  }
}

function TradersLinkAiPullbackScenarioBlock({
  heading,
  description,
  scenario,
  livePrice,
}: {
  heading: string;
  description: string;
  scenario: TradersLinkAiReadPullbackScenario;
  livePrice: number;
}) {
  const state = resolveTradersLinkAiPullbackScenarioState(scenario, livePrice);
  return (
    <div className="watchlist-ai-read-level" data-scenario-state={state.toLowerCase().replaceAll(" ", "-")}>
      <div className="watchlist-ai-read-section-heading">
        <h4>{heading}</h4>
      </div>
      <p>{description}</p>
      <dl className="watchlist-ai-read-scenario-items">
        <div>
          <dt>Zone</dt>
          <dd>${formatPrice(scenario.zoneLow)}-${formatPrice(scenario.zoneHigh)}</dd>
        </div>
        <div>
          <dt>Required confirmation</dt>
          <dd>{scenario.confirmation}</dd>
        </div>
        <div>
          <dt>Invalidation</dt>
          <dd>${formatPrice(scenario.invalidationPrice)}</dd>
        </div>
        <div>
          <dt>First objective</dt>
          <dd>
            {scenario.firstObjectivePrice === null
              ? "No defensible objective mapped"
              : `$${formatPrice(scenario.firstObjectivePrice)}`}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function TradersLinkAiLiveVolumeSection({
  read,
  livePrice,
  volume,
}: {
  read: TradersLinkAiReadPayload;
  livePrice: number;
  volume: LiveWatchlistVolumeContext;
}) {
  const summary = describeTradersLinkAiLiveVolumeContext({ read, livePrice, volume });
  return (
    <section
      className="watchlist-ai-read-live-confirmation"
      data-volume-tone={summary.tone}
    >
      <div>
        <h3>Live 5-minute confirmation</h3>
        <small>Updated {formatTime(volume.updatedAt)} ET</small>
      </div>
      <strong>{summary.headline}</strong>
      <p>{summary.detail}</p>
    </section>
  );
}

function TradersLinkAiReadCard({
  card,
  livePrice,
  liveVolumeContext,
  dipBuyPlanVisible = true,
}: {
  card: LiveWatchlistCardContent;
  livePrice: number | null;
  liveVolumeContext?: LiveWatchlistVolumeContext | null;
  dipBuyPlanVisible?: boolean;
}) {
  const read = parseTradersLinkAiRead(card.body);
  if (!read) {
    return (
      <article
        className="academy-card watchlist-content-card watchlist-ai-read-card"
        data-card-label="TradersLink AI Read"
      >
        <div className="academy-card-topline">
          <WatchlistCardKicker label="TradersLink AI Read" />
        </div>
        <h2 className="academy-card-title">Read unavailable</h2>
        <p className="academy-card-text">
          The latest AI Read could not be displayed. Use the admin refresh control to generate a
          new one.
        </p>
      </article>
    );
  }
  const downsideCheckpoints = read.downsideCheckpoints ?? [];
  const currentLivePrice = livePrice ?? read.currentPrice;
  const momentumSetupFailed = read.momentumFailure.price !== null &&
    currentLivePrice <= read.momentumFailure.price;
  const pullbackPlan = dipBuyPlanVisible
    ? deriveTradersLinkAiPullbackPlan(read)
    : null;

  return (
    <article
      className="academy-card watchlist-content-card watchlist-ai-read-card"
      data-card-label="TradersLink AI Read"
    >
      <div className="academy-card-topline">
        <WatchlistCardKicker label="TradersLink AI Read" />
      </div>
      <div className="watchlist-ai-read-header">
        <div>
          <p className="watchlist-ai-read-eyebrow">
            {formatAiReadSession(read.marketSession)} at ${formatPrice(read.currentPrice)}
          </p>
          <h2 className="academy-card-title">{read.symbol} trade preparation</h2>
        </div>
        <div className="watchlist-ai-read-badges">
          <span className="watchlist-ai-read-badge" data-bias={read.bias}>
            {read.bias} bias
          </span>
        </div>
      </div>

      <p className="watchlist-ai-read-current">{read.currentRead}</p>
      {liveVolumeContext ? (
        <TradersLinkAiLiveVolumeSection
          read={read}
          livePrice={currentLivePrice}
          volume={liveVolumeContext}
        />
      ) : null}
      <div className="watchlist-ai-read-level-grid">
        <TradersLinkAiReadLevelBlock heading="Needs to hold" level={read.needsToHold} />
        <TradersLinkAiReadLevelBlock
          heading="Caution below"
          level={read.cautionBelow}
        />
        <TradersLinkAiReadLevelBlock heading="Momentum failure" level={read.momentumFailure} />
        <TradersLinkAiReadLevelBlock heading="Must clear" level={read.mustClear} />
        <TradersLinkAiReadLevelBlock
          heading="Breakout continuation"
          level={read.breakoutContinuation}
        />
      </div>

      {read.targets.length > 0 ? (
        <section className="watchlist-ai-read-section">
          <h3>Where the trade could go next</h3>
          <ol className="watchlist-ai-read-targets">
            {read.targets.map((target, index) => (
              <li key={`${target.label}-${target.price ?? index}`}>
                <strong>
                  {target.price === null ? target.label : `$${formatPrice(target.price)}`}
                </strong>
                <span>{target.condition}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {read.version === 3 && dipBuyPlanVisible ? (
        <section className="watchlist-ai-read-section">
          <h3>Pullback entry plans</h3>
          {momentumSetupFailed ? (
            <p className="watchlist-ai-read-plan-warning">
              The original momentum setup is invalid below the momentum-failure boundary. Use the
              failure and recovery plan; do not treat either pullback zone as active.
            </p>
          ) : null}
          {read.pullbackPlans.shallow || read.pullbackPlans.deep ? (
            <div className="watchlist-ai-read-scenario-grid">
              {read.pullbackPlans.shallow ? (
                <TradersLinkAiPullbackScenarioBlock
                  heading="Shallow pullback — momentum retest"
                  description="For traders seeking a controlled retest while momentum remains intact."
                  scenario={read.pullbackPlans.shallow}
                  livePrice={currentLivePrice}
                />
              ) : null}
              {read.pullbackPlans.deep ? (
                <TradersLinkAiPullbackScenarioBlock
                  heading="Deep pullback — reset setup"
                  description="For traders waiting for the accelerated move to unwind into its base."
                  scenario={read.pullbackPlans.deep}
                  livePrice={currentLivePrice}
                />
              ) : null}
            </div>
          ) : (
            <p>No evidence-backed pullback entry plan is available for this read.</p>
          )}
        </section>
      ) : pullbackPlan ? (
        <section className="watchlist-ai-read-section">
          <h3>Potential pullback</h3>
          <p>
            AI-mapped pullback area: {" "}
            <strong>
              ${formatPrice(pullbackPlan.zoneLow)}-${formatPrice(pullbackPlan.zoneHigh)}
            </strong>.
          </p>
          <p>{pullbackPlanStateCopy(pullbackPlan)}</p>
          <p>
            This area comes from the AI Read&apos;s caution and needs-to-hold boundaries. Acceptance
            below ${formatPrice(pullbackPlan.zoneLow)} weakens the active pullback thesis.
          </p>
          <p>
            Momentum failure: acceptance below ${formatPrice(pullbackPlan.invalidationPrice)}{" "}
            invalidates the setup; wait for new structure rather than averaging into the failure.
          </p>
          {pullbackPlan.firstBounceTarget !== null ? (
            <p>
              First objective after a confirmed hold or reclaim: {" "}
              ${formatPrice(pullbackPlan.firstBounceTarget)}.
            </p>
          ) : null}
        </section>
      ) : null}

      {read.version === 3 && (downsideCheckpoints.length > 0 || read.failureRecovery) ? (
        <section className="watchlist-ai-read-section watchlist-ai-read-downside">
          <h3>Failure and recovery</h3>
          <p>
            The original momentum setup is invalid below {read.momentumFailure.price === null
              ? "the published momentum-failure boundary"
              : `$${formatPrice(read.momentumFailure.price)}`}.
          </p>
          {downsideCheckpoints.length > 0 ? (
            <>
              <p>Lower structural checkpoints exposed after that failure:</p>
              <ol className="watchlist-ai-read-targets">
                {downsideCheckpoints.map((checkpoint, index) => (
                  <li key={`${checkpoint.label}-${checkpoint.price ?? index}`}>
                    <strong>
                      {checkpoint.price === null
                        ? checkpoint.label
                        : `$${formatPrice(checkpoint.price)}`}
                    </strong>
                    <span>{checkpoint.condition}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
          {read.failureRecovery ? (
            <dl className="watchlist-ai-read-scenario-items">
              <div>
                <dt>Recovery-watch area</dt>
                <dd>${formatPrice(read.failureRecovery.recoveryZoneLow)}-${formatPrice(read.failureRecovery.recoveryZoneHigh)}</dd>
              </div>
              <div>
                <dt>First recovery reclaim</dt>
                <dd>${formatPrice(read.failureRecovery.firstReclaimPrice)} after a new base forms</dd>
              </div>
              <div>
                <dt>Restores original bullish thesis</dt>
                <dd>${formatPrice(read.failureRecovery.setupRestorePrice)}</dd>
              </div>
              <div>
                <dt>First recovery objective</dt>
                <dd>{read.failureRecovery.firstObjectivePrice === null
                  ? "No defensible objective mapped"
                  : `$${formatPrice(read.failureRecovery.firstObjectivePrice)}`}</dd>
              </div>
            </dl>
          ) : (
            <p>A recovery attempt is unavailable until a lower base and explicit reclaim are established.</p>
          )}
        </section>
      ) : downsideCheckpoints.length > 0 ? (
        <section className="watchlist-ai-read-section watchlist-ai-read-downside">
          <h3>If momentum fails</h3>
          <p>Lower structural areas exposed after the momentum-failure level gives way.</p>
          <ol className="watchlist-ai-read-targets">
            {downsideCheckpoints.map((checkpoint, index) => (
              <li key={`${checkpoint.label}-${checkpoint.price ?? index}`}>
                <strong>
                  {checkpoint.price === null
                    ? checkpoint.label
                    : `$${formatPrice(checkpoint.price)}`}
                </strong>
                <span>{checkpoint.condition}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="watchlist-ai-read-context-grid">
        {read.externalResearchEnabled === true ? (
          <>
            <section className="watchlist-ai-read-section">
              <div className="watchlist-ai-read-section-heading">
                <h3>Catalyst reality check</h3>
                <span>{formatAiReadTag(read.catalystRealityCheck.status)}</span>
              </div>
              <p>{read.catalystRealityCheck.summary}</p>
              <p className="watchlist-ai-read-relevance">
                <strong>Day-trade impact:</strong> {read.catalystRealityCheck.dayTradeRelevance}
              </p>
            </section>
            <section className="watchlist-ai-read-section">
              <div className="watchlist-ai-read-section-heading">
                <h3>Dilution risk</h3>
                <span>{formatAiReadTag(read.dilutionRisk.level)}</span>
              </div>
              <p>{read.dilutionRisk.summary}</p>
              {read.dilutionRisk.companyIssuance || read.dilutionRisk.publicResale ? (
                <div className="watchlist-ai-read-dilution-timing">
                  <p className="watchlist-ai-read-dilution-today">
                    <strong>Can the company issue shares today?</strong>{" "}
                    {read.dilutionRisk.canCompanyIssueToday === true
                      ? "Yes, based on the cited mechanism."
                      : read.dilutionRisk.canCompanyIssueToday === false
                        ? "No; a source-backed gate or future event remains."
                        : "Not confirmed from the available sources."}
                  </p>
                  {read.dilutionRisk.companyIssuance ? (
                    <DilutionTimingRow label="Company issuance" lane={read.dilutionRisk.companyIssuance} />
                  ) : null}
                  {read.dilutionRisk.publicResale ? (
                    <DilutionTimingRow label="Public resale" lane={read.dilutionRisk.publicResale} />
                  ) : null}
                </div>
              ) : null}
              <p className="watchlist-ai-read-relevance">
                <strong>Day-trade impact:</strong> {read.dilutionRisk.dayTradeRelevance}
              </p>
            </section>
          </>
        ) : null}
        {read.riskSummary.length > 0 ? (
          <section className="watchlist-ai-read-section">
            <h3>Intraday risk checks</h3>
            <ul>
              {read.riskSummary.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {read.externalResearchEnabled === true &&
       read.listingStatus.status !== "none" &&
      read.listingStatus.status !== "unknown" &&
      (read.listingStatus.immediacy === "near_term" ||
        read.listingStatus.immediacy === "immediate") &&
      read.listingStatus.sourceUrls.length > 0 ? (
        <section
          className="watchlist-ai-read-listing"
          data-immediacy={read.listingStatus.immediacy}
        >
          <div>
            <h3>Listing monitor</h3>
            <span>
              {formatAiReadTag(read.listingStatus.status)} · {formatAiReadTag(read.listingStatus.immediacy)}
            </span>
          </div>
          <p>{read.listingStatus.summary}</p>
          <p>
            <strong>Day-trade impact:</strong> {read.listingStatus.dayTradeRelevance}
          </p>
        </section>
      ) : null}

      {read.externalResearchEnabled === true && read.sources.length > 0 ? (
        <section className="watchlist-ai-read-section watchlist-ai-read-sources">
          <h3>Sources checked</h3>
          <ul>
            {read.sources.map((source) => (
              <li key={`${source.sourceType}-${source.url}`}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
                <span>
                  {source.sourceType === "press_release_sec_database"
                    ? "TradersLink press release / SEC database"
                    : "Supplemental web research"}
                </span>
                {source.evidence?.publishedAt ? (
                  <span>Published {source.evidence.publishedAt.slice(0, 10)}</span>
                ) : null}
                {source.evidence?.filingType ? <span>{source.evidence.filingType}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="watchlist-ai-read-meta">
        Market data as of {formatDateTime(read.dataAsOf)}. Generated {formatDateTime(read.generatedAt)}.
        AI-assisted preparation only; live price action and risk controls remain decisive. AI can make
        mistakes.
      </p>
    </article>
  );
}

function StructuredMarketStructureLines({ body }: { body: string }) {
  const lines = body
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  return (
    <>
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
    </>
  );
}

function StructuredMarketStructureCard({ body }: { body: string }) {
  return (
    <div className="watchlist-trader-read watchlist-structured-card-body">
      <StructuredMarketStructureLines body={body} />
    </div>
  );
}

function TechnicalContextLines({ card }: { card: LiveWatchlistCardContent }) {
  const lines = cleanGenericCardBody(card)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="watchlist-technical-context-lines">
      {lines.map((line, index) => {
        const match = line.match(/^([^:]{2,40}):\s*(.*)$/);
        if (!match) {
          return <p key={`${line}-${index}`}>{line}</p>;
        }
        const label = match[1] ?? "";
        const body = match[2] ?? "";
        return (
          <p key={`${line}-${index}`}>
            <strong>{label}:</strong>{" "}
            <span>{body}</span>
          </p>
        );
      })}
    </div>
  );
}

function TechnicalContextCard({ card }: { card: LiveWatchlistCardContent }) {
  return (
    <div className="watchlist-trader-read watchlist-structured-card-body">
      <TechnicalContextLines card={card} />
    </div>
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

function cleanLevelMapCardBody(card: LiveWatchlistCardContent): string {
  return stripInternalAtrLevelWording(cleanGenericCardBody(card))
    .split("\n")
    .filter((line) => !/^Current price:/i.test(line.trim()))
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

    const parsedArticles = parsed.articles
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

    const articlesByTitleAndDay = new Map<string, RecentNewsFilingArticle>();
    for (const article of parsedArticles) {
      const normalizedTitle = article.title.trim().toLowerCase().replace(/\s+/g, " ");
      const publishedAtMs = article.publishedAt ? Date.parse(article.publishedAt) : NaN;
      const publishedDay = Number.isFinite(publishedAtMs)
        ? new Date(publishedAtMs).toISOString().slice(0, 10)
        : "unknown";
      const key = `${normalizedTitle}\u0000${publishedDay}`;
      const existing = articlesByTitleAndDay.get(key);
      const existingPublishedAtMs = existing?.publishedAt ? Date.parse(existing.publishedAt) : NaN;

      if (
        !existing ||
        (Number.isFinite(publishedAtMs) &&
          (!Number.isFinite(existingPublishedAtMs) || publishedAtMs < existingPublishedAtMs))
      ) {
        articlesByTitleAndDay.set(key, article);
      }
    }

    return [...articlesByTitleAndDay.values()].sort((left, right) => {
      const leftMs = left.publishedAt ? Date.parse(left.publishedAt) : NaN;
      const rightMs = right.publishedAt ? Date.parse(right.publishedAt) : NaN;
      if (!Number.isFinite(leftMs)) return 1;
      if (!Number.isFinite(rightMs)) return -1;
      return rightMs - leftMs;
    });
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

function closestLevelsCardFromState(symbol: LiveWatchlistSymbolState): LiveWatchlistCardContent | null {
  const levelMap = symbol.levelMap;
  if (!levelMap) {
    return null;
  }

  const lines = ["Resistance:"];
  lines.push(
    ...(levelMap.resistanceLevels.length
      ? levelMap.resistanceLevels.map((level) => stripInternalAtrLevelWording(level.label))
      : ["none"]),
  );
  lines.push("", "Support:");
  lines.push(
    ...(levelMap.supportLevels.length
      ? levelMap.supportLevels.map((level) => stripInternalAtrLevelWording(level.label))
      : ["none"]),
  );

  return {
    title: "Potential Path Levels",
    body: lines.join("\n"),
    updatedAt: symbol.updatedAt,
    priceWhenPosted: levelMap.currentPrice,
    source: "live_level_map",
    metadata: {
      nearestSupport: levelMap.nearestSupport?.price ?? null,
      nearestResistance: levelMap.nearestResistance?.price ?? null,
      nearestSupportLabel: levelMap.nearestSupport?.label ?? null,
      nearestResistanceLabel: levelMap.nearestResistance?.label ?? null,
    },
  };
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
    label === "Potential Path Levels" ||
    label === "Trader Read" ||
    label === "Market Structure" ||
    label === "Technical Context" ||
    label === "Company Info" ||
    label === "Full Ladder"
  ) {
    return false;
  }
  return normalizeCardTitle(label) !== normalizeCardTitle(card.title);
}

function shouldShowCardMeta(label: string): boolean {
  return (
    label !== "Company Info" &&
    label !== "Known Recent News / SEC Filings"
  );
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

function symbolActivationSortTime(symbol: LiveWatchlistSymbolState): number {
  return symbol.firstPostedAt ?? symbol.updatedAt;
}

function sortSymbolsByActivation(
  left: LiveWatchlistSymbolState,
  right: LiveWatchlistSymbolState,
): number {
  const timeDiff = symbolActivationSortTime(right) - symbolActivationSortTime(left);
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return left.symbol.localeCompare(right.symbol);
}

export function mergeSymbol(
  symbols: LiveWatchlistSymbolState[],
  next: LiveWatchlistSymbolState,
): LiveWatchlistSymbolState[] {
  const existing = symbols.find((item) => item.symbol === next.symbol);
  if (existing && !isNewerLiveWatchlistSymbolState(existing, next)) {
    return symbols;
  }
  const without = symbols.filter((item) => item.symbol !== next.symbol);
  if (next.status === "deactivated") {
    return without;
  }
  return [next, ...without].sort(sortSymbolsByActivation);
}

function isPostmarketAddition(symbol: LiveWatchlistSymbolState): boolean {
  return getLiveWatchlistEntryGroup(symbol) === "postmarket";
}

function WatchlistLifecycleBadge({ symbol }: { symbol: LiveWatchlistSymbolState }) {
  const lifecycle = symbol.watchlistLifecycle;
  if (symbol.watchlistLifecycleLabelsVisible !== true || !lifecycle) {
    return null;
  }
  return (
    <span
      className="watchlist-lifecycle-badge"
      data-lifecycle-status={lifecycle.status}
      title={lifecycle.reason}
    >
      {lifecycle.label}
    </span>
  );
}

function WatchlistTickerTable({
  ariaLabel,
  symbols,
}: {
  ariaLabel: string;
  symbols: LiveWatchlistSymbolState[];
}) {
  return (
    <section className="watchlist-table" aria-label={ariaLabel}>
      <div className="watchlist-table-head">
        <span>Ticker</span>
        <span>
          Price <small className="watchlist-price-delay-note">(may be slightly delayed)</small>
        </span>
        <span>Added</span>
        <span>Updated</span>
        <span>Details</span>
      </div>
      {symbols.map((symbol) => {
        const countryFlag = getWatchlistCountryFlag(symbol.cards.companyInfo?.metadata?.country);
        return (
          <Link
            key={symbol.symbol}
            href={`/watchlist/${symbol.symbol}`}
            className="watchlist-row"
          >
            <span className="watchlist-symbol-cell">
              <strong>
                {symbol.symbol}
                {countryFlag ? (
                  <>
                    {" "}
                    <span
                      className={`fi fi-${countryFlag.code.toLowerCase()} watchlist-country-flag`}
                      role="img"
                      aria-label={`${countryFlag.label} flag`}
                      title={countryFlag.label}
                    />
                  </>
                ) : null}
              </strong>
              <WatchlistLifecycleBadge symbol={symbol} />
            </span>
            <span className="watchlist-mobile-field" data-mobile-label="Price (may be slightly delayed)">
              {formatPrice(symbol.latestPrice)}
            </span>
            <span className="watchlist-mobile-field" data-mobile-label="Added" style={watchlistTimeCellStyle}>
              {formatDateTime(symbol.firstPostedAt)}
            </span>
            <span className="watchlist-mobile-field" data-mobile-label="Updated" style={watchlistTimeCellStyle}>
              {formatTime(symbol.updatedAt)}
            </span>
            <span className="watchlist-mobile-field watchlist-details-cell" data-mobile-label="Details">
              View details
            </span>
          </Link>
        );
      })}
    </section>
  );
}

function WatchlistDetailCardArticle({
  label,
  card,
  symbol,
}: {
  label: string;
  card: LiveWatchlistCardContent | null | undefined;
  symbol: LiveWatchlistSymbolState;
}) {
  const hasContent = Boolean(card);

  return (
    <article
      className="academy-card watchlist-content-card"
      data-card-label={label}
    >
      <div className="academy-card-topline">
        <WatchlistCardKicker label={label} />
        {label === "Potential Path Levels" ? (
          <Link
            href="/watchlist/how-it-works"
            className="watchlist-card-guide-link"
          >
            How it works
          </Link>
        ) : null}
      </div>
      {hasContent ? (
        <>
          {card && shouldShowCardTitle(label, card) ? (
            <h2 className="academy-card-title">{card.title}</h2>
          ) : null}
          {label === "Known Recent News / SEC Filings" ? (
            card ? <RecentNewsFilingsCard card={card} /> : null
          ) : label === "Potential Path Levels" ? (
            card ? (
              <WatchlistV2PotentialPathCard
                symbol={symbol}
                fullLadderCard={symbol.cards.fullLadder}
              />
            ) : null
          ) : label === "Trader Read" ? (
            card ? <LiveTraderReadCard card={card} /> : null
          ) : label === "Market Structure" ? (
            card ? (
              <StructuredMarketStructureCard
                body={cleanMarketStructureBody(card, symbol.cards.liveTraderRead)}
              />
            ) : null
          ) : label === "Technical Context" ? (
            card ? <TechnicalContextCard card={card} /> : null
          ) : label === "Company Info" ? (
            card ? <pre>{cleanCompanyInfoBody(card.body)}</pre> : null
          ) : (
            card ? <pre>{cleanGenericCardBody(card)}</pre> : null
          )}
          {card && shouldShowCardMeta(label) ? (
            <p className="watchlist-card-meta">
              Updated {formatTime(card.updatedAt)} | Price when posted{" "}
              {formatPrice(card.priceWhenPosted)}
            </p>
          ) : null}
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
  );
}

function PotentialGainCard({ symbol }: { symbol: LiveWatchlistSymbolState }) {
  const gain = symbol.potentialGain;

  return (
    <article
      className="academy-card watchlist-content-card watchlist-potential-gain-card"
      data-card-label="Potential Gain"
    >
      <div className="academy-card-topline">
        <WatchlistCardKicker label="Potential Gain" />
      </div>
      {gain ? (
        <>
          <div>
            <p className="watchlist-potential-gain">
              {formatPercentPoints(gain.potentialGainPct)}
            </p>
            <p className="watchlist-potential-gain-label">Best observed move</p>
          </div>
          <div className="watchlist-potential-gain-stats">
            <div className="watchlist-potential-gain-stat">
              <span>Added to watchlist</span>
              <strong>${formatPrice(gain.startingPrice)}</strong>
            </div>
            <div className="watchlist-potential-gain-stat">
              <span>Highest after added</span>
              <strong>${formatPrice(gain.highPrice)}</strong>
            </div>
            <div className="watchlist-potential-gain-stat">
              <span>High observed</span>
              <strong>{formatDateTime(gain.highPriceAt)}</strong>
            </div>
          </div>
          <p className="watchlist-potential-gain-note">
            {gain.startingPriceAt - gain.postedAt <= 5 * 60 * 1000
              ? `Tracked from posting at ${formatDateTime(gain.postedAt)}.`
              : `Tracking began at ${formatDateTime(gain.startingPriceAt)} after the ticker was posted at ${formatDateTime(gain.postedAt)}.`}{" "}
            Based on observed live prices after tracking began.
          </p>
        </>
      ) : (
        <>
          <h2 className="academy-card-title">Waiting for a starting price</h2>
          <p className="academy-card-text">
            Potential gain will begin tracking when the first live price is available after
            this ticker is posted.
          </p>
        </>
      )}
    </article>
  );
}

function WatchlistDetailCards({ symbol }: { symbol: LiveWatchlistSymbolState }) {
  const liveClosestLevelsCard = closestLevelsCardFromState(symbol);
  const closestLevelsCard = liveClosestLevelsCard ?? symbol.cards.nearestSupportResistance;
  const traderReadCard = symbol.cards.liveTraderRead;
  const tradersLinkAiReadCard = symbol.cards.tradersLinkAiRead;
  const recentNewsFilingsCard = symbol.cards.recentNewsFilings;
  const companyInfoCard = symbol.cards.companyInfo;
  const highRiskWarning = buildWatchlistHighRiskWarning({
    country: companyInfoCard?.metadata?.country,
    aiReadCard: tradersLinkAiReadCard,
    referenceTime: symbol.updatedAt,
  });

  return (
    <section className="watchlist-card-grid">
      {highRiskWarning ? (
        <aside className="watchlist-high-risk-warning" aria-label="High risk warning">
          <h2>High Risk</h2>
          <p>{highRiskWarning.message}</p>
        </aside>
      ) : null}
      <WatchlistDetailCardArticle
        label="Potential Path Levels"
        card={closestLevelsCard}
        symbol={symbol}
      />
      {symbol.tradersLinkAiReadCardVisible !== false && tradersLinkAiReadCard ? (
        <TradersLinkAiReadCard
          card={tradersLinkAiReadCard}
          livePrice={symbol.latestPrice}
          liveVolumeContext={symbol.liveVolumeContext}
          dipBuyPlanVisible={symbol.tradersLinkAiReadDipBuyPlanVisible !== false}
        />
      ) : symbol.tradersLinkAiReadCardVisible !== false ? (
        <article
          className="academy-card watchlist-content-card watchlist-ai-read-card"
          data-card-label="TradersLink AI Read"
        >
          <div className="academy-card-topline">
            <WatchlistCardKicker label="TradersLink AI Read" />
          </div>
          <h2 className="academy-card-title">Read unavailable</h2>
          <p className="academy-card-text">
            No saved AI Read is available for this ticker. No pullback or recovery levels have
            been manufactured.
          </p>
        </article>
      ) : null}
      {recentNewsFilingsCard ? (
        <WatchlistDetailCardArticle
          label="Known Recent News / SEC Filings"
          card={recentNewsFilingsCard}
          symbol={symbol}
        />
      ) : null}
      {symbol.potentialGainCardVisible !== false ? (
        <PotentialGainCard symbol={symbol} />
      ) : null}
      {companyInfoCard ? (
        <WatchlistDetailCardArticle
          label="Company Info"
          card={companyInfoCard}
          symbol={symbol}
        />
      ) : null}
      {traderReadCard ? (
        <WatchlistDetailCardArticle
          label="Trader Read"
          card={traderReadCard}
          symbol={symbol}
        />
      ) : null}
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
  const activeSymbols = symbols.filter((symbol) => symbol.watchlistSlotState !== "followup");
  const reversalWatchSymbols = symbols.filter(
    (symbol) => symbol.watchlistSlotState === "followup" && symbol.reversalWatchEligible === true,
  );
  const reversalWatchlistVisible = !symbols.some(
    (symbol) => symbol.reversalWatchlistVisible === false,
  );
  const showReversalWatchlist = shouldShowReversalWatchlist(
    reversalWatchlistVisible,
    reversalWatchSymbols.length,
  );
  const mainSessionSymbols = activeSymbols.filter((symbol) => !isPostmarketAddition(symbol));
  const postmarketSymbols = activeSymbols.filter(isPostmarketAddition);

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
        setSymbols((current) => reconcileLiveWatchlistSnapshot({
          current,
          incoming: payload.symbols,
          generatedAt: payload.generatedAt,
        }));
        setMarketDataStatus(payload.marketDataStatus);
        setMarketDataUpdatedAt(payload.marketDataUpdatedAt);
      }
    }

    const stream = new EventSource("/api/live-watchlist/stream");
    stream.addEventListener("ready", () => {
      void refresh();
    });
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
    stream.addEventListener("error", () => {
      void refresh();
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
            Active tickers currently on the live watchlist. Click or tap any
            row to open that ticker&apos;s detail page.
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
          <span>
            {activeSymbols.length} active
            {showReversalWatchlist ? ` / ${reversalWatchSymbols.length} reversal watch` : ""}
          </span>
          <span>{mainSessionSymbols.length} main / {postmarketSymbols.length} post-market</span>
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
        <div className="watchlist-session-lists">
          <section className="watchlist-session-list" aria-labelledby="watchlist-main-session-heading">
            <div className="watchlist-session-heading">
              <div>
                <p className="academy-eyebrow">Premarket + Regular Hours</p>
                <h2 id="watchlist-main-session-heading">Main Session</h2>
              </div>
              <span>{mainSessionSymbols.length}</span>
            </div>
            {mainSessionSymbols.length > 0 ? (
              <WatchlistTickerTable ariaLabel="Main-session watchlist tickers" symbols={mainSessionSymbols} />
            ) : <p className="watchlist-session-empty">No main-session tickers are active.</p>}
            {showReversalWatchlist ? (
              <div className="watchlist-reversal-list" aria-labelledby="watchlist-reversal-heading">
                <div className="watchlist-session-heading">
                  <div>
                    <p className="academy-eyebrow">Still on Watch</p>
                    <h2 id="watchlist-reversal-heading">Potential Reversal Watchlist</h2>
                  </div>
                  <span>{reversalWatchSymbols.length}</span>
                </div>
                <p className="watchlist-reversal-description">
                  Strong runners that have pulled back and are still being watched for a possible
                  reversal. A spot on this list does not mean a reversal has started.
                </p>
                <WatchlistTickerTable
                  ariaLabel="Potential reversal watchlist tickers"
                  symbols={reversalWatchSymbols}
                />
              </div>
            ) : null}
          </section>
          <section className="watchlist-session-list" aria-labelledby="watchlist-postmarket-heading">
            <div className="watchlist-session-heading">
              <div>
                <p className="academy-eyebrow">Added from 4:00-8:00 PM ET</p>
                <h2 id="watchlist-postmarket-heading">Post-Market</h2>
              </div>
              <span>{postmarketSymbols.length}</span>
            </div>
            {postmarketSymbols.length > 0 ? (
              <WatchlistTickerTable ariaLabel="Post-market watchlist tickers" symbols={postmarketSymbols} />
            ) : <p className="watchlist-session-empty">No post-market tickers are active.</p>}
          </section>
        </div>
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
    let cancelled = false;
    async function refresh() {
      const response = await fetch(`/api/live-watchlist/symbols/${initialSymbol.symbol}`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { symbol: LiveWatchlistSymbolState };
      if (!cancelled) {
        setSymbol((current) => isNewerLiveWatchlistSymbolState(current, payload.symbol) ? payload.symbol : current);
      }
      const stateResponse = await fetch("/api/live-watchlist");
      if (stateResponse.ok && !cancelled) {
        const statePayload = (await stateResponse.json()) as LiveWatchlistStatePayload;
        setMarketDataStatus(statePayload.marketDataStatus);
      }
    }
    const stream = new EventSource("/api/live-watchlist/stream");
    stream.addEventListener("ready", () => {
      void refresh();
    });
    stream.addEventListener("symbol", (event) => {
      const next = JSON.parse(event.data) as LiveWatchlistSymbolState;
      if (next.symbol === initialSymbol.symbol) {
        setSymbol((current) => isNewerLiveWatchlistSymbolState(current, next) ? next : current);
      }
    });
    stream.addEventListener("health", (event) => {
      const next = JSON.parse(event.data) as {
        marketDataStatus: LiveWatchlistMarketDataStatus;
      };
      setMarketDataStatus(next.marketDataStatus);
    });
    stream.addEventListener("error", () => {
      void refresh();
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
            <p className="academy-eyebrow">Ticker Details</p>
            <div className="watchlist-detail-title-row">
              <h1 className="academy-title">{symbol.symbol}</h1>
              <WatchlistLifecycleBadge symbol={symbol} />
            </div>
          </div>
          <Link href="/watchlist" className="academy-card-action watchlist-back-action">
            Back to watchlist
          </Link>
        </div>
        <div className="watchlist-summary-panel">
          <span>Price {formatPrice(symbol.latestPrice)}</span>
          {symbol.watchlistSlotState === "followup" ? <span>Follow-up Watch</span> : null}
          <span>Posted {formatDateTime(symbol.firstPostedAt)}</span>
          <span>Updated {formatTime(symbol.updatedAt)}</span>
          <span data-market-data-status={marketDataStatus}>
            {formatMarketDataStatusLabel(marketDataStatus)}
          </span>
        </div>
      </section>

      <WatchlistDetailCards symbol={symbol} />
      <TradingViewChart symbol={symbol} />
    </div>
  );
}

export function LiveWatchlistArchiveIndex({
  archives,
  currentPage,
  totalArchives,
  totalPages,
}: {
  archives: LiveWatchlistArchiveSnapshot[];
  currentPage: number;
  totalArchives: number;
  totalPages: number;
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
          <span>{totalArchives} {totalArchives === 1 ? "archive" : "archives"}</span>
        </div>
      </section>

      {archives.length === 0 ? (
        <section className="academy-card watchlist-empty">
          <h2>No tickers have been archived yet</h2>
        </section>
      ) : (
        <>
          <section className="watchlist-table" aria-label="Archived watchlist tickers">
            <div className="watchlist-table-head watchlist-archive-table-head">
              <span>Ticker</span>
              <span>Archived</span>
              <span>Last active update</span>
              <span>Ticker Details</span>
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
                <span
                  className="watchlist-mobile-field watchlist-details-cell"
                  data-mobile-label="Ticker Details"
                >
                  Ticker Details
                </span>
              </Link>
            ))}
          </section>
          {totalPages > 1 ? (
            <nav className="watchlist-archive-pagination" aria-label="Archived ticker pages">
              {currentPage > 1 ? (
                <Link href={`/watchlist/archive?page=${currentPage - 1}`}>Previous</Link>
              ) : (
                <span aria-disabled="true">Previous</span>
              )}
              <strong>Page {currentPage} of {totalPages}</strong>
              {currentPage < totalPages ? (
                <Link href={`/watchlist/archive?page=${currentPage + 1}`}>Next</Link>
              ) : (
                <span aria-disabled="true">Next</span>
              )}
            </nav>
          ) : null}
        </>
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
