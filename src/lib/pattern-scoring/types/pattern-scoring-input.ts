import type {
  NormalizedDetectedPattern,
  NormalizedPatternResult,
} from "../../pattern-normalization/types/normalized-pattern-result";

export interface PatternScoringInput {
  // Full Layer 3 result preserved for downstream consumers that need the
  // complete normalized contract, but scoring should prefer the curated fields
  // below instead of reaching through this object by default.
  normalizedPatternResult: NormalizedPatternResult;

  // =========================
  // PRIMARY SCORING DRIVERS
  // =========================

  // Layer 4 should treat this as the trade's single top-level anchor.
  topOverallAnchorPattern: NormalizedDetectedPattern | null;

  // Strongest normalized patterns after Layer 3 overlap resolution.
  primaryPatterns: NormalizedDetectedPattern[];

  // Highest-priority full normalized order. Useful when scoring needs to
  // inspect how strongly a pattern sits inside the final Layer 3 ranking.
  prioritizedPatterns: NormalizedDetectedPattern[];

  // Strongest family-level anchors after Layer 3 enforces one primary per
  // family.
  primaryPatternsByFamily: Record<string, NormalizedDetectedPattern>;

  // =========================
  // SECONDARY SCORING CONTEXT
  // =========================

  // Secondary truths that survived normalization but are not family anchors.
  supportingPatterns: NormalizedDetectedPattern[];

  // Low-priority truths preserved for context only.
  contextualPatterns: NormalizedDetectedPattern[];

  // Full family grouping is useful when scoring wants family pressure or
  // breadth without reading directly from Layer 3 internals.
  patternsByFamily: Record<string, NormalizedDetectedPattern[]>;

  // =========================
  // INFORMATIONAL NOTE
  // =========================
  //
  // Every NormalizedDetectedPattern already carries:
  // - patternType
  // - structuralLevel
  // - attached Layer 3 metadata
  //
  // That means scoring can distinguish:
  // - atomic
  // - structural_composite
  // - storyline_composite
  //
  // without reaching back into Layer 2 or raw metadata registries directly.
}
