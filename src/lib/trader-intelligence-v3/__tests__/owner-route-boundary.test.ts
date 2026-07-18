import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TRADER_INTELLIGENCE_PRIVATE_CACHE_HEADERS,
  withTraderIntelligenceOwnerRoute,
} from "../auth";

const ENVIRONMENT_KEYS = [
  "TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE",
  "TRADER_INTELLIGENCE_HOSTING_MODE",
  "TRADER_INTELLIGENCE_STORAGE_MODE",
  "TRADER_INTELLIGENCE_DATA_MODE",
  "TRADER_INTELLIGENCE_OWNER_ID",
  "TRADER_INTELLIGENCE_OWNER_DISCORD_SUBJECT",
  "TRADER_INTELLIGENCE_LOCAL_OWNER_BYPASS",
] as const;

let originalEnvironment: Record<string, string | undefined>;

beforeEach(() => {
  originalEnvironment = Object.fromEntries(
    ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]),
  );
  process.env.TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE = "private_owner_alpha";
  process.env.TRADER_INTELLIGENCE_HOSTING_MODE = "local_only";
  process.env.TRADER_INTELLIGENCE_STORAGE_MODE = "local_sqlite";
  process.env.TRADER_INTELLIGENCE_DATA_MODE = "sample_data";
  process.env.TRADER_INTELLIGENCE_OWNER_ID = "synthetic-owner";
});

afterEach(() => {
  for (const key of ENVIRONMENT_KEYS) {
    const value = originalEnvironment[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  vi.restoreAllMocks();
});

describe("Trader Intelligence owner route boundary", () => {
  it("rejects unauthorized API reads before invoking repository-backed work", async () => {
    process.env.TRADER_INTELLIGENCE_HOSTING_MODE = "private_hosted";
    process.env.TRADER_INTELLIGENCE_STORAGE_MODE = "private_database";
    process.env.TRADER_INTELLIGENCE_DATA_MODE = "real_owner_data";
    process.env.TRADER_INTELLIGENCE_OWNER_DISCORD_SUBJECT = "owner-subject";
    const repositoryProbe = vi.fn();
    const GET = withTraderIntelligenceOwnerRoute(
      "app/api/trades/route.ts",
      async () => {
        repositoryProbe();
        return Response.json({ privateTradeId: "must-not-leak" });
      },
    );

    const response = await GET(new Request("https://private.example/api/trades"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(repositoryProbe).not.toHaveBeenCalled();
    expect(JSON.stringify(body)).not.toContain("privateTradeId");
    expect(body).toEqual({
      contractVersion: "trader_intelligence_v3_boundary_error_v1",
      error: {
        code: "ti_v3_resource_unavailable",
        message: "Resource unavailable.",
      },
    });
  });

  it("rejects a state-changing GET before handler execution", async () => {
    const mutationProbe = vi.fn();
    const POST = withTraderIntelligenceOwnerRoute(
      "app/api/trades/[tradeId]/notes/route.ts",
      async () => {
        mutationProbe();
        return Response.json({ ok: true });
      },
    );
    const response = await POST(
      new Request("http://localhost/api/trades/t-1/notes", { method: "GET" }),
    );

    expect(response.status).toBe(405);
    expect(mutationProbe).not.toHaveBeenCalled();
  });

  it("rejects missing mutation origin evidence", async () => {
    const mutationProbe = vi.fn();
    const POST = withTraderIntelligenceOwnerRoute(
      "app/api/trades/[tradeId]/notes/route.ts",
      async () => {
        mutationProbe();
        return Response.json({ ok: true });
      },
    );
    const request = new Request("http://localhost/api/trades/t-1/notes", {
      method: "POST",
    });
    request.headers.delete("origin");
    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ti_v3_mutation_origin_missing" },
    });
    expect(mutationProbe).not.toHaveBeenCalled();
  });

  it("rejects an invalid cross-origin mutation", async () => {
    const POST = withTraderIntelligenceOwnerRoute(
      "app/api/trades/[tradeId]/notes/route.ts",
      async () => Response.json({ ok: true }),
    );
    const response = await POST(
      new Request("http://localhost/api/trades/t-1/notes", {
        method: "POST",
        headers: { Origin: "https://attacker.example" },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ti_v3_mutation_origin_invalid" },
    });
  });

  it("allows a valid owner mutation and records a structured diagnostic", async () => {
    const diagnostic = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const POST = withTraderIntelligenceOwnerRoute(
      "app/api/trades/[tradeId]/notes/route.ts",
      async () => Response.json({ ok: true }),
    );
    const response = await POST(
      new Request("http://localhost/api/trades/t-1/notes", {
        method: "POST",
        headers: { Origin: "http://localhost" },
      }),
    );

    expect(response.status).toBe(200);
    expect(diagnostic).toHaveBeenCalledWith(
      "Trader Intelligence owner mutation authorized.",
      expect.objectContaining({
        eventCode: "ti_v3_owner_mutation_authorized",
        method: "POST",
      }),
    );
  });

  it("applies private no-store headers to successful and rejected responses", async () => {
    const GET = withTraderIntelligenceOwnerRoute(
      "app/api/trades/route.ts",
      async () => Response.json({ ok: true }),
    );
    const response = await GET(new Request("http://localhost/api/trades"));

    for (const [name, value] of Object.entries(
      TRADER_INTELLIGENCE_PRIVATE_CACHE_HEADERS,
    )) {
      expect(response.headers.get(name)).toBe(value);
    }
  });
});
