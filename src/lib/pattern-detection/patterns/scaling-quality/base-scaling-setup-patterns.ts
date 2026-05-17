import type { PatternDefinition } from "../../types/pattern-detection-types";
import {
  hasOutcomeOverlayScalingPattern,
  isRecoveryAwareScalingPattern,
  isRepeatedCycleScalingPattern,
  isSupportResistanceScalingPattern,
  selectScalingQualityPatterns,
} from "./select-scaling-quality-patterns";

export const BASE_SCALING_SETUP_PATTERNS: PatternDefinition[] =
  selectScalingQualityPatterns((pattern) => {
    return (
      !isRecoveryAwareScalingPattern(pattern.id) &&
      !isSupportResistanceScalingPattern(pattern.id) &&
      !isRepeatedCycleScalingPattern(pattern.id) &&
      !hasOutcomeOverlayScalingPattern(pattern.id)
    );
  });
