// 2026-04-12 10:31 AM America/Toronto
// PURPOSE:
// Global Vitest setup for the trader-improvement-system project.
// Keep this file lightweight and free of app-specific interpretation logic.

process.env.TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE ??= "private_owner_alpha";
process.env.TRADER_INTELLIGENCE_HOSTING_MODE ??= "local_only";
process.env.TRADER_INTELLIGENCE_STORAGE_MODE ??= "local_sqlite";
process.env.TRADER_INTELLIGENCE_DATA_MODE ??= "sample_data";
process.env.TRADER_INTELLIGENCE_OWNER_ID ??= "synthetic-test-owner";

const NativeRequest = globalThis.Request;

class SameOriginTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers);
    if (!["GET", "HEAD", "OPTIONS"].includes(method) && !headers.has("origin")) {
      const inputUrl = input instanceof NativeRequest ? input.url : String(input);
      headers.set("origin", new URL(inputUrl).origin);
    }
    super(input, { ...init, headers });
  }
}

globalThis.Request = SameOriginTestRequest;

export {};
