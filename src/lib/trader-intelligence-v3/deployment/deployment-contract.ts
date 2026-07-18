export const TRADER_INTELLIGENCE_DEPLOYMENT_PROFILES = [
  "private_owner_alpha",
  "private_invited_alpha",
  "public_beta",
  "public_production",
] as const;

export const TRADER_INTELLIGENCE_HOSTING_MODES = [
  "local_only",
  "private_hosted",
] as const;

export const TRADER_INTELLIGENCE_STORAGE_MODES = [
  "local_sqlite",
  "private_database",
] as const;

export const TRADER_INTELLIGENCE_DATA_MODES = [
  "sample_data",
  "real_owner_data",
] as const;

export type TraderIntelligenceDeploymentProfile =
  (typeof TRADER_INTELLIGENCE_DEPLOYMENT_PROFILES)[number];
export type TraderIntelligenceHostingMode =
  (typeof TRADER_INTELLIGENCE_HOSTING_MODES)[number];
export type TraderIntelligenceStorageMode =
  (typeof TRADER_INTELLIGENCE_STORAGE_MODES)[number];
export type TraderIntelligenceDataMode =
  (typeof TRADER_INTELLIGENCE_DATA_MODES)[number];

export type TraderIntelligenceDeploymentReasonCode =
  | "ti_v3_deployment_profile_missing"
  | "ti_v3_deployment_profile_invalid"
  | "ti_v3_deployment_profile_not_operational"
  | "ti_v3_hosting_mode_missing"
  | "ti_v3_hosting_mode_invalid"
  | "ti_v3_local_only_hosted_environment_forbidden"
  | "ti_v3_owner_id_missing"
  | "ti_v3_owner_subject_missing"
  | "ti_v3_storage_mode_missing"
  | "ti_v3_storage_mode_invalid"
  | "ti_v3_storage_mode_unsafe"
  | "ti_v3_data_mode_missing"
  | "ti_v3_data_mode_invalid"
  | "ti_v3_private_hosted_local_bypass_forbidden";

export interface TraderIntelligenceDeploymentConfig {
  profile: TraderIntelligenceDeploymentProfile;
  hostingMode: TraderIntelligenceHostingMode;
  storageMode: TraderIntelligenceStorageMode;
  dataMode: TraderIntelligenceDataMode;
  ownerId: string;
  ownerSubject: string | null;
  approvedOrigins: readonly string[];
}

export type TraderIntelligenceDeploymentValidation =
  | { ok: true; config: TraderIntelligenceDeploymentConfig }
  | { ok: false; code: TraderIntelligenceDeploymentReasonCode };

export type TraderIntelligenceEnvironment = Readonly<
  Record<string, string | undefined>
>;

function readValue(
  environment: TraderIntelligenceEnvironment,
  key: string,
): string | null {
  return environment[key]?.trim() || null;
}

function includesValue<T extends string>(
  values: readonly T[],
  candidate: string,
): candidate is T {
  return values.includes(candidate as T);
}

export function hasHostedEnvironmentSignal(
  environment: TraderIntelligenceEnvironment,
): boolean {
  return Boolean(
    environment.NODE_ENV === "production" ||
      environment.VERCEL ||
      environment.VERCEL_ENV ||
      environment.AWS_LAMBDA_FUNCTION_NAME ||
      environment.K_SERVICE ||
      environment.FLY_APP_NAME ||
      environment.RAILWAY_ENVIRONMENT ||
      environment.RENDER ||
      environment.DYNO,
  );
}

function parseApprovedOrigins(value: string | null): readonly string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function validateTraderIntelligenceDeployment(
  environment: TraderIntelligenceEnvironment,
): TraderIntelligenceDeploymentValidation {
  const profileValue = readValue(
    environment,
    "TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE",
  );
  if (!profileValue) {
    return { ok: false, code: "ti_v3_deployment_profile_missing" };
  }
  if (
    !includesValue(TRADER_INTELLIGENCE_DEPLOYMENT_PROFILES, profileValue)
  ) {
    return { ok: false, code: "ti_v3_deployment_profile_invalid" };
  }
  if (profileValue !== "private_owner_alpha") {
    return { ok: false, code: "ti_v3_deployment_profile_not_operational" };
  }

  const hostingModeValue = readValue(
    environment,
    "TRADER_INTELLIGENCE_HOSTING_MODE",
  );
  if (!hostingModeValue) {
    return { ok: false, code: "ti_v3_hosting_mode_missing" };
  }
  if (!includesValue(TRADER_INTELLIGENCE_HOSTING_MODES, hostingModeValue)) {
    return { ok: false, code: "ti_v3_hosting_mode_invalid" };
  }
  if (
    hostingModeValue === "local_only" &&
    hasHostedEnvironmentSignal(environment)
  ) {
    return {
      ok: false,
      code: "ti_v3_local_only_hosted_environment_forbidden",
    };
  }

  const ownerId = readValue(environment, "TRADER_INTELLIGENCE_OWNER_ID");
  if (!ownerId) {
    return { ok: false, code: "ti_v3_owner_id_missing" };
  }

  const ownerSubject = readValue(
    environment,
    "TRADER_INTELLIGENCE_OWNER_DISCORD_SUBJECT",
  );
  if (hostingModeValue === "private_hosted" && !ownerSubject) {
    return { ok: false, code: "ti_v3_owner_subject_missing" };
  }
  if (
    hostingModeValue === "private_hosted" &&
    readValue(environment, "TRADER_INTELLIGENCE_LOCAL_OWNER_BYPASS") === "1"
  ) {
    return {
      ok: false,
      code: "ti_v3_private_hosted_local_bypass_forbidden",
    };
  }

  const storageModeValue = readValue(
    environment,
    "TRADER_INTELLIGENCE_STORAGE_MODE",
  );
  if (!storageModeValue) {
    return { ok: false, code: "ti_v3_storage_mode_missing" };
  }
  if (!includesValue(TRADER_INTELLIGENCE_STORAGE_MODES, storageModeValue)) {
    return { ok: false, code: "ti_v3_storage_mode_invalid" };
  }
  if (
    hostingModeValue === "private_hosted" &&
    storageModeValue !== "private_database"
  ) {
    return { ok: false, code: "ti_v3_storage_mode_unsafe" };
  }

  const dataModeValue = readValue(
    environment,
    "TRADER_INTELLIGENCE_DATA_MODE",
  );
  if (!dataModeValue) {
    return { ok: false, code: "ti_v3_data_mode_missing" };
  }
  if (!includesValue(TRADER_INTELLIGENCE_DATA_MODES, dataModeValue)) {
    return { ok: false, code: "ti_v3_data_mode_invalid" };
  }

  return {
    ok: true,
    config: {
      profile: profileValue,
      hostingMode: hostingModeValue,
      storageMode: storageModeValue,
      dataMode: dataModeValue,
      ownerId,
      ownerSubject,
      approvedOrigins: parseApprovedOrigins(
        readValue(environment, "TRADER_INTELLIGENCE_APPROVED_ORIGINS"),
      ),
    },
  };
}
