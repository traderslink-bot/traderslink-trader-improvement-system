import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SiteShell } from "@/src/components/site/site-shell";
import smokeysLessonsImage from "@/app/news/images/smokeys-lessons/smokeys-lessons-blue-news.png";
import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import {
  getAcademyCoursePage,
  getAcademyCourses,
  getLaunchAcademyCourseIds,
} from "@/src/lib/academy/academy-content";
import { AcademyProgressStore } from "@/src/lib/academy/academy-progress-store";
import {
  getNewsArticle,
  type NewsArticle,
} from "@/src/lib/news/news-article-store";
import {
  formatFinnhubCountry,
  formatFinnhubExchange,
  formatFinnhubMarketCap,
  formatFinnhubWebsite,
  getFinnhubCompanyProfile,
} from "@/src/lib/news/finnhub-company-profile";

type PageProps = {
  params: Promise<{
    ticker: string;
    slug: string;
  }>;
};

type NewsArticleAccessMode = "full" | "free";

type NewsSectionIcon =
  | "assessment"
  | "book"
  | "check"
  | "levels"
  | "negative"
  | "rule"
  | "trendUp";

type NewsSectionIconTone = "primary" | "success" | "warning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chartReadingCourseId = "chart-reading-market-structure";
const candlestickModuleIds = new Set([
  "bullish-candle-patterns",
  "bearish-candle-patterns",
  "indecision-neutral-candles",
  "momentum-continuation-candles",
  "session-gap-behavior",
]);
const chartPatternModuleIds = new Set(["chart-patterns-context"]);

