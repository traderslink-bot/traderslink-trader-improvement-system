import type { Metadata } from "next";

import { SiteShell } from "@/src/components/site/site-shell";

type PlanLesson = {
  lesson: number;
  title: string;
  topics: string[];
};

const planLessons: PlanLesson[] = [
  {
    lesson: 1,
    title: "How Price Actually Moves - Introduction to Market Structure",
    topics: [
      "What market structure is",
      "Higher highs & lower lows",
      "Trending vs ranging markets",
      "Swing highs & swing lows",
      "Fractal market behavior",
    ],
  },
  {
    lesson: 2,
    title: "Trend Continuation - Understanding Momentum & Pullbacks",
    topics: [
      "Impulsive vs corrective moves",
      "Strong vs weak pullbacks",
      "Continuation structure",
      "Momentum recognition",
      "Healthy vs weakening trends",
    ],
  },
  {
    lesson: 3,
    title: "Break of Structure (BOS) - Identifying Confirmation",
    topics: [
      "Valid BOS",
      "Internal vs external structure",
      "Confirmation logic",
      "Strong highs & lows",
      "Trend continuation confirmation",
    ],
  },
  {
    lesson: 4,
    title: "Change of Character (CHoCH) - Spotting Potential Reversals",
    topics: [
      "Early reversal signals",
      "Market transitions",
      "Failed continuation",
      "Trend exhaustion",
      "Reversal structure",
    ],
  },
  {
    lesson: 5,
    title: "Liquidity - Understanding Where Price Wants to Go",
    topics: [
      "Equal highs & lows",
      "Liquidity pools",
      "Stop hunts",
      "Inducement",
      "Liquidity sweeps",
    ],
  },
  {
    lesson: 6,
    title: "Supply & Demand - Institutional Reaction Zones",
    topics: ["Supply zones", "Demand zones", "Imbalances", "Mitigation"],
  },
  {
    lesson: 7,
    title:
      "Fair Value Gaps & Imbalances - Understanding Inefficient Price Movement",
    topics: [
      "Fair value gaps (FVGs)",
      "Imbalance fills",
      "Price inefficiency",
      "Continuation imbalances",
      "Confluence with structure",
    ],
  },
  {
    lesson: 8,
    title: "Multi-Timeframe Analysis - Building Market Context",
    topics: [
      "Higher timeframe bias",
      "Lower timeframe execution",
      "Top-down analysis",
      "Timeframe alignment",
      "Context building",
    ],
  },
  {
    lesson: 9,
    title: "Entry Models - Timing Trades with Structure",
    topics: [
      "Confirmation entries",
      "Aggressive vs conservative entries",
      "Retest entries",
      "Sweep + reclaim setups",
      "Entry timing",
    ],
  },
  {
    lesson: 10,
    title: "Risk Management - Protecting Capital & Managing Trades",
    topics: [
      "Position sizing",
      "Risk-to-reward",
      "Stop placement",
      "Trade management",
      "Emotional discipline",
    ],
  },
  {
    lesson: 11,
    title: "Building a Trading Framework - Creating a Repeatable Process",
    topics: [
      "Developing a trading system",
      "Daily analysis workflow",
      "Trade checklists",
      "Session planning",
      "Consistency & discipline",
    ],
  },
  {
    lesson: 12,
    title: "Live Market Breakdown - Putting Everything Together",
    topics: [
      "Full top-down analysis",
      "Live structure reading",
      "Liquidity mapping",
      "Trade planning",
      "Real-time market execution concepts",
    ],
  },
];

const courseDescription =
  "A view of what is inside the course: price movement, structure confirmation, liquidity, imbalances, multi-timeframe context, entry models, and risk.";

export const metadata: Metadata = {
  title: "Smokey's 12 Lesson Market Structure Plan | TradersLink",
  description: courseDescription,
  alternates: {
    canonical: "/smokeys-12-week-market-structure-plan",
  },
  openGraph: {
    title: "Smokey's 12 Lesson Market Structure Plan",
    description: courseDescription,
    type: "website",
  },
};

function LessonCard({ lesson }: { lesson: PlanLesson }) {
  return (
    <article className="academy-card grid gap-4 p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--academy-primary)] text-sm font-black text-[var(--academy-on-primary)]">
          {lesson.lesson}
        </span>
        <span className="academy-lesson-status-badge">
          Lesson {lesson.lesson}
        </span>
      </div>

      <h2 className="m-0 text-xl font-black leading-tight text-[var(--academy-heading)]">
        {lesson.title}
      </h2>

      <ul className="grid gap-2 border-t border-[var(--academy-border)] pt-4">
        {lesson.topics.map((topic) => (
          <li
            className="grid grid-cols-[0.55rem_minmax(0,1fr)] items-start gap-3 text-sm leading-6 text-[var(--academy-muted)]"
            key={topic}
          >
            <span className="mt-[0.55rem] h-2 w-2 rounded-full bg-[var(--academy-primary)]" />
            <span>{topic}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function SmokeysMarketStructurePlanPage() {
  return (
    <SiteShell>
      <main className="academy-container">
        <section className="academy-hero">
          <div className="academy-hero-copy">
            <p className="academy-eyebrow">Market Structure Plan</p>
            <h1 className="academy-title">
              Smokey&apos;s 12 Lesson Market Structure Plan
            </h1>
            <p className="academy-lede">{courseDescription}</p>
            <p className="academy-lede">
              Available in TraderLink Premium for an additional fee.
            </p>
          </div>
        </section>

        <section className="academy-section">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planLessons.map((lesson) => (
              <LessonCard key={lesson.lesson} lesson={lesson} />
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
