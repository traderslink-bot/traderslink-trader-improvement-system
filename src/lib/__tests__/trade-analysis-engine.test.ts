// =========================
// 2026-04-14 03:27 PM America/Toronto
// TRADE ANALYSIS ENGINE TEST
// file name: trade-analysis-engine.test.ts
// =========================
//
// PURPOSE:
// Locks the orchestration contract for the v2 analysis pipeline without
// re-testing deep Layer 1, Layer 2, or Layer 3 logic.

import { describe, expect, it, vi, beforeEach } from "vitest";

import { sampleCreateRawTradeTimelineInput } from "../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import type { RawTradeTimelineBuildResult } from "../raw-trade-timeline/types/raw-trade-timeline-build-result";
import type { PatternInput } from "../pattern-input/types/pattern-input";
import type { PatternDetectionResult } from "../pattern-detection/types/pattern-detection-types";
import type { NormalizedPatternResult } from "../pattern-normalization/types/normalized-pattern-result";

const mockedPipeline = vi.hoisted(() => {
  return {
    createRawTradeTimeline: vi.fn(),
    buildPatternInput: vi.fn(),
    detectPatterns: vi.fn(),
    normalizeDetectedPatterns: vi.fn(),
  };
});

vi.mock("../raw-trade-timeline/builders/create-raw-trade-timeline", () => {
  return {
    createRawTradeTimeline: mockedPipeline.createRawTradeTimeline,
  };
});

vi.mock("../pattern-input/builders/build-pattern-input", () => {
  return {
    buildPatternInput: mockedPipeline.buildPatternInput,
  };
});

vi.mock("../pattern-detection/detect-patterns", () => {
  return {
    detectPatterns: mockedPipeline.detectPatterns,
  };
});

vi.mock("../pattern-normalization/normalize-detected-patterns", () => {
  return {
    normalizeDetectedPatterns: mockedPipeline.normalizeDetectedPatterns,
  };
});

import { analyzeTrade } from "../trade-analysis-engine";

describe("trade-analysis-engine", () => {
  // 2026-04-14 03:27 PM America/Toronto
  // Keep the test focused on orchestration contract, not deep detector truth.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the stable top-level engine contract and wires each layer in the correct order", () => {
    const pipelineOrder: string[] = [];

    const rawTradeTimeline = {
      timeline: {
        symbol: "ABCD",
      },
      executionLevelRelations: [],
    } as unknown as RawTradeTimelineBuildResult;

    const patternInput = {
      symbol: "ABCD",
      tradeDirection: "long",
      executionCount: 3,
    } as unknown as PatternInput;

    const detectedPatterns = {
      detectedPatterns: [
        {
          patternId: "advantaged_entry_structure",
          patternName: "Advantaged Entry Structure",
          family: "entry_quality",
          patternType: "composite",
          structuralLevel: "structural_composite",
          evidence: {},
          thresholdsUsed: {},
        },
      ],
    } satisfies PatternDetectionResult;

    const normalizedPatterns = {
      primaryPatterns: [],
      supportingPatterns: [],
      contextualPatterns: [],
      prioritizedPatterns: [],
      patternsByFamily: {},
      primaryPatternsByFamily: {},
      topOverallAnchorPattern: null,
    } satisfies NormalizedPatternResult;

    mockedPipeline.createRawTradeTimeline.mockImplementation((args) => {
      pipelineOrder.push("layer1");
      expect(args).toBe(sampleCreateRawTradeTimelineInput);
      return rawTradeTimeline;
    });

    mockedPipeline.buildPatternInput.mockImplementation((result) => {
      pipelineOrder.push("patternInput");
      expect(result).toBe(rawTradeTimeline);
      return patternInput;
    });

    mockedPipeline.detectPatterns.mockImplementation((input) => {
      pipelineOrder.push("layer2");
      expect(input).toBe(patternInput);
      return detectedPatterns;
    });

    mockedPipeline.normalizeDetectedPatterns.mockImplementation((result) => {
      pipelineOrder.push("layer3");
      expect(result).toBe(detectedPatterns);
      return normalizedPatterns;
    });

    const result = analyzeTrade(sampleCreateRawTradeTimelineInput);

    expect(pipelineOrder).toEqual([
      "layer1",
      "patternInput",
      "layer2",
      "layer3",
    ]);

    expect(Object.keys(result).sort()).toEqual([
      "detectedPatterns",
      "normalizedPatterns",
      "patternInput",
      "rawTradeTimeline",
    ]);

    expect(result).toEqual({
      rawTradeTimeline,
      patternInput,
      detectedPatterns,
      normalizedPatterns,
    });

    expect(mockedPipeline.createRawTradeTimeline).toHaveBeenCalledOnce();
    expect(mockedPipeline.buildPatternInput).toHaveBeenCalledOnce();
    expect(mockedPipeline.detectPatterns).toHaveBeenCalledOnce();
    expect(mockedPipeline.normalizeDetectedPatterns).toHaveBeenCalledOnce();

    expect(result).not.toHaveProperty("score");
    expect(result).not.toHaveProperty("scores");
    expect(result).not.toHaveProperty("coaching");
    expect(result).not.toHaveProperty("feedback");
    expect(result).not.toHaveProperty("narrative");
    expect(result).not.toHaveProperty("summary");
  });
});
