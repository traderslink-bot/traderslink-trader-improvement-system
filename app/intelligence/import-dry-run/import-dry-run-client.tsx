"use client";

import { useMemo, useState } from "react";
import {
  applyCsvDryRunCellEdit,
  buildCsvDryRunImportExperience,
  buildCsvDryRunPrototypeAnalysisPanel,
  importStatusLabel,
  importStorageLabel,
  importTradeDirectionLabel,
  type CsvDryRunEvidenceRecord,
  type CsvDryRunGroupingDecisionKind,
  type CsvDryRunImportExperience,
  type CsvDryRunPrototypeAnalysisPanel,
  type CsvDryRunRepairImpactSnapshot,
  type CsvDryRunSamplePreset,
  type CsvDryRunSetupTagKind,
} from "@/src/lib/trader-analytics";
import {
  IMPORTABLE_BROKER_PRESETS,
  resolveBrokerExecutionCsvSelection,
  BrokerExecutionCsvCanonicalField,
  BrokerExecutionCsvColumnMapping,
  type BrokerExecutionCsvSelection,
} from "@/src/lib/execution-sources/csv";

const BROKER_OPTIONS: Array<{ value: BrokerExecutionCsvSelection; label: string }> = [
  { value: "auto", label: "Auto detect" },
  { value: "ibkr_activity_statement", label: "IBKR activity statement" },
  { value: "moomoo_trade_history", label: "Moomoo trade history" },
  { value: "webull_order_history", label: "Webull order history" },
  { value: "robinhood_transaction_history", label: "Robinhood transaction history" },
  { value: "schwab_transactions", label: "Schwab transactions" },
  { value: "generic_execution_csv", label: "Generic execution CSV" },
  ...Object.values(IMPORTABLE_BROKER_PRESETS).map((preset) => ({
    value: preset.id,
    label: preset.label,
  })),
];

const MAPPING_FIELDS: BrokerExecutionCsvCanonicalField[] = [
  "symbol",
  "timestamp",
  "date",
  "time",
  "side",
  "quantity",
  "price",
  "status",
  "commission",
  "fees",
  "netAmount",
];

type DecisionReviewRequestStatus = "idle" | "loading" | "loaded" | "error";

interface DecisionReviewSnapshot {
  tradeId?: string | null;
  coachingHeadline?: string | null;
  fixFirstBehaviorId?: string | null;
  marketContextSource?: "levels_system_daily_4h" | "none" | null;
  tradeWindowEvidenceSource?:
    | "levels_system_trade_window"
    | "execution_only_fallback";
  candleQualityNotes?: string[];
  insights: Array<{
    id: string;
    tone: "strength" | "risk" | "neutral" | "review";
    category: string;
    title: string;
    summary: string;
    evidence?: string[];
  }>;
}

interface DecisionReviewDiagnostic {
  requestIndex: number | null;
  symbol: string | null;
  code: string;
  message: string;
}

interface DecisionReviewBridgeResponse {
  contractVersion: "csv_dry_run_decision_review_bridge_v1";
  importStatus: "blocked" | "needs_review" | "ready";
  requestedTradeCount: number;
  analyzableTradeCount: number;
  completedReviewCount: number;
  decisionReviews: DecisionReviewSnapshot[];
  diagnostics: DecisionReviewDiagnostic[];
}

interface DecisionReviewRequestState {
  status: DecisionReviewRequestStatus;
  requestKey: string | null;
  decisionReviews: DecisionReviewSnapshot[];
  diagnostics: DecisionReviewDiagnostic[];
  message: string | null;
}

type SaveImportStatus = "idle" | "previewing" | "committing" | "committed" | "error";

interface SaveImportState {
  status: SaveImportStatus;
  batchId: string | null;
  message: string | null;
}

interface RepairCarryForwardState {
  editCount: number;
  lastEdit: {
    rowNumber: number;
    header: string;
  } | null;
}

interface CandleQualityNoteDisplay {
  note: string;
  label: string;
  summary: string;
  tone: "warning" | "notice" | "info";
}

interface DecisionReviewStatusBadge {
  label: string;
  detail: string;
  tone: "emerald" | "sky" | "amber" | "rose" | "zinc";
}

interface DecisionReviewEvidenceAlignmentSummary {
  status: "aligned" | "needs_review" | "empty";
  label: string;
  detail: string;
  checkedReviewCount: number;
  issueCount: number;
  issues: string[];
}

interface DecisionReviewEvidenceGateSummary {
  status: "clear" | "limited" | "blocked" | "pending";
  label: string;
  detail: string;
  totalReviewCount: number;
  fullMarketContextCount: number;
  tradeWindowEvidenceCount: number;
  executionOnlyFallbackCount: number;
  verifiedBasisCount: number;
  limitedCandleCount: number;
  warningCount: number;
  unavailableDiagnosticCount: number;
  openTradeDiagnosticCount: number;
}

function toneClass(status: string): string {
  return status === "ready" || status === "complete" || status === "pass"
    ? "text-emerald-300"
    : status === "blocked"
      ? "text-rose-300"
      : "text-amber-300";
}

function borderTone(status: string): string {
  return status === "ready"
    ? "border-emerald-800"
    : status === "blocked"
      ? "border-rose-900"
      : "border-amber-800";
}

function riskTone(riskDirection: string): string {
  return riskDirection === "increased"
    ? "text-amber-300"
    : riskDirection === "closed" || riskDirection === "reduced"
      ? "text-emerald-300"
      : "text-zinc-500";
}

function insightTone(tone: string): string {
  return tone === "strength"
    ? "text-emerald-300"
    : tone === "risk"
      ? "text-amber-300"
      : tone === "review"
        ? "text-sky-300"
        : "text-zinc-400";
}

function insightBorderTone(tone: string): string {
  return tone === "strength"
    ? "border-emerald-900"
    : tone === "risk"
      ? "border-amber-900"
      : tone === "review"
        ? "border-sky-900"
        : "border-zinc-800";
}

function decisionReviewCategoryLabel(category: string): string {
  switch (category) {
    case "market_context":
      return "Chart Evidence";
    case "entry":
      return "Entry";
    case "scaling":
      return "Adds / Scaling";
    case "exit":
      return "Exit";
    case "trade_window":
      return "During Trade";
    default:
      return "Other";
  }
}

function decisionReviewCategoryPriority(category: string): number {
  switch (category) {
    case "market_context":
      return 10;
    case "entry":
      return 20;
    case "scaling":
      return 30;
    case "exit":
      return 40;
    case "trade_window":
      return 50;
    default:
      return 90;
  }
}

function humanizeEvidenceKey(key: string): string {
  const knownLabels: Record<string, string> = {
    addCountAfterInitialEntry: "Adds after first entry",
    addsNearResistanceCount: "Adds near resistance",
    averageAddDistanceToNearestResistancePct: "Average add distance to resistance",
    averageAddPricePositionInRecentRangePct: "Later add location in recent range",
    distanceToResistance: "Distance to resistance",
    distanceToSupport: "Distance to support",
    favorableExcursionLeftOnTablePct: "Move left after exit",
    firstEntryCapturedPercentOfTradeMfe: "Move remaining after entry",
    firstEntryRecentRunUpPctBeforeEntry: "Run-up before entry",
    firstEntryToPeakMovePct: "Move after first entry",
    maxAdverseMovePctAfterExit: "Adverse move after exit",
    maxFavorableMovePctAfterExit: "Move after exit",
    nearestResistance: "Nearest resistance",
    nearestResistanceReaction: "Resistance reaction",
    nearestResistanceScore: "Resistance score",
    nearestResistanceStrength: "Resistance strength",
    nearestSupport: "Nearest support",
    nearestSupportReaction: "Support reaction",
    nearestSupportScore: "Support score",
    nearestSupportStrength: "Support strength",
    realizedCapturePercentOfTradeMfe: "Move captured",
    tradeMaePct: "Adverse move during trade",
    tradeMfePct: "Favorable move during trade",
    tradeWindowEvidenceSource: "Movement evidence",
  };

  if (knownLabels[key]) {
    return knownLabels[key];
  }

  return key
    .replace(/Pct$/u, " percent")
    .replace(/Mfe/gu, "favorable move")
    .replace(/Mae/gu, "adverse move")
    .replace(/([a-z])([A-Z])/gu, "$1 $2")
    .replace(/_/gu, " ")
    .toLowerCase()
    .replace(/^\w/u, (letter) => letter.toUpperCase());
}

function humanizeEvidenceValue(value: string): string {
  switch (value) {
    case "levels_system_trade_window":
      return "during-trade candles";
    case "execution_only_fallback":
      return "executions and P/L only";
    case "true":
      return "yes";
    case "false":
      return "no";
    case "n/a":
      return "unavailable";
    default:
      return value;
  }
}

function decisionReviewEvidenceLabel(evidence: string): string {
  const trimmed = evidence.trim();

  if (trimmed.toLowerCase().includes("levels-system trade-window")) {
    return candleQualityNoteDisplay(trimmed).summary;
  }

  const match = trimmed.match(/^([A-Za-z0-9_]+)=([^=]+)$/u);

  if (!match) {
    return trimmed;
  }

  const key = match[1] ?? "";
  const value = match[2] ?? "";

  return `${humanizeEvidenceKey(key)}: ${humanizeEvidenceValue(value)}`;
}

function groupedDecisionReviewInsights(review: DecisionReviewSnapshot) {
  const groups = new Map<string, DecisionReviewSnapshot["insights"]>();

  for (const insight of review.insights) {
    const current = groups.get(insight.category) ?? [];
    current.push(insight);
    groups.set(insight.category, current);
  }

  return [...groups.entries()].sort(
    ([left], [right]) =>
      decisionReviewCategoryPriority(left) -
        decisionReviewCategoryPriority(right) ||
      left.localeCompare(right),
  );
}

function candleQualityNoteDisplay(note: string): CandleQualityNoteDisplay {
  const normalized = note.toLowerCase();

  if (normalized.includes("basis_adjustment_multiple_likely")) {
    return {
      note,
      label: "Movement review unavailable",
      summary:
        "Candle prices likely use a different split-adjusted basis than broker executions, so movement review stays execution/P&L-only.",
      tone: "warning",
    };
  }

  if (
    normalized.includes("basis_aligned") ||
    normalized.includes("compatible with broker execution prices")
  ) {
    return {
      note,
      label: "Candle basis verified",
      summary:
        "Nearby candle prices were compatible with broker execution prices.",
      tone: "info",
    };
  }

  if (normalized.includes("no post-trade candles")) {
    return {
      note,
      label: "Post-trade candles unavailable",
      summary:
        "Post-exit candle evidence was unavailable, so continuation after exit may be limited.",
      tone: "warning",
    };
  }

  if (normalized.includes("no pre-trade candles")) {
    return {
      note,
      label: "Pre-trade candles unavailable",
      summary:
        "Pre-entry candle evidence was unavailable, so setup context may be limited.",
      tone: "warning",
    };
  }

  if (
    normalized.includes("5m fallback candles were used") ||
    normalized.includes("1m trade-window candles were unavailable")
  ) {
    return {
      note,
      label: "Lower-resolution candle window",
      summary:
        "The review used 5m candles because complete 1m during-trade candles were unavailable.",
      tone: "notice",
    };
  }

  if (normalized.includes("trade-window candles were ignored")) {
    return {
      note,
      label: "During-trade candles ignored",
      summary:
        "During-trade candles were not used for movement review because they were unsafe for this trade.",
      tone: "warning",
    };
  }

  return {
    note,
    label: "Market-data note",
    summary: note,
    tone: "warning",
  };
}

function candleQualityNotesDisplay(notes: string[]): {
  warningNotes: CandleQualityNoteDisplay[];
  noticeNotes: CandleQualityNoteDisplay[];
  infoNotes: CandleQualityNoteDisplay[];
} {
  const displays = notes.map(candleQualityNoteDisplay);

  return {
    warningNotes: displays.filter((note) => note.tone === "warning"),
    noticeNotes: displays.filter((note) => note.tone === "notice"),
    infoNotes: displays.filter((note) => note.tone === "info"),
  };
}

function decisionReviewEvidenceText(review: DecisionReviewSnapshot): string {
  return review.insights
    .flatMap((insight) => insight.evidence ?? [])
    .join(" ");
}

function reviewHasExtremeMove(review: DecisionReviewSnapshot): boolean {
  const text = decisionReviewEvidenceText(review);
  const matches = text.matchAll(
    /\b(?:tradeMfePct|tradeMaePct|firstEntryToPeakMovePct|maxFavorableMovePctAfterExit|favorableExcursionLeftOnTablePct)=(-?\d+(?:\.\d+)?)%/g,
  );

  for (const match of matches) {
    const value = Number(match[1]);

    if (Number.isFinite(value) && Math.abs(value) >= 100) {
      return true;
    }
  }

  return false;
}

function reviewHasWeakButPresentContext(review: DecisionReviewSnapshot): boolean {
  if (review.marketContextSource !== "levels_system_daily_4h") {
    return false;
  }

  return (
    review.insights.some(
      (insight) => insight.id === "entry_far_from_daily_4h_support",
    ) || decisionReviewEvidenceText(review).toLowerCase().includes("nearestsupport=n/a")
  );
}

