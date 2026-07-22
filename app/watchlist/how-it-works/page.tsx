import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/src/components/site/site-shell";

export const metadata: Metadata = {
  alternates: {
    canonical: "/watchlist/how-it-works",
  },
  description:
    "Learn how TradersLink Potential Path levels use real-time and historical market data to map meaningful support and resistance.",
  title: "How the Potential Path Works | TradersLink",
};

const strengthLevels = [
  {
    title: "Major",
    body: "The strongest overall chart evidence. A Major level may be tied to an important historical turning point, repeated reactions, several supporting price areas, or higher-timeframe price action. Major does not mean the level cannot break; it means the area deserves more attention when price reaches it.",
  },
  {
    title: "Strong",
    body: "Clear supporting evidence shows that buyers or sellers previously responded in this area. It may become an important trigger, target, dip area, or failure point depending on how price behaves.",
  },
  {
    title: "Moderate",
    body: "Useful chart evidence is present, but the area is not as established as a Strong or Major level. It may still produce a reaction, especially when volume and price action support it.",
  },
  {
    title: "Weak",
    body: "Limited evidence supports the area. It may matter temporarily, but it should generally receive less weight unless real-time price action begins confirming it.",
  },
];

const levelSources = [
  {
    title: "Daily Confluence",
    body: "Daily chart activity and more than one piece of price evidence support the same area. These levels may be especially meaningful for larger targets, deeper pullbacks, major breakouts, or important failures.",
  },
  {
    title: "Daily Structure",
    body: "A meaningful area from the daily chart, such as a previous high, low, close, breakout, or rejection. These levels can remain important even when they formed weeks or months earlier.",
  },
  {
    title: "4-Hour Confluence",
    body: "More than one piece of four-hour or overlapping chart evidence supports the area. It can identify an important intermediate level between short-term trading and larger daily structure.",
  },
  {
    title: "4-Hour Structure",
    body: "Meaningful price action from the four-hour chart. These levels often map the middle of a move and may act as pullback areas, breakout barriers, or targets before a larger daily level.",
  },
  {
    title: "Fresh Intraday",
    body: "Recent trading activity from the current or latest session created the level. It can be useful for immediate decisions, but it is newer and may be less established than a higher-timeframe level.",
  },
  {
    title: "Intraday Structure",
    body: "Shorter-term market activity created the level, such as a recent reaction, consolidation, or session high or low. Its importance can change quickly as the stock trades.",
  },
  {
    title: "Extension",
    body: "A possible price area beyond the clearest existing chart structure. It helps map an open area with few historical levels, but it is a possible objective rather than established support or resistance with the same history as a structural level.",
  },
];

