// 2026-04-12 08:39 AM America/Toronto
// PURPOSE:
// Defines reusable raw session context types for the trade timeline system.
// This file stays strictly factual and interpretation free.

// file name session-context.ts

export type SessionBucket =
  | "pre_market"
  | "market_open"
  | "midday"
  | "close"
  | "after_hours"
  | "unknown";

export interface SessionContextInput {
  sessionBucket: string;
  sessionDate: string;
}

export interface SessionContext {
  sessionBucket: SessionBucket;
  sessionDate: string;
}
