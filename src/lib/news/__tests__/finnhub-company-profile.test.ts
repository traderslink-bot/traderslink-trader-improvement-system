import { describe, expect, it, vi } from "vitest";

import {
  formatFinnhubCountry,
  formatFinnhubExchange,
  formatFinnhubMarketCap,
  formatFinnhubWebsite,
  getFinnhubCompanyProfile,
} from "../finnhub-company-profile";

describe("Finnhub company profile", () => {
  it("loads and normalizes the profile used by article Company Info cards", async () => {
    let requestedUrl = "";
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      requestedUrl = String(input);
      return new Response(
        JSON.stringify({
          country: "US",
          exchange: "NASDAQ NMS - GLOBAL MARKET",
          finnhubIndustry: "Technology",
          marketCapitalization: 1250.5,
          name: "Example Corp",
          shareOutstanding: 42.25,
          weburl: "https://example.com/",
        }),
        { status: 200 },
      );
    });

    await expect(
      getFinnhubCompanyProfile("exmp", { apiKey: "test-key", fetchImpl }),
    ).resolves.toEqual({
      country: "US",
      exchange: "NASDAQ NMS - GLOBAL MARKET",
      industry: "Technology",
      marketCapitalization: 1250.5,
      name: "Example Corp",
      shareOutstanding: 42.25,
      weburl: "https://example.com/",
    });

    const requestUrl = new URL(requestedUrl);
    expect(requestUrl.pathname).toBe("/api/v1/stock/profile2");
    expect(requestUrl.searchParams.get("symbol")).toBe("EXMP");
    expect(requestUrl.searchParams.get("token")).toBe("test-key");
  });

  it("returns null when Finnhub is unavailable or not configured", async () => {
    await expect(getFinnhubCompanyProfile("EXMP", { apiKey: null })).resolves.toBeNull();
    await expect(
      getFinnhubCompanyProfile("EXMP", {
        apiKey: "test-key",
        fetchImpl: vi.fn(async () => new Response("rate limited", { status: 429 })),
      }),
    ).resolves.toBeNull();
  });

  it("matches the ticker-detail Company Info formatting", () => {
    expect(formatFinnhubExchange("NASDAQ NMS - GLOBAL MARKET")).toBe("Nasdaq");
    expect(formatFinnhubMarketCap(1250.5)).toBe("1.25B");
    expect(formatFinnhubMarketCap(42.25)).toBe("42.25M");
    expect(formatFinnhubWebsite("example.com/")).toBe("https://example.com");
    expect(formatFinnhubCountry("China")).toBe("China (High Risk Country)");
    expect(formatFinnhubCountry("United States")).toBe("United States");
  });
});
