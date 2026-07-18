import { describe, expect, it } from "vitest";

import { scanTraderIntelligenceArchitectureBoundaries } from "../testing";

describe("Trader Intelligence v3 architecture boundary guard", () => {
  it("accepts boundary-safe domain and adapter imports", () => {
    expect(
      scanTraderIntelligenceArchitectureBoundaries([
        {
          path: "src/lib/trader-intelligence-v3/domain/owner.ts",
          source: 'import type { OwnerContract } from "../contracts";',
        },
        {
          path: "src/lib/trader-intelligence-v3/auth/adapter.ts",
          source: 'import { authorizeOwner } from "../domain";',
        },
      ]),
    ).toEqual([]);
  });

  it.each([
    ["src/lib/trader-intelligence-v3/domain/bad.ts", 'import "next/headers";', "ti_v3_arch_domain_next_import"],
    ["src/lib/trader-intelligence-v3/contracts/bad.ts", 'import "@/app/intelligence/page";', "ti_v3_arch_domain_app_import"],
    ["src/lib/trader-intelligence-v3/domain/bad.ts", 'import Database from "better-sqlite3";', "ti_v3_arch_database_driver_import"],
    ["src/lib/trader-intelligence-v3/domain/bad.ts", 'import OpenAI from "openai";', "ti_v3_arch_ai_sdk_import"],
    ["src/lib/trader-intelligence-v3/domain/bad.ts", 'import "levels-system-v2";', "ti_v3_arch_levels_system_import"],
    ["src/lib/trader-intelligence-v3/domain/bad.ts", 'import "@/src/lib/market-data/yahoo";', "ti_v3_arch_market_provider_import"],
    ["src/lib/trader-intelligence-v3/auth/bad.ts", 'import "@/src/lib/academy/academy-progress-store";', "ti_v3_arch_academy_coupling"],
    ["src/lib/trader-analytics/product/coach.ts", 'import "@/src/lib/trader-intelligence-v3/domain";', "ti_v3_arch_legacy_coaching_internal_import"],
  ])("detects forbidden dependency %s", (path, source, code) => {
    expect(scanTraderIntelligenceArchitectureBoundaries([{ path, source }])).toEqual([
      expect.objectContaining({ code, path }),
    ]);
  });

  it("permits only the named provisional Discord adapter to read the existing session record", () => {
    expect(
      scanTraderIntelligenceArchitectureBoundaries([
        {
          path: "src/lib/trader-intelligence-v3/auth/provisional-discord-session-adapter.ts",
          source: 'import "@/src/lib/academy/academy-progress-store";',
        },
      ]),
    ).toEqual([]);
  });

  it("detects authoritative calculation logic placed in a route", () => {
    expect(
      scanTraderIntelligenceArchitectureBoundaries([
        {
          path: "app/api/trades/route.ts",
          source: "function calculateOwnerProfit() { return 1; }",
        },
      ]),
    ).toEqual([
      expect.objectContaining({ code: "ti_v3_arch_route_domain_authority" }),
    ]);
  });
});
