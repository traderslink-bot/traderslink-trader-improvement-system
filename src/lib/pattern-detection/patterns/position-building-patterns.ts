// =========================
// 2026-04-12 03:42 PM America/Toronto
// POSITION BUILDING PATTERNS
// =========================
//
// PURPOSE:
// Detects isolated position building facts from PatternInput.
//
// CURRENT DESIGN:
// These are atomic patterns.
// They describe single building facts, not full trade structures.
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

export const SCALED_INTO_POSITION: PatternDefinition = {
  id: "scaled_into_position",
  name: "Scaled Into Position",
  family: PATTERN_FAMILIES.POSITION_BUILDING,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold =
      THRESHOLDS.POSITION_BUILDING.MULTI_INCREASE_MIN_EVENTS;

    return {
      matched: input.totalPositionIncreaseCount >= threshold,
      evidence: {
        totalPositionIncreaseCount: input.totalPositionIncreaseCount,
        hadMultipleIncreases: input.hadMultipleIncreases,
      },
      thresholdsUsed: {
        minIncreaseEvents: threshold,
      },
    };
  },
};

export const SINGLE_BUILD_POSITION: PatternDefinition = {
  id: "single_build_position",
  name: "Single Build Position",
  family: PATTERN_FAMILIES.POSITION_BUILDING,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold =
      THRESHOLDS.POSITION_BUILDING.SINGLE_BUILD_MAX_INCREASE_EVENTS;

    const matched =
      input.totalPositionIncreaseCount === threshold &&
      input.hadMultipleIncreases === false;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: input.totalPositionIncreaseCount,
        hadMultipleIncreases: input.hadMultipleIncreases,
      },
      thresholdsUsed: {
        maxIncreaseEvents: threshold,
      },
    };
  },
};

export const POSITION_BUILDING_PATTERNS: PatternDefinition[] = [
  SCALED_INTO_POSITION,
  SINGLE_BUILD_POSITION,
];
