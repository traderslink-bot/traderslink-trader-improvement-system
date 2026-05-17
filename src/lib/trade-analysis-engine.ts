// =========================
// 2026-04-14 03:20 PM America/Toronto
// TRADE ANALYSIS ENGINE
// file name: trade-analysis-engine.ts
// =========================
//
// PURPOSE:
// Single orchestration entry point for the current v2 analysis pipeline.
//
// LAYER BOUNDARIES ENFORCED HERE:
// - Layer 1 stays in createRawTradeTimeline(...) and returns RawTradeTimelineBuildResult
// - PatternInput is built only from the Layer 1 result
// - Layer 2 consumes only PatternInput
// - Layer 3 consumes only PatternDetectionResult
//
// IMPORTANT:
// - no new detection logic
// - no new pattern logic
// - no scoring
// - no coaching
// - no support/resistance logic changes

import {
  createRawTradeTimeline,
  type CreateRawTradeTimelineArgs,
} from "./raw-trade-timeline/builders/create-raw-trade-timeline";
import type { RawTradeTimelineBuildResult } from "./raw-trade-timeline/types/raw-trade-timeline-build-result";
import { buildPatternInput } from "./pattern-input/builders/build-pattern-input";
import type { PatternInput } from "./pattern-input/types/pattern-input";
import { detectPatterns } from "./pattern-detection/detect-patterns";
import type { PatternDetectionResult } from "./pattern-detection/types/pattern-detection-types";
import { normalizeDetectedPatterns } from "./pattern-normalization/normalize-detected-patterns";
import type { NormalizedPatternResult } from "./pattern-normalization/types/normalized-pattern-result";

export interface TradeAnalysisEngineResult {
  rawTradeTimeline: RawTradeTimelineBuildResult;
  patternInput: PatternInput;
  detectedPatterns: PatternDetectionResult;
  normalizedPatterns: NormalizedPatternResult;
}

// 2026-04-14 03:20 PM America/Toronto
// The docs describe Layer 1 as the raw trade timeline foundation and require
// the final Layer 1 handoff to be RawTradeTimelineBuildResult. The existing
// top-level Layer 1 entry point that already returns that full build result is
// createRawTradeTimeline(...), so this orchestrator uses that entry directly
// instead of reassembling lower-level Layer 1 internals here.
export function analyzeTrade(
  args: CreateRawTradeTimelineArgs,
): TradeAnalysisEngineResult {
  // 2026-04-14 03:20 PM America/Toronto
  // Layer 1: build the complete factual trade and structural context result.
  const rawTradeTimeline = createRawTradeTimeline(args);

  // 2026-04-14 03:20 PM America/Toronto
  // PatternInput bridge: collapse Layer 1 truth into the pattern-ready contract.
  const patternInput = buildPatternInput(rawTradeTimeline);

  // 2026-04-14 03:20 PM America/Toronto
  // Layer 2: detect all structurally true patterns from PatternInput only.
  const detectedPatterns = detectPatterns(patternInput);

  // 2026-04-14 03:20 PM America/Toronto
  // Layer 3: normalize and prioritize from detected patterns only.
  const normalizedPatterns = normalizeDetectedPatterns(detectedPatterns);

  return {
    rawTradeTimeline,
    patternInput,
    detectedPatterns,
    normalizedPatterns,
  };
}

export type {
  CreateRawTradeTimelineArgs as TradeAnalysisEngineArgs,
};
