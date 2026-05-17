import { describe, expect, it } from "vitest";
import { PATTERN_DEFINITIONS } from "../../pattern-detection/registry/pattern-definitions";
import { PATTERN_METADATA } from "../pattern-metadata";
import {
  LEGACY_MANUAL_PATTERN_DOMINANCE_RULES,
  MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES,
  METADATA_INFERRED_DOMINANCE_RULE_SUMMARY_BY_CLASS,
  METADATA_INFERRED_PATTERN_DOMINANCE_RULES,
  PATTERN_DOMINANCE_RULES,
} from "../pattern-suppression-rules";

describe("pattern suppression integrity", () => {
  it("moves a non-trivial subset of dominance rules into metadata inference", () => {
    expect(METADATA_INFERRED_PATTERN_DOMINANCE_RULES.length).toBeGreaterThan(0);
    expect(MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES.length).toBeLessThan(
      PATTERN_DOMINANCE_RULES.length,
    );
  });

  it("supports truly metadata-driven inference beyond legacy manual pair matches", () => {
    const legacyManualKeys = new Set(
      LEGACY_MANUAL_PATTERN_DOMINANCE_RULES.map(
        (rule) => `${rule.dominantPatternId}=>${rule.suppressedPatternId}`,
      ),
    );
    const inferenceOnlyKeys = METADATA_INFERRED_PATTERN_DOMINANCE_RULES.map(
      (rule) => `${rule.dominantPatternId}=>${rule.suppressedPatternId}`,
    ).filter((key) => !legacyManualKeys.has(key));

    expect(inferenceOnlyKeys.length).toBeGreaterThan(0);
    expect(
      METADATA_INFERRED_DOMINANCE_RULE_SUMMARY_BY_CLASS.repeated_cycle_overlay,
    ).toContain(
      "repeated_balanced_management_with_premature_final_exit=>balanced_management_with_premature_final_exit",
    );
  });

  it("has no duplicate dominance pairs and no missing pattern references", () => {
    const pairKeys = PATTERN_DOMINANCE_RULES.map(
      (rule) => `${rule.dominantPatternId}=>${rule.suppressedPatternId}`,
    );
    const pairKeySet = new Set(pairKeys);
    const registeredPatternIds = new Set(
      PATTERN_DEFINITIONS.map((pattern) => pattern.id),
    );

    expect(pairKeySet.size).toBe(pairKeys.length);

    for (const rule of PATTERN_DOMINANCE_RULES) {
      expect(registeredPatternIds.has(rule.dominantPatternId)).toBe(true);
      expect(registeredPatternIds.has(rule.suppressedPatternId)).toBe(true);
    }
  });

  it("contains no circular dominance pairs or impossible mutual primary conflicts", () => {
    const pairKeySet = new Set(
      PATTERN_DOMINANCE_RULES.map(
        (rule) => `${rule.dominantPatternId}=>${rule.suppressedPatternId}`,
      ),
    );
    const metadataById = Object.fromEntries(
      PATTERN_METADATA.map((metadata) => [metadata.patternId, metadata]),
    );

    for (const rule of PATTERN_DOMINANCE_RULES) {
      expect(
        pairKeySet.has(`${rule.suppressedPatternId}=>${rule.dominantPatternId}`),
      ).toBe(false);

      const dominant = metadataById[rule.dominantPatternId];
      const suppressed = metadataById[rule.suppressedPatternId];

      if (dominant?.canBePrimary && suppressed?.canBePrimary) {
        expect(
          pairKeySet.has(
            `${rule.suppressedPatternId}=>${rule.dominantPatternId}`,
          ),
        ).toBe(false);
      }
    }
  });

  it("keeps broader-lineage chains acyclic", () => {
    const broaderById = Object.fromEntries(
      PATTERN_METADATA.map((metadata) => [
        metadata.patternId,
        metadata.broaderPatternIds,
      ]),
    );
    const visited = new Set<string>();
    const active = new Set<string>();

    const visit = (patternId: string): void => {
      if (visited.has(patternId)) {
        return;
      }

      expect(active.has(patternId)).toBe(false);
      active.add(patternId);

      for (const broaderPatternId of broaderById[patternId] ?? []) {
        visit(broaderPatternId);
      }

      active.delete(patternId);
      visited.add(patternId);
    };

    for (const metadata of PATTERN_METADATA) {
      visit(metadata.patternId);
      expect(metadata.lineageRoot.length).toBeGreaterThan(0);
    }
  });
});
