import { describe, expect, it } from "vitest";
import { PATTERN_DEFINITIONS } from "../../pattern-detection/registry/pattern-definitions";
import {
  PATTERN_JOURNEY_SCOPES,
  PATTERN_LANES,
  PATTERN_METADATA,
  PATTERN_OUTCOME_FLAVORS,
  validatePatternMetadataRegistry,
} from "../pattern-metadata";

describe("pattern metadata registry", () => {
  it("covers every registered pattern with valid metadata", () => {
    expect(validatePatternMetadataRegistry()).toEqual([]);
    expect(PATTERN_METADATA).toHaveLength(PATTERN_DEFINITIONS.length);
  });

  it("uses only supported semantic enums", () => {
    const supportedLanes = new Set(PATTERN_LANES);
    const supportedJourneyScopes = new Set(PATTERN_JOURNEY_SCOPES);
    const supportedOutcomeFlavors = new Set(PATTERN_OUTCOME_FLAVORS);

    for (const metadata of PATTERN_METADATA) {
      expect(supportedLanes.has(metadata.lane)).toBe(true);
      expect(supportedJourneyScopes.has(metadata.journeyScope)).toBe(true);
      expect(supportedOutcomeFlavors.has(metadata.outcomeFlavor)).toBe(true);
    }
  });

  it("keeps metadata ids unique and broader references valid", () => {
    const metadataIds = PATTERN_METADATA.map((metadata) => metadata.patternId);
    const metadataIdSet = new Set(metadataIds);

    expect(metadataIdSet.size).toBe(metadataIds.length);

    for (const metadata of PATTERN_METADATA) {
      for (const broaderPatternId of metadata.broaderPatternIds) {
        expect(metadataIdSet.has(broaderPatternId)).toBe(true);
      }

      expect(metadataIdSet.has(metadata.lineageRoot)).toBe(true);
    }
  });
});
