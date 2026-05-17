import type { PatternDefinition } from "../../types/pattern-detection-types";
import {
  isRecoveryAwareScalingPattern,
  isRepeatedCycleScalingPattern,
  isSupportResistanceScalingPattern,
  selectScalingQualityPatterns,
} from "./select-scaling-quality-patterns";

export const RECOVERY_OVERLAY_PATTERNS: PatternDefinition[] =
  selectScalingQualityPatterns((pattern) => {
    return (
      isRecoveryAwareScalingPattern(pattern.id) &&
      !isSupportResistanceScalingPattern(pattern.id) &&
      !isRepeatedCycleScalingPattern(pattern.id)
    );
  });
