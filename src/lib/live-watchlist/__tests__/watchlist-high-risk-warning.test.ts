import { describe, expect, it } from "vitest";

import type { LiveWatchlistCardContent } from "../live-watchlist-types";
import {
  buildWatchlistHighRiskWarning,
  getWatchlistHighRiskCountry,
  hasConfirmedSameDayCatalyst,
} from "../watchlist-high-risk-warning";

const REFERENCE_TIME = Date.parse("2026-07-22T15:00:00.000Z");

function aiReadCard(overrides: Record<string, unknown> = {}): LiveWatchlistCardContent {
  return {
    title: "TradersLink AI Read",
    body: JSON.stringify({
      catalystRealityCheck: {
        status: "confirmed",
        sourceUrls: ["https://example.com/catalyst"],
      },
      sources: [
        {
          url: "https://example.com/catalyst",
          evidence: { publishedAt: "2026-07-22T12:30:00.000Z" },
        },
      ],
      ...overrides,
    }),
    updatedAt: REFERENCE_TIME,
    priceWhenPosted: 1.25,
    source: "traderslink_ai_read",
  };
}

describe("watchlist high-risk warning", () => {
  it("recognizes China, Hong Kong, and Malaysia aliases with full display names", () => {
    expect(getWatchlistHighRiskCountry("CN")).toBe("China");
    expect(getWatchlistHighRiskCountry("Hong Kong SAR China")).toBe("Hong Kong");
    expect(getWatchlistHighRiskCountry("my")).toBe("Malaysia");
    expect(getWatchlistHighRiskCountry("Singapore")).toBeNull();
  });

  it("shows a warning when a covered ticker has no confirmed AI catalyst", () => {
    expect(
      buildWatchlistHighRiskWarning({
        country: "Hong Kong",
        aiReadCard: undefined,
        referenceTime: REFERENCE_TIME,
      }),
    ).toEqual({
      countryName: "Hong Kong",
      message:
        "This ticker is associated with Hong Kong and has no confirmed same-day catalyst. " +
        "Stocks with this profile can be especially vulnerable to pump-and-dump activity and dilution, so treat price-only momentum with extra caution.",
    });

    expect(
      buildWatchlistHighRiskWarning({
        country: "Malaysia",
        aiReadCard: aiReadCard({
          catalystRealityCheck: { status: "unverified", sourceUrls: [] },
        }),
        referenceTime: REFERENCE_TIME,
      }),
    ).not.toBeNull();
  });

  it("suppresses the warning only for a confirmed catalyst with same-day source evidence", () => {
    const card = aiReadCard();
    expect(hasConfirmedSameDayCatalyst(card, REFERENCE_TIME)).toBe(true);
    expect(
      buildWatchlistHighRiskWarning({
        country: "China",
        aiReadCard: card,
        referenceTime: REFERENCE_TIME,
      }),
    ).toBeNull();
  });

  it("keeps the warning for prior-day or unrelated same-day evidence", () => {
    const priorDay = aiReadCard({
      sources: [
        {
          url: "https://example.com/catalyst",
          evidence: { publishedAt: "2026-07-21T19:00:00.000Z" },
        },
      ],
    });
    const unrelatedSameDay = aiReadCard({
      sources: [
        {
          url: "https://example.com/other",
          evidence: { publishedAt: "2026-07-22T12:30:00.000Z" },
        },
      ],
    });

    expect(hasConfirmedSameDayCatalyst(priorDay, REFERENCE_TIME)).toBe(false);
    expect(hasConfirmedSameDayCatalyst(unrelatedSameDay, REFERENCE_TIME)).toBe(false);
  });
});
