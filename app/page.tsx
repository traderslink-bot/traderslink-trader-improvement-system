import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { LandingHeroCanvas } from "./landing-hero-canvas";
import { HomeScrollReveal } from "./home-scroll-reveal";
import { getAcademyCoursePage } from "@/src/lib/academy/academy-content";
import { TRADERSLINK_TWITTER_HANDLE } from "@/src/lib/academy/academy-seo";

const discordInviteUrl = "https://discord.gg/rrq73JGfFf";
const whopPlanUrl =
  "https://whop.com/traderslink-app/filtered-news-momentum-scanner-access/";

export const metadata: Metadata = {
  title:
    "TradersLink | Small Cap Scanner, AI Press Releases, Academy, Trader Intelligence",
  description:
    "TradersLink is a suite of trading tools with a small cap scanner, AI-summarized press releases and SEC filings, Discord alerts, generated chart levels, TradersLink Academy, and Trader Intelligence coming soon.",
  keywords: [
    "TradersLink",
    "small cap scanner",
    "small cap press releases",
    "SEC filing alerts",
    "AI press release summaries",
    "stock scanner",
    "day trading alerts",
    "support and resistance levels",
    "trading academy",
    "free trading lessons",
    "TradersLink Academy",
    "chart levels",
    "generated chart levels",
    "AI chart following",
    "trader intelligence",
    "AI trading journal",
    "day trading analytics",
    "Discord trading tools",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TradersLink",
    description:
      "Small cap scanner alerts, AI-summarized press releases and SEC filings, generated chart levels, TradersLink Academy, and Trader Intelligence coming soon.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradersLink",
    description:
      "Join TradersLink for small-cap news alerts, scanner alerts, AI summaries, and support/resistance levels.",
    site: TRADERSLINK_TWITTER_HANDLE,
    creator: TRADERSLINK_TWITTER_HANDLE,
  },
};

const featureBlocks = [
  {
    eyebrow: "Press Release App v2",
    title: "AI summaries for small-cap press releases and SEC filings.",
    body: "The system watches small-cap news and filings, summarizes the important details with AI, filters the stream for items that may matter to active day traders, and sends real-time Discord alerts so traders can react faster.",
  },
  {
    eyebrow: "Live Scanner",
    title: "Movement detection with Discord alerts.",
    body: "The scanner runs live for small-cap stocks, detects movement, filters for day-trading usefulness, and pushes alerts into Discord.",
  },
  {
    eyebrow: "Chart Levels",
    title: "Auto-generated support and resistance attached to alerts.",
    body: "The levels system generates chart levels for scanner and press-release names, then the coming AI chart-following system will use market data and candles to flag level breaks, weakening setups, and possible dip areas as the chart develops.",
  },
  {
    eyebrow: "Coming Soon",
    title: "Trader Intelligence will be the execution-review tool.",
    body: "Trader Intelligence is the next tool in the TradersLink platform: broker execution imports, saved trade analytics, session timing, and trade review tied to saved evidence.",
  },
];

const pressFeatures = [
  "Small-cap press release monitoring with AI summaries",
  "SEC filing monitoring with concise day-trader-focused summaries",
  "Market scanner filters news and filings by movement and usefulness",
  "Live Discord scanner alerts for small-cap stock movement",
  "Live Discord alerts for press releases and SEC filings",
  "Auto-generated support/resistance levels attached to scanner and press-release cards",
  "Press-release trading cards with float, market cap, short interest, and stock context",
  "AI chart-following system for breaks, weakening setups, and dip areas coming soon",
  "Trader Intelligence execution-review system coming soon",
];

const seoTopics = [
  "Small cap stock scanner",
  "AI press release summaries",
  "SEC filing alerts for traders",
  "Free trading academy",
  "Beginner trading lessons",
  "Day trading news scanner",
  "Support and resistance generation",
  "AI chart following for day traders",
  "Trader Intelligence execution review",
];

