import { describe, expect, it } from "vitest";
import { buildAnalyticsLabPreview } from "../../../../app/analytics/lab/lab-query";
import type { AnalyticsLabRuntime } from "../../../../app/analytics/lab/lab-runtime";
import type { AnalyticsLabQuery } from "../../../../app/analytics/lab/lab-types";
import { buildSyntheticQueryFixture } from "../analytics";

function runtime(): AnalyticsLabRuntime {
  const fixture = buildSyntheticQueryFixture(42);
  return {
    source: fixture.source,
    currency: "USD",
    canonicalOwnerKey: "owner_synthetic_primary",
    canonicalAccountKey: "account_synthetic_primary",
    authorityDirectory: "synthetic",
    minimumDate: "2026-07-01",
    maximumDate: "2026-07-07",
    symbols: ["ALPHA", "BETA", "GAMMA"],
    dataMode: "sample",
    unavailableReason: null,
    plan: fixture.plan,
  };
}

function query(
  patch: Partial<AnalyticsLabQuery> = {},
): AnalyticsLabQuery {
  return {
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
      startDate: "2026-07-01",
      endDate: "2026-07-07",
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
    ...patch,
  };
}

describe("Analytics Lab server query", () => {
  it("changes the V3 result when ticker and direction filters change", () => {
    const source = runtime();
    const allTrades = buildAnalyticsLabPreview(query(), source);
    const betaLong = buildAnalyticsLabPreview(query({
      grouping: "symbol",
      filters: {
        ...query().filters,
        symbol: "BETA",
        direction: "long",
      },
    }), source);

    expect(allTrades.authority.includedCount).toBe("42");
    expect(betaLong.authority.includedCount).toBe("14");
    expect(betaLong.series.map((row) => row.label)).toEqual(["BETA"]);
    expect(betaLong.appliedFilters).toContain("BETA");
    expect(betaLong.appliedFilters).toContain("long");
  }, 15_000);

  it("projects a selected metric, grouping, and period comparison", () => {
    const preview = buildAnalyticsLabPreview(query({
      metric: "win_rate",
      grouping: "direction",
      chart: "horizontal",
      comparison: "previous_period",
    }), runtime());

    expect(preview.primaryMetric).toEqual({ key: "win_rate", label: "Win rate" });
    expect(preview.grouping.label).toBe("Direction");
    expect(preview.series).toHaveLength(2);
    expect(preview.series.every((row) => row.primary.key === "win_rate")).toBe(true);
    expect(preview.comparison).not.toBeNull();
  });
});
