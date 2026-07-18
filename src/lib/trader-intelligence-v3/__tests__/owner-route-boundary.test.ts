import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTraderIntelligenceTestRequest } from "../../../test/trader-intelligence-request";
import { withTraderIntelligenceOwnerRoute } from "../auth";

const ENVIRONMENT_KEYS = [
  "TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE",
  "TRADER_INTELLIGENCE_HOSTING_MODE",
  "TRADER_INTELLIGENCE_STORAGE_MODE",
  "TRADER_INTELLIGENCE_DATA_MODE",
  "TRADER_INTELLIGENCE_OWNER_ID",
  "TRADER_INTELLIGENCE_APPROVED_ORIGINS",
  "TRADER_INTELLIGENCE_DB_PATH",
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
  process.env.TRADER_INTELLIGENCE_APPROVED_ORIGINS = "http://localhost";
  delete process.env.TRADER_INTELLIGENCE_DB_PATH;
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

function notesRoute(handler: () => Response | Promise<Response>) {
  return withTraderIntelligenceOwnerRoute(
    "app/api/trades/[tradeId]/notes/route.ts",
    handler,
  );
}

describe("Trader Intelligence owner route boundary", () => {
  it("requires unsafe test requests to declare origin behavior explicitly", () => {
    expect(() =>
      createTraderIntelligenceTestRequest(
        "http://localhost/api/trades/t-1/notes",
        { method: "POST" },
      ),
    ).toThrow("Unsafe test requests must declare origin evidence.");
  });

  it("rejects non-loopback API reads before repository-backed work", async () => {
    const repositoryProbe = vi.fn();
    const GET = withTraderIntelligenceOwnerRoute(
      "app/api/trades/route.ts",
      async () => {
        repositoryProbe();
        return Response.json({ privateTradeId: "must-not-leak" });
      },
    );
    const response = await GET(
      createTraderIntelligenceTestRequest("http://attacker.example/api/trades", {
        host: "attacker.example",
      }),
    );
    expect(response.status).toBe(503);
    expect(repositoryProbe).not.toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toContain("privateTradeId");
  });

  it("rejects a state-changing GET before handler execution", async () => {
    const mutationProbe = vi.fn();
    const POST = notesRoute(async () => {
      mutationProbe();
      return Response.json({ ok: true });
    });
    const response = await POST(
      createTraderIntelligenceTestRequest(
        "http://localhost/api/trades/t-1/notes",
        { method: "GET" },
      ),
    );
    expect(response.status).toBe(405);
    expect(mutationProbe).not.toHaveBeenCalled();
  });

  it("rejects a mutation when no approved origin is configured", async () => {
    delete process.env.TRADER_INTELLIGENCE_APPROVED_ORIGINS;
    const POST = notesRoute(async () => Response.json({ ok: true }));
    const response = await POST(
      createTraderIntelligenceTestRequest(
        "http://localhost/api/trades/t-1/notes",
        { method: "POST", origin: "http://localhost" },
      ),
    );
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ti_v3_mutation_origin_not_configured" },
    });
  });

  it("rejects explicitly missing mutation origin evidence", async () => {
    const POST = notesRoute(async () => Response.json({ ok: true }));
    const response = await POST(
      createTraderIntelligenceTestRequest(
        "http://localhost/api/trades/t-1/notes",
        { method: "POST", origin: null },
      ),
    );
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ti_v3_mutation_origin_missing" },
    });
  });

  it.each([
    "https://attacker.example",
    "null",
    "http://user@localhost",
    "http://localhost:3000/path",
  ])("rejects invalid mutation origin %s", async (origin) => {
    const POST = notesRoute(async () => Response.json({ ok: true }));
    const response = await POST(
      createTraderIntelligenceTestRequest(
        "http://localhost/api/trades/t-1/notes",
        { method: "POST", origin },
      ),
    );
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ti_v3_mutation_origin_invalid" },
    });
  });

  it("does not approve an origin from an attacker-controlled request URL", async () => {
    process.env.TRADER_INTELLIGENCE_APPROVED_ORIGINS = "http://localhost";
    const POST = notesRoute(async () => Response.json({ ok: true }));
    const response = await POST(
      createTraderIntelligenceTestRequest(
        "http://attacker.example/api/trades/t-1/notes",
        {
          method: "POST",
          origin: "http://attacker.example",
          host: "attacker.example",
        },
      ),
    );
    expect(response.status).toBe(503);
  });

  it("requires exact scheme, host, and configured port", async () => {
    process.env.TRADER_INTELLIGENCE_APPROVED_ORIGINS =
      "http://localhost:3000,http://127.0.0.1:3100";
    const POST = notesRoute(async () => Response.json({ ok: true }));

    const approved = await POST(
      createTraderIntelligenceTestRequest(
        "http://127.0.0.1:3100/api/trades/t-1/notes",
        { method: "POST", origin: "http://127.0.0.1:3100" },
      ),
    );
    const alternatePort = await POST(
      createTraderIntelligenceTestRequest(
        "http://localhost:3000/api/trades/t-1/notes",
        { method: "POST", origin: "http://localhost:3001" },
      ),
    );
    const alternateScheme = await POST(
      createTraderIntelligenceTestRequest(
        "http://localhost:3000/api/trades/t-1/notes",
        { method: "POST", origin: "https://localhost:3000" },
      ),
    );

    expect(approved.status).toBe(200);
    expect(alternatePort.status).toBe(403);
    expect(alternateScheme.status).toBe(403);
  });

  it("records only a non-durable local mutation diagnostic", async () => {
    const diagnostic = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const POST = notesRoute(async () => Response.json({ ok: true }));
    await POST(
      createTraderIntelligenceTestRequest(
        "http://localhost/api/trades/t-1/notes",
        { method: "POST", origin: "http://localhost" },
      ),
    );
    expect(diagnostic).toHaveBeenCalledWith(
      "Trader Intelligence non-durable local mutation diagnostic.",
      expect.objectContaining({
        eventCode: "ti_v3_local_mutation_diagnostic",
        method: "POST",
      }),
    );
  });

  it("preserves and case-insensitively deduplicates existing Vary values", async () => {
    const GET = withTraderIntelligenceOwnerRoute(
      "app/api/trades/route.ts",
      async () =>
        new Response("ok", {
          headers: { Vary: "Accept-Encoding, cookie, ACCEPT-ENCODING" },
        }),
    );
    const response = await GET(
      createTraderIntelligenceTestRequest("http://localhost/api/trades"),
    );
    expect(response.headers.get("Vary")).toBe("Accept-Encoding, cookie");
    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-store, max-age=0",
    );
  });

  it("returns a generic private no-store response for unexpected handler failures", async () => {
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const GET = withTraderIntelligenceOwnerRoute(
      "app/api/trades/route.ts",
      async () => {
        throw new Error("private trade t-secret import i-secret");
      },
    );
    const response = await GET(
      createTraderIntelligenceTestRequest("http://localhost/api/trades"),
    );
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(body).toMatchObject({ error: { code: "ti_v3_handler_failure" } });
    expect(JSON.stringify(body)).not.toContain("t-secret");
    expect(JSON.stringify(diagnostic.mock.calls)).not.toContain("t-secret");
  });

  it("requires real_owner_data before CSV upload handler execution", async () => {
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const POST = withTraderIntelligenceOwnerRoute(
      "app/api/import-batches/preview/route.ts",
      handler,
    );
    const response = await POST(
      createTraderIntelligenceTestRequest(
        "http://localhost/api/import-batches/preview",
        { method: "POST", origin: "http://localhost" },
      ),
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ti_v3_real_owner_data_mode_required" },
    });
    expect(handler).not.toHaveBeenCalled();
  });
});
