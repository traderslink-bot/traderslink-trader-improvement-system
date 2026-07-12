// 2026-04-16 02:03 PM America/Toronto
// Phase 3 alert intelligence engine that enriches, scores, filters, formats, and applies delivery policy.
import { DEFAULT_MONITORING_CONFIG } from "../monitoring/monitoring-config.js";
import { deriveBarrierClearanceLabel } from "../monitoring/monitoring-event-scoring.js";
import { DEFAULT_ALERT_INTELLIGENCE_CONFIG } from "./alert-config.js";
import { shouldSuppressAlert } from "./alert-filter.js";
import { formatIntelligentAlert } from "./alert-formatter.js";
import { appendPostedAlertHistory, evaluateAlertPostingPolicy, prunePostedAlertHistory, } from "./posting-policy.js";
import { scoreMonitoringEventToAlert } from "./alert-scorer.js";
const STORY_PLANNING_MIN_DISTANCE_PCT = 0.30;
const STORY_PLANNING_ACTIVE_RUNNER_DISTANCE_PCT = 0.25;
const STORY_PLANNING_EXTREME_RUNNER_DISTANCE_PCT = 0.20;
const STORY_PLANNING_MAX_DISTANCE_PCT = 0.55;
const STORY_PLANNING_MIN_STEP_PCT = 0.03;
const STORY_PLANNING_MAX_LEVELS = 5;
const STORY_PLANNING_HARD_MAX_LEVELS = 6;
function decimalPlacesForIncrement(increment) {
    const text = increment.toString();
    const dotIndex = text.indexOf(".");
    return dotIndex === -1 ? 0 : text.length - dotIndex - 1;
}
function normalizePlanningExtensionPrice(price, increment) {
    return Number(price.toFixed(Math.max(decimalPlacesForIncrement(increment), price >= 1 ? 2 : 4)));
}
function resistancePlanningIncrement(price) {
    if (price < 0.5)
        return 0.025;
    if (price < 1)
        return 0.05;
    if (price < 2)
        return 0.1;
    if (price < 5)
        return 0.25;
    if (price < 10)
        return 0.5;
    if (price < 25)
        return 1;
    if (price < 50)
        return 2.5;
    return 5;
}
function nextRoundedResistancePlanningLevel(basePrice) {
    const increment = resistancePlanningIncrement(basePrice);
    const rounded = Math.ceil((basePrice + increment * 0.05) / increment) * increment;
    return normalizePlanningExtensionPrice(rounded, increment);
}
function allZones(output) {
    return [
        ...output.majorSupport,
        ...output.majorResistance,
        ...output.intermediateSupport,
        ...output.intermediateResistance,
        ...output.intradaySupport,
        ...output.intradayResistance,
        ...output.extensionLevels.support,
        ...output.extensionLevels.resistance,
    ];
}
export class AlertIntelligenceEngine {
    config;
    postedAlertHistory = [];
    constructor(config = DEFAULT_ALERT_INTELLIGENCE_CONFIG) {
        this.config = config;
    }
    findZoneForEvent(event, levels) {
        if (!levels) {
            return undefined;
        }
        const canonicalZoneId = event.eventContext.canonicalZoneId;
        return allZones(levels).find((zone) => zone.id === canonicalZoneId || zone.id === event.zoneId);
    }
    resolveNextBarrierSide(event) {
        if (event.eventType === "breakout" ||
            event.eventType === "reclaim" ||
            event.eventType === "fake_breakdown") {
            return "resistance";
        }
        if (event.eventType === "breakdown" ||
            event.eventType === "fake_breakout") {
            return "support";
        }
        if (event.eventType === "level_touch" || event.eventType === "rejection") {
            return event.zoneKind === "support" ? "resistance" : "support";
        }
        if (event.eventType === "compression") {
            return event.zoneKind === "support" ? "resistance" : "support";
        }
        return event.bias === "bearish" ? "support" : "resistance";
    }
    buildPlanningLevels(params) {
        const triggerPrice = params.event.triggerPrice;
        if (!Number.isFinite(triggerPrice) || triggerPrice <= 0) {
            return undefined;
        }
        const candidates = params.levels
            ? allZones(params.levels)
                .filter((zone) => zone.kind === params.side)
                .filter((zone) => params.side === "resistance"
                ? zone.representativePrice > triggerPrice
                : zone.representativePrice < triggerPrice)
                .map((zone) => ({
                price: zone.representativePrice,
                strengthLabel: zone.strengthLabel,
            }))
            : [];
        if (params.seedBarrier) {
            const seedCandidate = {
                price: params.seedBarrier.price,
            };
            if (params.seedBarrier.strengthLabel) {
                seedCandidate.strengthLabel = params.seedBarrier.strengthLabel;
            }
            candidates.push(seedCandidate);
        }
        const sorted = candidates
            .map((candidate) => ({
            ...candidate,
            distancePct: Math.abs(candidate.price - triggerPrice) / Math.max(triggerPrice, 0.0001),
        }))
            .filter((candidate) => candidate.distancePct <= STORY_PLANNING_MAX_DISTANCE_PCT)
            .sort((left, right) => params.side === "resistance"
            ? left.price - right.price
            : right.price - left.price);
        const selected = [];
        const seenPrices = new Set();
        const targetDistancePct = this.resolvePlanningTargetDistancePct(params.event);
        for (const candidate of sorted) {
            const key = candidate.price >= 1 ? candidate.price.toFixed(2) : candidate.price.toFixed(4);
            if (seenPrices.has(key)) {
                continue;
            }
            const previous = selected.at(-1);
            if (previous &&
                Math.abs(candidate.price - previous.price) / Math.max(previous.price, 0.0001) < STORY_PLANNING_MIN_STEP_PCT) {
                continue;
            }
            selected.push(candidate);
            seenPrices.add(key);
            const reachedPlanningDistance = candidate.distancePct >= targetDistancePct;
            const hitSoftCap = selected.length >= STORY_PLANNING_MAX_LEVELS;
            const hitHardCap = selected.length >= STORY_PLANNING_HARD_MAX_LEVELS;
            const shouldStopForSoftCap = hitSoftCap &&
                (reachedPlanningDistance || targetDistancePct < STORY_PLANNING_MIN_DISTANCE_PCT);
            if (hitHardCap || shouldStopForSoftCap || (selected.length >= 2 && reachedPlanningDistance)) {
                break;
            }
        }
        this.appendSyntheticResistancePlanningLevels({
            selected,
            side: params.side,
            triggerPrice,
            targetDistancePct,
        });
        return selected.length >= 2 ? selected : undefined;
    }
    appendSyntheticResistancePlanningLevels(params) {
        if (params.side !== "resistance" || params.selected.length >= STORY_PLANNING_HARD_MAX_LEVELS) {
            return;
        }
        if (params.triggerPrice >= 30) {
            return;
        }
        const currentReach = params.selected.reduce((reach, level) => Math.max(reach, level.distancePct), 0);
        if (currentReach >= params.targetDistancePct) {
            return;
        }
        let boundary = Math.max(params.triggerPrice, ...params.selected.map((level) => level.price));
        const maxPrice = params.triggerPrice * (1 + STORY_PLANNING_MAX_DISTANCE_PCT);
        const seenPrices = new Set(params.selected.map((level) => level.price >= 1 ? level.price.toFixed(2) : level.price.toFixed(4)));
        while (params.selected.length < STORY_PLANNING_HARD_MAX_LEVELS &&
            boundary < params.triggerPrice * (1 + params.targetDistancePct)) {
            let nextPrice = nextRoundedResistancePlanningLevel(boundary);
            while (nextPrice <= boundary * (1 + STORY_PLANNING_MIN_STEP_PCT) &&
                nextPrice < maxPrice) {
                nextPrice = nextRoundedResistancePlanningLevel(nextPrice);
            }
            if (nextPrice <= boundary || nextPrice > maxPrice) {
                break;
            }
            const key = nextPrice >= 1 ? nextPrice.toFixed(2) : nextPrice.toFixed(4);
            boundary = nextPrice;
            if (seenPrices.has(key)) {
                continue;
            }
            params.selected.push({
                price: nextPrice,
                distancePct: (nextPrice - params.triggerPrice) / Math.max(params.triggerPrice, 0.0001),
                strengthLabel: "weak",
            });
            seenPrices.add(key);
        }
    }
    resolvePlanningTargetDistancePct(event) {
        const label = event.eventContext.behaviorBudget?.label;
        if (label === "extreme_runner") {
            return STORY_PLANNING_EXTREME_RUNNER_DISTANCE_PCT;
        }
        if (label === "active_runner") {
            return STORY_PLANNING_ACTIVE_RUNNER_DISTANCE_PCT;
        }
        return STORY_PLANNING_MIN_DISTANCE_PCT;
    }
    findNextBarrier(event, levels) {
        if (event.eventContext.nextBarrierKind &&
            typeof event.eventContext.nextBarrierLevel === "number" &&
            typeof event.eventContext.nextBarrierDistancePct === "number") {
            const seedBarrier = {
                side: event.eventContext.nextBarrierKind,
                price: event.eventContext.nextBarrierLevel,
                distancePct: event.eventContext.nextBarrierDistancePct,
                strengthLabel: event.eventContext.nextBarrierStrengthLabel,
            };
            return {
                ...seedBarrier,
                planningLevels: this.buildPlanningLevels({
                    event,
                    levels,
                    side: seedBarrier.side,
                    seedBarrier,
                }),
                roleFlipFromSide: event.eventContext.nextBarrierRoleFlipFromKind,
                clearanceLabel: event.eventContext.clearanceLabel,
                clutterLabel: event.eventContext.barrierClutterLabel,
                nearbyBarrierCount: event.eventContext.nearbyBarrierCount,
                pathQualityLabel: event.eventContext.pathQualityLabel,
                pathBarrierCount: event.eventContext.pathBarrierCount,
                pathConstraintScore: event.eventContext.pathConstraintScore,
                pathWindowDistancePct: event.eventContext.pathWindowDistancePct,
            };
        }
        if (!levels || event.triggerPrice <= 0) {
            return null;
        }
        return this.findBarrierForSide(event, levels, this.resolveNextBarrierSide(event));
    }
    findContinuationBarrier(event, levels) {
        if (!levels || event.triggerPrice <= 0) {
            return null;
        }
        if (event.eventType === "level_touch" && event.zoneKind === "resistance") {
            return this.findBarrierForSide(event, levels, "resistance");
        }
        return null;
    }
    findBarrierForSide(event, levels, barrierSide) {
        const candidates = allZones(levels)
            .filter((zone) => zone.kind === barrierSide)
            .filter((zone) => barrierSide === "resistance"
            ? zone.representativePrice > event.triggerPrice
            : zone.representativePrice < event.triggerPrice)
            .sort((left, right) => barrierSide === "resistance"
            ? left.representativePrice - right.representativePrice
            : right.representativePrice - left.representativePrice);
        const nextBarrier = candidates[0];
        if (!nextBarrier) {
            if (barrierSide === "resistance") {
                const planningLevels = this.buildPlanningLevels({
                    event,
                    levels,
                    side: barrierSide,
                });
                const syntheticNext = planningLevels?.[0];
                if (syntheticNext) {
                    return {
                        side: barrierSide,
                        price: syntheticNext.price,
                        strengthLabel: "weak",
                        planningLevels,
                        distancePct: syntheticNext.distancePct,
                        clearanceLabel: deriveBarrierClearanceLabel(syntheticNext.distancePct, DEFAULT_MONITORING_CONFIG),
                        clutterLabel: "clear",
                        nearbyBarrierCount: 0,
                        pathQualityLabel: "clean",
                        pathBarrierCount: 0,
                        pathConstraintScore: 0.2,
                        pathWindowDistancePct: syntheticNext.distancePct,
                    };
                }
            }
            return null;
        }
        const clusteredDistancePct = Math.max(DEFAULT_MONITORING_CONFIG.limitedClearancePct * 2, 0.06);
        const nearbyBarrierCount = candidates.filter((candidate) => Math.abs(candidate.representativePrice - event.triggerPrice) / Math.max(event.triggerPrice, 0.0001) <= clusteredDistancePct).length;
        const pathWindowDistancePct = candidates
            .slice(0, Math.min(nearbyBarrierCount, 4))
            .at(-1)
            ? Math.abs(candidates.slice(0, Math.min(nearbyBarrierCount, 4)).at(-1).representativePrice - event.triggerPrice) /
                Math.max(event.triggerPrice, 0.0001)
            : undefined;
        const clutterLabel = nearbyBarrierCount >= 3
            ? "dense"
            : nearbyBarrierCount >= 2
                ? "stacked"
                : "clear";
        return {
            side: barrierSide,
            price: nextBarrier.representativePrice,
            strengthLabel: nextBarrier.strengthLabel,
            planningLevels: this.buildPlanningLevels({
                event,
                levels,
                side: barrierSide,
                seedBarrier: {
                    side: barrierSide,
                    price: nextBarrier.representativePrice,
                    strengthLabel: nextBarrier.strengthLabel,
                    distancePct: Math.abs(nextBarrier.representativePrice - event.triggerPrice) /
                        Math.max(event.triggerPrice, 0.0001),
                },
            }),
            distancePct: Math.abs(nextBarrier.representativePrice - event.triggerPrice) /
                Math.max(event.triggerPrice, 0.0001),
            clearanceLabel: deriveBarrierClearanceLabel(Math.abs(nextBarrier.representativePrice - event.triggerPrice) /
                Math.max(event.triggerPrice, 0.0001), DEFAULT_MONITORING_CONFIG),
            clutterLabel,
            nearbyBarrierCount,
            pathQualityLabel: nearbyBarrierCount >= 3
                ? "choppy"
                : nearbyBarrierCount >= 2
                    ? "layered"
                    : "clean",
            pathBarrierCount: nearbyBarrierCount,
            pathConstraintScore: nearbyBarrierCount >= 3
                ? 0.8
                : nearbyBarrierCount >= 2
                    ? 0.5
                    : 0.2,
            pathWindowDistancePct,
        };
    }
    processEvent(event, levels) {
        const zone = this.findZoneForEvent(event, levels);
        const nextBarrier = this.findNextBarrier(event, levels);
        const continuationBarrier = this.findContinuationBarrier(event, levels);
        const rawAlert = scoreMonitoringEventToAlert({
            event,
            zone,
            nextBarrier,
            config: this.config,
        });
        rawAlert.continuationBarrier = continuationBarrier;
        this.postedAlertHistory = prunePostedAlertHistory(this.postedAlertHistory, event.timestamp, this.config);
        if (shouldSuppressAlert(rawAlert)) {
            return {
                rawAlert,
                formatted: null,
                delivery: {
                    shouldPost: false,
                    reason: "filtered",
                },
            };
        }
        const delivery = evaluateAlertPostingPolicy({
            alert: rawAlert,
            history: this.postedAlertHistory,
            config: this.config,
        });
        if (!delivery.shouldPost) {
            return {
                rawAlert,
                formatted: null,
                delivery,
            };
        }
        this.postedAlertHistory = appendPostedAlertHistory({
            alert: rawAlert,
            history: this.postedAlertHistory,
            config: this.config,
        });
        return {
            rawAlert,
            formatted: formatIntelligentAlert(rawAlert),
            delivery,
        };
    }
}
