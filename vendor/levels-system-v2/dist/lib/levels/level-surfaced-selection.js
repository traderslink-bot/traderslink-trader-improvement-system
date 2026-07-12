// 2026-04-18 12:18 AM America/Toronto
// Select trader-facing actionable levels from the richer structural ranking output without throwing away structural truth.
import { explainSurfacedSelection, explainSuppressedSurfacedLevel, } from "./level-surfaced-selection-explainer.js";
import { LEVEL_SURFACED_SELECTION_CONFIG } from "./level-surfaced-selection-config.js";
import { clamp, isPriceInsideZone, priceDistancePct } from "./level-zone-utils.js";
function maxSurfacedCount(side, config) {
    return side === "support" ? config.maximumSurfacedSupportCount : config.maximumSurfacedResistanceCount;
}
function preferredBands(side, config) {
    return config.sideRules[side].preferredDistanceBandsPct;
}
function practicalInteractionBandPct(side, config) {
    return config.sideRules[side].practicalInteractionBandPct;
}
function distanceBand(distanceToPricePct, side, config) {
    const bands = preferredBands(side, config);
    if (distanceToPricePct <= bands.immediate) {
        return "immediate";
    }
    if (distanceToPricePct <= bands.near) {
        return "near";
    }
    if (distanceToPricePct <= bands.local) {
        return "local";
    }
    if (distanceToPricePct <= bands.extended) {
        return "extended";
    }
    return "distant";
}
function proximityScoreForBand(band, distanceToPricePct, side, config) {
    const maxActionableDistancePct = config.sideRules[side].maxActionableDistancePct;
    if (distanceToPricePct > maxActionableDistancePct) {
        return 0;
    }
    switch (band) {
        case "immediate":
            return 100;
        case "near":
            return 84;
        case "local":
            return 66;
        case "extended":
            return 38;
        case "distant":
        default:
            return 16;
    }
}
function actionableStateScore(levelState, config) {
    return clamp(50 + config.stateAdjustments[levelState] * 4, 0, 100);
}
function structuralQualityScore(level, config) {
    return clamp(level.structuralStrengthScore + level.confidence * config.confidenceBonusScale, 0, 100);
}
function baseLadderUsefulnessScore(level, band, isInsideZone, config) {
    let raw = 0;
    const maxRaw = config.ladderUsefulness.nearPriceActionableBonus +
        config.ladderUsefulness.currentInteractionBonus +
        config.ladderUsefulness.freshReactionBonus;
    if (band === "immediate" || band === "near" || band === "local") {
        raw += config.ladderUsefulness.nearPriceActionableBonus;
    }
    if (isInsideZone || level.scoreBreakdown.currentInteractionScore >= 5) {
        raw += config.ladderUsefulness.currentInteractionBonus;
    }
    if (level.barsSinceLastReaction <= 8 || level.scoreBreakdown.freshReactionScore >= 14) {
        raw += config.ladderUsefulness.freshReactionBonus;
    }
    return clamp((raw / Math.max(maxRaw, 1)) * 100, 0, 100);
}
function isStaleContextLevel(level, config) {
    return (level.barsSinceLastReaction > config.staleContext.barsSinceLastReaction &&
        level.scoreBreakdown.freshReactionScore < config.staleContext.freshReactionScore);
}
function isOnActionableSide(level, currentPrice, side) {
    if (isPriceInsideZone(currentPrice, level.zoneLow, level.zoneHigh)) {
        return true;
    }
    return side === "support" ? level.price <= currentPrice : level.price >= currentPrice;
}
function prepareCandidate(level, context, side, config) {
    const distanceToPricePct = priceDistancePct(level.price, context.currentPrice);
    const proximityBand = distanceBand(distanceToPricePct, side, config);
    const isInsideZone = isPriceInsideZone(context.currentPrice, level.zoneLow, level.zoneHigh);
    const isPracticalInteractionCandidate = isInsideZone || distanceToPricePct <= practicalInteractionBandPct(side, config);
    const isStaleContext = isStaleContextLevel(level, config);
    const hasStrongStaleConfirmation = level.structuralStrengthScore >= config.staleContext.strongConfirmationStructuralScore &&
        level.confidence >= config.staleContext.strongConfirmationConfidence &&
        distanceToPricePct <= config.staleContext.maxStrongConfirmationDistancePct;
    const credibleNearBase = level.structuralStrengthScore >= config.nearPriceSelection.minimumStructuralScore &&
        level.confidence >= config.nearPriceSelection.minimumConfidence;
    const weakenedOverride = level.state === "weakened" &&
        level.structuralStrengthScore >= config.nearPriceSelection.weakenedStructuralOverride &&
        level.confidence >= config.nearPriceSelection.weakenedConfidenceOverride;
    const isCredibleNearActionable = isPracticalInteractionCandidate &&
        level.state !== "broken" &&
        (!isStaleContext || hasStrongStaleConfirmation || isInsideZone) &&
        (credibleNearBase || weakenedOverride) &&
        (level.state !== "weakened" || weakenedOverride);
    return {
        level,
        distanceToPricePct,
        proximityBand,
        proximityScore: proximityScoreForBand(proximityBand, distanceToPricePct, side, config),
        actionableStateScore: actionableStateScore(level.state, config),
        structuralQualityScore: structuralQualityScore(level, config),
        baseLadderScore: baseLadderUsefulnessScore(level, proximityBand, isInsideZone, config),
        isInsideZone,
        isPracticalInteractionCandidate,
        isCredibleNearActionable,
        isStaleContext,
        hasStrongStaleConfirmation,
    };
}
function spacingToSelectedPct(candidate, selected) {
    if (selected.length === 0) {
        return null;
    }
    return Math.min(...selected.map((level) => priceDistancePct(level.price, candidate.level.price)));
}
function buildSelectionScore(candidate, selected, config, selectionCategory) {
    let ladderRaw = candidate.baseLadderScore;
    let anchorAdjustment = 0;
    let redundancyPenalty = 0;
    const notes = [];
    const spacingPct = spacingToSelectedPct(candidate, selected);
    if (selectionCategory === "actionable" && candidate.isCredibleNearActionable) {
        ladderRaw = clamp(ladderRaw + config.nearPriceSelection.practicalInteractionBonus, 0, 100);
        notes.push("credible practical interaction candidate");
    }
    if (selectionCategory === "actionable" &&
        candidate.isPracticalInteractionCandidate &&
        !candidate.isCredibleNearActionable) {
        redundancyPenalty += config.nearPriceSelection.weakNearClutterPenalty;
        notes.push("near-price clutter penalty");
    }
    if (selectionCategory === "actionable" &&
        candidate.isStaleContext &&
        !candidate.hasStrongStaleConfirmation &&
        !candidate.isInsideZone) {
        redundancyPenalty += config.staleContext.actionablePenalty;
        notes.push("older context penalty");
    }
    if (selected.length === 0 && selectionCategory === "actionable") {
        ladderRaw = clamp(ladderRaw +
            (config.ladderUsefulness.firstLevelBonus / config.ladderUsefulness.firstLevelBonus) *
                100 +
            (candidate.isCredibleNearActionable
                ? config.nearPriceSelection.firstActionablePriorityBonus
                : 0), 0, 100);
        notes.push("first actionable level");
    }
    else if (spacingPct !== null && spacingPct >= config.ladderSpacingRules.preferredSpacingPct) {
        ladderRaw = clamp(ladderRaw + (config.ladderUsefulness.spacingBonus / config.ladderUsefulness.spacingBonus) * 100, 0, 100);
        notes.push("adds useful ladder spacing");
    }
    else if (spacingPct !== null && spacingPct < config.ladderSpacingRules.minSpacingPct) {
        redundancyPenalty = 18;
        notes.push("crowded with an already surfaced level");
    }
    if (selectionCategory === "anchor") {
        anchorAdjustment = config.ladderUsefulness.anchorContextBonus;
        notes.push("deeper structural context");
    }
    const structuralQualityComponent = candidate.structuralQualityScore * config.weights.structuralQuality;
    const proximityComponent = candidate.proximityScore * config.weights.proximity;
    const actionableStateComponent = candidate.actionableStateScore * config.weights.actionableState;
    const ladderUsefulnessComponent = ladderRaw * config.weights.ladderUsefulness;
    const surfacedSelectionScore = clamp(structuralQualityComponent +
        proximityComponent +
        actionableStateComponent +
        ladderUsefulnessComponent +
        anchorAdjustment -
        redundancyPenalty, 0, 100);
    return {
        selectionScore: surfacedSelectionScore,
        breakdown: {
            structuralQualityComponent,
            proximityComponent,
            actionableStateComponent,
            ladderUsefulnessComponent,
            anchorAdjustment,
            redundancyPenalty,
            surfacedSelectionScore,
            distanceToPricePct: candidate.distanceToPricePct,
            proximityBand: candidate.proximityBand,
        },
        notes,
    };
}
function selectedLevelDominates(incumbent, challenger, challengerScoring, config) {
    const priceBandDistancePct = priceDistancePct(incumbent.price, challenger.level.price);
    const sameBand = priceBandDistancePct <= config.sameBandSuppressionDistancePct ||
        (incumbent.surfacedSelectionBreakdown.distanceToPricePct <= config.sideRules[challenger.level.type].practicalInteractionBandPct &&
            challenger.isPracticalInteractionCandidate &&
            priceBandDistancePct <= config.bandOwnershipDistancePct) ||
        (incumbent.surfacedSelectionBreakdown.proximityBand === challenger.proximityBand &&
            priceBandDistancePct <= config.bandOwnershipDistancePct);
    if (!sameBand) {
        return false;
    }
    const challengerStructuralLead = challenger.level.structuralStrengthScore - incumbent.structuralStrengthScore;
    const challengerDistanceLead = incumbent.surfacedSelectionBreakdown.distanceToPricePct - challenger.distanceToPricePct;
    if (challengerStructuralLead >= config.strongerNearbyOverrideStructuralBuffer &&
        challengerDistanceLead <= config.ladderSpacingRules.preferredSpacingPct) {
        return false;
    }
    if (incumbent.surfacedSelectionBreakdown.proximityBand === challenger.proximityBand &&
        incumbent.surfacedSelectionScore >= challengerScoring.selectionScore - 3) {
        return true;
    }
    if (incumbent.surfacedSelectionBreakdown.distanceToPricePct <=
        config.sideRules[challenger.level.type].practicalInteractionBandPct &&
        !challenger.isCredibleNearActionable) {
        return true;
    }
    return (incumbent.surfacedSelectionScore >= challengerScoring.selectionScore - 5 ||
        incumbent.structuralStrengthScore >= challenger.level.structuralStrengthScore - 4 ||
        incumbent.confidence >= challenger.level.confidence);
}
function prefersAnchorRole(candidate, config) {
    return (!candidate.isPracticalInteractionCandidate &&
        candidate.distanceToPricePct >= config.deeperAnchorMinDistancePct &&
        candidate.level.structuralStrengthScore >= config.deeperAnchorMinStructuralScore);
}
function finalizeSelection(candidate, scoring, selectionCategory, redundantNearby) {
    return {
        ...candidate.level,
        selectionCategory,
        surfacedSelectionScore: scoring.selectionScore,
        surfacedSelectionBreakdown: scoring.breakdown,
        surfacedSelectionExplanation: explainSurfacedSelection({
            level: candidate.level,
            side: candidate.level.type,
            distanceToPricePct: candidate.distanceToPricePct,
            proximityBand: candidate.proximityBand,
            selectionCategory,
            redundantNearby,
        }),
        surfacedSelectionNotes: scoring.notes,
    };
}
function sortTraderFacing(levels, side, currentPrice) {
    return [...levels].sort((left, right) => {
        const leftDistance = Math.abs(left.price - currentPrice);
        const rightDistance = Math.abs(right.price - currentPrice);
        if (leftDistance !== rightDistance) {
            return leftDistance - rightDistance;
        }
        if (side === "support") {
            return right.price - left.price;
        }
        return left.price - right.price;
    });
}
function buildSuppressedLevel(level, side, reason, suppressedByLevel) {
    return {
        side,
        level,
        suppressedByLevelId: suppressedByLevel?.id,
        reason,
        explanation: explainSuppressedSurfacedLevel({
            level,
            side,
            reason,
            suppressedByLevel,
        }),
    };
}
function selectSurfacedSide(levels, context, side, config) {
    const actionableCandidates = [];
    const anchorCandidates = [];
    const suppressed = [];
    const notes = [];
    for (const level of levels) {
        if (!isOnActionableSide(level, context.currentPrice, side)) {
            suppressed.push(buildSuppressedLevel(level, side, "wrong_side_of_price"));
            continue;
        }
        if (level.state === "broken") {
            suppressed.push(buildSuppressedLevel(level, side, "broken_state"));
            continue;
        }
        if (level.structuralStrengthScore < config.minimumStructuralScore) {
            suppressed.push(buildSuppressedLevel(level, side, "below_minimum_structural_quality"));
            continue;
        }
        if (level.confidence < config.minimumConfidence) {
            suppressed.push(buildSuppressedLevel(level, side, "below_minimum_confidence"));
            continue;
        }
        const prepared = prepareCandidate(level, context, side, config);
        if (prepared.distanceToPricePct <= config.sideRules[side].maxActionableDistancePct) {
            actionableCandidates.push(prepared);
        }
        else {
            suppressed.push(buildSuppressedLevel(level, side, "outside_actionable_range"));
        }
        if (config.includeOneDeeperAnchor &&
            prepared.distanceToPricePct >= config.deeperAnchorMinDistancePct &&
            level.structuralStrengthScore >= config.deeperAnchorMinStructuralScore) {
            anchorCandidates.push(prepared);
        }
    }
    const selected = [];
    const remaining = [...actionableCandidates];
    while (remaining.length > 0 && selected.length < maxSurfacedCount(side, config)) {
        const rankingPool = selected.length === 0
            ? remaining.filter((candidate) => candidate.isCredibleNearActionable)
            : [];
        const weakNearPool = selected.length === 0 && rankingPool.length === 0
            ? remaining.filter((candidate) => candidate.isPracticalInteractionCandidate)
            : [];
        const strongestWeakNear = weakNearPool.length > 0
            ? Math.max(...weakNearPool.map((candidate) => candidate.level.structuralStrengthScore))
            : null;
        const structuralEscapePool = selected.length === 0 &&
            rankingPool.length === 0 &&
            strongestWeakNear !== null
            ? remaining.filter((candidate) => !candidate.isPracticalInteractionCandidate &&
                candidate.level.structuralStrengthScore >=
                    strongestWeakNear + config.strongerFarLevelStructuralBuffer)
            : [];
        const candidatePool = rankingPool.length > 0
            ? rankingPool
            : structuralEscapePool.length > 0
                ? structuralEscapePool
                : remaining;
        const rankedCandidates = candidatePool
            .map((candidate) => {
            const scoring = buildSelectionScore(candidate, selected, config, "actionable");
            return { candidate, scoring };
        })
            .sort((left, right) => {
            if (right.scoring.selectionScore !== left.scoring.selectionScore) {
                return right.scoring.selectionScore - left.scoring.selectionScore;
            }
            if (left.candidate.distanceToPricePct !== right.candidate.distanceToPricePct) {
                return left.candidate.distanceToPricePct - right.candidate.distanceToPricePct;
            }
            if (right.candidate.level.structuralStrengthScore !== left.candidate.level.structuralStrengthScore) {
                return right.candidate.level.structuralStrengthScore - left.candidate.level.structuralStrengthScore;
            }
            if (right.candidate.level.confidence !== left.candidate.level.confidence) {
                return right.candidate.level.confidence - left.candidate.level.confidence;
            }
            return left.candidate.level.rank - right.candidate.level.rank;
        });
        const next = rankedCandidates[0];
        if (!next) {
            break;
        }
        const redundantNearby = selected.some((incumbent) => priceDistancePct(incumbent.price, next.candidate.level.price) <= config.sameBandSuppressionDistancePct);
        const finalized = finalizeSelection(next.candidate, next.scoring, "actionable", redundantNearby);
        selected.push(finalized);
        const survivors = [];
        for (const candidate of remaining) {
            if (candidate.level.id === next.candidate.level.id) {
                continue;
            }
            if (next.candidate.isCredibleNearActionable &&
                selected.length === 1 &&
                prefersAnchorRole(candidate, config)) {
                suppressed.push(buildSuppressedLevel(candidate.level, side, "anchor_not_needed"));
                continue;
            }
            const challengerScoring = buildSelectionScore(candidate, selected, config, "actionable");
            if (selectedLevelDominates(finalized, candidate, challengerScoring, config)) {
                suppressed.push(buildSuppressedLevel(candidate.level, side, "nearby_stronger_level", finalized));
                continue;
            }
            survivors.push(candidate);
        }
        remaining.splice(0, remaining.length, ...survivors);
    }
    const surfaced = sortTraderFacing(selected, side, context.currentPrice);
    let anchor;
    if (config.includeOneDeeperAnchor && anchorCandidates.length > 0) {
        const availableAnchors = anchorCandidates.filter((candidate) => !surfaced.some((existing) => existing.id === candidate.level.id ||
            priceDistancePct(existing.price, candidate.level.price) <= config.bandOwnershipDistancePct));
        const rankedAnchors = availableAnchors
            .map((candidate) => {
            const scoring = buildSelectionScore(candidate, surfaced, config, "anchor");
            return { candidate, scoring };
        })
            .sort((left, right) => {
            if (right.scoring.selectionScore !== left.scoring.selectionScore) {
                return right.scoring.selectionScore - left.scoring.selectionScore;
            }
            if (right.candidate.level.structuralStrengthScore !== left.candidate.level.structuralStrengthScore) {
                return right.candidate.level.structuralStrengthScore - left.candidate.level.structuralStrengthScore;
            }
            return left.candidate.level.rank - right.candidate.level.rank;
        });
        const nextAnchor = rankedAnchors[0];
        if (nextAnchor) {
            anchor = finalizeSelection(nextAnchor.candidate, nextAnchor.scoring, "anchor", false);
            notes.push(`Added deeper ${side} anchor at ${anchor.price.toFixed(anchor.price >= 1 ? 2 : 4)} for ladder context.`);
            for (const candidate of availableAnchors.slice(1)) {
                suppressed.push(buildSuppressedLevel(candidate.level, side, "anchor_not_needed", anchor));
            }
        }
    }
    return {
        surfaced,
        anchor,
        suppressed,
        notes,
    };
}
export function selectSurfacedSupports(output, config = LEVEL_SURFACED_SELECTION_CONFIG) {
    return selectSurfacedSide(output.supports, { symbol: output.symbol, currentPrice: output.currentPrice }, "support", config);
}
export function selectSurfacedResistances(output, config = LEVEL_SURFACED_SELECTION_CONFIG) {
    return selectSurfacedSide(output.resistances, { symbol: output.symbol, currentPrice: output.currentPrice }, "resistance", config);
}
export function selectSurfacedLevels(output, config = LEVEL_SURFACED_SELECTION_CONFIG) {
    const supports = selectSurfacedSupports(output, config);
    const resistances = selectSurfacedResistances(output, config);
    const surfacedSelectionNotes = [
        "Surfaced selection starts from the structurally ranked output but biases the final ladder toward near-price actionable levels.",
        ...supports.notes,
        ...resistances.notes,
    ];
    return {
        symbol: output.symbol,
        currentPrice: output.currentPrice,
        surfacedSupports: supports.surfaced,
        surfacedResistances: resistances.surfaced,
        topActionableSupport: supports.surfaced[0],
        topActionableResistance: resistances.surfaced[0],
        deeperSupportAnchor: supports.anchor,
        deeperResistanceAnchor: resistances.anchor,
        suppressedNearbyLevels: [...supports.suppressed, ...resistances.suppressed],
        surfacedSelectionNotes,
        computedAt: Date.now(),
    };
}