function decisionReviewStatusBadges(
  review: DecisionReviewSnapshot,
): DecisionReviewStatusBadge[] {
  const { warningNotes, noticeNotes, infoNotes } = candleQualityNotesDisplay(
    review.candleQualityNotes ?? [],
  );
  const warningText = warningNotes.map((display) => display.note).join(" ").toLowerCase();
  const badges: DecisionReviewStatusBadge[] = [];

  if (review.marketContextSource === "levels_system_daily_4h") {
    badges.push({
      label: "Full chart data",
      detail: "Daily/4h levels-system chart data was available for this review.",
      tone: "emerald",
    });
  }

  if (review.tradeWindowEvidenceSource === "levels_system_trade_window") {
    badges.push({
      label: "During-trade candle evidence",
      detail: "During-trade candles were used for movement review.",
      tone: "emerald",
    });
  }

  if (infoNotes.length > 0) {
    badges.push({
      label: "Verified candle basis",
      detail: "Candles align with broker executions.",
      tone: "emerald",
    });
  }

  if (noticeNotes.length > 0) {
    badges.push({
      label: "Lower-resolution candle window",
      detail: "Used 5m candles where complete 1m was unavailable.",
      tone: "sky",
    });
  }

  if (
    warningText.includes("basis_adjustment_multiple_likely") ||
    warningText.includes("price-basis") ||
    warningText.includes("different price bases")
  ) {
    badges.push({
      label: "Execution/P&L only",
      detail: "Movement review is blocked by unsafe candle price basis.",
      tone: "rose",
    });
  } else if (review.tradeWindowEvidenceSource === "execution_only_fallback") {
    badges.push({
      label: "Execution/P&L only",
      detail: "During-trade candle evidence was unavailable for movement review.",
      tone: "amber",
    });
  }

  if (reviewHasExtremeMove(review)) {
    badges.push({
      label: "Verified extreme move",
      detail: "Triple-digit excursion is preserved as real market movement.",
      tone: "amber",
    });
  }

  if (reviewHasWeakButPresentContext(review)) {
    badges.push({
      label: "Context present, not supportive",
      detail: "Daily/4h data exists; nearby support/room was not favorable.",
      tone: "zinc",
    });
  }

  return badges;
}

function reviewHasInsight(review: DecisionReviewSnapshot, insightId: string): boolean {
  return review.insights.some((insight) => insight.id === insightId);
}

function buildDecisionReviewEvidenceAlignmentSummary(
  reviews: DecisionReviewSnapshot[],
): DecisionReviewEvidenceAlignmentSummary {
  if (reviews.length === 0) {
    return {
      status: "empty",
      label: "Evidence alignment pending",
      detail: "Run chart data review to check fix-first labels against visible insights.",
      checkedReviewCount: 0,
      issueCount: 0,
      issues: [],
    };
  }

  const issues: string[] = [];

  for (const review of reviews) {
    const tradeLabel = review.tradeId ?? "chart data review";

    if (
      reviewHasInsight(review, "profit_protection_failed") &&
      reviewHasInsight(review, "exit_captured_trade_well")
    ) {
      issues.push(`${tradeLabel}: failed protection conflicts with captured-exit evidence.`);
    }

    if (
      review.fixFirstBehaviorId === "poor_profit_protection" &&
      !reviewHasInsight(review, "profit_protection_failed")
    ) {
      issues.push(`${tradeLabel}: poor profit protection lacks visible failure evidence.`);
    }

    if (
      review.fixFirstBehaviorId === "premature_exit" &&
      !reviewHasInsight(review, "exit_left_continuation")
    ) {
      issues.push(`${tradeLabel}: premature exit lacks visible continuation evidence.`);
    }

    if (
      review.fixFirstBehaviorId === "adding_into_weakness" &&
      !reviewHasInsight(review, "adds_increased_risk_into_weakness")
    ) {
      issues.push(`${tradeLabel}: adding into weakness lacks visible weakness evidence.`);
    }

    if (
      review.fixFirstBehaviorId === "undersized_winner" &&
      !reviewHasInsight(review, "winner_stayed_undersized")
    ) {
      issues.push(`${tradeLabel}: undersized winner lacks visible sizing evidence.`);
    }
  }

  return {
    status: issues.length > 0 ? "needs_review" : "aligned",
    label: issues.length > 0 ? "Evidence alignment needs review" : "Evidence aligned",
    detail:
      issues.length > 0
        ? `${issues.length} visible-evidence issue(s) found across ${reviews.length} review(s).`
        : `Fix-first labels are backed by visible insights across ${reviews.length} review(s).`,
    checkedReviewCount: reviews.length,
    issueCount: issues.length,
    issues,
  };
}

function buildDecisionReviewEvidenceGateSummary(args: {
  reviews: DecisionReviewSnapshot[];
  diagnostics: DecisionReviewDiagnostic[];
}): DecisionReviewEvidenceGateSummary {
  let fullMarketContextCount = 0;
  let tradeWindowEvidenceCount = 0;
  let executionOnlyFallbackCount = 0;
  let verifiedBasisCount = 0;
  let limitedCandleCount = 0;
  let warningCount = 0;

  for (const review of args.reviews) {
    const { warningNotes, noticeNotes, infoNotes } = candleQualityNotesDisplay(
      review.candleQualityNotes ?? [],
    );

    if (review.marketContextSource === "levels_system_daily_4h") {
      fullMarketContextCount += 1;
    }

    if (review.tradeWindowEvidenceSource === "levels_system_trade_window") {
      tradeWindowEvidenceCount += 1;
    } else if (review.tradeWindowEvidenceSource === "execution_only_fallback") {
      executionOnlyFallbackCount += 1;
    }

    if (infoNotes.length > 0) {
      verifiedBasisCount += 1;
    }

    if (noticeNotes.length > 0) {
      limitedCandleCount += 1;
    }

    if (warningNotes.length > 0) {
      warningCount += 1;
    }
  }

  const unavailableDiagnosticCount = args.diagnostics.filter(
    (diagnostic) => diagnostic.code === "market_context_unavailable",
  ).length;
  const openTradeDiagnosticCount = args.diagnostics.filter(
    (diagnostic) => diagnostic.code === "trade_open",
  ).length;
  const hasLimitation =
    executionOnlyFallbackCount > 0 ||
    warningCount > 0 ||
    limitedCandleCount > 0 ||
    unavailableDiagnosticCount > 0 ||
    openTradeDiagnosticCount > 0;
  const totalReviewCount = args.reviews.length;

  if (totalReviewCount === 0 && args.diagnostics.length === 0) {
    return {
      status: "pending",
      label: "Evidence gates pending",
      detail: "Run the chart data review to attach chart evidence.",
      totalReviewCount,
      fullMarketContextCount,
      tradeWindowEvidenceCount,
      executionOnlyFallbackCount,
      verifiedBasisCount,
      limitedCandleCount,
      warningCount,
      unavailableDiagnosticCount,
      openTradeDiagnosticCount,
    };
  }

  if (totalReviewCount === 0) {
    return {
      status: "blocked",
      label: "Evidence blocked",
      detail:
        "No completed chart data reviews were attached; technical notes explain which data gate stopped review.",
      totalReviewCount,
      fullMarketContextCount,
      tradeWindowEvidenceCount,
      executionOnlyFallbackCount,
      verifiedBasisCount,
      limitedCandleCount,
      warningCount,
      unavailableDiagnosticCount,
      openTradeDiagnosticCount,
    };
  }

  return {
    status: hasLimitation ? "limited" : "clear",
    label: hasLimitation ? "Evidence-gated review" : "Evidence gates clear",
    detail: hasLimitation
      ? "Completed reviews stay visible, with candle or market-data limits called out before coaching."
      : "Completed reviews have daily/4h context, during-trade evidence, and no candle-basis warnings.",
    totalReviewCount,
    fullMarketContextCount,
    tradeWindowEvidenceCount,
    executionOnlyFallbackCount,
    verifiedBasisCount,
    limitedCandleCount,
    warningCount,
    unavailableDiagnosticCount,
    openTradeDiagnosticCount,
  };
}

function decisionReviewBadgeToneClass(tone: DecisionReviewStatusBadge["tone"]): string {
  switch (tone) {
    case "emerald":
      return "border-emerald-900 bg-emerald-950/20 text-emerald-200";
    case "sky":
      return "border-sky-900 bg-sky-950/20 text-sky-200";
    case "amber":
      return "border-amber-900 bg-amber-950/20 text-amber-200";
    case "rose":
      return "border-rose-900 bg-rose-950/20 text-rose-200";
    default:
      return "border-zinc-800 bg-zinc-950 text-zinc-300";
  }
}

function decisionReviewDiagnosticDisplay(diagnostic: DecisionReviewDiagnostic): {
  label: string;
  summary: string;
  detail: string | null;
  tone: "amber" | "rose" | "zinc";
} {
  switch (diagnostic.code) {
    case "market_context_unavailable":
      return {
        label: "Chart data still missing",
        summary:
          "Daily/4h market data was unavailable or insufficient for this symbol.",
        detail:
          "This is a market-data limitation, not a trade error. Support/resistance conclusions are hidden; the review can still use executions and P&L.",
        tone: "amber",
      };
    case "analysis_failed":
      return {
        label: "Chart data needs another check",
        summary:
          "Chart analysis needs another data check before it can support coaching.",
        detail:
          "Use execution review now and keep support, resistance, candle, and setup conclusions unavailable until this is resolved.",
        tone: "rose",
      };
    case "trade_open":
      return {
        label: "Open or swing trade",
        summary:
          "This trade was still open or carried, so completed-trade coaching waits until the position is flat.",
        detail:
          "Open or swing positions stay out of completed-trade coaching until the position is flat.",
        tone: "zinc",
      };
    case "limit_reached":
      return {
        label: "Review limit reached",
        summary:
          "The review pass reached its limit before this trade could receive chart review.",
        detail: "Resume the review pass later or keep the trade in execution-only review.",
        tone: "zinc",
      };
    default:
      return {
        label: "Technical follow-up",
        summary:
          "This chart item needs follow-up before it can support coaching.",
        detail: "Use execution evidence only until the technical item is resolved.",
        tone: "amber",
      };
  }
}

function decisionReviewDiagnosticBorder(tone: "amber" | "rose" | "zinc"): string {
  return tone === "rose"
    ? "border-rose-900"
    : tone === "amber"
      ? "border-amber-950"
      : "border-zinc-800";
}

function decisionReviewDiagnosticText(tone: "amber" | "rose" | "zinc"): string {
  return tone === "rose"
    ? "text-rose-300"
    : tone === "amber"
      ? "text-amber-300"
      : "text-zinc-400";
}

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function toColumnMapping(
  values: Record<string, string>,
): BrokerExecutionCsvColumnMapping {
  return Object.fromEntries(
    Object.entries(values)
      .map(([field, value]) => [field, value.trim()])
      .filter(([, value]) => value),
  ) as BrokerExecutionCsvColumnMapping;
}

function toTestIdSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Kpi({
  label,
  value,
  detail,
  tone = "text-zinc-100",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="ti-panel p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-3 text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-2 text-xs text-zinc-500">{detail}</div>
    </div>
  );
}

