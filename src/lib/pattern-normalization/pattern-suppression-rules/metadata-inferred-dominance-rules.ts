// =========================
// METADATA-INFERRED DOMINANCE ASSEMBLY
// =========================
//
// PURPOSE:
// Builds the metadata-driven subset of Layer 3 dominance, then subtracts those
// pairs from the legacy manual graph to leave only true manual exceptions.

import {
  PATTERN_METADATA_BY_ID,
  type PatternMetadata,
} from "../pattern-metadata";
import { defineDominanceRule } from "./helpers";
import { LEGACY_MANUAL_PATTERN_DOMINANCE_RULES } from "./manual-dominance-rules";
import type { PatternDominanceRule, SuppressionOutcome } from "./types";

function buildDominanceRuleKey(args: {
  dominantPatternId: string;
  suppressedPatternId: string;
}): string {
  return `${args.dominantPatternId}=>${args.suppressedPatternId}`;
}

const JOURNEY_SCOPE_RICHNESS_RANK: Record<
  PatternMetadata["journeyScope"],
  number
> = {
  atomic: 0,
  one_cycle: 1,
  whole_trade: 2,
  repeated_cycle: 3,
};

export const METADATA_DRIVEN_SUPPRESSION_CLASSES = [
  "legacy_calibrated_broader_lineage",
  "repeated_cycle_overlay",
  "recovery_overlay",
  "support_resistance_overlay",
  "journey_scope_overlay",
] as const;

export type MetadataDrivenSuppressionClass =
  (typeof METADATA_DRIVEN_SUPPRESSION_CLASSES)[number];

function inferDominanceOutcome(
  suppressedMetadata: PatternMetadata,
): SuppressionOutcome {
  return suppressedMetadata.defaultRole === "context_only"
    ? "demote_to_contextual"
    : "demote_to_supporting";
}

function getMetadataDrivenSuppressionClass(args: {
  dominantMetadata: PatternMetadata;
  suppressedMetadata: PatternMetadata;
  hasLegacyManualCalibration: boolean;
}): MetadataDrivenSuppressionClass | null {
  const { dominantMetadata, suppressedMetadata, hasLegacyManualCalibration } =
    args;

  if (hasLegacyManualCalibration) {
    return "legacy_calibrated_broader_lineage";
  }

  const sameFamily = dominantMetadata.family === suppressedMetadata.family;
  const sameSubFamily =
    dominantMetadata.subFamily === suppressedMetadata.subFamily;
  const sameOutcomeFlavor =
    dominantMetadata.outcomeFlavor === suppressedMetadata.outcomeFlavor;
  const samePatternType =
    dominantMetadata.patternType === suppressedMetadata.patternType;
  const richerJourneyScope =
    JOURNEY_SCOPE_RICHNESS_RANK[dominantMetadata.journeyScope] >
    JOURNEY_SCOPE_RICHNESS_RANK[suppressedMetadata.journeyScope];

  if (!(sameFamily && sameSubFamily && sameOutcomeFlavor && samePatternType)) {
    return null;
  }

  if (
    dominantMetadata.journeyScope === "repeated_cycle" &&
    suppressedMetadata.journeyScope !== "repeated_cycle"
  ) {
    return "repeated_cycle_overlay";
  }

  if (
    dominantMetadata.isRecoveryAware &&
    !suppressedMetadata.isRecoveryAware &&
    dominantMetadata.isSupportResistanceAware ===
      suppressedMetadata.isSupportResistanceAware &&
    dominantMetadata.journeyScope === suppressedMetadata.journeyScope
  ) {
    return "recovery_overlay";
  }

  if (
    dominantMetadata.isSupportResistanceAware &&
    !suppressedMetadata.isSupportResistanceAware &&
    dominantMetadata.isRecoveryAware === suppressedMetadata.isRecoveryAware &&
    dominantMetadata.journeyScope === suppressedMetadata.journeyScope
  ) {
    return "support_resistance_overlay";
  }

  if (
    richerJourneyScope &&
    dominantMetadata.isRecoveryAware === suppressedMetadata.isRecoveryAware &&
    dominantMetadata.isSupportResistanceAware ===
      suppressedMetadata.isSupportResistanceAware
  ) {
    return "journey_scope_overlay";
  }

  return null;
}

function buildMetadataDrivenSuppressionReason(args: {
  dominantMetadata: PatternMetadata;
  suppressedMetadata: PatternMetadata;
  inferenceClass: MetadataDrivenSuppressionClass;
}): string {
  const { dominantMetadata, suppressedMetadata, inferenceClass } = args;

  switch (inferenceClass) {
    case "legacy_calibrated_broader_lineage":
      return `Metadata inferred broader-lineage suppression: ${dominantMetadata.patternId} is a richer ${dominantMetadata.journeyScope} ${dominantMetadata.subFamily} variant than ${suppressedMetadata.patternId}.`;
    case "repeated_cycle_overlay":
      return `Metadata inferred repeated-cycle suppression: ${dominantMetadata.patternId} is the repeated-cycle ${dominantMetadata.subFamily} variant of ${suppressedMetadata.patternId}.`;
    case "recovery_overlay":
      return `Metadata inferred recovery-overlay suppression: ${dominantMetadata.patternId} adds recovery-aware context to ${suppressedMetadata.patternId}.`;
    case "support_resistance_overlay":
      return `Metadata inferred support/resistance suppression: ${dominantMetadata.patternId} adds structural level context to ${suppressedMetadata.patternId}.`;
    case "journey_scope_overlay":
      return `Metadata inferred journey-scope suppression: ${dominantMetadata.patternId} is a richer ${dominantMetadata.journeyScope} expression of ${suppressedMetadata.patternId}.`;
  }
}

