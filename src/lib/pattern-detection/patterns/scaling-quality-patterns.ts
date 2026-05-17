// =========================
// 2026-04-16 11:40 AM America/Toronto
// SCALING QUALITY PATTERNS
// =========================
//
// PURPOSE:
// Exposes the scaling-quality catalog through smaller composition-driven lanes.
//
// FILE LAYOUT:
// - `scaling-quality/scaling-quality-pattern-bank.ts` keeps the pattern bodies
// - lane files group the catalog by metadata-aware overlays
// - `final-pattern-assembly.ts` reassembles the exported list with coverage checks

export { SCALING_QUALITY_PATTERNS } from "./scaling-quality/final-pattern-assembly";