function asText(value: unknown, fallback = "N/A"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function asMultilineText(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
    : "";
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function boolText(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not specified";
}

function detailRow(label: string, value: string): [string, string] {
  return [label, value];
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLevelsText(value: unknown): string {
  return asMultilineText(value)
    .replace(/\*\*/g, "")
    .replace(/_/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

function isSecArticle(article: NewsArticle, eventType: string): boolean {
  const sourceHostname = asText(article.metadata.sourceHostname, "");

  return (
    Boolean(article.sourceUrl?.includes("sec.gov")) ||
    sourceHostname.includes("sec.gov") ||
    eventType.toLowerCase().startsWith("sec_")
  );
}

function DetailTile({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="news-detail-tile">
      <p className="news-detail-label">{label}</p>
      <p className="news-detail-value">
        {href ? (
          <a href={href} rel="noopener noreferrer" target="_blank">
            {value}
          </a>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function SectionCard({
  children,
  className,
  icon,
  iconTone = "primary",
  kicker,
  title,
}: {
  children: ReactNode;
  className?: string;
  icon?: NewsSectionIcon;
  iconTone?: NewsSectionIconTone;
  kicker?: string;
  title: string;
}) {
  return (
    <section className={["news-surface-card", className].filter(Boolean).join(" ")}>
      {kicker ? <p className="news-card-kicker">{kicker}</p> : null}
      <div className="news-card-heading">
        {icon ? (
          <span
            aria-hidden="true"
            className={`news-section-icon news-section-icon-${iconTone}`}
          >
            <NewsSectionIconGraphic icon={icon} />
          </span>
        ) : null}
        <h2 className="news-card-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function NewsSectionIconGraphic({ icon }: { icon: NewsSectionIcon }) {
  switch (icon) {
    case "assessment":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 19h16v2H4v-2Zm1-5h3v3H5v-3Zm5-5h3v8h-3V9Zm5-4h3v12h-3V5Z" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M5 4.5A3.5 3.5 0 0 1 8.5 1H21v17H8.5A1.5 1.5 0 0 0 7 19.5 1.5 1.5 0 0 0 8.5 21H21v2H8.5A3.5 3.5 0 0 1 5 19.5v-15Zm2 11.34A3.48 3.48 0 0 1 8.5 15H19V3H8.5A1.5 1.5 0 0 0 7 4.5v11.34Z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M10.2 16.6 5.8 12.2l1.4-1.4 3 3 6.6-6.6 1.4 1.4-8 8ZM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h14V5H5Z" />
        </svg>
      );
    case "rule":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 2h8v2H8V8Zm0 4h5v2H8v-2Z" />
        </svg>
      );
    case "levels":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 6h16v2H4V6Zm3 5h10v2H7v-2Zm-3 5h16v2H4v-2Zm2-1a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm12-5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-3 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
        </svg>
      );
    case "negative":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M12 3 2.7 20h18.6L12 3Zm0 4.15L17.9 18H6.1L12 7.15ZM11 10h2v4h-2v-4Zm0 5h2v2h-2v-2Z" />
        </svg>
      );
    case "trendUp":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M3.4 18 2 16.6l7.4-7.4 4 4L18.6 8H15V6h7v7h-2V9.4L13.4 16l-4-4-6 6Z" />
        </svg>
      );
  }
}

function BulletList({
  empty,
  items,
  tone,
}: {
  empty: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  if (items.length === 0) {
    return <p className="news-muted">{empty}</p>;
  }

  return (
    <ul className={`news-bullet-list news-bullet-list-${tone}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export async function buildNewsArticleMetadata({
  accessMode = "full",
  params,
}: PageProps & { accessMode?: NewsArticleAccessMode }): Promise<Metadata> {
  const { ticker, slug } = await params;
  const article = await getNewsArticle(ticker, slug);
  const basePath = accessMode === "free" ? "/news/free" : "/news";

  if (!article) {
    return {
      title: "News Article Not Found | TradersLink",
    };
  }

  return {
    title: `${article.ticker}: ${article.headline} | TradersLink News`,
    description:
      article.summary ||
      `Trader-focused press release summary and context for ${article.ticker}.`,
    alternates: {
      canonical: `${basePath}/${article.ticker}/${article.slug}`,
    },
    openGraph: {
      title: `${article.ticker}: ${article.headline}`,
      description: article.summary || undefined,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  return buildNewsArticleMetadata(props);
}

export async function NewsArticleView({
  accessMode = "full",
  params,
}: PageProps & { accessMode?: NewsArticleAccessMode }) {
  const { ticker, slug } = await params;
  const article = await getNewsArticle(ticker, slug);

  if (!article) {
    notFound();
  }

  const rawPayload = getRecord(article.rawPayload);
  const ai = getRecord(rawPayload.ai);
  const metadata = article.metadata;
  const eventType = asText(article.eventType || ai.eventType);
  const filingType = asText(metadata.filingType || ai.filingType);
  const secArticle = isSecArticle(article, eventType);
  const supportResistanceLevels = formatLevelsText(
    metadata.supportResistanceLevels ||
      rawPayload.supportResistanceLevels ||
      rawPayload.levelsText,
  );
  const showLockedLevelsCard = accessMode === "free";
  const alertSummary =
    article.summary ||
    asText(ai.summary || rawPayload.summary, "No AI summary was stored.");
  const companyProfile = await getFinnhubCompanyProfile(article.ticker);
  const companyWebsite = formatFinnhubWebsite(companyProfile?.weburl ?? null);
  const companyInfoRows = [
    { label: "Company", value: companyProfile?.name ?? null },
    { label: "Exchange", value: formatFinnhubExchange(companyProfile?.exchange ?? null) },
    { label: "Industry", value: companyProfile?.industry ?? null },
    { label: "Country", value: formatFinnhubCountry(companyProfile?.country ?? null) },
    { label: "Website", value: companyWebsite, href: companyWebsite ?? undefined },
    {
      label: "Market cap",
      value: formatFinnhubMarketCap(companyProfile?.marketCapitalization ?? null),
    },
    {
      label: "Shares outstanding",
      value: formatFinnhubMarketCap(companyProfile?.shareOutstanding ?? null),
    },
  ].filter((row): row is { label: string; value: string; href?: string } => Boolean(row.value));
  const dilutionRows: Array<[string, string]> = [
    detailRow("Can dilute today", boolText(metadata.canDiluteToday ?? ai.canDiluteToday)),
    detailRow("Earliest dilution", asText(metadata.earliestDilution || ai.earliestDilution)),
    detailRow("Dilution status", asText(metadata.dilutionStatus || ai.dilutionStatus)),
    detailRow("Dilution timing", asText(metadata.dilutionTiming || ai.dilutionTiming)),
    detailRow("Trigger type", asText(metadata.dilutionTriggerType || ai.dilutionTriggerType)),
    detailRow("Trigger date", asText(metadata.dilutionTriggerDate || ai.dilutionTriggerDate)),
  ].filter(([, value]) => value !== "N/A" && value !== "Not specified");
  const academyCourses = getAcademyCourses();
  const availableCourses = getLaunchAcademyCourseIds()
    .map((courseId) => {
      const course = academyCourses.find((item) => item.course_id === courseId);
      const coursePage = getAcademyCoursePage(courseId);

      return course && coursePage ? { course, coursePage } : null;
    })
    .filter((item) => item !== null);
  const academySession = await getCurrentAcademySession();
  const completedLessonSlugs = academySession
    ? new Set(
        await new AcademyProgressStore().listCompletedLessonSlugs(
          academySession.discordUserId,
        ),
      )
    : new Set<string>();

  return (
    <SiteShell sectionHref="/news" sectionLabel="News">
      <article className="academy-container news-article-page">
        <div className="news-article-stack">
          <header className="news-surface-card news-article-header-card">
            <div className="news-article-header-copy">
              <div className="news-chip-row">
                <span className="news-chip news-chip-primary">${article.ticker}</span>
                <span className="news-chip">{formatDate(article.publishedAt)}</span>
                <span className="news-chip">AI processed</span>
                {filingType !== "N/A" ? (
                  <span className="news-chip">{filingType}</span>
                ) : null}
              </div>
              <h1 className="news-article-title">{article.headline}</h1>
            </div>
          </header>

          <div className="news-dashboard-grid">
            <main className="news-main-stack">
              <SectionCard icon="assessment" title="AI Summary">
                <p className="news-body-copy">{alertSummary}</p>
              </SectionCard>

              <div className="news-two-column">
                <SectionCard
                  className="news-original-post-font-card"
                  icon="trendUp"
                  iconTone="success"
                  title="Positives"
                >
                  <BulletList
                    empty="No positive notes were stored with this alert."
                    items={article.positives}
                    tone="positive"
                  />
                </SectionCard>

                <SectionCard
                  className="news-original-post-font-card"
                  icon="negative"
                  iconTone="warning"
                  title="Negatives"
                >
                  <BulletList
                    empty="No negative notes were stored with this alert."
                    items={article.negatives}
                    tone="negative"
                  />
                </SectionCard>
              </div>

              {dilutionRows.length > 0 ? (
                <SectionCard
                  icon="rule"
                  kicker="Filing Context"
                  title="Filing and Dilution Context"
                >
                  <div className="news-detail-grid">
                    {dilutionRows.map(([label, value]) => (
                      <DetailTile key={label} label={label} value={value} />
                    ))}
                  </div>
                </SectionCard>
              ) : null}
            </main>

            <aside className="news-sidebar-stack">
              <SectionCard icon="check" title="Company Info">
                {companyInfoRows.length > 0 ? (
                  <div className="news-detail-grid news-detail-grid-compact">
                    {companyInfoRows.map(({ href, label, value }) => (
                      <DetailTile key={label} href={href} label={label} value={value} />
                    ))}
                  </div>
                ) : (
                  <p className="news-muted">
                    Company information is temporarily unavailable.
                  </p>
                )}
                {article.sourceUrl && secArticle ? (
                  <a
                    className="news-secondary-action news-sec-source-link"
                    href={article.sourceUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open SEC filing
                  </a>
                ) : null}
              </SectionCard>

              {showLockedLevelsCard ? (
                <SectionCard icon="levels" title="Support and Resistance">
                  <div className="news-levels-locked-card">
                    <p className="news-levels-locked-title">
                      Support and resistance levels are available to paid users.
                    </p>
                    <p className="news-muted">
                      Upgrade to view the instant levels attached to this alert.
                    </p>
                  </div>
                </SectionCard>
              ) : supportResistanceLevels ? (
                <SectionCard icon="levels" title="Support and Resistance">
                  <pre className="news-levels-block">{supportResistanceLevels}</pre>
                </SectionCard>
              ) : null}

              {availableCourses.length > 0 ? (
                <SectionCard
                  icon="book"
                  kicker="Available Now"
                  title="Begin The Academy Path"
                >
                  <div className="academy-module-list news-academy-course-list">
                    {availableCourses.map(({ course, coursePage }) => {
                      const lessons = coursePage.modules.flatMap(
                        ({ lessons }) => lessons,
                      );
                      const progress = getCourseProgress(
                        lessons,
                        completedLessonSlugs,
                      );
                      const lessonGroupProgress = getCourseLessonGroupProgress(
                        course.course_id,
                        lessons,
                        completedLessonSlugs,
                      );

                      return (
                        <Link
                          className="academy-card academy-card-link"
                          href={course.course_slug}
                          key={course.course_id}
                        >
                          <div className="academy-card-topline">
                            <p className="academy-kicker">
                              Course {course.course_order}
                            </p>
                            <span className="academy-chip academy-chip-success">
                              Open now
                            </span>
                          </div>
                          <h3 className="academy-card-title">
                            {course.course_title}
                          </h3>
                          <p className="academy-card-text">
                            {course.course_outcome || course.display_model}
                          </p>
                          <div className="academy-chip-row">
                            <span className="academy-chip">
                              {coursePage.totalLessonCount} lessons
                            </span>
                          </div>
                          <div className="academy-course-progress">
                            <CourseProgressMeter
                              isAuthenticated={Boolean(academySession)}
                              label={
                                course.course_id === chartReadingCourseId
                                  ? "Core lessons"
                                  : undefined
                              }
                              progress={progress}
                            />
                            {lessonGroupProgress.map((groupProgress) => (
                              <CourseProgressMeter
                                isAuthenticated={Boolean(academySession)}
                                key={groupProgress.label}
                                label={groupProgress.label}
                                progress={groupProgress}
                              />
                            ))}
                          </div>
                          <span className="academy-card-action">Open course</span>
                        </Link>
                      );
                    })}
                  </div>
                </SectionCard>
              ) : null}

              {accessMode === "free" ? (
                <SectionCard
                  icon="trendUp"
                  kicker="Paid Discord Feed"
                  title="Unlock The Filtered Version"
                >
                  <div className="news-levels-locked-card">
                    <p className="news-levels-locked-title">
                      Get the paid version for filtered channels and instant levels.
                    </p>
                    <p className="news-muted">
                      The free feed is one news dump channel. Paid access separates alerts
                      into focused channels and unlocks the support and resistance levels
                      attached to each post.
                    </p>
                    <Link
                      className="news-secondary-action"
                      href="https://whop.com/traderslink-app/filtered-news-momentum-scanner-access/"
                    >
                      View paid access
                    </Link>
                  </div>
                </SectionCard>
              ) : (
                <section
                  aria-label="Learn Market Structure with Smokey"
                  className="news-surface-card news-smokeys-lessons-card"
                >
                  <Image
                    alt="Learn Market Structure with Smokey. 12 live lessons, 1 lesson per week, saved after each session."
                    className="news-smokeys-lessons-image"
                    placeholder="blur"
                    sizes="(min-width: 1080px) 22rem, calc(100vw - 2rem)"
                    src={smokeysLessonsImage}
                  />
                </section>
              )}
            </aside>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}

export default async function NewsArticlePage(props: PageProps) {
  return <NewsArticleView {...props} accessMode="full" />;
}

function getCourseProgress(
  lessons: Array<{
    lesson_slug: string;
    module_id: string;
    counts_toward_course_progress: boolean;
  }>,
  completedLessonSlugs: Set<string>,
) {
  const progressLessons = lessons.filter(
    (lesson) => lesson.counts_toward_course_progress,
  );
  const completed = progressLessons.filter((lesson) =>
    completedLessonSlugs.has(lesson.lesson_slug),
  ).length;
  const total = progressLessons.length;

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function getCourseLessonGroupProgress(
  courseId: string,
  lessons: Array<{
    lesson_slug: string;
    module_id: string;
    counts_toward_course_progress: boolean;
  }>,
  completedLessonSlugs: Set<string>,
) {
  if (courseId !== chartReadingCourseId) {
    return [];
  }

  return [
    getLessonGroupProgress(
      "Candlestick lessons",
      lessons.filter((lesson) => candlestickModuleIds.has(lesson.module_id)),
      completedLessonSlugs,
    ),
    getLessonGroupProgress(
      "Chart pattern lessons",
      lessons.filter((lesson) => chartPatternModuleIds.has(lesson.module_id)),
      completedLessonSlugs,
    ),
  ].filter((progress) => progress.total > 0);
}

function getLessonGroupProgress(
  label: string,
  lessons: Array<{
    lesson_slug: string;
  }>,
  completedLessonSlugs: Set<string>,
) {
  const completed = lessons.filter((lesson) =>
    completedLessonSlugs.has(lesson.lesson_slug),
  ).length;
  const total = lessons.length;

  return {
    completed,
    label,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function CourseProgressMeter({
  isAuthenticated,
  label,
  progress,
}: {
  isAuthenticated: boolean;
  label?: string;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
}) {
  return (
    <div className="academy-course-progress-row">
      {label ? (
        <p className="academy-course-progress-label">{label}</p>
      ) : null}
      <div className="academy-course-progress-track">
        <span
          className="academy-course-progress-fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="academy-course-progress-meta">
        <span>
          {isAuthenticated
            ? `${progress.percent}% complete`
            : "Log in to track progress"}
        </span>
        <span>
          {progress.completed}/{progress.total}
        </span>
      </div>
    </div>
  );
}
