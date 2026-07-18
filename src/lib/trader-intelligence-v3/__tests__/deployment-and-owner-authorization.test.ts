import { describe, expect, it } from "vitest";

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

function validHostedEnvironment(): Record<string, string | undefined> {
  return {
    NODE_ENV: "production",
    VERCEL: "1",
    TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE: "private_owner_alpha",
    TRADER_INTELLIGENCE_HOSTING_MODE: "private_hosted",
    TRADER_INTELLIGENCE_STORAGE_MODE: "private_database",
    TRADER_INTELLIGENCE_DATA_MODE: "real_owner_data",
    TRADER_INTELLIGENCE_OWNER_ID: "synthetic-owner",
    TRADER_INTELLIGENCE_OWNER_DISCORD_SUBJECT: "discord-owner-subject",
  };
}

describe("Trader Intelligence v3 deployment contract", () => {
  it("accepts valid private-owner local-only configuration", () => {
    expect(validateTraderIntelligenceDeployment(validLocalEnvironment())).toMatchObject({
      ok: true,
      config: {
        profile: "private_owner_alpha",
        hostingMode: "local_only",
        storageMode: "local_sqlite",
        dataMode: "sample_data",
      },
    });
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

  it("rejects future profiles that are declared but not operational", () => {
    const environment = validLocalEnvironment();
    environment.TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE = "private_invited_alpha";
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_deployment_profile_not_operational",
    });
  });

  it("rejects local-only mode in production-like hosted environments", () => {
    const environment = validLocalEnvironment();
    environment.VERCEL = "1";
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_local_only_hosted_environment_forbidden",
    });
  });

  it("rejects private-hosted local SQLite storage", () => {
    const environment = validHostedEnvironment();
    environment.TRADER_INTELLIGENCE_STORAGE_MODE = "local_sqlite";
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_storage_mode_unsafe",
    });
  });

  it("rejects private-hosted mode without configured internal owner identity", () => {
    const environment = validHostedEnvironment();
    delete environment.TRADER_INTELLIGENCE_OWNER_ID;
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_owner_id_missing",
    });
  });

  it("rejects private-hosted mode without configured Discord owner subject", () => {
    const environment = validHostedEnvironment();
    delete environment.TRADER_INTELLIGENCE_OWNER_DISCORD_SUBJECT;
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_owner_subject_missing",
    });
  });
});

describe("Trader Intelligence v3 owner authorization", () => {
  it("uses the isolated local owner adapter only for explicit local-only mode", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validLocalEnvironment(),
        modulePath: "app/intelligence/page.tsx",
      }),
    ).resolves.toMatchObject({
      ok: true,
      owner: {
        identity: { ownerId: "synthetic-owner" },
        authorizationMode: "local_owner_adapter",
      },
    });
  });

  it("fails private-hosted authorization without a session resolver", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validHostedEnvironment(),
        modulePath: "app/intelligence/page.tsx",
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_owner_session_resolver_missing",
    });
  });

  it("fails private-hosted authorization without a resolved session", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validHostedEnvironment(),
        modulePath: "app/intelligence/page.tsx",
        sessionResolver: { async resolveOwnerSubject() { return null; } },
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_owner_session_missing",
    });
  });

  it("rejects an authenticated non-owner even when premium role settings exist", async () => {
    const environment = {
      ...validHostedEnvironment(),
      TRADERSLINK_PREMIUM_DISCORD_ROLE_ID: "premium-role",
    };
    await expect(
      authorizeTraderIntelligenceOwner({
        environment,
        modulePath: "app/intelligence/page.tsx",
        sessionResolver: {
          async resolveOwnerSubject() {
            return { subject: "authenticated-non-owner" };
          },
        },
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_authenticated_subject_not_owner",
    });
  });

  it("maps the configured Discord subject to a stable internal owner identity", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validHostedEnvironment(),
        modulePath: "app/intelligence/page.tsx",
        sessionResolver: {
          async resolveOwnerSubject() {
            return { subject: "discord-owner-subject" };
          },
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
      owner: {
        identity: { ownerId: "synthetic-owner" },
        authorizationMode: "provisional_discord_session_adapter",
      },
    });
  });

  it("does not reuse the live-watchlist local bypass in private-hosted mode", async () => {
    const environment = {
      ...validHostedEnvironment(),
      LIVE_WATCHLIST_REQUIRE_LOCAL_AUTH: "0",
    };
    await expect(
      authorizeTraderIntelligenceOwner({
        environment,
        modulePath: "app/intelligence/page.tsx",
        sessionResolver: { async resolveOwnerSubject() { return null; } },
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_owner_session_missing",
    });
  });

  it("rejects a private-hosted local owner bypass flag", () => {
    const environment = {
      ...validHostedEnvironment(),
      TRADER_INTELLIGENCE_LOCAL_OWNER_BYPASS: "1",
    };
    expect(validateTraderIntelligenceDeployment(environment)).toEqual({
      ok: false,
      code: "ti_v3_private_hosted_local_bypass_forbidden",
    });
  });

  it("fails closed for an unclassified private route", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validLocalEnvironment(),
        modulePath: "app/intelligence/new-unclassified/page.tsx",
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_route_unclassified",
    });
  });

  it("disables internal diagnostics outside local-only mode", async () => {
    await expect(
      authorizeTraderIntelligenceOwner({
        environment: validHostedEnvironment(),
        modulePath: "app/intelligence/debug/trade-analysis/page.tsx",
        sessionResolver: {
          async resolveOwnerSubject() {
            return { subject: "discord-owner-subject" };
          },
        },
      }),
    ).resolves.toEqual({
      ok: false,
      code: "ti_v3_route_disabled_for_hosting_mode",
    });
  });
});
