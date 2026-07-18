import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import next from "next";

import { mergeTraderIntelligenceVaryCookie } from "../lib/trader-intelligence-v3/auth/private-response";
import {
  isTraderIntelligenceLoopbackPeerAddress,
  TRADER_INTELLIGENCE_LOCAL_LISTENER_ASSERTION_HEADER,
  TRADER_INTELLIGENCE_LOCAL_LISTENER_HOST,
  TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV,
  validateTraderIntelligenceLocalRequest,
} from "../lib/trader-intelligence-v3/deployment/local-network-boundary";

function applyIntelligencePageVaryBoundary(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname !== "/intelligence" && !pathname.startsWith("/intelligence/")) {
    return;
  }
  const setHeader = response.setHeader.bind(response);
  response.setHeader = ((name: string, value: number | string | readonly string[]) =>
    setHeader(
      name,
      name.toLowerCase() === "vary"
        ? mergeTraderIntelligenceVaryCookie(
            Array.isArray(value) ? value.join(", ") : String(value),
          )
        : value,
    )) as typeof response.setHeader;
  response.setHeader("Vary", "Cookie");
}

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function resolvePort(): number {
  const supplied = readArgument("--port") ?? readArgument("-p") ?? process.env.PORT ?? "3000";
  if (!/^\d{1,5}$/.test(supplied)) {
    throw new Error("ti_v3_local_listener_port_invalid");
  }
  const parsed = Number(supplied);
  if (parsed < 1 || parsed > 65_535) {
    throw new Error("ti_v3_local_listener_port_invalid");
  }
  return parsed;
}

function resolveHostname(): string {
  const supplied = readArgument("--hostname") ?? readArgument("-H");
  if (supplied && supplied !== TRADER_INTELLIGENCE_LOCAL_LISTENER_HOST) {
    throw new Error("ti_v3_local_listener_host_not_loopback");
  }
  return TRADER_INTELLIGENCE_LOCAL_LISTENER_HOST;
}

function requestHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    headers.append(request.rawHeaders[index], request.rawHeaders[index + 1]);
  }
  return headers;
}

function rejectRequest(
  response: ServerResponse,
  status: number,
  code: string,
): void {
  response.writeHead(status, {
    "cache-control": "private, no-store, max-age=0",
    "content-type": "application/json; charset=utf-8",
    expires: "0",
    pragma: "no-cache",
    vary: "Cookie",
  });
  response.end(JSON.stringify({ ok: false, code }));
}

async function main(): Promise<void> {
  const dev = process.argv.includes("--dev");
  const hostname = resolveHostname();
  const port = resolvePort();
  const listenerToken = randomBytes(32).toString("base64url");
  process.env[TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV] = listenerToken;

  const application = next({ dev, hostname, port });
  const handler = application.getRequestHandler();
  await application.prepare();

  const server = createServer((request, response) => {
    if (!isTraderIntelligenceLoopbackPeerAddress(request.socket.remoteAddress)) {
      rejectRequest(
        response,
        403,
        "ti_v3_local_request_remote_address_not_loopback",
      );
      return;
    }
    const headers = requestHeaders(request);
    headers.delete(TRADER_INTELLIGENCE_LOCAL_LISTENER_ASSERTION_HEADER);
    const validation = validateTraderIntelligenceLocalRequest({ headers });
    if (!validation.ok) {
      rejectRequest(response, 400, validation.code);
      return;
    }

    request.headers[TRADER_INTELLIGENCE_LOCAL_LISTENER_ASSERTION_HEADER] =
      listenerToken;
    applyIntelligencePageVaryBoundary(request, response);
    void handler(request, response).catch((error: unknown) => {
      console.error("Trader Intelligence local listener request failure.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      if (!response.headersSent) {
        rejectRequest(response, 500, "ti_v3_local_listener_request_failure");
      } else {
        response.end();
      }
    });
  });

  server.listen(port, hostname, () => {
    console.info("Trader Intelligence local listener ready.", {
      mode: dev ? "development" : "optimized",
      hostname,
      port,
    });
  });
}

void main().catch((error: unknown) => {
  const stableCode =
    error instanceof Error &&
    new Set([
      "ti_v3_local_listener_host_not_loopback",
      "ti_v3_local_listener_port_invalid",
    ]).has(error.message)
      ? error.message
      : "ti_v3_local_listener_failure";
  console.error("Trader Intelligence local listener startup failed.", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    code: stableCode,
  });
  process.exitCode = 1;
});
