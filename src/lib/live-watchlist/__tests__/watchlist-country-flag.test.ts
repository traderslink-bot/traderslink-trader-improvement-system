import { describe, expect, it } from "vitest";

import { getWatchlistCountryFlag } from "../watchlist-country-flag";

describe("getWatchlistCountryFlag", () => {
  it("normalizes Finnhub ISO country codes for flag artwork", () => {
    expect(getWatchlistCountryFlag("US")).toMatchObject({
      code: "US",
      label: "United States",
    });
    expect(getWatchlistCountryFlag("tw")).toMatchObject({
      code: "TW",
      label: "Taiwan",
    });
  });

  it("supports country names found in older Company Info metadata", () => {
    expect(getWatchlistCountryFlag("China")).toMatchObject({
      code: "CN",
    });
    expect(getWatchlistCountryFlag("United States (High Risk Country)")).toMatchObject({
      code: "US",
    });
    expect(getWatchlistCountryFlag("UK")).toMatchObject({
      code: "GB",
      label: "United Kingdom",
    });
  });

  it("omits the flag when country metadata is missing or unrecognized", () => {
    expect(getWatchlistCountryFlag(null)).toBeNull();
    expect(getWatchlistCountryFlag("Unknown")).toBeNull();
  });
});
