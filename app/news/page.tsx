import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/src/components/site/site-shell";
import { listRecentNewsArticles } from "@/src/lib/news/news-article-store";
import { formatNewsPublishedDate } from "@/src/lib/news/news-date-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TradersLink News",
  description:
    "Stored TradersLink stock news, press-release, and filing article pages.",
  alternates: {
    canonical: "/news",
  },
};

export default async function NewsIndexPage() {
  const articles = await listRecentNewsArticles();
  const tickers = Array.from(new Set(articles.map((article) => article.ticker)));

  return (
    <SiteShell sectionHref="/news" sectionLabel="News" shellElement="div">
      <main className="academy-container news-ticker-page">
        <section className="academy-hero">
          <div className="academy-hero-copy">
            <p className="academy-eyebrow">TradersLink News</p>
            <h1 className="academy-title-sm">Small Cap News Context</h1>
            <p className="academy-lede">
              Saved TradersLink press-release and filing article pages. Discord
              alerts can link here when full article context is available.
            </p>
          </div>
        </section>

        <section className="academy-section">
          <div className="academy-section-heading">
            <div>
              <p className="academy-eyebrow">Published Articles</p>
              <h2 className="academy-section-title">Latest saved alerts</h2>
            </div>
          </div>

          {articles.length > 0 ? (
            <div className="news-article-list">
              {articles.map((article) => (
                <Link
                  className="news-article-list-card"
                  href={`/news/${article.ticker}/${article.slug}`}
                  key={article.id}
                >
                  <div className="news-chip-row">
                    <span className="news-chip news-chip-primary">
                      ${article.ticker}
                    </span>
                    <span className="news-chip">
                      {formatNewsPublishedDate(article.publishedAt)}
                    </span>
                    {article.eventType ? (
                      <span className="news-chip">
                        {article.eventType.replace(/_/g, " ")}
                      </span>
                    ) : null}
                  </div>
                  <h3>{article.headline}</h3>
                  {article.summary ? <p>{article.summary}</p> : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="news-empty-card">
              <h2>No stored articles yet</h2>
              <p>
                Publish a press-release alert with full article text to create
                the first public News article.
              </p>
            </div>
          )}
        </section>

        {tickers.length > 0 ? (
          <section className="academy-section">
            <div className="academy-section-heading">
              <div>
                <p className="academy-eyebrow">Ticker Pages</p>
                <h2 className="academy-section-title">Browse by ticker</h2>
              </div>
            </div>
            <div className="academy-chip-row">
              {tickers.map((ticker) => (
                <Link
                  className="academy-chip academy-chip-success"
                  href={`/news/${ticker}`}
                  key={ticker}
                >
                  ${ticker}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </SiteShell>
  );
}