function buildMetadataInferredDominanceRules(): {
  rules: PatternDominanceRule[];
  summaryByClass: Record<MetadataDrivenSuppressionClass, string[]>;
} {
  const legacyManualRulesByKey = new Map(
    LEGACY_MANUAL_PATTERN_DOMINANCE_RULES.map((rule) => [
      buildDominanceRuleKey(rule),
      rule,
    ]),
  );
  const inferredRules: PatternDominanceRule[] = [];
  const summaryByClass = METADATA_DRIVEN_SUPPRESSION_CLASSES.reduce<
    Record<MetadataDrivenSuppressionClass, string[]>
  >(
    (accumulator, classification) => {
      accumulator[classification] = [];
      return accumulator;
    },
    {
      legacy_calibrated_broader_lineage: [],
      repeated_cycle_overlay: [],
      recovery_overlay: [],
      support_resistance_overlay: [],
      journey_scope_overlay: [],
    },
  );

  for (const dominantMetadata of Object.values(PATTERN_METADATA_BY_ID)) {
    for (const suppressedPatternId of dominantMetadata.broaderPatternIds) {
      const suppressedMetadata = PATTERN_METADATA_BY_ID[suppressedPatternId];

      if (!suppressedMetadata) {
        continue;
      }

      const key = buildDominanceRuleKey({
        dominantPatternId: dominantMetadata.patternId,
        suppressedPatternId,
      });
      const matchingManualRule = legacyManualRulesByKey.get(key);
      const inferenceClass = getMetadataDrivenSuppressionClass({
        dominantMetadata,
        suppressedMetadata,
        hasLegacyManualCalibration: Boolean(matchingManualRule),
      });

      if (!inferenceClass) {
        continue;
      }

      summaryByClass[inferenceClass].push(key);
      inferredRules.push(
        defineDominanceRule({
          dominantPatternId: dominantMetadata.patternId,
          suppressedPatternId,
          outcome:
            matchingManualRule?.outcome ??
            inferDominanceOutcome(suppressedMetadata),
          reason:
            matchingManualRule?.reason ??
            buildMetadataDrivenSuppressionReason({
              dominantMetadata,
              suppressedMetadata,
              inferenceClass,
            }),
        }),
      );
    }
  }

  return {
    rules: inferredRules,
    summaryByClass,
  };
}

function dedupeDominanceRules(
  rules: PatternDominanceRule[],
): PatternDominanceRule[] {
  const seenRuleKeys = new Set<string>();
  const dedupedRules: PatternDominanceRule[] = [];

  for (const rule of rules) {
    const key = buildDominanceRuleKey(rule);

    if (seenRuleKeys.has(key)) {
      continue;
    }

    seenRuleKeys.add(key);
    dedupedRules.push(rule);
  }

  return dedupedRules;
}

const METADATA_INFERRED_RULE_BUILD_RESULT =
  buildMetadataInferredDominanceRules();

export const METADATA_INFERRED_PATTERN_DOMINANCE_RULES =
  METADATA_INFERRED_RULE_BUILD_RESULT.rules;

export const METADATA_INFERRED_DOMINANCE_RULE_SUMMARY =
  METADATA_INFERRED_PATTERN_DOMINANCE_RULES.map(
    (rule) => `${rule.dominantPatternId}=>${rule.suppressedPatternId}`,
  );

export const METADATA_INFERRED_DOMINANCE_RULE_SUMMARY_BY_CLASS =
  METADATA_INFERRED_RULE_BUILD_RESULT.summaryByClass;

const METADATA_INFERRED_RULE_KEYS = new Set(
  METADATA_INFERRED_PATTERN_DOMINANCE_RULES.map((rule) =>
    buildDominanceRuleKey(rule),
  ),
);

// Manual exceptions still carry the cases metadata cannot prove safely yet:
// - cross-family bridges
// - same-family but asymmetric storyline jumps
// - outcome mixes where richer-vs-broader meaning depends on domain nuance not
//   yet encoded in PatternMetadata
export const MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES =
  LEGACY_MANUAL_PATTERN_DOMINANCE_RULES.filter(
    (rule) => !METADATA_INFERRED_RULE_KEYS.has(buildDominanceRuleKey(rule)),
  );

export const PATTERN_DOMINANCE_RULES: PatternDominanceRule[] =
  dedupeDominanceRules([
    ...METADATA_INFERRED_PATTERN_DOMINANCE_RULES,
    ...MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES,
  ]);
