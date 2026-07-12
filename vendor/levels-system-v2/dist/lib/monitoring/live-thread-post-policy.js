import { isPracticalStructureExpansion } from "./practical-trade-structure.js";
const FOLLOW_THROUGH_REPEAT_COOLDOWN_MS = 5 * 60 * 1000;
const FOLLOW_THROUGH_STORY_WINDOW_MS = 30 * 60 * 1000;
const INTELLIGENT_ALERT_STORY_WINDOW_MS = 3 * 60 * 60 * 1000;
const INTELLIGENT_ALERT_SAME_STORY_COOLDOWN_MS = 20 * 60 * 1000;
const INTELLIGENT_ALERT_ZONE_CHOP_WINDOW_MS = 5 * 60 * 1000;
const INTELLIGENT_ALERT_RANGE_CHOP_WINDOW_MS = 3 * 60 * 60 * 1000;
const INTELLIGENT_ALERT_RANGE_CHOP_POST_LIMIT = 3;
const INTELLIGENT_ALERT_RANGE_CHOP_PRICE_RANGE_PCT = 0.08;
const INTELLIGENT_ALERT_RANGE_CHOP_LEVEL_DISTANCE_PCT = 0.05;
const INTELLIGENT_ALERT_STRUCTURE_BUDGET_WINDOW_MS = 4 * 60 * 60 * 1000;
const INTELLIGENT_ALERT_STRUCTURE_BUDGET_POST_LIMIT = 2;
const INTELLIGENT_ALERT_STRUCTURE_BUDGET_RANGE_PCT = 0.18;
const INTELLIGENT_ALERT_STRUCTURE_EXPANSION_PCT = 0.08;
const INTELLIGENT_ALERT_LADDER_STEP_COOLDOWN_MS = 8 * 60 * 1000;
const INTELLIGENT_ALERT_LADDER_STEP_MOVE_PCT = 0.08;
const THREAD_STORY_PHASE_WINDOW_MS = 3 * 60 * 60 * 1000;
const THREAD_STORY_PHASE_EXPANSION_PCT = 0.08;
const AI_SIGNAL_STORY_WINDOW_MS = 45 * 60 * 1000;
const AI_SIGNAL_SYMBOL_WINDOW_MS = 20 * 60 * 1000;
const SAME_STORY_LEVEL_PCT = 0.012;
const SAME_STORY_LEVEL_ABSOLUTE = 0.03;
const FOLLOW_THROUGH_STORY_LEVEL_PCT = 0.03;
const FOLLOW_THROUGH_STORY_LEVEL_ABSOLUTE = 0.05;
const MATERIAL_FOLLOW_THROUGH_DELTA_PCT = 2;
const MIN_INITIAL_FOLLOW_THROUGH_MOVE_PCT = 1.25;
const MIN_INITIAL_FAILED_FOLLOW_THROUGH_MOVE_PCT = 1;
const MATERIAL_ALERT_SCORE_ESCALATION = 15;
const MATERIAL_ZONE_REVERSAL_MOVE_PCT = 1.25;
const CRITICAL_BURST_WINDOW_MS = 5 * 60 * 1000;
const CRITICAL_EXTENDED_BURST_WINDOW_MS = 10 * 60 * 1000;
const CRITICAL_BURST_LIMIT = 4;
const CRITICAL_EXTENDED_BURST_LIMIT = 6;
const FOLLOW_THROUGH_KIND_BURST_LIMIT = 2;
const MIN_FOLLOW_THROUGH_STATE_MOVE_PCT = 1;
const BASE_POSTING_POLICY_SETTINGS = {
    profile: "balanced",
    followThroughRepeatCooldownMs: FOLLOW_THROUGH_REPEAT_COOLDOWN_MS,
    followThroughStoryWindowMs: FOLLOW_THROUGH_STORY_WINDOW_MS,
    intelligentAlertStoryWindowMs: INTELLIGENT_ALERT_STORY_WINDOW_MS,
    intelligentAlertSameStoryCooldownMs: INTELLIGENT_ALERT_SAME_STORY_COOLDOWN_MS,
    intelligentAlertZoneChopWindowMs: INTELLIGENT_ALERT_ZONE_CHOP_WINDOW_MS,
    intelligentAlertRangeChopWindowMs: INTELLIGENT_ALERT_RANGE_CHOP_WINDOW_MS,
    intelligentAlertRangeChopPostLimit: INTELLIGENT_ALERT_RANGE_CHOP_POST_LIMIT,
    intelligentAlertRangeChopPriceRangePct: INTELLIGENT_ALERT_RANGE_CHOP_PRICE_RANGE_PCT,
    intelligentAlertRangeChopLevelDistancePct: INTELLIGENT_ALERT_RANGE_CHOP_LEVEL_DISTANCE_PCT,
    intelligentAlertStructureBudgetWindowMs: INTELLIGENT_ALERT_STRUCTURE_BUDGET_WINDOW_MS,
    intelligentAlertStructureBudgetPostLimit: INTELLIGENT_ALERT_STRUCTURE_BUDGET_POST_LIMIT,
    intelligentAlertStructureBudgetRangePct: INTELLIGENT_ALERT_STRUCTURE_BUDGET_RANGE_PCT,
    intelligentAlertStructureExpansionPct: INTELLIGENT_ALERT_STRUCTURE_EXPANSION_PCT,
    intelligentAlertLadderStepCooldownMs: INTELLIGENT_ALERT_LADDER_STEP_COOLDOWN_MS,
    intelligentAlertLadderStepMovePct: INTELLIGENT_ALERT_LADDER_STEP_MOVE_PCT,
    threadStoryPhaseWindowMs: THREAD_STORY_PHASE_WINDOW_MS,
    threadStoryPhaseExpansionPct: THREAD_STORY_PHASE_EXPANSION_PCT,
    aiSignalStoryWindowMs: AI_SIGNAL_STORY_WINDOW_MS,
    aiSignalSymbolWindowMs: AI_SIGNAL_SYMBOL_WINDOW_MS,
    materialFollowThroughDeltaPct: MATERIAL_FOLLOW_THROUGH_DELTA_PCT,
    minInitialFollowThroughMovePct: MIN_INITIAL_FOLLOW_THROUGH_MOVE_PCT,
    minInitialFailedFollowThroughMovePct: MIN_INITIAL_FAILED_FOLLOW_THROUGH_MOVE_PCT,
    materialAlertScoreEscalation: MATERIAL_ALERT_SCORE_ESCALATION,
    materialZoneReversalMovePct: MATERIAL_ZONE_REVERSAL_MOVE_PCT,
    criticalBurstWindowMs: CRITICAL_BURST_WINDOW_MS,
    criticalExtendedBurstWindowMs: CRITICAL_EXTENDED_BURST_WINDOW_MS,
    criticalBurstLimit: CRITICAL_BURST_LIMIT,
    criticalExtendedBurstLimit: CRITICAL_EXTENDED_BURST_LIMIT,
    followThroughKindBurstLimit: FOLLOW_THROUGH_KIND_BURST_LIMIT,
    aiHighConfidenceMinScore: 60,
    aiAlwaysPostMinScore: 65,
    allowMinorContinuity: false,
    optionalLivePostDensityLimit: 1,
    optionalLivePostKindLimit: 1,
    minFollowThroughStateMovePct: MIN_FOLLOW_THROUGH_STATE_MOVE_PCT,
};
export function resolveLiveThreadPostingProfile(input) {
    const normalized = input?.trim().toLowerCase();
    if (normalized === "quiet" || normalized === "active" || normalized === "balanced") {
        return normalized;
    }
    return "balanced";
}
export function getLiveThreadPostingPolicySettings(profileInput) {
    const profile = resolveLiveThreadPostingProfile(profileInput);
    if (profile === "quiet") {
        return {
            ...BASE_POSTING_POLICY_SETTINGS,
            profile,
            intelligentAlertStoryWindowMs: 4 * 60 * 60 * 1000,
            intelligentAlertSameStoryCooldownMs: 30 * 60 * 1000,
            intelligentAlertZoneChopWindowMs: 8 * 60 * 1000,
            intelligentAlertRangeChopWindowMs: 4 * 60 * 60 * 1000,
            intelligentAlertRangeChopPostLimit: 2,
            intelligentAlertRangeChopPriceRangePct: 0.1,
            intelligentAlertRangeChopLevelDistancePct: 0.06,
            intelligentAlertStructureBudgetWindowMs: 4 * 60 * 60 * 1000,
            intelligentAlertStructureBudgetPostLimit: 2,
            intelligentAlertStructureBudgetRangePct: 0.2,
            intelligentAlertStructureExpansionPct: 0.1,
            intelligentAlertLadderStepCooldownMs: 10 * 60 * 1000,
            intelligentAlertLadderStepMovePct: 0.1,
            threadStoryPhaseWindowMs: 4 * 60 * 60 * 1000,
            threadStoryPhaseExpansionPct: 0.1,
            materialAlertScoreEscalation: 20,
            materialZoneReversalMovePct: 1.75,
            minInitialFollowThroughMovePct: 1.75,
            minInitialFailedFollowThroughMovePct: 1.25,
            materialFollowThroughDeltaPct: 2.75,
            criticalBurstLimit: 3,
            criticalExtendedBurstLimit: 5,
            followThroughKindBurstLimit: 2,
            aiHighConfidenceMinScore: 68,
            aiAlwaysPostMinScore: 72,
            minFollowThroughStateMovePct: 1.5,
        };
    }
    if (profile === "active") {
        return {
            ...BASE_POSTING_POLICY_SETTINGS,
            profile,
            intelligentAlertStoryWindowMs: 90 * 60 * 1000,
            intelligentAlertSameStoryCooldownMs: 10 * 60 * 1000,
            intelligentAlertZoneChopWindowMs: 3 * 60 * 1000,
            intelligentAlertRangeChopWindowMs: 90 * 60 * 1000,
            intelligentAlertRangeChopPostLimit: 6,
            intelligentAlertRangeChopPriceRangePct: 0.07,
            intelligentAlertRangeChopLevelDistancePct: 0.04,
            intelligentAlertStructureBudgetWindowMs: 2 * 60 * 60 * 1000,
            intelligentAlertStructureBudgetPostLimit: 4,
            intelligentAlertStructureBudgetRangePct: 0.15,
            intelligentAlertStructureExpansionPct: 0.06,
            intelligentAlertLadderStepCooldownMs: 5 * 60 * 1000,
            intelligentAlertLadderStepMovePct: 0.06,
            threadStoryPhaseWindowMs: 90 * 60 * 1000,
            threadStoryPhaseExpansionPct: 0.05,
            materialAlertScoreEscalation: 10,
            materialZoneReversalMovePct: 0.75,
            minInitialFollowThroughMovePct: 0.75,
            minInitialFailedFollowThroughMovePct: 0.65,
            materialFollowThroughDeltaPct: 1.25,
            criticalBurstLimit: 6,
            criticalExtendedBurstLimit: 9,
            followThroughKindBurstLimit: 4,
            aiHighConfidenceMinScore: 52,
            aiAlwaysPostMinScore: 58,
            allowMinorContinuity: true,
            optionalLivePostDensityLimit: 2,
            minFollowThroughStateMovePct: 0.75,
        };
    }
    return BASE_POSTING_POLICY_SETTINGS;
}
export function classifyLiveThreadMessage(kind) {
    switch (kind) {
        case "intelligent_alert":
        case "level_clear_update":
        case "follow_through_update":
        case "level_snapshot":
        case "level_extension":
            return "trader_critical";
        case "continuity_update":
        case "follow_through_state_update":
        case "symbol_recap":
        case "ai_signal_commentary":
        case "market_structure_update":
            return "trader_helpful_optional";
        default:
            return "operator_only";
    }
}
export function sameStoryLevelTolerance(price) {
    const absolutePrice = Math.abs(price);
    if (absolutePrice < 1) {
        return Math.max(absolutePrice * 0.04, 0.03);
    }
    if (absolutePrice < 2) {
        return Math.max(absolutePrice * 0.035, 0.05);
    }
    if (absolutePrice < 5) {
        return Math.max(absolutePrice * 0.025, 0.08);
    }
    if (absolutePrice < 10) {
        return Math.max(absolutePrice * 0.02, 0.12);
    }
    return Math.max(absolutePrice * SAME_STORY_LEVEL_PCT, SAME_STORY_LEVEL_ABSOLUTE);
}
export function formatPolicyLevel(price) {
    if (!Number.isFinite(price)) {
        return "unknown";
    }
    const tolerance = sameStoryLevelTolerance(price);
    const bucket = Math.round(price / tolerance) * tolerance;
    return bucket >= 1 ? bucket.toFixed(2) : bucket.toFixed(4);
}
export function followThroughStoryLevelTolerance(price) {
    return Math.max(Math.abs(price) * FOLLOW_THROUGH_STORY_LEVEL_PCT, FOLLOW_THROUGH_STORY_LEVEL_ABSOLUTE);
}
export function formatFollowThroughPolicyLevel(price) {
    if (!Number.isFinite(price)) {
        return "unknown";
    }
    const tolerance = followThroughStoryLevelTolerance(price);
    const bucket = Math.round(price / tolerance) * tolerance;
    return bucket >= 1 ? bucket.toFixed(2) : bucket.toFixed(4);
}
export function buildFollowThroughStoryKey(evaluation) {
    return `${evaluation.eventType}|${formatFollowThroughPolicyLevel(evaluation.entryPrice)}`;
}
export function buildIntelligentAlertStoryKey(params) {
    return `${params.eventType}|${formatPolicyLevel(params.level)}`;
}
export function buildIntelligentAlertZoneKey(params) {
    return formatPolicyLevel(params.level);
}
export function buildThreadStoryPhaseAreaKey(params) {
    if (params.practicalZoneKey?.trim()) {
        return params.practicalZoneKey.trim();
    }
    const side = params.eventType === "breakdown" ||
        params.eventType === "fake_breakdown"
        ? "support"
        : params.eventType === "breakout" ||
            params.eventType === "reclaim" ||
            params.eventType === "fake_breakout" ||
            params.eventType === "rejection"
            ? "resistance"
            : "area";
    return `${side}:${formatPolicyLevel(params.level)}`;
}
export function deriveThreadStoryPhase(params) {
    if (params.followThroughLabel === "failed") {
        if (params.eventType === "breakout" || params.eventType === "fake_breakout") {
            return "failed_breakout";
        }
        if (params.eventType === "breakdown" || params.eventType === "fake_breakdown") {
            return "reclaim_attempt";
        }
    }
    if (params.followThroughLabel === "working" || params.followThroughLabel === "strong") {
        if (params.eventType === "breakout") {
            return "breakout_holding";
        }
        if (params.eventType === "reclaim") {
            return "reclaim_holding";
        }
        if (params.eventType === "breakdown") {
            return "support_area_lost";
        }
    }
    switch (params.practicalStructureState) {
        case "range_bound":
            return "range_bound";
        case "building_base":
            return "building_base";
        case "pullback_to_support":
        case "support_holding":
            return "testing_support";
        case "pressing_resistance":
            return "pressing_resistance";
        case "breakout_attempt":
            return "breakout_attempt";
        case "breakout_holding":
            return "breakout_holding";
        case "breakout_failed":
            return "failed_breakout";
        case "support_failing":
        case "structure_broken":
            return "support_area_lost";
        case "reclaim_attempt":
            return "reclaim_attempt";
        case "reclaim_holding":
            return "reclaim_holding";
    }
    switch (params.eventType) {
        case "breakout":
            return "breakout_attempt";
        case "breakdown":
            return "support_area_lost";
        case "reclaim":
        case "fake_breakdown":
            return "reclaim_attempt";
        case "rejection":
        case "fake_breakout":
            return "failed_breakout";
        case "compression":
            return "range_bound";
        case "level_touch":
            return params.zoneKind === "resistance" ? "pressing_resistance" : "testing_support";
        case "level_clear_update":
            return "runner_extension";
        default:
            return null;
    }
}
function phaseImportance(phase) {
    switch (phase) {
        case "range_bound":
        case "building_base":
        case "testing_support":
        case "pressing_resistance":
            return 1;
        case "breakout_attempt":
        case "reclaim_attempt":
            return 2;
        case "breakout_holding":
        case "failed_breakout":
        case "support_area_lost":
        case "reclaim_holding":
        case "runner_extension":
            return 3;
        default:
            return 1;
    }
}
function isMeaningfulThreadPhaseChange(params) {
    if (params.previousPhase === params.nextPhase) {
        return false;
    }
    const nextWasAlreadySeen = params.sameArea.some((record) => record.phase === params.nextPhase);
    if (nextWasAlreadySeen) {
        return false;
    }
    if (phaseImportance(params.nextPhase) > phaseImportance(params.previousPhase)) {
        return true;
    }
    if (params.previousPhase === "range_bound" && params.nextPhase !== "range_bound") {
        return true;
    }
    if (params.previousPhase === "building_base" &&
        (params.nextPhase === "testing_support" || params.nextPhase === "pressing_resistance")) {
        return true;
    }
    if (params.previousPhase === "testing_support" && params.nextPhase === "support_area_lost") {
        return true;
    }
    if (params.previousPhase === "pressing_resistance" && params.nextPhase === "breakout_attempt") {
        return true;
    }
    return false;
}
export function pruneFollowThroughStoryRecords(records, timestamp, settings = getLiveThreadPostingPolicySettings()) {
    return records.filter((record) => timestamp - record.postedAt <= settings.followThroughStoryWindowMs);
}
export function pruneThreadStoryPhaseRecords(records, timestamp, settings = getLiveThreadPostingPolicySettings()) {
    return records.filter((record) => timestamp - record.postedAt <= settings.threadStoryPhaseWindowMs);
}
export function buildThreadStoryPhaseRecord(params) {
    return {
        phase: params.phase,
        areaKey: params.areaKey,
        eventType: params.eventType ?? null,
        triggerPrice: params.triggerPrice,
        postedAt: params.timestamp,
    };
}
export function decideThreadStoryPhasePost(params) {
    const settings = params.settings ?? getLiveThreadPostingPolicySettings();
    const phaseKey = `${params.phase}|${params.areaKey}`;
    const recent = pruneThreadStoryPhaseRecords(params.records, params.timestamp, settings);
    const sameArea = recent
        .filter((record) => record.areaKey === params.areaKey)
        .sort((left, right) => right.postedAt - left.postedAt);
    const latestSamePhase = sameArea.find((record) => record.phase === params.phase);
    if (!latestSamePhase) {
        const latestDifferentPhase = sameArea[0];
        if (latestDifferentPhase &&
            !params.materialChange &&
            !params.majorChange &&
            !isMeaningfulThreadPhaseChange({
                previousPhase: latestDifferentPhase.phase,
                nextPhase: params.phase,
                sameArea,
            })) {
            return { shouldPost: false, reason: "phase_churn", phaseKey };
        }
        return {
            shouldPost: true,
            reason: sameArea.length > 0 ? "phase_changed" : "new_phase",
            phaseKey,
        };
    }
    if (params.materialChange) {
        return { shouldPost: true, reason: "phase_changed", phaseKey };
    }
    if (Math.abs(params.triggerPrice - latestSamePhase.triggerPrice) /
        Math.max(Math.abs(latestSamePhase.triggerPrice), 0.0001) >=
        settings.threadStoryPhaseExpansionPct) {
        return { shouldPost: true, reason: "phase_expansion", phaseKey };
    }
    const expanded = hasExpandedOutsidePriorRange(sameArea.map((record) => ({
        storyKey: phaseKey,
        zoneKey: params.areaKey,
        level: record.triggerPrice,
        eventType: record.eventType ?? params.eventType ?? "unknown",
        triggerPrice: record.triggerPrice,
        postedAt: record.postedAt,
    })), params.triggerPrice, settings.threadStoryPhaseExpansionPct);
    if (expanded) {
        return { shouldPost: true, reason: "phase_expansion", phaseKey };
    }
    return { shouldPost: false, reason: "same_phase_repeat", phaseKey };
}
function isMaterialFollowThroughChange(previous, evaluation, settings) {
    if (previous.label !== evaluation.followThroughLabel) {
        return true;
    }
    if (previous.directionalReturnPct === null || evaluation.directionalReturnPct === null) {
        return false;
    }
    const referencePrice = Math.max(Math.abs(previous.entryPrice), 0.0001);
    return (Math.abs(evaluation.directionalReturnPct - previous.directionalReturnPct) >=
        materialFollowThroughDeltaPctForPrice(referencePrice, settings));
}
function isMinorInitialFollowThroughMove(evaluation, settings, referencePrice) {
    if (evaluation.followThroughLabel === "strong") {
        return false;
    }
    if (evaluation.directionalReturnPct === null) {
        return true;
    }
    const threshold = minInitialFollowThroughMovePctForPrice(referencePrice, evaluation.followThroughLabel, settings);
    return Math.abs(evaluation.directionalReturnPct) < threshold;
}
function isMeaningfulFollowThroughTransition(previousLabel, nextLabel) {
    if (previousLabel === nextLabel) {
        return true;
    }
    if (previousLabel === "unknown") {
        return true;
    }
    const transition = `${previousLabel}->${nextLabel}`;
    return [
        "working->strong",
        "working->failed",
        "stalled->working",
        "stalled->strong",
        "stalled->failed",
        "failed->working",
        "failed->strong",
        "strong->failed",
        "strong->stalled",
    ].includes(transition);
}
function isSameFollowThroughStoryLevel(left, right) {
    const tolerance = Math.max(followThroughStoryLevelTolerance(left), followThroughStoryLevelTolerance(right));
    return Math.abs(left - right) <= tolerance;
}
export function decideFollowThroughPost(params) {
    const settings = params.settings ?? getLiveThreadPostingPolicySettings();
    const storyKey = buildFollowThroughStoryKey(params.evaluation);
    const matching = params.records
        .filter((record) => record.eventType === params.evaluation.eventType &&
        isSameFollowThroughStoryLevel(record.entryPrice, params.evaluation.entryPrice))
        .sort((left, right) => right.postedAt - left.postedAt);
    const latestSameLabel = matching.find((record) => record.eventType === params.evaluation.eventType &&
        record.label === params.evaluation.followThroughLabel);
    const latestSameStory = matching[0];
    if (latestSameStory &&
        !isMeaningfulFollowThroughTransition(latestSameStory.label, params.evaluation.followThroughLabel)) {
        return {
            shouldPost: false,
            reason: "weak_label_transition",
            storyKey,
        };
    }
    if (!latestSameLabel) {
        if (isMinorInitialFollowThroughMove(params.evaluation, settings, params.evaluation.entryPrice)) {
            return {
                shouldPost: false,
                reason: "minor_initial_move",
                storyKey,
            };
        }
        return {
            shouldPost: true,
            reason: "new_story",
            storyKey,
        };
    }
    if (params.evaluation.evaluatedAt - latestSameLabel.postedAt <= settings.followThroughRepeatCooldownMs) {
        return {
            shouldPost: false,
            reason: "repeat_cooldown",
            storyKey,
        };
    }
    if (!isMaterialFollowThroughChange(latestSameLabel, params.evaluation, settings)) {
        return {
            shouldPost: false,
            reason: "not_materially_new",
            storyKey,
        };
    }
    return {
        shouldPost: true,
        reason: "materially_new",
        storyKey,
    };
}
function severityRank(severity) {
    switch (severity) {
        case "critical":
            return 4;
        case "high":
            return 3;
        case "medium":
            return 2;
        case "low":
            return 1;
        default:
            return 0;
    }
}
function isRangeChopEventType(eventType) {
    return [
        "level_touch",
        "breakdown",
        "breakout",
        "reclaim",
        "rejection",
        "fake_breakout",
        "fake_breakdown",
        "compression",
    ].includes(eventType);
}
function isStructureBudgetEventType(eventType) {
    return [
        "level_touch",
        "breakdown",
        "rejection",
        "fake_breakout",
        "fake_breakdown",
        "compression",
    ].includes(eventType);
}
function isDirectionalExpansionEventType(eventType) {
    return eventType === "breakout" || eventType === "reclaim";
}
function materialZoneReversalMovePctForPrice(referencePrice, settings) {
    const price = Math.abs(referencePrice);
    if (price < 1) {
        return Math.max(settings.materialZoneReversalMovePct, 3.5);
    }
    if (price < 2) {
        return Math.max(settings.materialZoneReversalMovePct, 3);
    }
    if (price < 5) {
        return Math.max(settings.materialZoneReversalMovePct, 2.25);
    }
    if (price < 10) {
        return Math.max(settings.materialZoneReversalMovePct, 1.75);
    }
    return settings.materialZoneReversalMovePct;
}
function rangeChopPriceRangePctForPrice(referencePrice, settings) {
    const price = Math.abs(referencePrice);
    if (price < 1) {
        return Math.max(settings.intelligentAlertRangeChopPriceRangePct, 0.13);
    }
    if (price < 2) {
        return Math.max(settings.intelligentAlertRangeChopPriceRangePct, 0.12);
    }
    if (price < 5) {
        return Math.max(settings.intelligentAlertRangeChopPriceRangePct, 0.1);
    }
    if (price < 10) {
        return Math.max(settings.intelligentAlertRangeChopPriceRangePct, 0.09);
    }
    return settings.intelligentAlertRangeChopPriceRangePct;
}
function rangeChopLevelDistancePctForPrice(referencePrice, settings) {
    const price = Math.abs(referencePrice);
    if (price < 1) {
        return Math.max(settings.intelligentAlertRangeChopLevelDistancePct, 0.08);
    }
    if (price < 2) {
        return Math.max(settings.intelligentAlertRangeChopLevelDistancePct, 0.07);
    }
    if (price < 5) {
        return Math.max(settings.intelligentAlertRangeChopLevelDistancePct, 0.06);
    }
    return settings.intelligentAlertRangeChopLevelDistancePct;
}
function rangeChopPostLimitForPrice(referencePrice, settings) {
    const price = Math.abs(referencePrice);
    if (price < 2) {
        return Math.max(2, settings.intelligentAlertRangeChopPostLimit - 1);
    }
    if (price < 5) {
        return Math.max(2, settings.intelligentAlertRangeChopPostLimit);
    }
    return settings.intelligentAlertRangeChopPostLimit;
}
function minInitialFollowThroughMovePctForPrice(referencePrice, label, settings) {
    const base = label === "failed"
        ? settings.minInitialFailedFollowThroughMovePct
        : settings.minInitialFollowThroughMovePct;
    const price = Math.abs(referencePrice);
    if (price >= 5 && price < 10) {
        return Math.max(base, label === "failed" ? 2 : 1.75);
    }
    return base;
}
function materialFollowThroughDeltaPctForPrice(referencePrice, settings) {
    const price = Math.abs(referencePrice);
    if (price >= 5 && price < 10) {
        return Math.max(settings.materialFollowThroughDeltaPct, 1.75);
    }
    return settings.materialFollowThroughDeltaPct;
}
function practicalStructureBudgetPostLimit(state, settings) {
    switch (state) {
        case "range_bound":
        case "pullback_to_support":
        case "support_holding":
            return Math.max(1, settings.intelligentAlertStructureBudgetPostLimit);
        case "building_base":
        case "pressing_resistance":
        case "support_failing":
            return settings.intelligentAlertStructureBudgetPostLimit + 1;
        case "breakout_attempt":
        case "reclaim_attempt":
        case "breakout_failed":
            return settings.intelligentAlertStructureBudgetPostLimit + 1;
        case "breakout_holding":
        case "structure_broken":
        case "reclaim_holding":
            return settings.intelligentAlertStructureBudgetPostLimit + 2;
        default:
            return settings.intelligentAlertStructureBudgetPostLimit;
    }
}
function stableMarketStructureBudgetPostLimit(state, settings) {
    switch (state) {
        case "range_bound":
        case "base_building":
        case "pullback_to_structure":
            return Math.max(1, settings.intelligentAlertStructureBudgetPostLimit);
        case "pressing_range_high":
        case "higher_lows_intact":
        case "trend_intact":
        case "trend_damaged":
        case "breakout_attempt":
        case "reclaim_attempt":
            return settings.intelligentAlertStructureBudgetPostLimit + 1;
        case "breakout_holding":
        case "failed_breakout":
        case "pivot_lost":
        case "reclaim_confirmed":
            return settings.intelligentAlertStructureBudgetPostLimit + 2;
        case "insufficient_data":
        default:
            return settings.intelligentAlertStructureBudgetPostLimit;
    }
}
function isStableStructureChopState(state) {
    return (state === "range_bound" ||
        state === "base_building" ||
        state === "pullback_to_structure");
}
function stableStructureRepeatPostLimit(state, settings) {
    if (state === "range_bound") {
        return Math.max(1, settings.intelligentAlertStructureBudgetPostLimit - 1);
    }
    return Math.max(1, settings.intelligentAlertStructureBudgetPostLimit);
}
function isNearLevel(left, right, tolerancePct) {
    const baseline = Math.max(Math.abs(left), Math.abs(right), 0.0001);
    return Math.abs(left - right) / baseline <= tolerancePct;
}
function isSameIntelligentStoryLevel(left, right) {
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
        return false;
    }
    const tolerance = Math.max(sameStoryLevelTolerance(left), sameStoryLevelTolerance(right));
    return Math.abs(left - right) <= tolerance;
}
function recordLevel(record) {
    return Number.isFinite(record.level) ? record.level : Number(record.zoneKey);
}
function isTightPriceRange(prices, maxRangePct) {
    const usable = prices.filter((price) => Number.isFinite(price) && price > 0);
    if (usable.length < 2) {
        return false;
    }
    const low = Math.min(...usable);
    const high = Math.max(...usable);
    return (high - low) / Math.max(low, 0.0001) <= maxRangePct;
}
function hasExpandedOutsidePriorRange(records, triggerPrice, expansionPct) {
    const prices = records
        .map((record) => record.triggerPrice)
        .filter((price) => Number.isFinite(price) && price > 0);
    if (prices.length < 2 || !Number.isFinite(triggerPrice) || triggerPrice <= 0) {
        return false;
    }
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    return (triggerPrice >= high * (1 + expansionPct) ||
        triggerPrice <= low * (1 - expansionPct));
}
function hasMaterialStructureTransition(params) {
    if (!params.nextState) {
        return false;
    }
    const previousIncludesNext = params.previousStates.includes(params.nextState);
    if (!previousIncludesNext &&
        (params.nextState === "breakout_attempt" ||
            params.nextState === "breakout_holding" ||
            params.nextState === "breakout_failed" ||
            params.nextState === "support_failing" ||
            params.nextState === "structure_broken" ||
            params.nextState === "reclaim_attempt" ||
            params.nextState === "reclaim_holding")) {
        return true;
    }
    return params.previousStates.some((state) => state !== undefined &&
        state !== params.nextState &&
        (params.nextState === "support_failing" ||
            params.nextState === "pressing_resistance" ||
            params.nextState === "building_base"));
}
function hasMaterialStableMarketStructureTransition(params) {
    if (params.materialChange === true) {
        return true;
    }
    if (!params.nextState || params.nextState === "insufficient_data") {
        return false;
    }
    const previousIncludesNext = params.previousStates.includes(params.nextState);
    if (!previousIncludesNext &&
        (params.nextState === "breakout_attempt" ||
            params.nextState === "breakout_holding" ||
            params.nextState === "failed_breakout" ||
            params.nextState === "pivot_lost" ||
            params.nextState === "reclaim_attempt" ||
            params.nextState === "reclaim_confirmed" ||
            params.nextState === "trend_damaged" ||
            params.nextState === "trend_intact" ||
            params.nextState === "higher_lows_intact")) {
        return true;
    }
    return params.previousStates.some((state) => state !== undefined &&
        state !== params.nextState &&
        (params.nextState === "pressing_range_high" ||
            params.nextState === "base_building" ||
            params.nextState === "trend_damaged" ||
            params.nextState === "pivot_lost"));
}
function hasMaterialFormalStructureTransition(params) {
    if (params.materialChange === true) {
        return true;
    }
    if (!params.nextKey || !params.eventType || params.eventType === "none") {
        return false;
    }
    return !params.previousKeys.includes(params.nextKey);
}
function stableStructureSupportsFormalDirection(params) {
    if (params.stableMaterialChange !== true ||
        params.stableConfidence !== "high" ||
        !params.stableState) {
        return false;
    }
    if (params.eventType === "bos_bullish" || params.eventType === "choch_bullish") {
        return (params.stableState === "breakout_holding" ||
            params.stableState === "reclaim_confirmed" ||
            params.stableState === "trend_intact" ||
            params.stableState === "pressing_range_high");
    }
    if (params.eventType === "bos_bearish" || params.eventType === "choch_bearish") {
        return (params.stableState === "pivot_lost" ||
            params.stableState === "trend_damaged" ||
            params.stableState === "failed_breakout");
    }
    return false;
}
function isActionableFormalStructureMaterialChange(params) {
    if (params.materialChange !== true ||
        !params.eventType ||
        params.eventType === "none" ||
        params.confidence === "low") {
        return false;
    }
    if (params.timeframe === "daily" || params.timeframe === "4h") {
        return true;
    }
    return false;
}
function recordFormalStructureKey(record) {
    return record.selectedFormalStructureKey ?? record.formalStructureKey;
}
function effectiveStructureBudget(params) {
    const practicalBudget = practicalStructureBudgetPostLimit(params.practicalState, params.settings);
    if (!params.stableState || params.stableState === "insufficient_data") {
        return practicalBudget;
    }
    return Math.min(practicalBudget, stableMarketStructureBudgetPostLimit(params.stableState, params.settings));
}
export function pruneIntelligentAlertStoryRecords(records, timestamp, settings = getLiveThreadPostingPolicySettings()) {
    return records.filter((record) => timestamp - record.postedAt <= settings.intelligentAlertStoryWindowMs);
}
export function decideIntelligentAlertPost(params) {
    const settings = params.settings ?? getLiveThreadPostingPolicySettings();
    const storyKey = buildIntelligentAlertStoryKey(params);
    const zoneKey = buildIntelligentAlertZoneKey(params);
    const formalStructureEventType = params.selectedFormalStructureEventType ?? params.formalStructureEventType;
    const formalStructureKey = params.selectedFormalStructureKey ?? params.formalStructureKey;
    const formalStructureMaterialChange = params.selectedFormalStructureMaterialChange ?? params.formalStructureMaterialChange;
    const actionableFormalStructureMaterialChange = isActionableFormalStructureMaterialChange({
        eventType: formalStructureEventType,
        materialChange: formalStructureMaterialChange,
        timeframe: params.selectedFormalStructureTimeframe ?? params.formalStructureTimeframe,
        confidence: params.selectedFormalStructureConfidence ?? params.formalStructureConfidence,
        stableState: params.stableMarketStructureState,
        stableConfidence: params.stableMarketStructureConfidence,
        stableMaterialChange: params.stableMarketStructureMaterialChange,
    });
    const matchingStory = params.records
        .filter((record) => record.eventType === params.eventType &&
        isSameIntelligentStoryLevel(recordLevel(record), params.level))
        .sort((left, right) => right.postedAt - left.postedAt)[0];
    if (params.eventType === "breakdown" &&
        params.practicalStructureState === "support_failing" &&
        params.practicalZoneKey !== undefined &&
        params.acceptanceLabel !== "accepted" &&
        (params.acceptanceLabel === "weak_probe" ||
            params.acceptanceLabel === "testing" ||
            params.failedLevelOutcome === "probe_only" ||
            params.failedLevelOutcome === "testing" ||
            params.rangeBoxLabel === "active" ||
            params.behaviorBudgetLabel === "boring_range")) {
        const latestWeakSupportFailure = params.records
            .filter((record) => record.eventType === "breakdown" &&
            record.practicalStructureState === "support_failing" &&
            record.practicalZoneKey === params.practicalZoneKey &&
            record.acceptanceLabel !== "accepted" &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertSameStoryCooldownMs)
            .sort((left, right) => right.postedAt - left.postedAt)[0];
        if (latestWeakSupportFailure) {
            const materialMovePct = materialZoneReversalMovePctForPrice(Math.max(Math.abs(params.triggerPrice), Math.abs(latestWeakSupportFailure.triggerPrice), 0.0001), settings) / 100;
            const expandedLower = params.triggerPrice <
                latestWeakSupportFailure.triggerPrice * (1 - materialMovePct);
            if (expandedLower) {
                return { shouldPost: true, reason: "material_escalation", storyKey, zoneKey };
            }
            if (params.stableMarketStructureMaterialChange !== true &&
                actionableFormalStructureMaterialChange !== true) {
                return { shouldPost: false, reason: "same_story_not_material", storyKey, zoneKey };
            }
        }
    }
    if (matchingStory && params.timestamp - matchingStory.postedAt <= settings.intelligentAlertSameStoryCooldownMs) {
        const scoreEscalated = typeof params.score === "number" &&
            typeof matchingStory.score === "number" &&
            params.score - matchingStory.score >= settings.materialAlertScoreEscalation;
        const severityEscalated = severityRank(params.severity) > severityRank(matchingStory.severity);
        const triggerMovePct = Math.abs((params.triggerPrice - matchingStory.triggerPrice) / Math.max(Math.abs(matchingStory.triggerPrice), 0.0001));
        const materialMovePct = materialZoneReversalMovePctForPrice(Math.max(Math.abs(params.triggerPrice), Math.abs(matchingStory.triggerPrice), 0.0001), settings) / 100;
        const materialEscalation = actionableFormalStructureMaterialChange === true ||
            (scoreEscalated || severityEscalated) &&
                (triggerMovePct >= materialMovePct ||
                    params.practicalStructureMaterialChange === true ||
                    params.stableMarketStructureMaterialChange === true ||
                    (params.acceptanceLabel === "accepted" &&
                        matchingStory.acceptanceLabel !== "accepted"));
        if (materialEscalation) {
            return { shouldPost: true, reason: "material_escalation", storyKey, zoneKey };
        }
        return { shouldPost: false, reason: "same_story_cooldown", storyKey, zoneKey };
    }
    if (params.ladderStepUpdate === true &&
        params.acceptanceLabel !== "accepted" &&
        params.levelImportanceLabel !== "major_decision" &&
        !params.practicalStructureMaterialChange &&
        !params.stableMarketStructureMaterialChange &&
        !actionableFormalStructureMaterialChange) {
        const latestSameDirection = params.records
            .filter((record) => record.eventType === params.eventType &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertLadderStepCooldownMs)
            .sort((left, right) => right.postedAt - left.postedAt)[0];
        if (latestSameDirection) {
            const movePct = Math.abs((params.triggerPrice - latestSameDirection.triggerPrice) /
                Math.max(Math.abs(latestSameDirection.triggerPrice), 0.0001));
            if (movePct < settings.intelligentAlertLadderStepMovePct) {
                return { shouldPost: false, reason: "ladder_step_cooldown", storyKey, zoneKey };
            }
        }
    }
    if (params.practicalZoneKey !== undefined &&
        params.acceptanceLabel !== "accepted" &&
        params.levelImportanceLabel !== "major_decision" &&
        !params.practicalStructureMaterialChange &&
        !params.stableMarketStructureMaterialChange &&
        (params.rangeBoxLabel === "active" ||
            params.behaviorBudgetLabel === "boring_range" ||
            isStableStructureChopState(params.stableMarketStructureState))) {
        const recentSamePracticalArea = params.records.filter((record) => record.practicalZoneKey === params.practicalZoneKey &&
            record.acceptanceLabel !== "accepted" &&
            record.levelImportanceLabel !== "major_decision" &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertStructureBudgetWindowMs);
        const hasOppositeStory = recentSamePracticalArea.some((record) => record.eventType !== params.eventType);
        const hasSameEventExplained = recentSamePracticalArea.some((record) => record.eventType === params.eventType);
        const practicalAreaExpanded = hasExpandedOutsidePriorRange(recentSamePracticalArea, params.triggerPrice, settings.intelligentAlertStructureExpansionPct);
        if (recentSamePracticalArea.length >= 2 &&
            hasOppositeStory &&
            hasSameEventExplained &&
            !practicalAreaExpanded) {
            return { shouldPost: false, reason: "practical_area_flip_chop", storyKey, zoneKey };
        }
    }
    if (matchingStory) {
        const scoreEscalated = typeof params.score === "number" &&
            typeof matchingStory.score === "number" &&
            params.score - matchingStory.score >= settings.materialAlertScoreEscalation;
        const severityEscalated = severityRank(params.severity) > severityRank(matchingStory.severity);
        const structureChanged = params.practicalStructureMaterialChange === true ||
            params.stableMarketStructureMaterialChange === true ||
            actionableFormalStructureMaterialChange === true ||
            hasMaterialFormalStructureTransition({
                previousKeys: [recordFormalStructureKey(matchingStory)],
                nextKey: formalStructureKey,
                eventType: formalStructureEventType,
            }) ||
            (params.practicalStructureState !== undefined &&
                matchingStory.practicalStructureState !== undefined &&
                params.practicalStructureState !== matchingStory.practicalStructureState);
        const acceptanceChanged = params.acceptanceLabel === "accepted" &&
            matchingStory.acceptanceLabel !== "accepted";
        const triggerMovePct = Math.abs((params.triggerPrice - matchingStory.triggerPrice) / Math.max(Math.abs(matchingStory.triggerPrice), 0.0001));
        const materialMovePct = materialZoneReversalMovePctForPrice(Math.max(Math.abs(params.triggerPrice), Math.abs(matchingStory.triggerPrice), 0.0001), settings) / 100;
        const practicalExpansion = isPracticalStructureExpansion({
            previousTrigger: matchingStory.triggerPrice,
            nextTrigger: params.triggerPrice,
            referencePrice: Math.max(Math.abs(params.triggerPrice), Math.abs(matchingStory.triggerPrice), 0.0001),
        });
        if (!scoreEscalated &&
            !severityEscalated &&
            !structureChanged &&
            !acceptanceChanged &&
            !practicalExpansion &&
            triggerMovePct < materialMovePct) {
            return { shouldPost: false, reason: "same_story_not_material", storyKey, zoneKey };
        }
    }
    const recentZone = params.records
        .filter((record) => isSameIntelligentStoryLevel(recordLevel(record), params.level) &&
        params.timestamp - record.postedAt <= settings.intelligentAlertZoneChopWindowMs)
        .sort((left, right) => right.postedAt - left.postedAt)[0];
    if (recentZone && recentZone.eventType !== params.eventType) {
        const movePct = Math.abs((params.triggerPrice - recentZone.triggerPrice) / recentZone.triggerPrice);
        const materialMovePct = materialZoneReversalMovePctForPrice(Math.max(Math.abs(params.triggerPrice), Math.abs(recentZone.triggerPrice), 0.0001), settings) / 100;
        if (movePct < materialMovePct) {
            return { shouldPost: false, reason: "zone_chop", storyKey, zoneKey };
        }
    }
    if (isRangeChopEventType(params.eventType)) {
        const rangePriceReference = Math.max(Math.abs(params.triggerPrice), Math.abs(params.level), 0.0001);
        const rangeChopPriceRangePct = rangeChopPriceRangePctForPrice(rangePriceReference, settings);
        const rangeChopLevelDistancePct = rangeChopLevelDistancePctForPrice(rangePriceReference, settings);
        const rangeChopPostLimit = rangeChopPostLimitForPrice(rangePriceReference, settings);
        const recentRange = params.records.filter((record) => isRangeChopEventType(record.eventType) &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertRangeChopWindowMs &&
            isNearLevel(record.triggerPrice, params.triggerPrice, rangeChopPriceRangePct) &&
            isNearLevel(Number(record.zoneKey), Number(zoneKey), rangeChopLevelDistancePct));
        const sameEventAlreadySeen = recentRange.some((record) => record.eventType === params.eventType);
        const structureExpanded = hasExpandedOutsidePriorRange(recentRange, params.triggerPrice, settings.intelligentAlertStructureExpansionPct);
        const structureTransition = hasMaterialStructureTransition({
            previousStates: recentRange.map((record) => record.practicalStructureState),
            nextState: params.practicalStructureState,
        }) || hasMaterialStableMarketStructureTransition({
            previousStates: recentRange.map((record) => record.stableMarketStructureState),
            nextState: params.stableMarketStructureState,
            materialChange: params.stableMarketStructureMaterialChange,
        }) || hasMaterialFormalStructureTransition({
            previousKeys: recentRange.map(recordFormalStructureKey),
            nextKey: formalStructureKey,
            eventType: formalStructureEventType,
            materialChange: actionableFormalStructureMaterialChange,
        });
        if (recentRange.length >= rangeChopPostLimit &&
            sameEventAlreadySeen &&
            !structureExpanded &&
            !structureTransition &&
            isTightPriceRange([...recentRange.map((record) => record.triggerPrice), params.triggerPrice], rangeChopPriceRangePct)) {
            return { shouldPost: false, reason: "range_bound_chop", storyKey, zoneKey };
        }
    }
    if (params.rangeBoxLabel === "active" &&
        (params.acceptanceLabel === "weak_probe" || params.acceptanceLabel === "testing") &&
        !params.practicalStructureMaterialChange &&
        !params.stableMarketStructureMaterialChange &&
        !actionableFormalStructureMaterialChange) {
        const recentBox = params.records.filter((record) => record.rangeBoxLabel === "active" &&
            record.practicalZoneKey !== undefined &&
            params.practicalZoneKey !== undefined &&
            record.practicalZoneKey === params.practicalZoneKey &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertRangeChopWindowMs);
        const rangeBoxLimit = params.behaviorBudgetLabel === "boring_range" ? 1 : 2;
        if (recentBox.length >= rangeBoxLimit) {
            return { shouldPost: false, reason: "range_box_chop", storyKey, zoneKey };
        }
    }
    if (params.primaryTradeAreaLocked === true &&
        (params.acceptanceLabel === "weak_probe" || params.acceptanceLabel === "testing") &&
        !params.practicalStructureMaterialChange &&
        !params.stableMarketStructureMaterialChange &&
        !actionableFormalStructureMaterialChange) {
        const recentLockedArea = params.records.filter((record) => record.primaryTradeAreaLocked === true &&
            params.practicalZoneKey !== undefined &&
            record.practicalZoneKey === params.practicalZoneKey &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertStructureBudgetWindowMs);
        const lockedAreaLimit = params.behaviorBudgetLabel === "boring_range" ? 1 : 2;
        const hasAcceptedEscape = params.primaryTradeAreaEscapeConfidence === "accepted";
        if (recentLockedArea.length >= lockedAreaLimit && !hasAcceptedEscape) {
            return { shouldPost: false, reason: "primary_area_lock", storyKey, zoneKey };
        }
    }
    if (params.practicalZoneKey !== undefined &&
        params.acceptanceLabel !== "accepted" &&
        params.levelImportanceLabel !== "major_decision" &&
        !params.practicalStructureMaterialChange &&
        !params.stableMarketStructureMaterialChange &&
        !actionableFormalStructureMaterialChange) {
        const recentSameArea = params.records.filter((record) => record.practicalZoneKey === params.practicalZoneKey &&
            record.eventType === params.eventType &&
            record.acceptanceLabel !== "accepted" &&
            record.levelImportanceLabel !== "major_decision" &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertSameStoryCooldownMs * 2);
        const sameAreaAlreadyExplained = recentSameArea.some((record) => {
            const movePct = Math.abs((params.triggerPrice - record.triggerPrice) /
                Math.max(Math.abs(record.triggerPrice), 0.0001));
            const materialMovePct = materialZoneReversalMovePctForPrice(Math.max(Math.abs(params.triggerPrice), Math.abs(record.triggerPrice), 0.0001), settings) / 100;
            return movePct < materialMovePct;
        });
        if (sameAreaAlreadyExplained) {
            return { shouldPost: false, reason: "same_story_not_material", storyKey, zoneKey };
        }
    }
    if ((params.failedLevelOutcome === "probe_only" || params.failedLevelOutcome === "testing") &&
        params.acceptanceLabel !== "accepted" &&
        params.levelImportanceLabel !== "major_decision" &&
        !params.practicalStructureMaterialChange &&
        !params.stableMarketStructureMaterialChange &&
        !actionableFormalStructureMaterialChange) {
        const recentProbe = params.records.filter((record) => (record.failedLevelOutcome === "probe_only" || record.failedLevelOutcome === "testing") &&
            record.eventType === params.eventType &&
            isSameIntelligentStoryLevel(recordLevel(record), params.level) &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertSameStoryCooldownMs * 2);
        if (recentProbe.length >= 1) {
            return { shouldPost: false, reason: "weak_probe_memory", storyKey, zoneKey };
        }
    }
    if (isStableStructureChopState(params.stableMarketStructureState) &&
        params.stableMarketStructureKey !== undefined &&
        params.stableMarketStructureMaterialChange !== true &&
        actionableFormalStructureMaterialChange !== true &&
        params.acceptanceLabel !== "accepted") {
        const recentStableSameStructure = params.records.filter((record) => record.stableMarketStructureState === params.stableMarketStructureState &&
            record.stableMarketStructureKey === params.stableMarketStructureKey &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertStructureBudgetWindowMs &&
            (params.practicalZoneKey !== undefined && record.practicalZoneKey !== undefined
                ? params.practicalZoneKey === record.practicalZoneKey
                : true));
        const stableLimit = stableStructureRepeatPostLimit(params.stableMarketStructureState, settings);
        const latestStable = [...recentStableSameStructure].sort((left, right) => right.postedAt - left.postedAt)[0];
        const stableStructureExpanded = recentStableSameStructure.length > 0 &&
            hasExpandedOutsidePriorRange(recentStableSameStructure, params.triggerPrice, settings.intelligentAlertStructureExpansionPct);
        const scoreEscalated = latestStable !== undefined &&
            typeof params.score === "number" &&
            typeof latestStable.score === "number" &&
            params.score - latestStable.score >= settings.materialAlertScoreEscalation;
        const severityEscalated = latestStable !== undefined &&
            severityRank(params.severity) > severityRank(latestStable.severity);
        const isMajorDecision = params.levelImportanceLabel === "major_decision";
        const isHighConvictionDirectional = (params.eventType === "breakout" || params.eventType === "breakdown" || params.eventType === "reclaim") &&
            severityRank(params.severity) >= severityRank("critical");
        if (recentStableSameStructure.length >= stableLimit &&
            !stableStructureExpanded &&
            !scoreEscalated &&
            !severityEscalated &&
            !isHighConvictionDirectional &&
            (!isMajorDecision || params.behaviorBudgetLabel === "boring_range" || params.rangeBoxLabel === "active")) {
            return { shouldPost: false, reason: "stable_structure_repeat", storyKey, zoneKey };
        }
    }
    if (isStructureBudgetEventType(params.eventType)) {
        const recentStructure = params.records.filter((record) => isStructureBudgetEventType(record.eventType) &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertStructureBudgetWindowMs &&
            (params.practicalZoneKey !== undefined &&
                record.practicalZoneKey !== undefined
                ? params.practicalZoneKey === record.practicalZoneKey
                : params.stableMarketStructureKey !== undefined &&
                    record.stableMarketStructureKey !== undefined
                    ? params.stableMarketStructureKey === record.stableMarketStructureKey
                    : isNearLevel(record.triggerPrice, params.triggerPrice, settings.intelligentAlertStructureBudgetRangePct)));
        const structureBudget = effectiveStructureBudget({
            practicalState: params.practicalStructureState,
            stableState: params.stableMarketStructureState,
            settings,
        });
        const structureExpanded = hasExpandedOutsidePriorRange(recentStructure, params.triggerPrice, settings.intelligentAlertStructureExpansionPct);
        const structureTransition = hasMaterialStructureTransition({
            previousStates: recentStructure.map((record) => record.practicalStructureState),
            nextState: params.practicalStructureState,
        }) || hasMaterialStableMarketStructureTransition({
            previousStates: recentStructure.map((record) => record.stableMarketStructureState),
            nextState: params.stableMarketStructureState,
            materialChange: params.stableMarketStructureMaterialChange,
        }) || hasMaterialFormalStructureTransition({
            previousKeys: recentStructure.map(recordFormalStructureKey),
            nextKey: formalStructureKey,
            eventType: formalStructureEventType,
            materialChange: actionableFormalStructureMaterialChange,
        });
        if (recentStructure.length >= structureBudget &&
            !structureExpanded &&
            !structureTransition) {
            return { shouldPost: false, reason: "structure_budget", storyKey, zoneKey };
        }
    }
    if (params.behaviorBudgetLabel === "boring_range") {
        const recentBoringRange = params.records.filter((record) => record.behaviorBudgetLabel === "boring_range" &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertStructureBudgetWindowMs);
        const hasAcceptedChange = params.acceptanceLabel === "accepted" ||
            params.practicalStructureMaterialChange === true ||
            params.stableMarketStructureMaterialChange === true ||
            actionableFormalStructureMaterialChange === true;
        if (recentBoringRange.length >= 3 && !hasAcceptedChange) {
            return { shouldPost: false, reason: "behavior_budget", storyKey, zoneKey };
        }
    }
    if (params.practicalZoneKey && isDirectionalExpansionEventType(params.eventType)) {
        const recentPracticalArea = params.records.filter((record) => params.practicalZoneKey !== undefined &&
            record.practicalZoneKey === params.practicalZoneKey &&
            params.timestamp - record.postedAt >= 0 &&
            params.timestamp - record.postedAt <= settings.intelligentAlertStructureBudgetWindowMs);
        const practicalAreaBudget = effectiveStructureBudget({
            practicalState: params.practicalStructureState,
            stableState: params.stableMarketStructureState,
            settings,
        });
        const structureExpanded = hasExpandedOutsidePriorRange(recentPracticalArea, params.triggerPrice, settings.intelligentAlertStructureExpansionPct);
        const structureTransition = hasMaterialStructureTransition({
            previousStates: recentPracticalArea.map((record) => record.practicalStructureState),
            nextState: params.practicalStructureState,
        }) || hasMaterialStableMarketStructureTransition({
            previousStates: recentPracticalArea.map((record) => record.stableMarketStructureState),
            nextState: params.stableMarketStructureState,
            materialChange: params.stableMarketStructureMaterialChange,
        }) || hasMaterialFormalStructureTransition({
            previousKeys: recentPracticalArea.map(recordFormalStructureKey),
            nextKey: formalStructureKey,
            eventType: formalStructureEventType,
            materialChange: actionableFormalStructureMaterialChange,
        });
        const latestPracticalArea = [...recentPracticalArea].sort((left, right) => right.postedAt - left.postedAt)[0];
        const materialMovePct = latestPracticalArea
            ? materialZoneReversalMovePctForPrice(Math.max(Math.abs(params.triggerPrice), Math.abs(latestPracticalArea.triggerPrice), 0.0001), settings) / 100
            : 0;
        const movedEnough = latestPracticalArea !== undefined &&
            Math.abs((params.triggerPrice - latestPracticalArea.triggerPrice) / Math.max(Math.abs(latestPracticalArea.triggerPrice), 0.0001)) >=
                materialMovePct;
        if (recentPracticalArea.length >= practicalAreaBudget &&
            !structureExpanded &&
            !structureTransition &&
            !movedEnough) {
            return { shouldPost: false, reason: "structure_budget", storyKey, zoneKey };
        }
    }
    return { shouldPost: true, reason: "new_story", storyKey, zoneKey };
}
export function buildIntelligentAlertStoryRecord(params) {
    return {
        storyKey: buildIntelligentAlertStoryKey(params),
        zoneKey: buildIntelligentAlertZoneKey(params),
        level: params.level,
        eventType: params.eventType,
        severity: params.severity,
        score: params.score,
        triggerPrice: params.triggerPrice,
        practicalStructureState: params.practicalStructureState,
        practicalZoneKey: params.practicalZoneKey,
        stableMarketStructureState: params.stableMarketStructureState,
        stableMarketStructureKey: params.stableMarketStructureKey,
        stableMarketStructureConfidence: params.stableMarketStructureConfidence,
        formalStructureEventType: params.formalStructureEventType,
        formalStructureKey: params.formalStructureKey,
        formalStructureMaterialChange: params.formalStructureMaterialChange,
        formalStructureTimeframe: params.formalStructureTimeframe,
        formalStructureConfidence: params.formalStructureConfidence,
        selectedFormalStructureEventType: params.selectedFormalStructureEventType,
        selectedFormalStructureKey: params.selectedFormalStructureKey,
        selectedFormalStructureMaterialChange: params.selectedFormalStructureMaterialChange,
        selectedFormalStructureTimeframe: params.selectedFormalStructureTimeframe,
        selectedFormalStructureConfidence: params.selectedFormalStructureConfidence,
        tradeStoryState: params.tradeStoryState,
        rangeBoxLabel: params.rangeBoxLabel,
        acceptanceLabel: params.acceptanceLabel,
        behaviorBudgetLabel: params.behaviorBudgetLabel,
        primaryTradeAreaLocked: params.primaryTradeAreaLocked,
        primaryTradeAreaEscapeSide: params.primaryTradeAreaEscapeSide,
        primaryTradeAreaEscapeConfidence: params.primaryTradeAreaEscapeConfidence,
        failedLevelOutcome: params.failedLevelOutcome,
        levelImportanceLabel: params.levelImportanceLabel,
        postedAt: params.timestamp,
    };
}
export function decideCriticalLivePost(params) {
    const settings = params.settings ?? getLiveThreadPostingPolicySettings();
    const recentCritical = params.criticalPosts.filter((entry) => params.timestamp - entry.timestamp >= 0 && params.timestamp - entry.timestamp <= settings.criticalBurstWindowMs);
    const extendedCritical = params.criticalPosts.filter((entry) => params.timestamp - entry.timestamp >= 0 &&
        params.timestamp - entry.timestamp <= settings.criticalExtendedBurstWindowMs);
    if (recentCritical.length >= settings.criticalBurstLimit || extendedCritical.length >= settings.criticalExtendedBurstLimit) {
        return { shouldPost: false, reason: "critical_burst" };
    }
    if (params.kind === "follow_through") {
        const recentTriggeringAlert = recentCritical.find((entry) => (entry.kind === "intelligent_alert" || entry.kind === "level_clear_update") &&
            (params.eventType === null ||
                params.eventType === undefined ||
                entry.eventType === null ||
                entry.eventType === params.eventType) &&
            params.timestamp - entry.timestamp <= 2 * 60 * 1000);
        if (recentTriggeringAlert) {
            return { shouldPost: false, reason: "critical_kind_burst" };
        }
    }
    if (params.majorChange) {
        return { shouldPost: true, reason: "allowed" };
    }
    const recentKind = recentCritical.filter((entry) => entry.kind === params.kind);
    if (params.kind === "follow_through" && recentKind.length >= settings.followThroughKindBurstLimit) {
        return { shouldPost: false, reason: "critical_kind_burst" };
    }
    return { shouldPost: true, reason: "allowed" };
}
export function buildFollowThroughStoryRecord(evaluation) {
    return {
        eventType: evaluation.eventType,
        label: evaluation.followThroughLabel,
        entryPrice: evaluation.entryPrice,
        postedAt: evaluation.evaluatedAt,
        directionalReturnPct: evaluation.directionalReturnPct,
        storyKey: buildFollowThroughStoryKey(evaluation),
    };
}
export function buildAiSignalStoryKey(params) {
    const levelPart = typeof params.level === "number" && Number.isFinite(params.level)
        ? formatPolicyLevel(params.level)
        : "unknown";
    const titlePart = (params.title ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .slice(0, 80);
    return `${params.symbol.toUpperCase()}|${params.eventType}|${levelPart}|${titlePart}`;
}
export function pruneAiSignalStoryRecords(records, timestamp, settings = getLiveThreadPostingPolicySettings()) {
    return records.filter((record) => timestamp - record.reservedAt <= settings.aiSignalStoryWindowMs);
}
export function decideAiSignalPost(params) {
    const settings = params.settings ?? getLiveThreadPostingPolicySettings();
    if (params.records.some((record) => record.storyKey === params.storyKey && params.timestamp - record.reservedAt <= settings.aiSignalStoryWindowMs)) {
        return {
            shouldPost: false,
            reason: "in_flight_or_recent_story",
            storyKey: params.storyKey,
        };
    }
    const recentSymbolAi = params.symbolAiRecords.some((record) => params.timestamp - record.reservedAt <= settings.aiSignalSymbolWindowMs);
    if (recentSymbolAi) {
        return {
            shouldPost: false,
            reason: "recent_symbol_ai",
            storyKey: params.storyKey,
        };
    }
    const highValue = params.severity === "critical" ||
        (params.severity === "high" && params.confidence === "high" && typeof params.score === "number" && params.score >= settings.aiHighConfidenceMinScore) ||
        (typeof params.score === "number" && params.score >= settings.aiAlwaysPostMinScore);
    if (!highValue) {
        return {
            shouldPost: false,
            reason: "low_value_repeat",
            storyKey: params.storyKey,
        };
    }
    return {
        shouldPost: true,
        reason: "new_story",
        storyKey: params.storyKey,
    };
}
function isReactiveEvent(eventType) {
    return eventType !== undefined && eventType !== null && ["level_touch", "compression"].includes(eventType);
}
function isFragileDirectionalEvent(eventType) {
    return (eventType !== undefined &&
        eventType !== null &&
        ["fake_breakout", "fake_breakdown", "rejection"].includes(eventType));
}
function isTrendDirectionalEvent(eventType) {
    return eventType !== undefined && eventType !== null && ["breakout", "breakdown", "reclaim"].includes(eventType);
}
export function decideNarrationBurst(params) {
    const state = params.state.filter((entry) => params.timestamp - entry.timestamp <= params.narrationBurstWindowMs);
    const recentKind = state.filter((entry) => entry.kind === params.kind);
    const burstLimit = isReactiveEvent(params.eventType) || isFragileDirectionalEvent(params.eventType) ? 2 : 3;
    if (state.length >= burstLimit) {
        return { shouldPost: false, reason: "burst_limit" };
    }
    if (params.kind === "recap" &&
        state.some((entry) => params.timestamp - entry.timestamp <= params.recapBurstWindowMs)) {
        return { shouldPost: false, reason: "recap_burst" };
    }
    if (params.kind !== "continuity" &&
        recentKind.length >= 1 &&
        recentKind.some((entry) => params.timestamp - entry.timestamp <= params.continuityCooldownMs)) {
        return { shouldPost: false, reason: "kind_cooldown" };
    }
    return { shouldPost: true, reason: "allowed" };
}
export function decideOptionalLivePost(params) {
    const settings = params.settings ?? getLiveThreadPostingPolicySettings();
    const recentCritical = params.criticalPosts.length;
    const recentOptional = params.optionalPosts.length;
    const recentKind = params.optionalPosts.filter((entry) => entry.kind === params.kind).length;
    const lastCriticalAt = params.criticalPosts.at(-1)?.timestamp ?? null;
    const recentCriticalAge = lastCriticalAt === null ? Number.POSITIVE_INFINITY : params.timestamp - lastCriticalAt;
    const optionalLead = recentOptional - recentCritical;
    const reactiveEvent = isReactiveEvent(params.eventType);
    const fragileDirectionalEvent = isFragileDirectionalEvent(params.eventType);
    const trendDirectionalEvent = isTrendDirectionalEvent(params.eventType);
    const recentSameEventOptional = params.optionalPosts.filter((entry) => entry.eventType !== null &&
        entry.eventType === (params.eventType ?? null) &&
        params.timestamp - entry.timestamp <= params.narrationBurstWindowMs);
    const recentSameEventContinuity = recentSameEventOptional.filter((entry) => entry.kind === "continuity").length;
    const recentSameEventFollowThroughState = recentSameEventOptional.filter((entry) => entry.kind === "follow_through_state").length;
    const recentSameEventOptionalAttempts = params.narrationAttempts.filter((entry) => entry.eventType !== null &&
        entry.eventType === (params.eventType ?? null) &&
        (entry.kind === "continuity" || entry.kind === "follow_through_state" || entry.kind === "recap"));
    const recentSameEventContinuityAttempts = recentSameEventOptionalAttempts.filter((entry) => entry.kind === "continuity").length;
    const recentSameEventFollowThroughStateAttempts = recentSameEventOptionalAttempts.filter((entry) => entry.kind === "follow_through_state").length;
    if (params.deliveryBackoffActive) {
        return { shouldPost: false, reason: "delivery_backoff" };
    }
    if (recentCritical >= 3 &&
        !params.majorChange &&
        (params.kind === "recap" || params.kind === "continuity" || params.kind === "follow_through_state")) {
        return { shouldPost: false, reason: "optional_density" };
    }
    if (params.kind === "continuity" && !params.majorChange && !settings.allowMinorContinuity) {
        return { shouldPost: false, reason: "minor_continuity" };
    }
    if ((reactiveEvent || fragileDirectionalEvent) &&
        (recentSameEventOptional.length >= 1 || recentSameEventOptionalAttempts.length >= 1)) {
        return { shouldPost: false, reason: "reactive_same_event_overlap" };
    }
    if (params.kind === "follow_through_state" && !params.majorChange) {
        if (params.progressLabel === "stalling") {
            return { shouldPost: false, reason: "stalling_follow_through_state" };
        }
        if (params.directionalReturnPct === null ||
            params.directionalReturnPct === undefined ||
            Math.abs(params.directionalReturnPct) < settings.minFollowThroughStateMovePct) {
            return { shouldPost: false, reason: "minor_follow_through_state" };
        }
    }
    if (params.kind === "follow_through_state" &&
        (recentSameEventContinuity >= 1 || recentSameEventContinuityAttempts >= 1)) {
        return { shouldPost: false, reason: "follow_through_state_after_continuity" };
    }
    if (params.kind === "continuity" &&
        (recentSameEventFollowThroughState >= 1 || recentSameEventFollowThroughStateAttempts >= 1)) {
        return { shouldPost: false, reason: "continuity_after_follow_through_state" };
    }
    if (recentOptional >= params.optionalDensityLimit && recentCriticalAge > params.continuityCooldownMs) {
        return { shouldPost: false, reason: "optional_density" };
    }
    if (recentKind >= params.optionalKindLimit && recentCriticalAge > params.continuityCooldownMs) {
        return { shouldPost: false, reason: "optional_kind_density" };
    }
    if (optionalLead >= 2 && recentCriticalAge > params.continuityCooldownMs) {
        return { shouldPost: false, reason: "optional_lead" };
    }
    if ((reactiveEvent || fragileDirectionalEvent) && params.kind === "recap") {
        return { shouldPost: false, reason: "reactive_recap" };
    }
    if ((reactiveEvent || fragileDirectionalEvent) && params.kind === "continuity" && recentKind >= 1) {
        return { shouldPost: false, reason: "reactive_kind_repeat" };
    }
    if ((reactiveEvent || fragileDirectionalEvent) && params.kind === "follow_through_state" && recentKind >= 1) {
        return { shouldPost: false, reason: "reactive_kind_repeat" };
    }
    if (fragileDirectionalEvent && recentOptional >= 2 && recentCriticalAge > params.continuityCooldownMs) {
        return { shouldPost: false, reason: "fragile_optional_density" };
    }
    if (params.kind === "recap" &&
        recentOptional >= 2 &&
        recentCriticalAge > params.continuityMajorTransitionCooldownMs) {
        return { shouldPost: false, reason: "recap_density" };
    }
    if (params.kind === "recap" &&
        recentKind >= 1 &&
        optionalLead >= 1 &&
        recentCriticalAge > params.continuityCooldownMs) {
        return { shouldPost: false, reason: "recap_kind_density" };
    }
    if (params.kind === "continuity" &&
        recentKind >= 2 &&
        optionalLead >= 1 &&
        recentCriticalAge > params.continuityCooldownMs) {
        return { shouldPost: false, reason: "continuity_kind_density" };
    }
    if (params.kind === "continuity" &&
        !trendDirectionalEvent &&
        recentOptional >= 2 &&
        recentCriticalAge > params.continuityCooldownMs) {
        return { shouldPost: false, reason: "non_directional_continuity_density" };
    }
    if (params.kind === "follow_through_state" &&
        recentKind >= 1 &&
        optionalLead >= 1 &&
        recentCriticalAge > params.continuityCooldownMs) {
        return { shouldPost: false, reason: "follow_through_state_kind_density" };
    }
    if (params.kind === "follow_through_state" && !trendDirectionalEvent && recentOptional >= 2) {
        return { shouldPost: false, reason: "non_directional_follow_through_state_density" };
    }
    return { shouldPost: true, reason: "allowed" };
}
