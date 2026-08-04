import type { Metadata } from "next";
import AnalyticsLabClient from "./analytics-lab-client";
import { buildAnalyticsLabPreview } from "./lab-query";
import { resolveAnalyticsLabRuntime } from "./lab-runtime";
import { listAnalyticsLabSavedViews } from "./lab-saved-views";
import type { AnalyticsLabQuery } from "./lab-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics Lab | Trader Intelligence",
  description:
    "Explore execution performance through browser-safe Trader Intelligence V3 analytics packets.",
};

export default async function AnalyticsLabPage() {
  const runtime = await resolveAnalyticsLabRuntime();
  const defaultQuery: AnalyticsLabQuery = {
    analysis: "performance",
    metric: "net_pnl",
    grouping: "day",
    chart: "area",
    comparison: "none",
    evidenceRows: 6,
    filters: {
      symbol: "all",
      direction: "all",
      outcome: "all",
      session: "all",
      weekday: "all",
      startDate: runtime.minimumDate,
      endDate: runtime.maximumDate,
      entryStart: "00:00",
      entryEnd: "23:59",
      holdingMinimum: "",
      holdingMaximum: "",
      sequenceMinimum: "",
      sequenceMaximum: "",
      previousOutcome: "all",
      preEntryState: "all",
      repeatAttemptMinimum: "",
      repeatAttemptMaximum: "",
      shareMinimum: "",
      shareMaximum: "",
      notionalMinimum: "",
      notionalMaximum: "",
    },
  };
  const initialSavedViews = await listAnalyticsLabSavedViews(runtime);
  return (
    <AnalyticsLabClient
      filterOptions={{
        symbols: runtime.symbols,
        minimumDate: runtime.minimumDate,
        maximumDate: runtime.maximumDate,
      }}
      initialPreview={buildAnalyticsLabPreview(defaultQuery, runtime)}
      initialQuery={defaultQuery}
      initialSavedViews={initialSavedViews}
    />
  );
}