function ExecutionReadinessSummary({
  experience,
  prototypePanel,
}: {
  experience: CsvDryRunImportExperience;
  prototypePanel: CsvDryRunPrototypeAnalysisPanel;
}) {
  const importResult = experience.preview.importResult;
  const grouping = experience.tradeGroupingReview;
  const openTradeCount = grouping.items.filter(
    (item) => item.lifecycleStatus === "open",
  ).length;
  const hasRejectedRows = importResult.rejectedRowCount > 0;
  const groupingNeedsReview = grouping.needsReviewCount > 0 || openTradeCount > 0;
  const status = hasRejectedRows
    ? "blocked"
    : groupingNeedsReview
      ? "needs_review"
      : importResult.acceptedExecutionCount > 0
        ? "ready"
        : "blocked";
  const statusLabel =
    status === "ready"
      ? "Execution ready"
      : status === "needs_review"
        ? "Execution review needed"
        : "Execution blocked";
  const nextAction =
    status === "ready"
      ? "Grouped executions are ready for import feedback review."
      : status === "needs_review"
        ? "Review open or uncertain grouped trades before trusting feedback."
        : "Repair rejected rows or mapping issues before feedback review.";

  return (
    <section
      className={`ti-panel p-4 ${borderTone(status)}`}
      data-testid="execution-readiness-summary"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Execution Readiness
          </h2>
          <div
            className={`mt-2 text-2xl font-semibold ${toneClass(status)}`}
            data-testid="execution-readiness-status"
          >
            {statusLabel}
          </div>
          <div className="mt-2 text-sm text-zinc-500">{nextAction}</div>
        </div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          write safety: {prototypePanel.writesProductionDatabase ? "production" : "dry-run only"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Kpi
          label="Accepted Executions"
          value={String(importResult.acceptedExecutionCount)}
          detail={`${importResult.rejectedRowCount} rejected row(s)`}
          tone={importResult.acceptedExecutionCount > 0 ? "text-sky-300" : "text-zinc-400"}
        />
        <Kpi
          label="Grouped Trades"
          value={String(grouping.totalCount)}
          detail={`${grouping.needsReviewCount} need review`}
          tone={grouping.needsReviewCount > 0 ? "text-amber-300" : "text-emerald-300"}
        />
        <Kpi
          label="Open Positions"
          value={openTradeCount > 0 ? `${openTradeCount} open` : "none"}
          detail="final position check"
          tone={openTradeCount > 0 ? "text-amber-300" : "text-emerald-300"}
        />
        <Kpi
          label="Cost Policy"
          value="gross-only"
          detail={experience.costVisibility.hasBrokerNetAmount ? "broker net visible" : "costs reviewed separately"}
          tone="text-sky-300"
        />
      </div>
    </section>
  );
}

function DecisionReviewDiagnosticRow({
  diagnostic,
}: {
  diagnostic: DecisionReviewDiagnostic;
}) {
  const display = decisionReviewDiagnosticDisplay(diagnostic);

  return (
    <div
      className={`border-t py-2 text-xs ${decisionReviewDiagnosticBorder(display.tone)}`}
    >
      <div className={decisionReviewDiagnosticText(display.tone)}>
        {display.label}
        {diagnostic.symbol ? ` / ${diagnostic.symbol}` : ""}
      </div>
      <div className="mt-1 text-zinc-400">{display.summary}</div>
      {display.detail ? (
        <div className="mt-1 text-zinc-500">{display.detail}</div>
      ) : null}
      {display.summary !== diagnostic.message ? (
        <details className="mt-2 text-zinc-500">
          <summary className="cursor-pointer text-zinc-500">Technical detail</summary>
          <div className="mt-1">{diagnostic.message}</div>
        </details>
      ) : null}
    </div>
  );
}

function DecisionReviewEvidenceAlignment({
  summary,
}: {
  summary: DecisionReviewEvidenceAlignmentSummary;
}) {
  const statusClass =
    summary.status === "aligned"
      ? "border-emerald-900 bg-emerald-950/10 text-emerald-200"
      : summary.status === "needs_review"
        ? "border-amber-900 bg-amber-950/10 text-amber-200"
        : "border-zinc-800 bg-zinc-950 text-zinc-400";

  return (
    <div
      className={`mt-4 border p-3 ${statusClass}`}
      data-testid="decision-review-evidence-alignment"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide">
            Behavior Evidence Alignment
          </div>
          <div className="mt-1 text-sm font-medium">{summary.label}</div>
          <div className="mt-1 text-xs opacity-80">{summary.detail}</div>
        </div>
        <div className="font-mono text-xs opacity-80">
          {summary.issueCount}/{summary.checkedReviewCount} flagged
        </div>
      </div>
      {summary.issues.length > 0 ? (
        <div className="mt-3 grid gap-1 text-xs opacity-90">
          {summary.issues.slice(0, 4).map((issue) => (
            <div key={issue}>{issue}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function evidenceGateStatusClass(
  status: DecisionReviewEvidenceGateSummary["status"],
): string {
  switch (status) {
    case "clear":
      return "border-emerald-900 bg-emerald-950/10 text-emerald-200";
    case "limited":
      return "border-amber-900 bg-amber-950/10 text-amber-200";
    case "blocked":
      return "border-rose-900 bg-rose-950/10 text-rose-200";
    default:
      return "border-zinc-800 bg-zinc-950 text-zinc-400";
  }
}

function evidenceGateStatusTone(
  status: DecisionReviewEvidenceGateSummary["status"],
): string {
  switch (status) {
    case "clear":
      return "border-emerald-700 bg-emerald-500/10 text-emerald-200";
    case "limited":
      return "border-amber-700 bg-amber-500/10 text-amber-200";
    case "blocked":
      return "border-rose-700 bg-rose-500/10 text-rose-200";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function evidenceGateStatusLabel(
  status: DecisionReviewEvidenceGateSummary["status"],
): string {
  switch (status) {
    case "clear":
      return "Clear";
    case "limited":
      return "Limited";
    case "blocked":
      return "Blocked";
    default:
      return "Pending";
  }
}

function EvidenceGateMetric({
  label,
  value,
  detail,
  tone = "text-zinc-100",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="border-t border-zinc-800 pt-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{detail}</div>
    </div>
  );
}

function DecisionReviewEvidenceGates({
  summary,
}: {
  summary: DecisionReviewEvidenceGateSummary;
}) {
  const hasCompletedReviews = summary.totalReviewCount > 0;

  return (
    <div
      className={`mt-4 border p-3 ${evidenceGateStatusClass(summary.status)}`}
      data-testid="decision-review-evidence-gates"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide">
            Review Evidence Gates
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`border px-2 py-1 text-xs uppercase tracking-wide ${evidenceGateStatusTone(
                summary.status,
              )}`}
            >
              {evidenceGateStatusLabel(summary.status)}
            </span>
            <span className="text-sm font-medium text-zinc-100">
              {summary.label}
            </span>
          </div>
          <div className="mt-2 max-w-3xl text-xs leading-5 opacity-80">
            {summary.detail}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs lg:min-w-64">
          <div className="border border-zinc-800 bg-zinc-950 p-2">
            <div className="uppercase tracking-wide text-zinc-500">Reviews</div>
            <div className="mt-1 font-mono text-zinc-200">
              {summary.totalReviewCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-2">
            <div className="uppercase tracking-wide text-zinc-500">Limits</div>
            <div className="mt-1 font-mono text-zinc-200">
              {summary.warningCount +
                summary.limitedCandleCount +
                summary.unavailableDiagnosticCount +
                summary.openTradeDiagnosticCount}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <EvidenceGateMetric
          label="Daily/4h Chart Data"
          value={`${summary.fullMarketContextCount}/${summary.totalReviewCount}`}
          detail="full chart data"
          tone={
            hasCompletedReviews &&
            summary.fullMarketContextCount === summary.totalReviewCount
              ? "text-emerald-300"
              : hasCompletedReviews
                ? "text-amber-300"
                : "text-zinc-300"
          }
        />
        <EvidenceGateMetric
          label="Trade Window"
          value={`${summary.tradeWindowEvidenceCount}/${summary.totalReviewCount}`}
          detail="candle movement evidence"
          tone={
            hasCompletedReviews &&
            summary.tradeWindowEvidenceCount === summary.totalReviewCount
              ? "text-emerald-300"
              : hasCompletedReviews
                ? "text-amber-300"
                : "text-zinc-300"
          }
        />
        <EvidenceGateMetric
          label="Execution Only"
          value={String(summary.executionOnlyFallbackCount)}
          detail="movement fallback reviews"
          tone={
            summary.executionOnlyFallbackCount > 0
              ? "text-amber-300"
              : "text-zinc-300"
          }
        />
        <EvidenceGateMetric
          label="Data Limits"
          value={String(
            summary.warningCount +
              summary.limitedCandleCount +
              summary.unavailableDiagnosticCount +
              summary.openTradeDiagnosticCount,
          )}
          detail="warnings, fallbacks, or skips"
          tone={
            summary.warningCount +
              summary.limitedCandleCount +
              summary.unavailableDiagnosticCount +
              summary.openTradeDiagnosticCount >
            0
              ? "text-amber-300"
              : "text-emerald-300"
          }
        />
      </div>

      <div className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2 lg:grid-cols-4">
        <div>verified basis: {summary.verifiedBasisCount}</div>
        <div>lower-resolution windows: {summary.limitedCandleCount}</div>
        <div>chart data still missing: {summary.unavailableDiagnosticCount}</div>
        <div>open trades waiting: {summary.openTradeDiagnosticCount}</div>
      </div>
    </div>
  );
}

function ConfidenceGate({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const gate = experience.confidenceGate;

  return (
    <section className={`ti-panel p-4 ${borderTone(gate.status)}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Import Confidence Gate
          </h2>
          <div className={`mt-2 text-2xl font-semibold ${toneClass(gate.status)}`}>
            <span data-testid="confidence-gate-title">{gate.title}</span>
          </div>
          <div className="mt-2 text-sm text-zinc-500">{gate.nextAction}</div>
        </div>
        <div className="font-mono text-2xl text-sky-300">{gate.score}/100</div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[...gate.blockedReasons, ...gate.reviewReasons, ...gate.reasons]
          .slice(0, 8)
          .map((reason, index) => (
            <div
              key={`${index}:${reason}`}
              className="border-t border-zinc-900 py-2 text-sm text-zinc-400"
            >
              {reason}
            </div>
          ))}
      </div>
    </section>
  );
}

function SessionState({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  return (
    <section className="ti-panel p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Import Session State</h2>
      <div className="mt-2 text-sm text-zinc-500">
        {experience.sessionState.nextAction}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {experience.sessionState.stages.map((stage) => (
          <div key={stage.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-300">{stage.label}</span>
              <span className={`text-xs uppercase tracking-wide ${toneClass(stage.status)}`}>
                {importStatusLabel(stage.status)}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">{stage.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ImportSessionSummary({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const summary = experience.importSessionSummary;

  return (
    <section className={`ti-panel p-4 ${borderTone(summary.status)}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Import Session Summary
          </h2>
          <div className={`mt-2 text-2xl font-semibold ${toneClass(summary.status)}`}>
            <span data-testid="import-session-summary-status">
              {importStatusLabel(summary.status)}
            </span>
          </div>
          <div className="mt-2 text-sm text-zinc-500">{summary.summary}</div>
        </div>
        <div className="text-sm text-zinc-400">
          {summary.highestPriorityNextAction}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Kpi
          label="Rows Parsed"
          value={String(summary.rowsParsed)}
          detail={`${summary.acceptedExecutionCount} accepted execution(s)`}
        />
        <Kpi
          label="Repairs"
          value={String(summary.rejectedRowCount)}
          detail={`${summary.skippedRowCount} skipped row(s)`}
          tone={summary.rejectedRowCount > 0 ? "text-rose-300" : "text-emerald-300"}
        />
        <Kpi
          label="Grouped Trades"
          value={String(summary.groupedTradeCount)}
          detail={`${summary.tradesNeedingReviewCount} need review`}
        />
        <Kpi
          label="Feedback"
          value={String(summary.feedbackPreviewCount)}
          detail={`${summary.readyTradeCount} ready trade(s)`}
          tone="text-sky-300"
        />
      </div>
    </section>
  );
}

function ReadinessScoreBreakdown({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const readiness = experience.readinessScoreBreakdown;

  return (
    <section className="ti-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Import Readiness Breakdown
          </h2>
          <div className="mt-1 text-sm text-zinc-500">
            {readiness.nextAction}
          </div>
        </div>
        <div className={`font-mono text-2xl ${toneClass(readiness.status)}`}>
          {readiness.overallScore}/100
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {readiness.dimensions.map((dimension) => (
          <div key={dimension.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-zinc-200">
                {dimension.label}
              </span>
              <span className={`font-mono text-sm ${toneClass(dimension.status)}`}>
                {dimension.score}
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-zinc-900">
              <div
                className="h-1.5 bg-sky-500"
                style={{ width: `${dimension.score}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-zinc-500">{dimension.detail}</div>
            <div className="mt-1 text-xs text-zinc-400">
              {dimension.nextAction}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RepairImpactDiff({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const diff = experience.repairImpactDiff;

  return (
    <section className="ti-panel p-4">
      <h2 className="text-sm font-semibold text-zinc-100">
        Before / After Repair Impact
      </h2>
      <div className="mt-1 text-sm text-zinc-500">{diff.summary}</div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <Kpi
          label="Accepted"
          value={`${diff.delta.acceptedExecutions >= 0 ? "+" : ""}${diff.delta.acceptedExecutions}`}
          detail={`${diff.currentSnapshot.acceptedExecutionCount} current`}
          tone={diff.delta.acceptedExecutions >= 0 ? "text-emerald-300" : "text-rose-300"}
        />
        <Kpi
          label="Rows Fixed"
          value={`${diff.delta.rejectedRows >= 0 ? "+" : ""}${diff.delta.rejectedRows}`}
          detail={`${diff.currentSnapshot.rejectedRowCount} rejected now`}
          tone={diff.delta.rejectedRows >= 0 ? "text-emerald-300" : "text-rose-300"}
        />
        <Kpi
          label="Skipped"
          value={`${diff.delta.skippedRows >= 0 ? "+" : ""}${diff.delta.skippedRows}`}
          detail={`${diff.currentSnapshot.skippedRowCount} skipped now`}
        />
        <Kpi
          label="Grouped"
          value={`${diff.delta.groupedTrades >= 0 ? "+" : ""}${diff.delta.groupedTrades}`}
          detail={`${diff.currentSnapshot.groupedTradeCount} current`}
        />
        <Kpi
          label="Confidence"
          value={`${diff.delta.confidenceScore >= 0 ? "+" : ""}${diff.delta.confidenceScore}`}
          detail={`${diff.currentSnapshot.confidenceScore}/100 current`}
          tone="text-sky-300"
        />
      </div>
      <div className="mt-3 text-xs text-zinc-500">{diff.nextAction}</div>
    </section>
  );
}

function RepairCarryForwardPanel({
  experience,
  state,
}: {
  experience: CsvDryRunImportExperience;
  state: RepairCarryForwardState;
}) {
  const repaired = state.editCount > 0;
  const rejectedRows = experience.preview.importResult.rejectedRowCount;
  const acceptedExecutions = experience.preview.importResult.acceptedExecutionCount;
  const readyToSave = repaired && rejectedRows === 0 && acceptedExecutions > 0;

  return (
    <section
      className="ti-panel p-4"
      data-testid="repair-carry-forward-panel"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Repair Carry-Forward
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-500">
            Row edits update the CSV text used by preview, save, grouping,
            analytics, and chart review items. The original file text is not stored.
          </p>
        </div>
        <div
          className={`text-xs uppercase tracking-wide ${
            readyToSave
              ? "text-emerald-300"
              : repaired
                ? "text-amber-300"
                : "text-zinc-500"
          }`}
          data-testid="repair-carry-forward-status"
        >
          {readyToSave ? "repaired save source" : repaired ? "edited" : "no edits"}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Kpi
          label="Repair Edits"
          value={String(state.editCount)}
          detail={
            state.lastEdit
              ? `last row ${state.lastEdit.rowNumber} ${state.lastEdit.header}`
              : "no row edits yet"
          }
          tone={repaired ? "text-sky-300" : "text-zinc-100"}
        />
        <Kpi
          label="Rejected Rows"
          value={String(rejectedRows)}
          detail={readyToSave ? "clear for save" : "must be zero before save"}
          tone={rejectedRows === 0 ? "text-emerald-300" : "text-rose-300"}
        />
        <Kpi
          label="Accepted Execs"
          value={String(acceptedExecutions)}
          detail="from current CSV text"
          tone={acceptedExecutions > 0 ? "text-emerald-300" : "text-zinc-100"}
        />
        <Kpi
          label="Save Source"
          value={repaired ? "Repaired CSV" : "Current CSV"}
          detail="same text shown above"
          tone={repaired ? "text-emerald-300" : "text-zinc-100"}
        />
      </div>
    </section>
  );
}

function ColumnMappingAssistant({
  experience,
  values,
  onChange,
}: {
  experience: CsvDryRunImportExperience;
  values: Record<string, string>;
  onChange: (field: BrokerExecutionCsvCanonicalField, value: string) => void;
}) {
  const assistant = experience.columnMappingAssistant;

  return (
    <section className="ti-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Column Mapping Assistant
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{assistant.nextAction}</div>
        </div>
        <div className={`text-xs uppercase tracking-wide ${toneClass(assistant.status)}`}>
          {importStatusLabel(assistant.status)}
        </div>
      </div>

      <div className="mt-4 rounded-none border border-zinc-900 p-3">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Detected Headers
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {assistant.headers.length === 0 ? (
            <span className="text-xs text-zinc-500">No headers detected yet.</span>
          ) : (
            assistant.headers.map((header) => (
              <span key={header} className="border border-zinc-800 px-2 py-1 text-xs text-zinc-400">
                {header}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {MAPPING_FIELDS.map((field) => {
          const row = assistant.rows.find((candidate) => candidate.field === field);

          return (
            <label key={field} className="block border-t border-zinc-900 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {field}
                </span>
                <span className={`text-xs ${toneClass(row?.status ?? "optional")}`}>
                  {row?.detectedHeader ?? row?.status ?? "optional"}
                </span>
              </div>
              <input
                aria-label={`${field} column mapping`}
                className="mt-2 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500"
                data-testid={`mapping-field-${field}`}
                placeholder={row?.detectedHeader ?? "Optional header name"}
                value={values[field] ?? ""}
                onChange={(event) => onChange(field, event.target.value)}
              />
              <div className="mt-1 text-xs text-zinc-500">
                {row?.helperText ?? "Optional broker column."}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function RowRepairTable({
  experience,
  onEditCell,
}: {
  experience: CsvDryRunImportExperience;
  onEditCell: (rowNumber: number, header: string, value: string) => void;
}) {
  const table = experience.rowRepairTable;
  const importantHeaders = table.headers.filter((header) =>
    table.editableRows.some((row) =>
      row.cells.some((cell) => cell.header === header && cell.important),
    ),
  );
  const headers = importantHeaders.length > 0 ? importantHeaders : table.headers;

  return (
    <section className="ti-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Editable Row Repair Table
          </h2>
          <div className="mt-1 text-sm text-zinc-500">
            {table.totalRows} row(s), {table.rejectedRowCount} rejected,{" "}
            {table.skippedRowCount} skipped.
          </div>
        </div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          local dry run
        </div>
      </div>

      <div className="mt-3 border-t border-zinc-900 pt-3 text-xs text-zinc-500">
        {table.privacyReminder}
      </div>

      {table.editableRows.length === 0 ? (
        <div className="mt-4 border-t border-zinc-900 py-4 text-sm text-zinc-500">
          Paste CSV text to inspect row-level repair actions.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-500">
                <th className="w-20 px-2 py-2 font-medium">Row</th>
                <th className="w-24 px-2 py-2 font-medium">Status</th>
                {headers.map((header) => (
                  <th key={header} className="min-w-[150px] px-2 py-2 font-medium">
                    {header}
                  </th>
                ))}
                <th className="min-w-[220px] px-2 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {table.editableRows.map((row) => (
                <tr key={row.rowNumber} className="border-b border-zinc-900">
                  <td className="px-2 py-2 font-mono text-zinc-500">
                    {row.rowNumber}
                  </td>
                  <td
                    className={`px-2 py-2 ${toneClass(row.status)}`}
                    data-testid={`row-repair-${row.rowNumber}-status`}
                  >
                    {row.status}
                  </td>
                  {headers.map((header) => {
                    const cell = row.cells.find((candidate) => candidate.header === header);

                    return (
                      <td key={`${row.rowNumber}:${header}`} className="px-2 py-2">
                        <input
                          aria-label={`Row ${row.rowNumber} ${header}`}
                          data-testid={`row-repair-${row.rowNumber}-${toTestIdSegment(header)}`}
                          className="w-full min-w-[130px] border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-sky-500"
                          value={cell?.value ?? ""}
                          onChange={(event) =>
                            onEditCell(row.rowNumber, header, event.target.value)
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-zinc-500">
                    {row.suggestedAction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TradeGroupingReview({
  experience,
  decisionValues,
  onDecisionChange,
}: {
  experience: CsvDryRunImportExperience;
  decisionValues: Record<number, CsvDryRunGroupingDecisionKind>;
  onDecisionChange: (
    requestIndex: number,
    value: CsvDryRunGroupingDecisionKind,
  ) => void;
}) {
  const grouping = experience.tradeGroupingReview;
  const decisionsByIndex = new Map(
    experience.groupingDecisionReview.items.map((item) => [
      item.requestIndex,
      item,
    ]),
  );

  return (
    <section className="ti-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Trade Grouping Review
          </h2>
          <div className="mt-1 text-sm text-zinc-500">
            {grouping.totalCount} grouped trade(s), {grouping.needsReviewCount} need review.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {grouping.items.length === 0 ? (
          <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500">
            No grouped trades are ready yet.
          </div>
        ) : (
          grouping.items.map((item) => (
            <div key={item.requestIndex} className="border-t border-zinc-900 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium text-zinc-100">
                    {item.symbol} / {importTradeDirectionLabel(item.tradeDirection)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {importStatusLabel(item.lifecycleStatus)} / {item.groupingReason} / rows{" "}
                    {item.rowIndexes.join(", ")}
                  </div>
                  <div className="mt-1 text-xs text-sky-300">
                    {item.entrySessionBucket} / {item.entryHourLabelEt || "hour n/a"}
                    {item.heldSessionBuckets.length > 1
                      ? ` / held ${item.heldSessionBuckets.join(" -> ")}`
                      : ""}
                  </div>
                </div>
                <div className={`text-xs uppercase tracking-wide ${item.needsReview ? "text-amber-300" : "text-emerald-300"}`}>
                  {item.needsReview ? "Needs review" : "Ready"}
                </div>
              </div>
              {decisionsByIndex.has(item.requestIndex) ? (
                <label className="mt-3 block">
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    User grouping decision
                  </span>
                  <select
                    aria-label={`${item.symbol} grouping decision`}
                    data-testid={`grouping-decision-${item.requestIndex}`}
                    className="mt-2 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500"
                    value={
                      decisionValues[item.requestIndex] ??
                      decisionsByIndex.get(item.requestIndex)!.currentRecommendation
                    }
                    onChange={(event) =>
                      onDecisionChange(
                        item.requestIndex,
                        event.target.value as CsvDryRunGroupingDecisionKind,
                      )
                    }
                  >
                    {decisionsByIndex.get(item.requestIndex)!.options.map((option) => (
                      <option key={option.kind} value={option.kind}>
                        {option.label}
                        {option.recommended ? " (recommended)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-zinc-500">
                    {
                      decisionsByIndex
                        .get(item.requestIndex)!
                        .options.find(
                          (option) =>
                            option.kind ===
                            (decisionValues[item.requestIndex] ??
                              decisionsByIndex.get(item.requestIndex)!
                                .currentRecommendation),
                        )?.detail
                    }
                  </div>
                </label>
              ) : null}
              <div className="mt-3 grid gap-2">
                {item.timeline.map((step) => (
                  <div
                    key={`${item.requestIndex}:${step.index}`}
                    className="grid gap-2 border border-zinc-900 px-3 py-2 text-xs md:grid-cols-[80px_1fr_80px_90px_90px]"
                  >
                    <span className="font-mono text-zinc-500">#{step.index + 1}</span>
                    <span className="text-zinc-400">{step.timestamp}</span>
                    <span className="text-zinc-300">{step.side}</span>
                    <span className="font-mono text-zinc-400">{step.shares}</span>
                    <span className="font-mono text-sky-300">
                      pos {step.positionAfterExecution}
                    </span>
                  </div>
                ))}
              </div>
              {item.warnings.length > 0 ? (
                <div className="mt-3 text-xs text-amber-300">
                  {item.warnings[0]}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Walkthrough({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const walkthrough = experience.firstTradeWalkthrough;

  return (
    <section className="ti-panel p-4">
      <h2 className="text-sm font-semibold text-zinc-100">{walkthrough.title}</h2>
      <div className="mt-1 text-sm text-zinc-500">{walkthrough.nextAction}</div>
      <div className="mt-4 grid gap-3">
        {walkthrough.steps.map((step, index) => (
          <div key={step.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center border border-zinc-800 font-mono text-xs text-sky-300">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">{step.label}</span>
                  <span className={`text-xs uppercase tracking-wide ${toneClass(step.status)}`}>
                    {importStatusLabel(step.status)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">{step.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExecutionFeedbackPreview({
  experience,
  approved,
  onApprovedChange,
}: {
  experience: CsvDryRunImportExperience;
  approved: boolean;
  onApprovedChange: (approved: boolean) => void;
}) {
  const feedback = experience.executionFeedbackPreview;

  return (
    <section className="ti-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Execution Feedback Preview
          </h2>
          <div className="mt-1 text-sm text-zinc-500">
            {feedback.completedCount} of {feedback.totalCount} grouped trade(s)
            produced execution-only feedback.
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <input
            data-testid="feedback-reviewed-checkbox"
            checked={approved}
            className="h-4 w-4 accent-sky-500"
            type="checkbox"
            onChange={(event) => onApprovedChange(event.target.checked)}
          />
          reviewed
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        {feedback.items.length === 0 ? (
          <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500">
            Valid grouped trades will create a feedback preview here.
          </div>
        ) : (
          feedback.items.map((item) => (
            <div key={item.requestIndex} className="border-t border-zinc-900 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    {item.tradeLabel}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    P/L {formatCurrency(item.grossRealizedPnl)} /{" "}
                    {item.warningCount} warning(s)
                  </div>
                </div>
                <div className={`text-xs uppercase tracking-wide ${toneClass(item.status)}`}>
                  {importStatusLabel(item.status)}
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <div className="border border-zinc-900 p-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Focus
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    {item.primaryFocusLabel ?? "Not enough evidence"}
                  </div>
                </div>
                <div className="border border-zinc-900 p-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Risk
                  </div>
                  <div className="mt-2 text-sm text-amber-300">
                    {item.topRiskLabel ?? "No top risk"}
                  </div>
                </div>
                <div className="border border-zinc-900 p-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Strength
                  </div>
                  <div className="mt-2 text-sm text-emerald-300">
                    {item.topStrengthLabel ?? "No top strength"}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                {item.limitations[0]}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ReplayPreview({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const replay = experience.replayPreview;

  return (
    <section className="ti-panel p-4">
      <h2 className="text-sm font-semibold text-zinc-100">
        Dry-Run Replay Preview
      </h2>
      <div className="mt-1 text-sm text-zinc-500">
        {replay.tradeLabel ?? "No grouped trade ready"} /{" "}
        {importStatusLabel(replay.lifecycleStatus)}
      </div>
      {replay.openPositionWarning ? (
        <div className="mt-3 border border-amber-900 bg-amber-950/20 p-3 text-xs text-amber-300">
          {replay.openPositionWarning}
        </div>
      ) : null}
      <div className="mt-4 grid gap-2">
        {replay.steps.length === 0 ? (
          <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500">
            Replay appears after the first grouped trade is reconstructed.
          </div>
        ) : (
          replay.steps.map((step) => (
            <div
              key={step.index}
              className="grid gap-2 border border-zinc-900 px-3 py-3 text-xs md:grid-cols-[90px_1fr_90px_90px_120px_120px]"
            >
              <span className="font-mono text-zinc-500">#{step.index + 1}</span>
              <span className="text-zinc-400">{step.timestamp}</span>
              <span className="text-zinc-300">{step.side}</span>
              <span className="font-mono text-zinc-400">{step.shares}</span>
              <span className="font-mono text-sky-300">
                pos {step.positionAfterExecution}
              </span>
              <span className={riskTone(step.riskDirection)}>
                {step.roleLabel}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function PnlReconciliationAssistant({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const pnl = experience.pnlReconciliationAssistant;

  return (
    <section className="ti-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            P/L Reconciliation Assistant
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{pnl.summary}</div>
        </div>
        <div className={`text-xs uppercase tracking-wide ${toneClass(pnl.status)}`}>
          {importStatusLabel(pnl.status)}
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {pnl.items.length === 0 ? (
          <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500">
            P/L reconciliation appears after grouped trades exist.
          </div>
        ) : (
          pnl.items.map((item) => (
            <div key={item.requestIndex} className="border-t border-zinc-900 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    {item.symbol} / {importStatusLabel(item.lifecycleStatus)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.explanation}
                  </div>
                </div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {importStatusLabel(item.status)}
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <Kpi
                  label="Broker Net"
                  value={formatCurrency(item.brokerNetAmountTotal)}
                  detail="from CSV when present"
                />
                <Kpi
                  label="App P/L"
                  value={formatCurrency(item.grossMinusKnownCosts)}
                  detail="gross minus known costs"
                />
                <Kpi
                  label="Difference"
                  value={formatCurrency(item.difference)}
                  detail={item.suggestedReviewAction}
                  tone={item.status === "mismatch" ? "text-amber-300" : "text-emerald-300"}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function CostVisibilityPanel({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const costs = experience.costVisibility;

  return (
    <section
      className="ti-panel p-4"
      data-testid="cost-visibility-panel"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Fee / Commission Visibility
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{costs.summary}</div>
        </div>
        <div className={`text-xs uppercase tracking-wide ${toneClass(
          costs.status === "needs_review"
            ? "needs_review"
            : costs.status === "costs_detected"
              ? "ready"
              : "complete",
        )}`}>
          {importStatusLabel(costs.status)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Kpi
          label="Commission"
          value={formatCurrency(costs.totalCommission)}
          detail={costs.hasCommission ? "commission column parsed" : "not detected"}
          tone={costs.hasCommission ? "text-sky-300" : "text-zinc-400"}
        />
        <Kpi
          label="Fees"
          value={formatCurrency(costs.totalFees)}
          detail={costs.hasFees ? "fee column parsed" : "not detected"}
          tone={costs.hasFees ? "text-sky-300" : "text-zinc-400"}
        />
        <Kpi
          label="Broker Net"
          value={costs.hasBrokerNetAmount ? "present" : "n/a"}
          detail="from net amount columns"
          tone={costs.hasBrokerNetAmount ? "text-emerald-300" : "text-zinc-400"}
        />
        <Kpi
          label="Currency"
          value={costs.currencies.join(", ") || "n/a"}
          detail={costs.mixedCurrencies ? "mixed currencies need review" : "parsed currency"}
          tone={costs.mixedCurrencies ? "text-amber-300" : "text-zinc-400"}
        />
      </div>

      <div
        className="mt-4 border border-zinc-900 bg-zinc-950 p-3 text-sm text-zinc-500"
        data-testid="cost-visibility-scoring-policy"
      >
        {costs.scoringPolicyDetail}
      </div>

      <div className="mt-4 grid gap-3">
        {costs.items.length === 0 ? (
          <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500">
            Cost visibility appears after grouped trades exist.
          </div>
        ) : (
          costs.items.slice(0, 6).map((item) => (
            <div key={item.requestIndex} className="border-t border-zinc-900 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    {item.symbol} / {importStatusLabel(item.lifecycleStatus)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{item.detail}</div>
                </div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {importStatusLabel(item.status)}
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <Kpi
                  label="Total Costs"
                  value={formatCurrency(item.totalCosts)}
                  detail={`commission ${formatCurrency(item.totalCommission)}`}
                  tone={item.totalCosts > 0 ? "text-sky-300" : "text-zinc-400"}
                />
                <Kpi
                  label="Known Net"
                  value={formatCurrency(item.grossMinusKnownCosts)}
                  detail="gross minus parsed costs"
                />
                <Kpi
                  label="Broker Net"
                  value={formatCurrency(item.brokerNetAmountTotal)}
                  detail={item.hasBrokerNetAmount ? "present in CSV" : "not present"}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function PostImportReviewQueuePreview({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const queue = experience.postImportReviewQueuePreview;

  return (
    <section className="ti-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Post-Import Review Queue Preview
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{queue.nextAction}</div>
        </div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          {queue.totalCount} preview item(s)
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {queue.items.slice(0, 8).map((item) => (
          <div key={item.id} className="border-t border-zinc-900 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-100">
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{item.reason}</div>
              </div>
              <div className={`text-xs uppercase tracking-wide ${toneClass(item.severity)}`}>
                {item.lane} / {item.priority}
              </div>
            </div>
            <div className="mt-2 text-xs text-sky-300">
              {item.suggestedNextAction}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeedbackComparison({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const comparison = experience.feedbackComparison;

  return (
    <section className="ti-panel p-4">
      <h2 className="text-sm font-semibold text-zinc-100">
        Trade Feedback Preview Comparison
      </h2>
      <div className="mt-1 text-sm text-zinc-500">{comparison.limitation}</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Kpi
          label="Best Preview"
          value={comparison.bestPreviewTrade?.tradeLabel ?? "n/a"}
          detail={formatCurrency(comparison.bestPreviewTrade?.grossRealizedPnl ?? null)}
          tone="text-emerald-300"
        />
        <Kpi
          label="Worst Preview"
          value={comparison.worstPreviewTrade?.tradeLabel ?? "n/a"}
          detail={formatCurrency(comparison.worstPreviewTrade?.grossRealizedPnl ?? null)}
          tone="text-amber-300"
        />
        <Kpi
          label="Top Risk"
          value={comparison.mostRiskyExecutionBehavior ?? "n/a"}
          detail={comparison.highestPriorityReviewItemTitle ?? "No queue item yet"}
          tone="text-amber-300"
        />
        <Kpi
          label="Repeatable Strength"
          value={comparison.mostRepeatableStrength ?? "n/a"}
          detail={comparison.sampleSizeWarning ? "Small dry-run sample" : "More than five previews"}
          tone="text-emerald-300"
        />
      </div>
    </section>
  );
}

function PrototypeAnalysisPanel({
  chartTierEnabled,
  panel,
  decisionReviews,
  decisionReviewDiagnostics,
  decisionReviewStatus,
  decisionReviewMessage,
  canRequestDecisionReview,
  onRequestDecisionReview,
}: {
  chartTierEnabled: boolean;
  panel: CsvDryRunPrototypeAnalysisPanel;
  decisionReviews: DecisionReviewSnapshot[];
  decisionReviewDiagnostics: DecisionReviewDiagnostic[];
  decisionReviewStatus: DecisionReviewRequestStatus;
  decisionReviewMessage: string | null;
  canRequestDecisionReview: boolean;
  onRequestDecisionReview: () => void;
}) {
  const evidenceAlignment = buildDecisionReviewEvidenceAlignmentSummary(
    decisionReviews,
  );
  const evidenceGates = buildDecisionReviewEvidenceGateSummary({
    reviews: decisionReviews,
    diagnostics: decisionReviewDiagnostics,
  });

  return (
    <section
      className="ti-panel p-4"
      data-testid="prototype-analysis-panel"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Prototype Analysis
          </h2>
          <div
            className={`mt-2 text-2xl font-semibold ${toneClass(
              panel.state === "prototype_generated" || panel.state === "ready"
                ? "ready"
                : panel.state === "blocked"
                  ? "blocked"
                  : "review",
            )}`}
            data-testid="prototype-analysis-state"
          >
            {panel.stateLabel}
          </div>
          <div className="mt-2 text-sm text-zinc-500">
            {panel.primaryNextAction}
          </div>
        </div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          production write: {String(panel.writesProductionDatabase)}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border border-zinc-900 bg-zinc-950 p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            {chartTierEnabled ? "Chart Data Review" : "Execution-Only Review"}
          </div>
          <div
            className="mt-1 text-sm text-zinc-400"
            data-testid="decision-review-status"
          >
            {chartTierEnabled
              ? decisionReviewMessage ??
                "Run daily/4h chart data review for completed grouped trades."
              : "Dry-run review is limited to executions, grouping, P/L, repairs, and save readiness in the current tier."}
          </div>
        </div>
        {chartTierEnabled ? (
          <button
            className="border border-zinc-700 px-3 py-2 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-900 disabled:text-zinc-600"
            data-testid="decision-review-request-button"
            disabled={!canRequestDecisionReview || decisionReviewStatus === "loading"}
            type="button"
            onClick={onRequestDecisionReview}
          >
            {decisionReviewStatus === "loading" ? "Running..." : "Run Review"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Kpi
          label="Trades"
          value={String(panel.generatedTradeCount)}
          detail={`${panel.feedbackSummaryCount} feedback summaries`}
          tone={panel.prototypeGenerated ? "text-sky-300" : "text-zinc-400"}
        />
        <Kpi
          label="Review Queue"
          value={String(panel.reviewQueueItemCount)}
          detail="post-import preview items"
          tone={panel.reviewQueueItemCount > 0 ? "text-amber-300" : "text-emerald-300"}
        />
        {chartTierEnabled ? (
          <>
            <Kpi
              label="Chart Data Review"
              value={
                panel.topDecisionReviewInsights.length > 0
                  ? "attached"
                  : "pending"
              }
              detail={panel.coachingHeadline ?? "daily/4h facts attach server-side"}
              tone={
                panel.topDecisionReviewInsights.length > 0
                  ? "text-emerald-300"
                  : "text-zinc-400"
              }
            />
            <Kpi
              label="Chart Data"
              value={panel.marketContextSource}
              detail="support/resistance evidence only when available"
              tone={panel.marketContextUsed ? "text-emerald-300" : "text-zinc-400"}
            />
          </>
        ) : (
          <Kpi
            label="Evidence Scope"
            value="execution-only"
            detail="paid review evidence stays out of this tier"
            tone="text-zinc-400"
          />
        )}
      </div>

      {chartTierEnabled &&
      (decisionReviews.length > 0 || decisionReviewDiagnostics.length > 0) ? (
        <DecisionReviewEvidenceGates summary={evidenceGates} />
      ) : null}

      {chartTierEnabled && decisionReviews.length > 0 ? (
        <DecisionReviewEvidenceAlignment summary={evidenceAlignment} />
      ) : null}

      {panel.coachingHeadline ? (
        <div
          className="mt-4 border border-sky-900 bg-sky-950/20 p-3"
          data-testid="prototype-analysis-coaching"
        >
          <div className="text-xs uppercase tracking-wide text-sky-300">
            Coaching headline
          </div>
          <div className="mt-2 text-sm text-zinc-200">
            {panel.coachingHeadline}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Fix first: {panel.fixFirstBehaviorId ?? "not selected"}
          </div>
        </div>
      ) : (
        <div
          className="mt-4 border border-zinc-900 bg-zinc-950 p-3 text-sm text-zinc-500"
          data-testid="prototype-analysis-coaching"
        >
          {chartTierEnabled
            ? "Execution-only prototype preview. Daily/4h chart data facts can attach after server-side chart data review runs with levels-system data."
            : "Execution-only prototype preview. Save readiness, grouping, repairs, P/L, and review queue items are available in this tier."}
        </div>
      )}

      {chartTierEnabled && decisionReviews.length > 0 ? (
        <div
          className="mt-4 grid gap-4"
          data-testid="decision-review-details"
        >
          {decisionReviews.map((review, reviewIndex) => {
            const { warningNotes, noticeNotes, infoNotes } = candleQualityNotesDisplay(
              review.candleQualityNotes ?? [],
            );
            const statusBadges = decisionReviewStatusBadges(review);

            return (
              <div
                key={`${review.tradeId ?? "review"}:${reviewIndex}`}
                className="border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      {review.tradeId ?? `review ${reviewIndex + 1}`}
                    </div>
                    <div className="mt-2 text-base font-semibold text-zinc-100">
                      {review.coachingHeadline ?? "Chart evidence attached"}
                    </div>
                  </div>
                  <div className="grid gap-1 text-xs text-zinc-400 md:text-right">
                    <span>
                      chart data: {review.marketContextSource ?? "none"}
                    </span>
                    <span>
                      movement:{" "}
                      {review.tradeWindowEvidenceSource ===
                      "execution_only_fallback"
                        ? "executions only"
                        : "candle window"}
                    </span>
                    <span>
                      fix first: {review.fixFirstBehaviorId ?? "none"}
                    </span>
                  </div>
                </div>

                {statusBadges.length > 0 ? (
                  <div
                    className="mt-3 flex flex-wrap gap-2"
                    data-testid="decision-review-status-badges"
                  >
                    {statusBadges.map((badge) => (
                      <span
                        key={`${review.tradeId ?? "review"}:${badge.label}`}
                        className={`border px-2 py-1 text-xs ${decisionReviewBadgeToneClass(
                          badge.tone,
                        )}`}
                        title={badge.detail}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                ) : null}

                {warningNotes.length > 0 ? (
                  <div
                    className="mt-3 grid gap-2 border border-amber-900 bg-amber-950/10 p-2 text-xs"
                    data-testid="decision-review-candle-warning-notes"
                  >
                    {warningNotes.map((display) => (
                      <div key={`${review.tradeId ?? "review"}:${display.note}`}>
                        <div className="font-medium text-amber-200">
                          {display.label}
                        </div>
                        <div className="mt-1 text-amber-100/80">
                          {display.summary}
                        </div>
                        {display.summary !== display.note ? (
                          <details className="mt-1 text-amber-100/60">
                            <summary className="cursor-pointer">
                              Provider detail
                            </summary>
                            <div className="mt-1">{display.note}</div>
                          </details>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {noticeNotes.length > 0 ? (
                  <div
                    className="mt-3 grid gap-2 border border-sky-900 bg-sky-950/10 p-2 text-xs"
                    data-testid="decision-review-candle-notice-notes"
                  >
                    {noticeNotes.map((display) => (
                      <div key={`${review.tradeId ?? "review"}:${display.note}`}>
                        <div className="font-medium text-sky-200">
                          {display.label}
                        </div>
                        <div className="mt-1 text-sky-100/80">
                          {display.summary}
                        </div>
                        {display.summary !== display.note ? (
                          <details className="mt-1 text-sky-100/60">
                            <summary className="cursor-pointer">
                              Provider detail
                            </summary>
                            <div className="mt-1">{display.note}</div>
                          </details>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {infoNotes.length > 0 ? (
                  <details
                    className="mt-3 border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-500"
                    data-testid="decision-review-candle-info-notes"
                  >
                    <summary className="cursor-pointer text-zinc-400">
                      Verified candle basis
                    </summary>
                    <div className="mt-2 grid gap-2">
                      {infoNotes.map((display) => (
                        <div key={`${review.tradeId ?? "review"}:${display.note}`}>
                          <div className="text-zinc-300">{display.label}</div>
                          <div className="mt-1">{display.summary}</div>
                          {display.summary !== display.note ? (
                            <details className="mt-1">
                              <summary className="cursor-pointer">
                                Provider detail
                              </summary>
                              <div className="mt-1">{display.note}</div>
                            </details>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}

                <div className="mt-4 grid gap-3">
                  {groupedDecisionReviewInsights(review).map(
                    ([category, insights]) => (
                      <div key={category} className="border-t border-zinc-900 pt-3">
                        <div className="text-xs uppercase tracking-wide text-zinc-500">
                          {decisionReviewCategoryLabel(category)}
                        </div>
                        <div className="mt-2 grid gap-2">
                          {insights.map((insight) => (
                            <div
                              key={insight.id}
                              className={`border bg-zinc-950 p-3 ${insightBorderTone(
                                insight.tone,
                              )}`}
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="text-sm font-medium text-zinc-200">
                                    {insight.title}
                                  </div>
                                  <div className="mt-1 text-xs text-zinc-500">
                                    {insight.summary}
                                  </div>
                                </div>
                                <span
                                  className={`text-xs uppercase tracking-wide ${insightTone(
                                    insight.tone,
                                  )}`}
                                >
                                  {insight.tone}
                                </span>
                              </div>
                              {(insight.evidence ?? []).length > 0 ? (
                                <div className="mt-3 grid gap-2">
                                  <div className="flex flex-wrap gap-2">
                                    {(insight.evidence ?? [])
                                      .slice(0, 3)
                                      .map((item) => (
                                        <span
                                          key={`${insight.id}:${item}:plain`}
                                          className="border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-[11px] text-sky-200"
                                        >
                                          {decisionReviewEvidenceLabel(item)}
                                        </span>
                                      ))}
                                  </div>
                                  <details className="text-[11px] text-zinc-500">
                                    <summary className="cursor-pointer text-zinc-400">
                                      Show calculation details
                                    </summary>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {(insight.evidence ?? []).map((item) => (
                                        <span
                                          key={`${insight.id}:${item}:technical`}
                                          className="border border-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-400"
                                        >
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {chartTierEnabled && decisionReviewDiagnostics.length > 0 ? (
        <div
          className="mt-4 border border-amber-900 bg-amber-950/10 p-3"
          data-testid="decision-review-diagnostics"
        >
          <div className="text-xs uppercase tracking-wide text-amber-300">
            Chart Data Review Notes
          </div>
          <div className="mt-2 grid gap-2">
            {decisionReviewDiagnostics.slice(0, 5).map((diagnostic, index) => (
              <DecisionReviewDiagnosticRow
                key={`${diagnostic.code}:${diagnostic.requestIndex}:${index}`}
                diagnostic={diagnostic}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Execution Autopsy
          </div>
          <div className="mt-2 grid gap-2">
            {panel.topAutopsyFindings.length === 0 ? (
              <div className="border-t border-zinc-900 py-3 text-sm text-zinc-500">
                Repair the import or add closed trades to generate execution
                autopsy findings.
              </div>
            ) : (
              panel.topAutopsyFindings.map((finding) => (
                <div key={finding.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{finding.title}</span>
                    <span className={`text-xs uppercase tracking-wide ${insightTone(finding.tone)}`}>
                      {finding.tone}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {finding.summary}
                  </div>
                  {finding.evidence[0] ? (
                    <div className="mt-2 text-xs text-sky-300">
                      {decisionReviewEvidenceLabel(finding.evidence[0])}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            {chartTierEnabled ? "Daily/4h Chart Data Review" : "Review Scope"}
          </div>
          {chartTierEnabled ? (
            <div className="mt-2 grid gap-2">
              {panel.topDecisionReviewInsights.length === 0 ? (
                <div className="border-t border-zinc-900 py-3 text-sm text-zinc-500">
                  Entry-near-resistance, clean-room, and add-after-extension
                  review notes appear here after daily/4h context is attached.
                </div>
              ) : (
                panel.topDecisionReviewInsights.map((finding) => (
                  <div key={finding.id} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">{finding.title}</span>
                      <span className={`text-xs uppercase tracking-wide ${insightTone(finding.tone)}`}>
                        {finding.tone}
                      </span>
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-wide text-zinc-600">
                      {finding.category}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {finding.summary}
                    </div>
                    {finding.evidence[0] ? (
                      <div className="mt-2 text-xs text-sky-300">
                        {decisionReviewEvidenceLabel(finding.evidence[0])}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="mt-2 border-t border-zinc-900 py-3 text-sm text-zinc-500">
              This advanced preview checks import readiness and execution
              review items only in the current tier.
            </div>
          )}
        </div>
      </div>

      {[...panel.topImportBlockers, ...panel.topReviewReasons].length > 0 ? (
        <div className="mt-4 grid gap-2">
          {[...panel.topImportBlockers, ...panel.topReviewReasons]
            .slice(0, 4)
            .map((reason, index) => (
              <div
                key={`${index}:${reason}`}
                className="border-t border-zinc-900 py-2 text-xs text-amber-300"
              >
                {reason}
              </div>
            ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {(chartTierEnabled
          ? panel.limitations
          : panel.limitations.filter((limitation) => {
              const normalized = limitation.toLowerCase();
              return (
                !normalized.includes("chart") &&
                !normalized.includes("support") &&
                !normalized.includes("resistance") &&
                !normalized.includes("daily/4h")
              );
            })
        )
          .slice(0, 4)
          .map((limitation) => (
          <div
            key={limitation}
            className="border-t border-zinc-900 py-2 text-xs text-zinc-500"
          >
            {limitation}
          </div>
          ))}
      </div>
    </section>
  );
}

function ExecutionAnomalyDetector({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const anomalies = experience.executionAnomalyDetector;

  return (
    <section className="ti-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Execution Anomaly Detector
          </h2>
          <div className="mt-1 text-sm text-zinc-500">
            Import and execution-only checks. Market context used:{" "}
            {String(anomalies.marketContextUsed)}.
          </div>
        </div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          {anomalies.urgentCount} urgent / {anomalies.reviewCount} review
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {anomalies.items.length === 0 ? (
          <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500">
            No execution anomalies detected in this dry run.
          </div>
        ) : (
          anomalies.items.slice(0, 8).map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{item.title}</span>
                <span className={`text-xs uppercase tracking-wide ${toneClass(item.severity)}`}>
                  {item.severity}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {item.evidence[0]}
              </div>
              <div className="mt-2 text-xs text-sky-300">{item.suggestedAction}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SetupTagging({
  experience,
  values,
  onChange,
}: {
  experience: CsvDryRunImportExperience;
  values: Record<number, CsvDryRunSetupTagKind>;
  onChange: (requestIndex: number, value: CsvDryRunSetupTagKind) => void;
}) {
  const setup = experience.setupTagging;

  return (
    <section className="ti-panel p-4">
      <h2 className="text-sm font-semibold text-zinc-100">
        Setup / Playbook Tagging
      </h2>
      <div className="mt-1 text-sm text-zinc-500">{setup.limitation}</div>
      <div className="mt-4 grid gap-3">
        {setup.items.length === 0 ? (
          <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500">
            Grouped trades can be tagged once the import parser accepts executions.
          </div>
        ) : (
          setup.items.map((item) => (
            <label key={item.requestIndex} className="border-t border-zinc-900 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    {item.symbol}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{item.reason}</div>
                </div>
                <select
                  aria-label={`${item.symbol} setup tag`}
                  data-testid={`setup-tag-${item.requestIndex}`}
                  className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500 md:w-48"
                  value={values[item.requestIndex] ?? item.selectedTag}
                  onChange={(event) =>
                    onChange(
                      item.requestIndex,
                      event.target.value as CsvDryRunSetupTagKind,
                    )
                  }
                >
                  {setup.options.map((option) => (
                    <option key={option.kind} value={option.kind}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          ))
        )}
      </div>
    </section>
  );
}

function EvidenceDrillIn({
  experience,
  sampleMistakes,
}: {
  experience: CsvDryRunImportExperience;
  sampleMistakes: CsvDryRunEvidenceRecord[];
}) {
  const records = [
    ...experience.evidenceDrillIn.records,
    ...sampleMistakes.map((record) => ({
      ...record,
      source: "sample_mistake" as const,
    })),
  ];

  return (
    <section className="ti-panel p-4">
      <h2 className="text-sm font-semibold text-zinc-100">
        Why Am I Seeing This
      </h2>
      <div className="mt-1 text-sm text-zinc-500">
        Import, grouping, and sample mistake explanations are tied to visible facts.
      </div>
      <div className="mt-4 grid gap-3">
        {records.slice(0, 8).map((record) => (
          <div key={record.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-300">{record.title}</span>
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {record.source}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {record.evidenceLabels.map((label) => (
                <span key={label} className="border border-zinc-800 px-2 py-1 text-xs text-zinc-500">
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {record.sourceFacts[0] ?? record.limitation}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BrokerAndCalibration({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Broker Coverage Confidence
        </h2>
        <div className="mt-3 text-lg font-semibold text-sky-300">
          {experience.brokerCoverage.selectedBrokerLabel}
        </div>
        <div className="mt-2 text-sm text-zinc-500">
          {experience.brokerCoverage.supportCopy}
        </div>
        <div className="mt-4 grid gap-2">
          {experience.brokerCoverage.coverageLabels.map((label) => (
            <div key={label} className="border-t border-zinc-900 py-2 text-xs text-zinc-400">
              {label}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          {experience.brokerCoverage.limitation}
        </div>
      </div>

      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Real Import Calibration Queue
        </h2>
        <div className="mt-2 text-sm text-zinc-500">
          {experience.calibrationQueue.waitingCount} item(s) are waiting for real imports.
        </div>
        <div className="mt-4 grid gap-2">
          {experience.calibrationQueue.items.slice(0, 6).map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{item.label}</span>
                <span className="text-xs text-zinc-500">
                  {item.marketContextRequired ? "later context" : "execution"}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{item.dataNeeded}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrokerHelpAndErrorLibrary({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const help = experience.brokerHelp;
  const library = experience.errorLibrary;

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">{help.title}</h2>
        <div className="mt-2 text-sm text-zinc-500">
          Expected source: {help.expectedExportName}
        </div>
        <div className="mt-4 grid gap-2">
          {help.requiredFields.map((field) => (
            <div key={field} className="border-t border-zinc-900 py-2 text-xs text-zinc-400">
              {field}
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs uppercase tracking-wide text-zinc-500">
          Common gotchas
        </div>
        <div className="mt-2 grid gap-2">
          {help.commonGotchas.map((gotcha) => (
            <div key={gotcha} className="text-xs text-zinc-500">
              {gotcha}
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-zinc-500">{help.fallbackPath}</div>
      </div>

      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Import Error Library
        </h2>
        <div className="mt-2 text-sm text-zinc-500">
          {library.matchedCount} matching issue type(s) in this dry run.
        </div>
        <div className="mt-4 grid gap-3">
          {library.entries.length === 0 ? (
            <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500">
              No known import errors are active.
            </div>
          ) : (
            library.entries.map((entry) => (
              <div key={entry.issueCode} className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">{entry.title}</span>
                  <span className={entry.canContinue ? "text-xs text-amber-300" : "text-xs text-rose-300"}>
                    {entry.canContinue ? "review" : "fix first"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {entry.whyItHappened}
                </div>
                <div className="mt-2 text-xs text-sky-300">{entry.howToFix}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function BrokerMappingLearningConsole({
  experience,
}: {
  experience: CsvDryRunImportExperience;
}) {
  const consoleModel = experience.brokerMappingLearningConsole;

  return (
    <section className="ti-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Broker Mapping Learning Console
          </h2>
          <div className="mt-1 text-sm text-zinc-500">
            {consoleModel.recommendation}
          </div>
        </div>
        <div className={`text-xs uppercase tracking-wide ${toneClass(consoleModel.learningUrgency)}`}>
          {consoleModel.learningUrgency} urgency
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Kpi
          label="Mapping Confidence"
          value={consoleModel.confidenceLevel}
          detail={`score ${consoleModel.confidenceScore}`}
          tone="text-sky-300"
        />
        <Kpi
          label="Unknown Headers"
          value={String(consoleModel.unknownHeaders.length)}
          detail={consoleModel.unknownHeaders.slice(0, 2).join(", ") || "none"}
        />
        <Kpi
          label="Explicit Mappings"
          value={String(consoleModel.explicitMappingCount)}
          detail={consoleModel.persistenceStatus}
        />
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {consoleModel.mappedFields.slice(0, 8).map((field) => (
          <div key={field.field} className="border-t border-zinc-900 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {field.field}
              </span>
              <span className={`text-xs ${toneClass(field.status)}`}>
                {importStatusLabel(field.status)}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              {field.detectedHeader ?? field.explicitHeader ?? "No header"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PrivacyDecisionAndMobile({
  experience,
  groupingDecisionCount,
  feedbackApproved,
}: {
  experience: CsvDryRunImportExperience;
  groupingDecisionCount: number;
  feedbackApproved: boolean;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          {experience.privacyNotice.title}
        </h2>
        <div className="mt-2 text-sm text-zinc-500">
          {experience.privacyNotice.body}
        </div>
        <div className="mt-4 grid gap-2">
          {experience.privacyNotice.bullets.map((bullet) => (
            <div key={bullet} className="border-t border-zinc-900 py-2 text-xs text-zinc-400">
              {bullet}
            </div>
          ))}
        </div>
      </div>

      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          User Decision Capture
        </h2>
        <div className="mt-2 text-sm text-zinc-500">
          {experience.decisionCapture.nextAction}
        </div>
        <div className="mt-4 grid gap-2">
          <div className="border-t border-zinc-900 py-2 text-xs text-zinc-400">
            {groupingDecisionCount} grouping decision(s) changed in client state.
          </div>
          <div className="border-t border-zinc-900 py-2 text-xs text-zinc-400">
            Feedback preview {feedbackApproved ? "marked reviewed" : "waiting for review"}.
          </div>
          {experience.decisionCapture.items.slice(0, 5).map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="text-xs text-zinc-300">{item.label}</div>
              <div className="mt-1 text-xs text-zinc-500">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Mobile QA Notes</h2>
        <div className="mt-2 text-sm text-zinc-500">
          {experience.mobileQaPanel.totalCount} rough UI panels have mobile checks.
        </div>
        <div className="mt-4 grid gap-2">
          {experience.mobileQaPanel.items.slice(0, 5).map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {importStatusLabel(item.status)}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                {item.checks[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ImportDryRunClient({
  chartTierEnabled,
  presets,
  sampleMistakes,
}: {
  chartTierEnabled: boolean;
  presets: CsvDryRunSamplePreset[];
  sampleMistakes: CsvDryRunEvidenceRecord[];
}) {
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [broker, setBroker] = useState<BrokerExecutionCsvSelection>("auto");
  const [timezone, setTimezone] = useState("America/New_York");
  const [csvText, setCsvText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [mappingValues, setMappingValues] = useState<Record<string, string>>({});
  const [groupingDecisions, setGroupingDecisions] = useState<
    Record<number, CsvDryRunGroupingDecisionKind>
  >({});
  const [setupTags, setSetupTags] = useState<Record<number, CsvDryRunSetupTagKind>>(
    {},
  );
  const [repairImpactBaseline, setRepairImpactBaseline] =
    useState<CsvDryRunRepairImpactSnapshot | null>(null);
  const [repairCarryForward, setRepairCarryForward] =
    useState<RepairCarryForwardState>({
      editCount: 0,
      lastEdit: null,
    });
  const [feedbackApproved, setFeedbackApproved] = useState(false);
  const [decisionReviewRequest, setDecisionReviewRequest] =
    useState<DecisionReviewRequestState>({
      status: "idle",
      requestKey: null,
      decisionReviews: [],
      diagnostics: [],
      message: null,
    });
  const [saveImportState, setSaveImportState] = useState<SaveImportState>({
    status: "idle",
    batchId: null,
    message: null,
  });

  const userColumnMapping = useMemo(
    () => toColumnMapping(mappingValues),
    [mappingValues],
  );
  const resolvedBrokerSelection = useMemo(
    () =>
      resolveBrokerExecutionCsvSelection({
        broker,
        columnMapping: userColumnMapping,
      }),
    [broker, userColumnMapping],
  );
  const experience = useMemo(
    () =>
      buildCsvDryRunImportExperience({
        csvText,
        broker: resolvedBrokerSelection.broker,
        accountTimezone: timezone,
        columnMapping: resolvedBrokerSelection.columnMapping,
        repairImpactBaseline,
        setupTagSelections: setupTags,
      }),
    [csvText, repairImpactBaseline, resolvedBrokerSelection, setupTags, timezone],
  );
  const currentColumnMapping = resolvedBrokerSelection.columnMapping;
  const decisionReviewRequestKey = useMemo(
    () =>
      [
        experience.preview.fileFingerprint,
        broker,
        timezone,
        JSON.stringify(currentColumnMapping),
      ].join(":"),
    [broker, currentColumnMapping, experience.preview.fileFingerprint, timezone],
  );
  const currentDecisionReviewRequest =
    decisionReviewRequest.requestKey === decisionReviewRequestKey
      ? decisionReviewRequest
      : {
          status: "idle" as const,
          requestKey: null,
          decisionReviews: [],
          diagnostics: [],
          message: null,
        };
  const prototypeAnalysisPanel = useMemo(
    () =>
      buildCsvDryRunPrototypeAnalysisPanel({
        experience,
        decisionReviews: currentDecisionReviewRequest.decisionReviews,
      }),
    [currentDecisionReviewRequest.decisionReviews, experience],
  );
  const canRequestDecisionReview =
    chartTierEnabled &&
    experience.confidenceGate.status !== "blocked" &&
    experience.preview.importResult.requestCount > 0;
  const hasCsvText = csvText.trim().length > 0;
  const canTrySaveImport = experience.preview.importResult.acceptedExecutionCount > 0;
  const needsBeginnerRepairHelp =
    hasCsvText &&
    (experience.preview.importResult.rejectedRowCount > 0 ||
      experience.confidenceGate.status === "blocked");

  function reviewAcknowledgements() {
    return {
      anomalyTypes: experience.executionAnomalyDetector.items
        .filter((item) => item.severity !== "info")
        .map((item) => item.type),
      groupingReview: experience.tradeGroupingReview.needsReviewCount > 0,
      mappingReview: experience.preview.importResult.mappingConfidence.level !== "high",
      openPositions: experience.tradeGroupingReview.items.some(
        (item) => item.lifecycleStatus === "open",
      ),
      pnlReview: experience.pnlReconciliationAssistant.status === "needs_review",
    };
  }

  function importCommitPayload() {
    return {
      csvText,
      broker,
      accountTimezone: timezone,
      columnMapping: currentColumnMapping,
      acknowledgements: reviewAcknowledgements(),
      repairSource:
        repairCarryForward.editCount > 0 ? "repaired_csv" : "original_csv",
    };
  }

  function choosePreset(id: string) {
    const preset = presets.find((candidate) => candidate.id === id);
    setSelectedPresetId(id);

    if (!preset) {
      setBroker("auto");
      setCsvText("");
      setSelectedFileName(null);
      setMappingValues({});
      setGroupingDecisions({});
      setSetupTags({});
      setRepairImpactBaseline(null);
      setRepairCarryForward({ editCount: 0, lastEdit: null });
      setFeedbackApproved(false);
      return;
    }

    setBroker(preset.broker);
    setCsvText(preset.csvText);
    setSelectedFileName(preset.label);
    setMappingValues({});
    setGroupingDecisions({});
    setSetupTags({});
    setRepairImpactBaseline(null);
    setRepairCarryForward({ editCount: 0, lastEdit: null });
    setFeedbackApproved(false);
  }

  function openLocalCsv(file: File | undefined) {
    if (!file) {
      return;
    }

    void file.text().then((text) => {
      setCsvText(text);
      setSelectedFileName(file.name);
      setBroker("auto");
      setSelectedPresetId("");
      setGroupingDecisions({});
      setSetupTags({});
      setRepairImpactBaseline(null);
      setRepairCarryForward({ editCount: 0, lastEdit: null });
      setFeedbackApproved(false);
    });
  }

  function editDryRunCell(rowNumber: number, header: string, value: string) {
    setRepairImpactBaseline(experience.repairImpactDiff.currentSnapshot);
    setRepairCarryForward((current) => ({
      editCount: current.editCount + 1,
      lastEdit: { rowNumber, header },
    }));
    setCsvText((current) =>
      applyCsvDryRunCellEdit({
        csvText: current,
        rowNumber,
        header,
        value,
      }),
    );
    setSelectedPresetId("");
    setFeedbackApproved(false);
  }

  async function requestDecisionReview() {
    if (!canRequestDecisionReview) {
      return;
    }

    setDecisionReviewRequest({
      status: "loading",
      requestKey: decisionReviewRequestKey,
      decisionReviews: [],
      diagnostics: [],
      message: "Running daily/4h chart data review.",
    });

    try {
      const response = await fetch("/api/import-dry-run/decision-review", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          csvText,
          broker,
          accountTimezone: timezone,
          columnMapping: currentColumnMapping,
          maxTrades: 3,
        }),
      });
      const body = (await response.json()) as
        | DecisionReviewBridgeResponse
        | { error?: { message?: string } };

      if (!response.ok || !("decisionReviews" in body)) {
        throw new Error(
          "error" in body && body.error?.message
            ? body.error.message
            : "Chart data review request failed.",
        );
      }

      const marketContextDiagnostic = body.diagnostics.find(
        (diagnostic) => diagnostic.code === "market_context_unavailable",
      );

      setDecisionReviewRequest({
        status: "loaded",
        requestKey: decisionReviewRequestKey,
        decisionReviews: body.decisionReviews,
        diagnostics: body.diagnostics,
        message:
          body.completedReviewCount > 0
            ? `${body.completedReviewCount} chart evidence snapshot(s) attached.`
            : marketContextDiagnostic
              ? decisionReviewDiagnosticDisplay(marketContextDiagnostic).summary
              : body.diagnostics[0]
                ? decisionReviewDiagnosticDisplay(body.diagnostics[0]).summary
                : "No completed chart evidence snapshots were available.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setDecisionReviewRequest({
        status: "error",
        requestKey: decisionReviewRequestKey,
        decisionReviews: [],
        diagnostics: [],
        message,
      });
    }
  }

  async function saveImport() {
    if (!canTrySaveImport) {
      setSaveImportState({
        status: "error",
        batchId: null,
        message: "No accepted executions are available to save.",
      });
      return;
    }

    setSaveImportState({
      status: "previewing",
      batchId: null,
      message: "Checking save readiness.",
    });

    try {
      const payload = importCommitPayload();
      const previewResponse = await fetch("/api/import-batches/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const previewBody = await previewResponse.json();

      if (!previewResponse.ok || !("plan" in previewBody)) {
        throw new Error(
          previewBody.error?.message ?? "Import preview failed before save.",
        );
      }

      const plan = previewBody.plan as {
        canCommitNow: boolean;
        batch: { id: string };
        readModel: { nextAction: string };
        requiredDecisions: Array<{ message: string }>;
      };

      if (!plan.canCommitNow) {
        throw new Error(
          plan.requiredDecisions[0]?.message ??
            plan.readModel.nextAction ??
            "Import still needs review before saving.",
        );
      }

      setSaveImportState({
        status: "committing",
        batchId: plan.batch.id,
        message: "Saving normalized executions and trades.",
      });

      const commitResponse = await fetch(
        `/api/import-batches/${encodeURIComponent(plan.batch.id)}/commit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const commitBody = await commitResponse.json();

      if (!commitResponse.ok || !("result" in commitBody)) {
        throw new Error(commitBody.error?.message ?? "Import save failed.");
      }

      setSaveImportState({
        status: "committed",
        batchId: plan.batch.id,
        message: commitBody.result.message ?? "Import saved.",
      });
      window.location.href = `/intelligence/imports/${encodeURIComponent(plan.batch.id)}`;
    } catch (error) {
      setSaveImportState({
        status: "error",
        batchId: null,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <div className="flex flex-col gap-8" data-testid="import-dry-run-client">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
        <div className="ti-panel p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Upload Your CSV
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Choose your broker export. The app will read the rows, group trades,
            and tell you whether anything needs attention before saving.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                CSV file
              </span>
              <input
                aria-label="Local CSV"
                data-testid="local-csv-input"
                className="mt-2 w-full text-sm text-zinc-400 file:mr-3 file:border file:border-zinc-800 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:text-zinc-200"
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={(event) => openLocalCsv(event.target.files?.[0])}
              />
              <span className="mt-2 block text-xs leading-5 text-zinc-500">
                Choose the CSV export from your broker.
              </span>
            </label>
          </div>

          <details
            className="mt-4 border border-zinc-900 bg-zinc-950/60 p-3"
            data-testid="paste-csv-details"
          >
            <summary className="cursor-pointer text-sm font-medium text-zinc-300">
              Paste CSV instead or view parsed text
            </summary>
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                CSV Text
              </span>
              <textarea
                aria-label="CSV Text"
                data-testid="csv-textarea"
                className="mt-2 min-h-[260px] w-full resize-y border border-zinc-800 bg-zinc-950 px-3 py-3 font-mono text-xs leading-5 text-zinc-200 outline-none focus:border-sky-500"
                value={csvText}
                onChange={(event) => {
                  setCsvText(event.target.value);
                  setSelectedPresetId("");
                  setSelectedFileName(null);
                  setRepairImpactBaseline(null);
                  setRepairCarryForward({ editCount: 0, lastEdit: null });
                  setFeedbackApproved(false);
                }}
              />
            </label>
          </details>

          <details
            className="mt-4 border border-zinc-900 bg-zinc-950/40 p-3"
            data-testid="import-dry-run-advanced-upload-settings"
          >
            <summary className="cursor-pointer text-sm font-medium text-zinc-300">
              Show advanced import settings
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  Broker override
                </span>
                <select
                  aria-label="Broker"
                  data-testid="broker-select"
                  className="mt-2 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500"
                  value={broker}
                  onChange={(event) => {
                    setBroker(event.target.value as BrokerExecutionCsvSelection);
                    setRepairImpactBaseline(null);
                    setRepairCarryForward({ editCount: 0, lastEdit: null });
                    setFeedbackApproved(false);
                  }}
                >
                  {BROKER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs leading-5 text-zinc-500">
                  Leave this on auto detect unless the app cannot identify the
                  export or asks you to choose a format.
                </span>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  CSV timezone
                </span>
                <input
                  aria-label="Account Timezone"
                  data-testid="timezone-input"
                  className="mt-2 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                />
                <span className="mt-2 block text-xs leading-5 text-zinc-500">
                  Used only when the CSV timestamps do not include their own
                  timezone. Most users should leave this alone.
                </span>
              </label>
            </div>
          </details>

        </div>

        <div className="grid gap-4">
          <Kpi
            label="File"
            value={hasCsvText ? "Loaded" : "Waiting"}
            detail={
              hasCsvText
                ? selectedFileName ?? "CSV text is ready"
                : "Choose a CSV to start"
            }
            tone="text-sky-300"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Kpi
              label="Rows"
              value={String(experience.preview.importResult.rowCount)}
              detail={
                hasCsvText
                  ? `${experience.preview.importResult.acceptedExecutionCount} accepted`
                  : "No file selected yet"
              }
            />
            <Kpi
              label="Trades"
              value={String(experience.preview.importResult.requestCount)}
              detail={
                hasCsvText
                  ? `${experience.preview.importResult.rejectedRowCount} rejected rows`
                  : "Trades appear after upload"
              }
            />
            <Kpi
              label="Rows To Fix"
              value={String(experience.preview.importResult.rejectedRowCount)}
              detail={
                !hasCsvText
                  ? "No file selected yet"
                  : experience.preview.importResult.rejectedRowCount > 0
                  ? "Repair these before saving"
                  : "No rejected rows"
              }
              tone={
                !hasCsvText
                  ? "text-zinc-400"
                  : experience.preview.importResult.rejectedRowCount > 0
                  ? "text-amber-300"
                  : "text-emerald-300"
              }
            />
            <Kpi
              label="Import Check"
              value={!hasCsvText ? "Waiting" : canTrySaveImport ? "Ready" : "Review"}
              detail={
                !hasCsvText
                  ? "Upload a CSV to start"
                  : canTrySaveImport
                  ? "Save this import or inspect details first"
                  : "Fix rows or column choices before saving"
              }
              tone={
                !hasCsvText
                  ? "text-zinc-400"
                  : canTrySaveImport
                    ? "text-emerald-300"
                    : "text-amber-300"
              }
            />
          </div>
          <div className="ti-panel p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Save Import
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  Once saved, these trades appear in your trade library, review
                  queue, analytics, and coach.
                </div>
                {saveImportState.message ? (
                  <div
                    className={`mt-2 text-xs ${
                      saveImportState.status === "error"
                        ? "text-rose-300"
                        : saveImportState.status === "committed"
                          ? "text-emerald-300"
                          : "text-sky-300"
                    }`}
                    data-testid="save-import-message"
                  >
                    {saveImportState.message}
                  </div>
                ) : null}
              </div>
              <button
                className="border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
                data-testid="save-import-button"
                disabled={
                  !canTrySaveImport ||
                  saveImportState.status === "previewing" ||
                  saveImportState.status === "committing"
                }
                type="button"
                onClick={() => void saveImport()}
              >
                {saveImportState.status === "previewing" ||
                saveImportState.status === "committing"
                  ? "Saving..."
                  : "Save Import"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          What happens after upload
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Kpi
            label="1. App checks rows"
            value={
              !hasCsvText
                ? "Waiting"
                : experience.preview.importResult.rejectedRowCount > 0
                  ? "Needs help"
                  : "Looks clean"
            }
            detail={
              !hasCsvText
                ? "Upload a CSV to start"
                : experience.preview.importResult.rejectedRowCount > 0
                ? "Only rejected rows need attention"
                : "No rejected rows in this file"
            }
            tone={
              !hasCsvText
                ? "text-zinc-400"
                : experience.preview.importResult.rejectedRowCount > 0
                ? "text-amber-300"
                : "text-emerald-300"
            }
          />
          <Kpi
            label="2. Save import"
            value={canTrySaveImport ? "Available" : "Waiting"}
            detail={
              canTrySaveImport
                ? "Save when you are ready"
                : "Upload or repair rows first"
            }
            tone={canTrySaveImport ? "text-emerald-300" : "text-zinc-400"}
          />
          <Kpi
            label="3. Review trades"
            value={String(experience.preview.importResult.requestCount)}
            detail="saved trades will open after saving"
            tone="text-sky-300"
          />
        </div>
      </section>

      {needsBeginnerRepairHelp ? (
        <section className="grid gap-6">
          <section className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Rows That Need Attention
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              The app could not safely save every row yet. Fix only the
              highlighted row or column issue, then save the import.
            </p>
          </section>
          <ColumnMappingAssistant
            experience={experience}
            values={mappingValues}
            onChange={(field, value) =>
              setMappingValues((current) => ({
                ...current,
                [field]: value,
              }))
            }
          />
          <RowRepairTable experience={experience} onEditCell={editDryRunCell} />
        </section>
      ) : null}

      <details
        className="ti-advanced-panel p-4"
        data-testid="import-dry-run-review-details"
      >
        <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
          Show import review details
        </summary>
        <div className="mt-5 grid gap-6">
          <ImportSessionSummary experience={experience} />
          <ExecutionReadinessSummary
            experience={experience}
            prototypePanel={prototypeAnalysisPanel}
          />
          {!needsBeginnerRepairHelp ? (
            <>
              <ColumnMappingAssistant
                experience={experience}
                values={mappingValues}
                onChange={(field, value) =>
                  setMappingValues((current) => ({
                    ...current,
                    [field]: value,
                  }))
                }
              />
              <RowRepairTable experience={experience} onEditCell={editDryRunCell} />
            </>
          ) : null}
          <TradeGroupingReview
            experience={experience}
            decisionValues={groupingDecisions}
            onDecisionChange={(requestIndex, value) =>
              setGroupingDecisions((current) => ({
                ...current,
                [requestIndex]: value,
              }))
            }
          />
          <SetupTagging
            experience={experience}
            values={setupTags}
            onChange={(requestIndex, value) =>
              setSetupTags((current) => ({
                ...current,
                [requestIndex]: value,
              }))
            }
          />
          <section className="grid gap-6 xl:grid-cols-2">
            <Walkthrough experience={experience} />
            <EvidenceDrillIn
              experience={experience}
              sampleMistakes={sampleMistakes}
            />
          </section>
          <section className="grid gap-6 xl:grid-cols-2">
            <ExecutionFeedbackPreview
              experience={experience}
              approved={feedbackApproved}
              onApprovedChange={setFeedbackApproved}
            />
            <ReplayPreview experience={experience} />
          </section>
        </div>
      </details>

      <details
        className="ti-advanced-panel p-4"
        data-testid="import-dry-run-advanced-cost-details"
      >
        <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
          Show advanced P/L and cost details
        </summary>
        <section className="mt-5 grid gap-6 xl:grid-cols-2">
          <PnlReconciliationAssistant experience={experience} />
          <CostVisibilityPanel experience={experience} />
        </section>
      </details>

      <details
        className="ti-advanced-panel p-4"
        data-testid="import-dry-run-technical-diagnostics"
      >
        <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
          Show technical import diagnostics
        </summary>
        <div className="mt-5 grid gap-6">
          <PrototypeAnalysisPanel
            chartTierEnabled={chartTierEnabled}
            panel={prototypeAnalysisPanel}
            decisionReviews={currentDecisionReviewRequest.decisionReviews}
            decisionReviewDiagnostics={currentDecisionReviewRequest.diagnostics}
            decisionReviewStatus={currentDecisionReviewRequest.status}
            decisionReviewMessage={currentDecisionReviewRequest.message}
            canRequestDecisionReview={canRequestDecisionReview}
            onRequestDecisionReview={requestDecisionReview}
          />
          <ReadinessScoreBreakdown experience={experience} />
          <RepairCarryForwardPanel
            experience={experience}
            state={repairCarryForward}
          />
          <ConfidenceGate experience={experience} />
          <SessionState experience={experience} />
          <RepairImpactDiff experience={experience} />
          <section className="grid gap-6 xl:grid-cols-2">
            <FeedbackComparison experience={experience} />
            <PostImportReviewQueuePreview experience={experience} />
          </section>
          <section className="grid gap-6 xl:grid-cols-2">
            <ExecutionAnomalyDetector experience={experience} />
          </section>
          <BrokerHelpAndErrorLibrary experience={experience} />
        </div>
      </details>
      <details
        className="ti-advanced-panel p-4"
        data-testid="import-dry-run-advanced-mapping-details"
      >
        <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
          Show technical import setup details
        </summary>
        <div className="mt-5 grid gap-6">
          <BrokerMappingLearningConsole experience={experience} />
          <BrokerAndCalibration experience={experience} />
        </div>
      </details>
      <details
        className="ti-advanced-panel p-4"
        data-testid="import-dry-run-operator-details"
      >
        <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
          Show privacy, decision, and QA notes
        </summary>
        <div className="mt-5">
          <PrivacyDecisionAndMobile
            experience={experience}
            feedbackApproved={feedbackApproved}
            groupingDecisionCount={Object.keys(groupingDecisions).length}
          />
        </div>
      </details>
      <details
        className="ti-advanced-panel p-4"
        data-testid="import-dry-run-admin-sample-details"
      >
        <summary className="cursor-pointer text-sm font-semibold text-zinc-500">
          Show demo/admin sample files
        </summary>
        <label className="mt-4 block max-w-xl">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Sample file
          </span>
          <select
            aria-label="Sample"
            data-testid="sample-select"
            className="mt-2 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500"
            value={selectedPresetId}
            onChange={(event) => choosePreset(event.target.value)}
          >
            <option value="">No sample selected</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs leading-5 text-zinc-500">
            Demo fixtures are for internal testing and product QA, not the
            normal trader import path.
          </span>
        </label>
      </details>
    </div>
  );
}
