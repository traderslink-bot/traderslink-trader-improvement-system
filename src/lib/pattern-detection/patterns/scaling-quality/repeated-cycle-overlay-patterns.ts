import type { PatternDefinition } from "../../types/pattern-detection-types";
import {
  isRepeatedCycleScalingPattern,
  isSupportResistanceScalingPattern,
  selectScalingQualityPatterns,
} from "./select-scaling-quality-patterns";

export const REPEATED_CYCLE_OVERLAY_PATTERNS: PatternDefinition[] =
  selectScalingQualityPatterns((pattern) => {
    return (
      isRepeatedCycleScalingPattern(pattern.id) &&
      !isSupportResistanceScalingPattern(pattern.id)
    );
  });
