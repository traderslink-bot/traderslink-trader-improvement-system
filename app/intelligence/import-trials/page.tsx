import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import type { Metadata } from "next";
import { buildProductWorkflowShellViewModel } from "@/src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Import Trials | Trader Intelligence",
};

function statusClass(status: string): string {
  return status === "pass"
    ? "text-emerald-300"
    : status === "blocked"
      ? "text-rose-300"
      : "text-amber-300";
}

export default async function ImportTrialsPage() {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/import-trials/page.tsx");
  const shell = buildProductWorkflowShellViewModel();
  const experience = shell.analytics.importTrialExperience;
  const harness = experience.harness;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Import Trials
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {harness.fixtureStrategy}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Fixtures
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {harness.totalCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Pass
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {harness.passCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Needs Review
            </div>
            <div className="mt-3 text-2xl font-semibold text-amber-300">
              {harness.needsRepairCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Blocked
            </div>
            <div className="mt-3 text-2xl font-semibold text-rose-300">
              {harness.blockedCount}
            </div>
          </div>
        </section>

        <section
          className="grid gap-4 border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-3"
          data-testid="import-trials-safety-policy"
        >
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Fixture Mode
            </div>
            <div className="mt-2 text-sm font-medium text-emerald-300">
              synthetic dry run
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Trial fixtures exercise import behavior without production writes.
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Cost Policy
            </div>
            <div className="mt-2 text-sm font-medium text-sky-300">
              gross-only feedback
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Fees and broker net amounts test visibility and reconciliation,
              not alternate coaching scores.
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Broker Coverage
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-300">
              synthetic fixtures
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Passing trials prove fixture coverage, not guaranteed live broker
              support.
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.38fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Trial Results
            </h2>
            <div className="mt-4 grid gap-3">
              {harness.results.map((result) => (
                <div key={result.fixtureId} className="border-t border-zinc-900 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        {result.label}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {result.acceptedExecutionCount} execution(s),{" "}
                        {result.groupedTradeCount} grouped trade(s)
                      </div>
                    </div>
                    <div className={`text-xs uppercase tracking-wide ${statusClass(result.status)}`}>
                      {result.status}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {result.evidence.map((item) => (
                      <div key={item} className="text-xs text-zinc-500">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-sky-300">
                    {result.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Fixture Library
            </h2>
            <div className="mt-2 text-sm text-zinc-500">
              {experience.fixtureLibrary.unsupportedBrokerCopy}
            </div>
            <div className="mt-4 grid gap-3">
              {experience.fixtureLibrary.brokers.slice(0, 8).map((broker) => (
                <div key={`${broker.broker}:${broker.label}`} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{broker.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {broker.headerConfidence}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {broker.fixtureCount} fixture(s)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
