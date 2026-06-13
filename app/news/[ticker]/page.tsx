import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/src/components/site/site-shell";
import { listNewsArticlesByTicker } from "@/src/lib/news/news-article-store";
import { formatNewsPublishedDate } from "@/src/lib/news/news-date-format";

type PageProps = {
  params: Promise<{
    ticker: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { ticker } = await params;
  const normalizedTicker = ticker.toUpperCase();

  return {
    title: `${normalizedTicker} News | TradersLink`,
    description: `Press releases and news context for ${normalizedTicker}.`,
    alternates: {
      canonical: `/news/${normalizedTicker}`,
    },
  };
}

export default async function TickerNewsPage({ params }: PageProps) {
  const { ticker } = await params;
  const normalizedTicker = ticker.toUpperCase();
  const articles = await listNewsArticlesByTicker(normalizedTicker);

  return (
    <SiteShell sectionHref="/news" sectionLabel="News" shellElement="div">
      <main className="academy-container news-ticker-page">
        <section className="academy-hero">
          <div className="academy-hero-copy">
            <p className="academy-eyebrow">Ticker News</p>
            <h1 className="academy-title-sm">${normalizedTicker} News</h1>
            <p className="academy-lede">
              Stored TradersLink news articles and press-release context for this
              ticker. Discord alerts link into these article pages when full
              article text is available.
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
                the first public article for this ticker.
              </p>
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
