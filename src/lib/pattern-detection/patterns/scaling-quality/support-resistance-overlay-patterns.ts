import type { PatternDefinition } from "../../types/pattern-detection-types";
import {
  isSupportResistanceScalingPattern,
  selectScalingQualityPatterns,
} from "./select-scaling-quality-patterns";

export const SUPPORT_RESISTANCE_OVERLAY_PATTERNS: PatternDefinition[] =
  selectScalingQualityPatterns((pattern) => {
    return isSupportResistanceScalingPattern(pattern.id);
  });
