import { describe, expect, it } from "vitest";

import type { LiveWatchlistLevelMapLevel } from "../live-watchlist-types";
import { buildWatchlistV2LevelRows } from "../watchlist-v2-levels";

function level(
  side: "support" | "resistance",
  price: number,
): LiveWatchlistLevelMapLevel {
  return {
    side,
    price,
    distancePct: side === "support" ? -0.05 - price / 1000 : 0.05 + price / 1000,
    strengthLabel: price >= 1.05 ? "major" : "moderate",
    sourceLabel: price >= 1.05 ? "daily structure" : "4h structure",
    label: `${price.toFixed(4)} (${side})`,
  };
}

describe("buildWatchlistV2LevelRows", () => {
  it("returns every curated support and resistance level without applying a display cap", () => {
    const supportLevels = [
      level("support", 0.91),
      level("support", 0.88),
      level("support", 0.84),
      level("support", 0.8),
    ];
    const resistanceLevels = [
      level("resistance", 0.95),
      level("resistance", 0.9873),
      level("resistance", 1.03),
      level("resistance", 1.07),
      level("resistance", 1.12),
    ];

    const rows = buildWatchlistV2LevelRows({
      currentPrice: 0.947,
      rangeState: "normal",
      nearestSupport: supportLevels[0]!,
      nearestResistance: resistanceLevels[0]!,
      nextStrongSupport: null,
      nextStrongResistance: resistanceLevels[3]!,
      supportLevels,
      resistanceLevels,
    });

    expect(rows.support.map((row) => row.price)).toEqual([0.91, 0.88, 0.84, 0.8]);
    expect(rows.resistance.map((row) => row.price)).toEqual([
      0.95,
      0.9873,
      1.03,
      1.07,
      1.12,
    ]);
  });

  it("marks nearest support and resistance without hiding the rest of the list", () => {
    const nearestSupport = level("support", 1.1);
    const deeperSupport = level("support", 1.03);
    const nearestResistance = level("resistance", 1.2);
    const higherResistance = level("resistance", 1.34);

    const rows = buildWatchlistV2LevelRows({
      currentPrice: 1.16,
      rangeState: "normal",
      nearestSupport,
      nearestResistance,
      nextStrongSupport: null,
      nextStrongResistance: higherResistance,
      supportLevels: [nearestSupport, deeperSupport],
      resistanceLevels: [nearestResistance, higherResistance],
    });

    expect(rows.support).toHaveLength(2);
    expect(rows.support[0]?.isNearest).toBe(true);
    expect(rows.support[1]?.isNearest).toBe(false);
    expect(rows.resistance).toHaveLength(2);
    expect(rows.resistance[0]?.isNearest).toBe(true);
    expect(rows.resistance[1]?.isNearest).toBe(false);
  });
});
