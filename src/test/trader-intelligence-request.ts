export interface TraderIntelligenceTestRequestInit
  extends Omit<RequestInit, "headers"> {
  headers?: HeadersInit;
  origin?: string | null;
  host?: string;
}

const LOCAL_TEST_ENVIRONMENT = {
  TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE: "private_owner_alpha",
  TRADER_INTELLIGENCE_HOSTING_MODE: "local_only",
  TRADER_INTELLIGENCE_STORAGE_MODE: "local_sqlite",
  TRADER_INTELLIGENCE_DATA_MODE: "sample_data",
  TRADER_INTELLIGENCE_OWNER_ID: "synthetic-test-owner",
  TRADER_INTELLIGENCE_APPROVED_ORIGINS: "http://localhost",
} as const;

export function installTraderIntelligenceLocalTestEnvironment(
  overrides: Readonly<Record<string, string | undefined>> = {},
): () => void {
  const values = { ...LOCAL_TEST_ENVIRONMENT, ...overrides };
  const original = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return () => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

export function createTraderIntelligenceTestRequest(
  url: string,
  init: TraderIntelligenceTestRequestInit = {},
): Request {
  const method = (init.method ?? "GET").toUpperCase();
  if (
    !new Set(["GET", "HEAD", "OPTIONS"]).has(method) &&
    !("origin" in init)
  ) {
    throw new Error("Unsafe test requests must declare origin evidence.");
  }
  const headers = new Headers(init.headers);
  headers.set("host", init.host ?? new URL(url).host);
  if (init.origin !== null && init.origin !== undefined) {
    headers.set("origin", init.origin);
  }
  const requestInit = { ...init };
  delete requestInit.host;
  delete requestInit.origin;
  return new Request(url, { ...requestInit, method, headers });
}
