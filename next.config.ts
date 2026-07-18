import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["levels-system-v2"],
  async headers() {
    return [
      {
        source: "/intelligence/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Vary", value: "Cookie" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.traderslink.pro",
          },
        ],
        destination: "https://traderslink.pro/:path*",
        permanent: true,
      },
      {
        source: "/workspace",
        destination: "/intelligence",
        permanent: true,
      },
      {
        source: "/workspace/admin",
        destination: "/intelligence/admin",
        permanent: true,
      },
      {
        source: "/analytics/:path*",
        destination: "/intelligence/analytics/:path*",
        permanent: true,
      },
      {
        source: "/trades/:path*",
        destination: "/intelligence/trades/:path*",
        permanent: true,
      },
      {
        source: "/imports/:path*",
        destination: "/intelligence/imports/:path*",
        permanent: true,
      },
      {
        source: "/coach/:path*",
        destination: "/intelligence/coach/:path*",
        permanent: true,
      },
      {
        source: "/review",
        destination: "/intelligence/review",
        permanent: true,
      },
      {
        source: "/progress",
        destination: "/intelligence/progress",
        permanent: true,
      },
      {
        source: "/upload-csv",
        destination: "/intelligence/upload-csv",
        permanent: true,
      },
      {
        source: "/trader-intelligence",
        destination: "/intelligence/trader-intelligence",
        permanent: true,
      },
      {
        source: "/import-dry-run",
        destination: "/intelligence/import-dry-run",
        permanent: true,
      },
      {
        source: "/import-health",
        destination: "/intelligence/import-health",
        permanent: true,
      },
      {
        source: "/import-trials",
        destination: "/intelligence/import-trials",
        permanent: true,
      },
      {
        source: "/repair-wizard",
        destination: "/intelligence/repair-wizard",
        permanent: true,
      },
      {
        source: "/review-cockpit",
        destination: "/intelligence/review-cockpit",
        permanent: true,
      },
      {
        source: "/session-recap",
        destination: "/intelligence/session-recap",
        permanent: true,
      },
      {
        source: "/compare-trades",
        destination: "/intelligence/compare-trades",
        permanent: true,
      },
      {
        source: "/calibration",
        destination: "/intelligence/calibration",
        permanent: true,
      },
      {
        source: "/onboarding",
        destination: "/intelligence/onboarding",
        permanent: true,
      },
      {
        source: "/first-run",
        destination: "/intelligence/first-run",
        permanent: true,
      },
      {
        source: "/debug/:path*",
        destination: "/intelligence/debug/:path*",
        permanent: true,
      },
      {
        source: "/admin/broker-mappings",
        destination: "/intelligence/admin/broker-mappings",
        permanent: true,
      },
      {
        source: "/coaching",
        destination: "/intelligence/coach",
        permanent: true,
      },
      {
        source: "/academy/candlestick-deep-dive-lessons",
        destination: "/academy/candlestick-patterns",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/hammer",
        destination: "/academy/candle-behavior/hammer",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/bottoming-tail",
        destination: "/academy/candle-behavior/bottoming-tail-candle",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/topping-tail",
        destination: "/academy/candle-behavior/topping-tail-candle",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/doji",
        destination: "/academy/candle-behavior/standard-doji",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/spinning-top",
        destination: "/academy/candle-behavior/spinning-top",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/inside-bar",
        destination: "/academy/candle-behavior/inside-bar",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/outside-bar",
        destination: "/academy/candle-behavior/outside-bar",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/candle-volume-confirmation",
        destination: "/academy/candle-behavior/high-volume-green-candle",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/red-to-green-move",
        destination: "/academy/candle-behavior/red-to-green-move",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/green-to-red-move",
        destination: "/academy/candle-behavior/green-to-red-move",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/long-wick-candle",
        destination: "/academy/candlestick-patterns",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/pin-bar",
        destination: "/academy/candlestick-patterns",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/engulfing-candle",
        destination: "/academy/candlestick-patterns",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
