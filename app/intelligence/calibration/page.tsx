import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import type { Metadata } from "next";
import { buildProductWorkflowShellViewModel } from "@/src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Calibration | Trader Intelligence",
};

function metricClass(status: string): string {
  return status === "ready"
    ? "text-emerald-300"
    : status === "watch"
      ? "text-amber-300"
      : "text-zinc-400";
}

export default async function CalibrationPage() {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/calibration/page.tsx");
  const shell = buildProductWorkflowShellViewModel();
  const calibration = shell.analytics.importTrialExperience.calibrationDashboard;
  const mobileQa = shell.analytics.importTrialExperience.mobileQa;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Calibration
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {calibration.nextAction}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Status
            </div>
            <div className="mt-3 text-lg font-semibold text-zinc-100">
              {calibration.status}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Fixture Trials
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {calibration.syntheticTrialCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Real Imports
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-400">
              {calibration.realImportCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Mobile QA Routes
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {mobileQa.totalRoutes}
            </div>
          </div>
        </section>

        <section
          className="grid gap-4 border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-3"
          data-testid="calibration-safety-policy"
        >
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Write Safety
            </div>
            <div className="mt-2 text-sm font-medium text-emerald-300">
              measurement only
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Calibration status does not save broker rows or promote behavior
              changes.
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
              Cost and broker-net checks remain import-readiness evidence.
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Data Scope
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-300">
              waiting for real imports
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Synthetic fixtures protect regressions but do not complete real
              calibration.
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Calibration Metrics
            </h2>
            <div className="mt-4 grid gap-3">
              {calibration.metrics.map((metric) => (
                <div key={metric.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{metric.label}</span>
                    <span className={`text-xs uppercase tracking-wide ${metricClass(metric.status)}`}>
                      {metric.status}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-900">
                    <div
                      className="h-1.5 bg-sky-400"
                      style={{
                        width: `${Math.min(100, (metric.value / Math.max(metric.target, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {metric.value} / {metric.target} - {metric.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Needed Later
              </h2>
              <div className="mt-4 grid gap-3">
                {calibration.nextDataNeeded.map((item) => (
                  <div key={item} className="border-t border-zinc-900 py-3 text-sm text-zinc-400">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Mobile QA Contract
              </h2>
              <div className="mt-4 grid gap-2">
                {mobileQa.items.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2">
                    <span className="text-xs text-zinc-400">{item.route}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
