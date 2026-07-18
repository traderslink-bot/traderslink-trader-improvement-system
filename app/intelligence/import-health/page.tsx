import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import type { Metadata } from "next";
import { buildImportHealthCenterViewModel } from "@/src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Import Health | Trader Intelligence",
};

export default async function ImportHealthPage() {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/import-health/page.tsx");
  const health = buildImportHealthCenterViewModel();
  const quality = health.importReview.diagnostics.qualityScore;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Import Health Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {health.healthSummary}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Quality
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {quality.score}/100
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Supported Brokers
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {health.supportedBrokers.length}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Fingerprints
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {health.fingerprintLibrary.totalCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Needs Admin Review
            </div>
            <div className="mt-3 text-2xl font-semibold text-amber-300">
              {health.fingerprintLibrary.needsReviewCount}
            </div>
          </div>
        </section>

        <section
          className="grid gap-4 border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-3"
          data-testid="import-health-safety-policy"
        >
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Write Safety
            </div>
            <div className="mt-2 text-sm font-medium text-emerald-300">
              Review-only prototype
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Import health does not write broker rows to production storage.
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
              Fees, commissions, and broker net amounts stay review context.
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Market Context
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-300">
              import facts only
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Health scoring uses parser, grouping, repair, and P/L diagnostics.
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Broker Support
            </h2>
            <div className="mt-4 grid gap-3">
              {health.supportedBrokers.map((broker) => (
                <div key={broker.id} className="flex items-center justify-between gap-3 border-t border-zinc-900 py-3">
                  <span className="text-sm text-zinc-300">{broker.label}</span>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {broker.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Latest Import Signals
            </h2>
            <div className="mt-4 grid gap-3">
              {quality.reasons.map((reason) => (
                <div key={reason} className="border-t border-zinc-900 py-3 text-sm text-zinc-400">
                  {reason}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
