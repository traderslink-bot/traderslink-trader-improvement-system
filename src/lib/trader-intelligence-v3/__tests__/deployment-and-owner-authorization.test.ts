import { homedir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { authorizeTraderIntelligenceOwner } from "../auth/owner-authorization";
import { validateTraderIntelligenceDeployment } from "../deployment";

function validLocalEnvironment(): Record<string, string | undefined> {
  return {
    NODE_ENV: "development",
    TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE: "private_owner_alpha",
    TRADER_INTELLIGENCE_HOSTING_MODE: "local_only",
    TRADER_INTELLIGENCE_STORAGE_MODE: "local_sqlite",
    TRADER_INTELLIGENCE_DATA_MODE: "sample_data",
    TRADER_INTELLIGENCE_OWNER_ID: "synthetic-owner",
  };
}

function realOwnerEnvironment(): Record<string, string | undefined> {
  return {
    ...validLocalEnvironment(),
    TRADER_INTELLIGENCE_DATA_MODE: "real_owner_data",
    TRADER_INTELLIGENCE_DB_PATH: join(
      homedir(),
      ".trader-intelligence-tests",
      "owner.sqlite",
    ),
  };
}

function localRequest(host = "localhost") {
  return { headers: new Headers({ host }) };
}

describe("Trader Intelligence v3 deployment contract", () => {
  it("accepts only the implemented private-owner local SQLite sample profile", () => {
    expect(validateTraderIntelligenceDeployment(validLocalEnvironment())).toMatchObject({
      ok: true,
      config: {
        profile: "private_owner_alpha",
        hostingMode: "local_only",
        storageMode: "local_sqlite",
        dataMode: "sample_data",
        persistence: { kind: "in_memory", databaseTarget: ":memory:" },
      },
    });
  });

  it("accepts explicit durable real-owner storage in development and optimized local modes", () => {
    for (const nodeEnvironment of ["development", "production"]) {
      const environment = realOwnerEnvironment();
      environment.NODE_ENV = nodeEnvironment;
      expect(validateTraderIntelligenceDeployment(environment)).toMatchObject({
        ok: true,
        config: {
          hostingMode: "local_only",
          storageMode: "local_sqlite",
          dataMode: "real_owner_data",
          persistence: {
            kind: "file",
            databaseTarget: environment.TRADER_INTELLIGENCE_DB_PATH,
          },
        },
      });
    }
  });

  it.each([
    ["TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE", "ti_v3_deployment_profile_missing"],
    ["TRADER_INTELLIGENCE_HOSTING_MODE", "ti_v3_hosting_mode_missing"],
    ["TRADER_INTELLIGENCE_STORAGE_MODE", "ti_v3_storage_mode_missing"],
    ["TRADER_INTELLIGENCE_DATA_MODE", "ti_v3_data_mode_missing"],
  ])("fails closed when %s is missing", (key, code) => {
    const environment = validLocalEnvironment();
    delete environment[key];
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code,
    });
  });

  it.each([
    ["TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE", "unknown", "ti_v3_deployment_profile_invalid"],
    ["TRADER_INTELLIGENCE_HOSTING_MODE", "unknown", "ti_v3_hosting_mode_invalid"],
    ["TRADER_INTELLIGENCE_STORAGE_MODE", "unknown", "ti_v3_storage_mode_invalid"],
    ["TRADER_INTELLIGENCE_DATA_MODE", "unknown", "ti_v3_data_mode_invalid"],
  ])("rejects invalid %s values", (key, value, code) => {
    const environment = validLocalEnvironment();
    environment[key] = value;
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code,
    });
  });

  it.each(["private_invited_alpha", "public_beta", "public_production"])(
    "rejects declared profile %s as not operational",
    (profile) => {
      const environment = validLocalEnvironment();
      environment.TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE = profile;
      expect(validateTraderIntelligenceDeployment(environment)).toEqual({
        ok: false,
        code: "ti_v3_deployment_profile_not_operational",
      });
    },
  );

  it("rejects private-hosted before any provisional session adapter can run", async () => {
    const environment = validLocalEnvironment();
    environment.TRADER_INTELLIGENCE_HOSTING_MODE = "private_hosted";
    const resolver = vi.fn(async () => ({ subject: "synthetic-owner" }));
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_hosting_mode_not_operational",
    });
    await expect(
      authorizeTraderIntelligenceOwner({
        environment,
        modulePath: "app/intelligence/page.tsx",
        sessionResolver: { resolveOwnerSubject: resolver },
        localRequest: localRequest(),
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_hosting_mode_not_operational",
    });
    expect(resolver).not.toHaveBeenCalled();
  });

  it("rejects private_database as declared but not operational", () => {
    const environment = validLocalEnvironment();
    environment.TRADER_INTELLIGENCE_STORAGE_MODE = "private_database";
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_storage_mode_not_operational",
    });
  });

  it("rejects local-only mode when a hosted-environment signal exists", () => {
    const environment = validLocalEnvironment();
    environment.VERCEL = "1";
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_local_only_hosted_environment_forbidden",
    });
  });

  it("normalizes only explicit loopback origins", () => {
    const environment = validLocalEnvironment();
    environment.TRADER_INTELLIGENCE_APPROVED_ORIGINS =
      "http://localhost:3000/,http://127.0.0.1:3001,https://[::1]:3002";
    expect(validateTraderIntelligenceDeployment(environment)).toMatchObject({
      ok: true,
      config: {
        approvedOrigins: [
          "http://localhost:3000",
          "http://127.0.0.1:3001",
          "https://[::1]:3002",
        ],
      },
    });
  });

  it.each([
    "https://attacker.example",
    "http://localhost.attacker.example",
    "http://user@localhost:3000",
    "null",
    "http://localhost:3000/path",
    "http://0.0.0.0:3000",
  ])("rejects invalid configured origin %s", (origin) => {
    const environment = validLocalEnvironment();
    environment.TRADER_INTELLIGENCE_APPROVED_ORIGINS = origin;
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_approved_origin_invalid",
    });
  });
});

describe("Trader Intelligence v3 owner authorization", () => {
  it("requires verified local request evidence before granting local owner authority", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validLocalEnvironment(),
        modulePath: "app/intelligence/page.tsx",
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_local_request_context_missing",
    });
  });

  it("uses the isolated local owner adapter after loopback validation", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validLocalEnvironment(),
        modulePath: "app/intelligence/page.tsx",
        localRequest: localRequest("127.0.0.1:3000"),
      }),
    ).resolves.toMatchObject({
      ok: true,
      owner: {
        identity: { ownerId: "synthetic-owner" },
        authorizationMode: "local_owner_adapter",
      },
    });
  });

  it("fails closed for an unclassified private route", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validLocalEnvironment(),
        modulePath: "app/intelligence/new-unclassified/page.tsx",
        localRequest: localRequest(),
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_route_unclassified",
    });
  });
});
