# UPDATE – TRADE ANALYSIS ENGINE CONTRACT ALIGNMENT

## IMPORTANT CORRECTION

The trade-analysis-engine must strictly follow the system architecture contracts.

---

## UPDATED PIPELINE RULES

### 1. Layer 1 Output

Call:

* create-raw-trade-timeline
* build-trade-timeline
* build-trade-state-series

Final result must be:

```ts
RawTradeTimelineBuildResult
```

This is the ONLY Layer 1 output passed forward.

---

### 2. PatternInput Bridge (MANDATORY)

Call:

```ts
patternInput = buildPatternInput(rawTradeTimeline)
```

Rules:

* Pattern detection MUST use PatternInput
* No direct access to raw timeline inside pattern detection
* No recomputing signals inside Layer 2

---

### 3. Pattern Detection

Call:

```ts
detectedPatterns = detectPatterns(patternInput)
```

---

### 4. Pattern Normalization

Call:

```ts
normalizedPatterns = normalizeDetectedPatterns(detectedPatterns)
```

---

## UPDATED RETURN SHAPE

The engine must return:

```ts
{
  rawTradeTimeline: RawTradeTimelineBuildResult,
  patternInput,
  detectedPatterns,
  normalizedPatterns
}
```

---

## STRICT RULES

DO NOT return:

* internal timeline fragments
* partial state objects
* derived signal fragments outside rawTradeTimeline

DO NOT allow:

* Layer 2 to access rawTradeTimeline directly
* Layer 3 to access PatternInput or raw timeline

---

## PURPOSE

This ensures:

* strict layer separation
* clean architecture enforcement
* future AI/tool compatibility
* prevention of layer leakage

---

This correction overrides any previous instruction that exposed internal Layer 1 structures.

---

## Current Downstream Boundary Reminder

As of `2026-04-14`, the engine contract above is still the correct Layer 1-3
boundary.

Important:

- `src/lib/trade-analysis-engine.ts` still stops at:
  - `rawTradeTimeline`
  - `patternInput`
  - `detectedPatterns`
  - `normalizedPatterns`
- scoring, behavior analysis, coaching, and trader-level multi-trade
  aggregation now exist downstream, but they are not part of the
  trade-analysis-engine return contract yet

Current downstream consumers built after this engine contract:

- `src/lib/pattern-scoring/`
- `src/lib/behavior-analysis/`
- `src/lib/coaching/`
- `src/lib/trader-behavior/`
