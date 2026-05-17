// =========================
// 2026-04-12 06:45 PM America/Toronto
// VERIFY LAYER 2 PATTERN DETECTION
// =========================
//
// PURPOSE:
// Reusable verification script for Layer 2 pattern detection.
//
// WHAT THIS SCRIPT DOES:
// 1. Loads a sample PatternInput JSON file
// 2. Runs Layer 2 detectPatterns(...)
// 3. Prints detected patterns
// 4. Verifies the detected pattern IDs against the expected canonical sample
// 5. Exits with a non-zero code if verification fails
//
// USAGE:
// npx tsx src/scripts/verify-layer2-pattern-detection.ts
//
// OPTIONAL:
// npx tsx src/scripts/verify-layer2-pattern-detection.ts path/to/sample-pattern-input.json
//
// DEFAULT SEARCH PATHS:
// - docs/layer2-pattern-detection/sample-pattern-input.json
// - docs/layer1-raw-data/sample-pattern-input.json
//

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { detectPatterns } from "../lib/pattern-detection/detect-patterns";
import {
  normalizePatternInputShape,
  type LegacyPatternInputShape,
  type PatternInput,
} from "../lib/pattern-input/types/pattern-input";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// 2026-04-12 06:45 PM America/Toronto
// Canonical expected pattern IDs for the current Layer 2 reference sample.
const EXPECTED_PATTERN_IDS = [
  "scaled_into_position",
  "multi_build_full_exit",
  "high_mfe_trade",
  "fully_closed_trade",
  "low_range_entry",
  "entry_near_trade_low",
  "entry_with_favorable_remaining_upside",
  "advantaged_entry_structure",
  "efficient_entry_structure",
  "moderate_capture_exit_structure",
  "exit_with_meaningful_giveback",
  "structured_position_building",
  "balanced_position_management",
] as const;

function resolveSampleFilePath(): string {
  const cliArgPath = process.argv[2];

  if (cliArgPath) {
    const resolvedCliPath = path.isAbsolute(cliArgPath)
      ? cliArgPath
      : path.resolve(PROJECT_ROOT, cliArgPath);

    if (!fs.existsSync(resolvedCliPath)) {
      throw new Error(
        `Sample file path provided on CLI does not exist: ${resolvedCliPath}`,
      );
    }

    return resolvedCliPath;
  }

    const candidatePaths = [
    path.resolve(
      PROJECT_ROOT,
      "src/docs/layer2-pattern-detection/sample-pattern-input.json",
    ),
    path.resolve(
      PROJECT_ROOT,
      "src/docs/layer1-raw-data/sample-pattern-input.json",
    ),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    [
      "Could not find a sample PatternInput JSON file.",
      "Checked the following locations:",
      ...candidatePaths.map((p) => `  - ${p}`),
      "",
      "Either place your sample file at one of those locations",
      "or pass an explicit file path on the command line.",
    ].join("\n"),
  );
}

function readPatternInputFromJson(filePath: string): PatternInput {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as PatternInput | LegacyPatternInputShape;

  return normalizePatternInputShape(parsed);
}

function sortStrings(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function formatPatternLine(args: {
  patternId: string;
  patternName: string;
  family: string;
  patternType: string;
}): string {
  const { patternId, patternName, family, patternType } = args;
  return `${patternId} | ${patternName} | family=${family} | type=${patternType}`;
}

function main(): void {
  const sampleFilePath = resolveSampleFilePath();
  const sampleInput = readPatternInputFromJson(sampleFilePath);

  const result = detectPatterns(sampleInput);

  const detectedPatternIds = sortStrings(
    result.detectedPatterns.map((pattern) => pattern.patternId),
  );

  const expectedPatternIds = sortStrings([...EXPECTED_PATTERN_IDS]);

  const missingPatternIds = expectedPatternIds.filter(
    (id) => !detectedPatternIds.includes(id),
  );

  const unexpectedPatternIds = detectedPatternIds.filter(
    (id) => !expectedPatternIds.includes(id),
  );

  console.log("=================================");
  console.log("LAYER 2 PATTERN DETECTION VERIFY");
  console.log("=================================");
  console.log(`Sample file: ${sampleFilePath}`);
  console.log(`Symbol: ${sampleInput.symbol}`);
  console.log(`Trade direction: ${sampleInput.tradeDirection}`);
  console.log("");

  console.log("Detected patterns:");
  for (const pattern of result.detectedPatterns) {
    console.log(
      `  - ${formatPatternLine({
        patternId: pattern.patternId,
        patternName: pattern.patternName,
        family: pattern.family,
        patternType: pattern.patternType,
      })}`,
    );
  }

  console.log("");
  console.log(`Detected count: ${detectedPatternIds.length}`);
  console.log(`Expected count: ${expectedPatternIds.length}`);
  console.log("");

  if (missingPatternIds.length === 0 && unexpectedPatternIds.length === 0) {
    console.log("✅ Layer 2 verification PASSED");
    process.exit(0);
  }

  console.log("❌ Layer 2 verification FAILED");

  if (missingPatternIds.length > 0) {
    console.log("");
    console.log("Missing expected patterns:");
    for (const id of missingPatternIds) {
      console.log(`  - ${id}`);
    }
  }

  if (unexpectedPatternIds.length > 0) {
    console.log("");
    console.log("Unexpected detected patterns:");
    for (const id of unexpectedPatternIds) {
      console.log(`  - ${id}`);
    }
  }

  console.log("");
  console.log("Expected pattern IDs:");
  for (const id of expectedPatternIds) {
    console.log(`  - ${id}`);
  }

  console.log("");
  console.log("Actual detected pattern IDs:");
  for (const id of detectedPatternIds) {
    console.log(`  - ${id}`);
  }

  process.exit(1);
}

main();
