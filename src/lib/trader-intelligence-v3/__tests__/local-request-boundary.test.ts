import { describe, expect, it } from "vitest";

import {
  isTraderIntelligenceLoopbackPeerAddress,
  TRADER_INTELLIGENCE_LOCAL_LISTENER_ASSERTION_HEADER,
  TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV,
  validateTraderIntelligenceLocalRequest,
} from "../deployment";

function validate(args: {
  host?: string;
  requestUrl?: string;
  extraHeaders?: Record<string, string>;
}) {
  const headers = new Headers(args.extraHeaders);
  if (args.host !== undefined) {
    headers.set("host", args.host);
  }
  return validateTraderIntelligenceLocalRequest({
    headers,
    requestUrl: args.requestUrl,
  });
}

describe("Trader Intelligence local request boundary", () => {
  it.each([
    ["localhost", "http://localhost/intelligence"],
    ["127.0.0.1", "http://127.0.0.1/intelligence"],
    ["[::1]", "http://[::1]/intelligence"],
    ["localhost:3000", "http://localhost:3000/intelligence"],
    ["127.0.0.1:3100", "http://127.0.0.1:3100/intelligence"],
    ["[::1]:3200", "http://[::1]:3200/intelligence"],
  ])("allows exact loopback authority %s", (host, requestUrl) => {
    expect(validate({ host, requestUrl })).toMatchObject({ ok: true });
  });

  it.each([
    "0.0.0.0",
    "192.168.1.10",
    "10.0.0.5",
    "8.8.8.8",
    "arbitrary-hostname",
    "attacker.example",
    "localhost.attacker.example",
  ])("rejects non-loopback host %s", (host) => {
    expect(validate({ host, requestUrl: `http://${host}/intelligence` })).toEqual({
      ok: false,
      code: "ti_v3_local_request_host_not_loopback",
    });
  });

  it.each([
    "",
    "localhost:0",
    "localhost:65536",
    "localhost:abc",
    "user@localhost",
    "localhost,attacker.example",
    "localhost/path",
    "[::1",
  ])("rejects malformed Host value %s", (host) => {
    expect(validate({ host, requestUrl: "http://localhost/intelligence" })).toMatchObject({
      ok: false,
      code: expect.stringMatching(/host_(?:missing|malformed)/),
    });
  });

  it.each([
    "forwarded",
    "x-forwarded-host",
    "x-forwarded-for",
    "x-forwarded-proto",
  ])("rejects forwarded header %s", (header) => {
    expect(
      validate({
        host: "localhost",
        requestUrl: "http://localhost/intelligence",
        extraHeaders: { [header]: "attacker.example" },
      }),
    ).toEqual({
      ok: false,
      code: "ti_v3_local_request_forwarded_header_forbidden",
    });
  });

  it.each(["via", "x-real-ip", "cf-connecting-ip", "x-ngrok-id"])(
    "rejects proxy or tunnel evidence %s",
    (header) => {
      expect(
        validate({
          host: "localhost",
          requestUrl: "http://localhost/intelligence",
          extraHeaders: { [header]: "synthetic-proxy" },
        }),
      ).toEqual({
        ok: false,
        code: "ti_v3_local_request_proxy_or_tunnel_header_forbidden",
      });
    },
  );

  it("rejects a loopback Host paired with a non-loopback request URL", () => {
    expect(
      validate({ host: "localhost", requestUrl: "http://attacker.example/api/trades" }),
    ).toEqual({
      ok: false,
      code: "ti_v3_local_request_url_not_loopback",
    });
  });

  it("rejects mismatched loopback authorities", () => {
    expect(
      validate({ host: "localhost:3000", requestUrl: "http://localhost:3001/api/trades" }),
    ).toEqual({
      ok: false,
      code: "ti_v3_local_request_host_url_mismatch",
    });
  });

  it("accepts only the exact forwarding set synthesized after listener validation", () => {
    const original = process.env[TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV];
    process.env[TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV] = "synthetic-listener-token";
    try {
      expect(
        validate({
          host: "127.0.0.1:3101",
          requestUrl: "http://localhost:3101/intelligence",
          extraHeaders: {
            [TRADER_INTELLIGENCE_LOCAL_LISTENER_ASSERTION_HEADER]:
              "synthetic-listener-token",
            "x-forwarded-for": "127.0.0.1",
            "x-forwarded-host": "127.0.0.1:3101",
            "x-forwarded-port": "3101",
            "x-forwarded-proto": "http",
          },
        }),
      ).toMatchObject({ ok: true });

      expect(
        validate({
          host: "127.0.0.1:3101",
          requestUrl: "http://127.0.0.1:3101/intelligence",
          extraHeaders: {
            [TRADER_INTELLIGENCE_LOCAL_LISTENER_ASSERTION_HEADER]:
              "synthetic-listener-token",
            "x-forwarded-for": "127.0.0.1",
            "x-forwarded-host": "attacker.example",
            "x-forwarded-port": "3101",
            "x-forwarded-proto": "http",
          },
        }),
      ).toEqual({
        ok: false,
        code: "ti_v3_local_request_forwarded_header_forbidden",
      });
    } finally {
      if (original === undefined) {
        delete process.env[TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV];
      } else {
        process.env[TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV] = original;
      }
    }
  });

  it.each([
    ["127.0.0.1", true],
    ["::1", true],
    ["::ffff:127.0.0.1", true],
    ["192.168.1.10", false],
    ["10.0.0.5", false],
    ["8.8.8.8", false],
  ])("classifies listener peer address %s", (address, expected) => {
    expect(isTraderIntelligenceLoopbackPeerAddress(address)).toBe(expected);
  });
});