export default function PotentialPathHowItWorksPage() {
  return (
    <SiteShell forcedTheme="light" shellElement="div">
      <main className="academy-container-narrow watchlist-guide-page">
        <section className="academy-hero watchlist-guide-hero">
          <div className="academy-hero-copy">
            <p className="academy-eyebrow">Potential Path</p>
            <h1 className="academy-title-sm">How the Potential Path Works</h1>
            <p className="academy-lede">
              The Potential Path shows the price areas that could matter most if
              a stock begins moving higher or lower. It helps you visualize
              possible routes for the trade—it does not predict exactly what the
              stock will do.
            </p>
          </div>
          <Link href="/watchlist" className="academy-card-action watchlist-guide-back-link">
            Back to watchlist
          </Link>
        </section>

        <section className="academy-section watchlist-guide-section">
          <p className="academy-section-label">The Foundation</p>
          <h2 className="academy-section-title">Where the information comes from</h2>
          <div className="academy-card watchlist-guide-copy-card">
            <p>
              The Potential Path is built from real market data. It combines
              real-time market data with historical market data to follow the
              stock&apos;s current price while identifying earlier areas where
              buyers or sellers became active.
            </p>
            <p>
              Multiple chart timeframes help separate short-term trading areas
              from larger, more established levels. As new market data becomes
              available, the current price and the importance of nearby levels
              may change.
            </p>
          </div>
        </section>

        <section className="academy-section watchlist-guide-section">
          <p className="academy-section-label">Reading the Card</p>
          <h2 className="academy-section-title">What each level tells you</h2>
          <div className="academy-card watchlist-guide-copy-card">
            <p>
              <strong>Support</strong> is an area where selling may slow and
              buyers may step in. <strong>Resistance</strong> is an area where
              buying may slow and sellers may appear. The percentage beside a
              level shows how far it is from the current price.
            </p>
            <p>
              Treat each level as a small price zone rather than an exact penny.
              A stock may turn just before it, trade briefly through it, or
              retest it before choosing a direction.
            </p>
            <div className="watchlist-guide-example" aria-label="Example level label">
              <strong>$1.25</strong>
              <span>+8.7%</span>
              <span>Major</span>
              <span>Daily Confluence</span>
            </div>
            <p className="watchlist-guide-note">
              Strength and source describe different things. In this example,
              Major describes the level&apos;s strength, while Daily Confluence
              explains where its supporting evidence comes from.
            </p>
          </div>
        </section>

        <section className="academy-section watchlist-guide-section">
          <p className="academy-section-label">Level Strength</p>
          <h2 className="academy-section-title">How much evidence supports the area</h2>
          <div className="watchlist-guide-grid">
            {strengthLevels.map((level) => (
              <article className="academy-card watchlist-guide-definition" key={level.title}>
                <h3>{level.title}</h3>
                <p>{level.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="academy-section watchlist-guide-section">
          <p className="academy-section-label">Level Source</p>
          <h2 className="academy-section-title">Where the chart evidence comes from</h2>
          <div className="watchlist-guide-grid">
            {levelSources.map((source) => (
              <article className="academy-card watchlist-guide-definition" key={source.title}>
                <h3>{source.title}</h3>
                <p>{source.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="academy-section watchlist-guide-section">
          <p className="academy-section-label">Level Dates</p>
          <h2 className="academy-section-title">Formed date and confirmed date</h2>
          <p className="watchlist-guide-intro">
            These dates belong to the actual market candles used to identify the
            level. They are not the date the watchlist post was published.
          </p>
          <div className="watchlist-guide-grid">
            <article className="academy-card watchlist-guide-definition">
              <h3>Formed Date</h3>
              <p>
                The date of the market candle that first created the price area.
                It helps distinguish a newly formed intraday area from a
                longer-standing historical level.
              </p>
            </article>
            <article className="academy-card watchlist-guide-definition">
              <h3>Confirmed Date</h3>
              <p>
                The date of a later market candle that provided meaningful
                evidence that the level was still being respected. This may be a
                rejection, reclaim, failed break, or another meaningful move away
                from the area. If no Confirmed Date appears, the level may not
                have received a separate qualifying reaction after it formed.
              </p>
            </article>
          </div>
          <p className="watchlist-guide-intro">
            A recent confirmation can make an older level more relevant because
            traders responded there again. It does not guarantee that the level
            will continue to hold.
          </p>
        </section>

        <section className="academy-section watchlist-guide-section">
          <p className="academy-section-label">Using the Map</p>
          <h2 className="academy-section-title">The path higher and lower</h2>
          <div className="watchlist-guide-grid">
            <article className="academy-card watchlist-guide-definition">
              <h3>The Path Higher</h3>
              <p>
                Levels above the current price show where the stock could meet
                resistance. A level becomes more meaningful when price approaches
                with strength and volume, breaks through and remains above it, or
                retests it from above and holds. A brief trade above resistance
                does not confirm a breakout.
              </p>
            </article>
            <article className="academy-card watchlist-guide-definition">
              <h3>The Path Lower</h3>
              <p>
                Levels below the current price show where buyers may become
                interested during a pullback. Look for price to stabilize,
                selling pressure to weaken, buyers to return, or a failed
                breakdown to reclaim the area. Support is not automatically a
                dip-buy signal.
              </p>
            </article>
          </div>
        </section>

        <section className="academy-section watchlist-guide-section">
          <p className="academy-section-label">Keeping It Useful</p>
          <h2 className="academy-section-title">Why some levels are not shown</h2>
          <div className="academy-card watchlist-guide-copy-card">
            <p>
              The card focuses on levels close enough to be useful for the
              current trade. It generally maps the practical path within
              approximately 30% of the current price.
            </p>
            <p>
              A level beyond that range may still appear when it is especially
              important or when no meaningful level exists closer to the stock.
              Very distant historical levels stay out of the main path so they
              do not distract from the immediate trade.
            </p>
            <p>
              Sometimes a stock genuinely has a large open area between two
              meaningful levels. The card will not add weak prices just to fill
              that space. A large gap means there may be limited chart structure
              in the area; it does not mean the stock will automatically travel
              to the next level.
            </p>
          </div>
        </section>

        <section className="academy-section watchlist-guide-section watchlist-guide-final">
          <div className="academy-card watchlist-guide-copy-card">
            <p className="academy-section-label">Important to Remember</p>
            <h2 className="academy-section-title">Use price action for confirmation</h2>
            <p>
              The Potential Path is a chart-reading guide, not a promise or a
              complete trade plan. Levels gain or lose importance based on how
              price behaves around them, including volume, momentum, liquidity,
              and the overall market.
            </p>
            <p>
              The best opportunities usually come from seeing confirmation at a
              meaningful area—not from buying or selling simply because a price
              level was reached.
            </p>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