const faqItems = [
  {
    question: "What is TradersLink?",
    answer:
      "TradersLink is a suite of trading tools. The paid plan includes scanner and press-release/filing tools now, the free TradersLink Academy is open on the website, and Trader Intelligence is coming soon as another tool in the platform.",
  },
  {
    question: "What does the $30 USD plan include?",
    answer:
      "The paid $30 plan gets you Discord access to small cap news filtered by market cap up to $100M, the small cap momentum scanner, the news momentum scanner, and instant real-time support and resistance levels.",
  },
  {
    question: "Is TradersLink Academy free?",
    answer:
      "Yes. TradersLink Academy is free. Anyone can read the open Academy lessons, and free TradersLink Discord members can log in with Discord to track lesson progress across the Academy.",
  },
  {
    question: "How does paid access work?",
    answer:
      "Paid access is handled through Whop. After checkout, connect your Discord account to Whop so the paid channels unlock for your account.",
  },
];

export default function Home() {
  const chartReadingCoursePage = getAcademyCoursePage(
    "chart-reading-market-structure",
  );
  const chartReadingCourse = chartReadingCoursePage?.course;
  const chartReadingModules = chartReadingCoursePage?.modules ?? [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TradersLink",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description:
      "Trading-tools platform with small cap scanner alerts, AI-summarized press releases and SEC filings, generated chart levels, TradersLink Academy, and Trader Intelligence coming soon.",
    offers: {
      "@type": "Offer",
      price: "30.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      category: "Discord paid plan",
    },
    featureList: pressFeatures,
  };

  return (
    <main className="tl-home min-h-screen overflow-hidden bg-[#020817] text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeScrollReveal />

      <section className="tl-home-hero relative min-h-[82vh] overflow-hidden border-b border-cyan-400/20">
        <LandingHeroCanvas />
        <div className="absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(2,8,23,0.96)_0%,rgba(2,8,23,0.8)_36%,rgba(2,8,23,0.28)_70%,rgba(2,8,23,0.08)_100%)]" />

        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center"
            aria-label="TradersLink homepage"
          >
            <span className="tl-home-logo-card flex h-12 w-[232px] items-center overflow-hidden rounded-md border border-sky-900/60 bg-[#011E56] px-3 shadow-[0_12px_30px_rgba(1,30,86,0.35)]">
              <Image
                alt="TradersLink"
                className="h-auto w-full"
                height={74}
                priority
                src="/logo-horizontal-main.png"
                width={360}
              />
            </span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              className="rounded-md border border-cyan-300/20 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/10"
              href="/academy"
            >
              Academy
            </Link>
            <Link
              className="rounded-md border border-cyan-300/20 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/10"
              href="/news"
            >
              News
            </Link>
            <Link
              className="rounded-md border border-cyan-300/20 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/10"
              href="/intelligence"
            >
              Intelligence
            </Link>
            <Link
              className="rounded-md border border-cyan-300/20 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/10"
              href="/account"
            >
              Account
            </Link>
            <Link
              className="rounded-md border border-cyan-300/20 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/10"
              href="/platform-readiness"
            >
              Readiness
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-12 pt-12 sm:px-8 lg:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)] lg:pb-16 lg:pt-20">
          <div
            className="tl-home-hero-copy flex max-w-4xl flex-col"
            data-home-animate
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Paid Discord access now open at $30 USD
            </p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              TradersLink Trading Tools
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300 sm:text-2xl">
              Small-cap scanner alerts, AI-summarized press releases and SEC
              filings, generated chart levels, TradersLink Academy, and the
              Trader Intelligence system coming soon for paid members.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whopPlanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tl-home-cta inline-flex min-h-12 items-center justify-center border border-cyan-300 bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Join the $30 plan
              </a>
              <a
                href={discordInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tl-home-cta tl-home-cta-secondary inline-flex min-h-12 items-center justify-center border border-cyan-300/50 bg-slate-950/50 px-5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200"
              >
                Join Free Discord
              </a>
            </div>
          </div>

          <aside
            className="tl-home-panel self-end border border-cyan-300/20 bg-slate-950/58 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur"
            aria-label="Paid plan summary"
            data-home-animate
          >
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-200">
              Paid Access
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-semibold text-white">$30.00</span>
              <span className="pb-2 text-sm text-slate-400">USD / month</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              The paid $30 plan gets you Discord access to small cap news
              filtered by market cap up to $100M, the small cap momentum
              scanner, the news momentum scanner, and instant real-time support
              and resistance levels.
            </p>
            <div className="mt-5 grid gap-2 text-sm text-slate-300">
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span>Scanner alerts</span>
                <span className="text-emerald-300">Included</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span>PR and SEC AI summaries</span>
                <span className="text-cyan-300">Included</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span>Generated chart levels</span>
                <span className="text-cyan-300">Included</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span>TradersLink Academy</span>
                <span className="text-emerald-300">Free</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span>Trader Intelligence</span>
                <span className="text-amber-300">Coming soon</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-800 pt-2">
                <span>AI chart-following system</span>
                <span className="text-amber-300">Coming soon</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section
        id="features"
        className="tl-home-section mx-auto grid w-full max-w-7xl gap-6 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]"
        data-home-animate
        data-scroll-reveal
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Feature overview
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold text-white sm:text-4xl">
            TradersLink is the trading-tools hub.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
            The website will bring the scanner, Press Release App v2, generated
            chart levels, and Trader Intelligence into one member area. Paid
            Discord members get access to the website and the Trader
            Intelligence system as they roll out.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featureBlocks.map((feature) => (
            <article
              key={feature.title}
              className="tl-home-card border border-slate-800 bg-slate-950/70 p-5"
              data-scroll-reveal
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                {feature.eyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="academy"
        className="tl-home-section tl-home-section-surface border-y border-slate-800 bg-slate-950 px-5 py-16 sm:px-8"
        data-home-animate
        data-scroll-reveal
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              TradersLink Academy
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              A free structured trading course path is open now.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              TradersLink Academy gives new and developing traders a clear path
              through trading foundations, chart reading, market structure, risk
              planning, catalysts, psychology, and trade review. Lessons are
              built to be read in order, revisited later, and connected to the
              tools TradersLink is building.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              The Academy is free. If you are a free member of the TradersLink
              Discord and you log in with your Discord account, the Academy can
              save lesson completion and show your progress across the course
              list.
            </p>
            <Link
              href="/academy"
              className="tl-home-cta mt-7 inline-flex min-h-12 items-center justify-center border border-cyan-300 bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Open TradersLink Academy
            </Link>
          </div>

          <div className="tl-home-panel border border-cyan-300/20 bg-[#041328] p-5">
            <div className="border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Featured course
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {chartReadingCourse?.course_title ??
                    "Chart Reading And Market Structure"}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {chartReadingCourse?.course_outcome ??
                  "Build a practical chart-reading foundation for small cap trading: read candles in context, map levels, understand breaks and reclaims, recognize structure changes, and use chart patterns as references."}
              </p>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                <span className="border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-emerald-200">
                  Open now
                </span>
                <span className="border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">
                  {chartReadingCoursePage?.totalLessonCount ?? 93} lessons
                </span>
                <span className="border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
                  {chartReadingModules.length} modules
                </span>
              </div>

              <div className="mt-5 grid gap-2">
                {chartReadingModules.map(({ module, lessons }) => (
                  <div
                    key={module.module_id}
                    className="tl-home-list-row border-t border-slate-800 py-3"
                    data-scroll-reveal
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 bg-cyan-300" />
                      <div>
                        <p className="font-semibold text-slate-100">
                          {module.module_title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {lessons.length} lessons
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={chartReadingCourse?.course_slug ?? "/academy"}
                className="tl-home-cta tl-home-cta-secondary mt-5 inline-flex min-h-11 items-center justify-center border border-cyan-300/50 bg-slate-950/50 px-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200"
              >
                Open Chart Reading Course
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="levels"
        className="tl-home-section tl-home-section-surface border-y border-slate-800 bg-[#041328] px-5 py-16 sm:px-8"
        data-home-animate
        data-scroll-reveal
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.52fr)_minmax(320px,0.48fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              Scanner + press release alerts
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Press Release App v2 filters the news stream.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              The system collects small-cap press releases and SEC filings,
              summarizes them with AI, and filters them through the market
              scanner plus a usefulness score for day trading. Alerts go to the
              Discord when the system finds movement, news, or filings worth
              watching. Press-release alerts are designed like trading cards,
              with stock context such as float size, market cap, short interest,
              generated levels, and the AI summary in one place.
            </p>
          </div>
          <div className="grid gap-3">
            {pressFeatures.map((feature) => (
              <div
                key={feature}
                className="tl-home-list-row flex items-start gap-3 border-t border-slate-700/70 py-3"
                data-scroll-reveal
              >
                <span className="mt-1 h-2 w-2 shrink-0 bg-cyan-300" />
                <span className="text-sm leading-6 text-slate-200">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="tl-home-section mx-auto w-full max-w-7xl px-5 py-16 sm:px-8"
        data-home-animate
        data-scroll-reveal
      >
        <div className="grid gap-5 md:grid-cols-3">
          <div
            className="tl-home-card border border-slate-800 bg-slate-950 p-5"
            data-scroll-reveal
          >
            <div className="text-3xl font-semibold text-cyan-300">01</div>
            <h3 className="mt-4 text-xl font-semibold text-white">
              Scan the market
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Detect small-cap movement and route high-priority symbols into
              live Discord scanner alerts.
            </p>
          </div>
          <div
            className="tl-home-card border border-slate-800 bg-slate-950 p-5"
            data-scroll-reveal
          >
            <div className="text-3xl font-semibold text-emerald-300">02</div>
            <h3 className="mt-4 text-xl font-semibold text-white">
              Generate levels
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Attach auto-generated support and resistance to scanner and
              press-release names. The coming AI chart-following system will use
              market data and candles to track level breaks, weakening setups,
              and possible dip areas.
            </p>
          </div>
          <div
            className="tl-home-card border border-slate-800 bg-slate-950 p-5"
            data-scroll-reveal
          >
            <div className="text-3xl font-semibold text-amber-300">03</div>
            <h3 className="mt-4 text-xl font-semibold text-white">
              Review the trade soon
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Trader Intelligence will add broker execution imports, saved trade
              analytics, and saved-evidence review for paid members.
            </p>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="tl-home-section mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.48fr)_minmax(320px,0.52fr)]"
        data-home-animate
        data-scroll-reveal
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Paid pricing
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
            Join the paid plan for $30.00 USD.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400">
            The paid $30 plan gets you Discord access to small cap news filtered
            by market cap up to $100M, the small cap momentum scanner, the news
            momentum scanner, and instant real-time support and resistance
            levels.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whopPlanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tl-home-cta tl-home-cta-green inline-flex min-h-12 items-center justify-center border border-emerald-300 bg-emerald-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            >
              Join the $30 plan
            </a>
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tl-home-cta tl-home-cta-secondary inline-flex min-h-12 items-center justify-center border border-cyan-300/50 bg-slate-950/50 px-5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200"
            >
              Join Free Discord
            </a>
          </div>
        </div>
        <div className="tl-home-panel border border-cyan-300/25 bg-slate-950 p-6">
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            What paid members get
          </div>
          <div className="mt-5 grid gap-4">
            {[
              "Paid Discord access at $30.00 USD",
              "Discord feedback loop while features are shipping",
              "Live scanner, press release, and SEC filing alerts",
              "Website access as scanner, generated levels, AI chart following, and Trader Intelligence roll out",
            ].map((item) => (
              <div
                key={item}
                className="tl-home-list-row border-t border-slate-800 pt-4 text-slate-200"
                data-scroll-reveal
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="tl-home-section tl-home-section-surface border-y border-slate-800 bg-slate-950 px-5 py-16 sm:px-8"
        data-home-animate
        data-scroll-reveal
      >
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Search-friendly topics
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Built for traders searching for better review and market prep.
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {seoTopics.map((topic) => (
              <span
                key={topic}
                className="tl-home-chip border border-slate-700 px-3 py-2 text-sm text-slate-300"
                data-scroll-reveal
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="tl-home-section mx-auto w-full max-w-7xl px-5 py-16 sm:px-8"
        data-home-animate
        data-scroll-reveal
      >
        <div className="grid gap-5 md:grid-cols-2">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="tl-home-card border border-slate-800 bg-slate-950 p-5"
              data-scroll-reveal
            >
              <h3 className="text-lg font-semibold text-white">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 px-5 py-8 text-sm text-slate-500 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span>TradersLink. Trading involves risk.</span>
        </div>
      </footer>
    </main>
  );
}
