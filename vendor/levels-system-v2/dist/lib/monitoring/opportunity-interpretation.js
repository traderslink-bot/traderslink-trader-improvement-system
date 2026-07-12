export const APPROVED_INTERPRETATION_MESSAGE_TEMPLATES = {
    pre_zone: "watching pullback into support near {level}",
    in_zone: "price testing support near {level} - watching reaction",
    confirmation: "buyers reacting at support near {level}",
    weakening: "support weakening near {level}",
    breakout_context: "holding above breakout level near {level}",
    neutral: "potential buy zone below near {level}",
};
const SAME_LEVEL_COOLDOWN_MS = 5 * 60 * 1000;
const SYMBOL_TYPE_COOLDOWN_MS = 90 * 1000;
function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
}
function round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
export function formatInterpretationLevel(value) {
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}
function formatTemplate(template, level) {
    return template.replace("{level}", formatInterpretationLevel(level));
}
function formatZoneAwareMessage(type, zoneLabel, level) {
    const formattedLevel = formatInterpretationLevel(level);
    switch (type) {
        case "pre_zone":
            return `watching pullback into ${zoneLabel} near ${formattedLevel}`;
        case "in_zone":
            return `price testing ${zoneLabel} near ${formattedLevel} - watching reaction`;
        case "confirmation":
            return zoneLabel === "resistance"
                ? `sellers reacting at resistance near ${formattedLevel}`
                : `buyers reacting at ${zoneLabel} near ${formattedLevel}`;
        case "weakening":
            return `${zoneLabel} weakening near ${formattedLevel}`;
        case "neutral":
            return `potential buy zone below near ${formattedLevel}`;
        default:
            return formatTemplate(APPROVED_INTERPRETATION_MESSAGE_TEMPLATES[type], level);
    }
}
function stageRank(type) {
    switch (type) {
        case "pre_zone":
            return 1;
        case "in_zone":
            return 2;
        case "confirmation":
            return 3;
        default:
            return 0;
    }
}
function resolveOpportunityEventType(opportunity) {
    return opportunity.eventType ?? opportunity.type;
}
function resolveZoneLabel(opportunity) {
    if (opportunity.zoneKind) {
        return opportunity.zoneKind;
    }
    const eventType = resolveOpportunityEventType(opportunity);
    if (eventType === "breakdown" ||
        eventType === "rejection" ||
        eventType === "fake_breakout" ||
        opportunity.bias === "bearish") {
        return "resistance";
    }
    if (eventType === "breakout" ||
        eventType === "reclaim" ||
        eventType === "fake_breakdown" ||
        eventType === "level_touch" ||
        eventType === "compression" ||
        opportunity.bias !== "bearish") {
        return "support";
    }
    return "level";
}
function resolveBaseType(context) {
    const { opportunity, adaptiveState, structure } = context;
    const eventType = resolveOpportunityEventType(opportunity);
    if (adaptiveState.weakStreak > 0 && adaptiveState.adaptiveMultiplier < 1) {
        return "weakening";
    }
    if (eventType === "breakout" && structure.type === "breakout_setup") {
        return "breakout_context";
    }
    if (eventType === "breakout" ||
        (eventType === "compression" && opportunity.bias !== "bearish")) {
        return "pre_zone";
    }
    if (eventType === "level_touch") {
        return "in_zone";
    }
    if (eventType === "rejection" || eventType === "reclaim") {
        return "confirmation";
    }
    return "neutral";
}
function applyProgression(candidateType, previous) {
    const candidateRank = stageRank(candidateType);
    if (candidateRank === 0) {
        return candidateType;
    }
    const previousRank = previous?.stageRank ?? 0;
    if (candidateRank <= previousRank + 1) {
        return candidateType;
    }
    return previousRank <= 0 ? "in_zone" : "confirmation";
}
function buildMessage(type, context) {
    if (type === "breakout_context") {
        return formatTemplate(APPROVED_INTERPRETATION_MESSAGE_TEMPLATES[type], context.levels.referenceLevel);
    }
    return formatZoneAwareMessage(type, context.levels.zoneLabel, context.levels.referenceLevel);
}
function buildTags(type, context) {
    return [
        type,
        resolveOpportunityEventType(context.opportunity),
        context.levels.zoneLabel,
        context.structure.type ?? "no_structure",
    ];
}
export function interpretOpportunity(context, previous) {
    const candidateType = resolveBaseType(context);
    const resolvedType = applyProgression(candidateType, previous);
    const weaknessAdjustment = clamp(1 - context.adaptiveState.weakStreak * 0.18, 0.4, 1);
    const confidence = round(clamp(context.opportunity.strength *
        context.adaptiveState.adaptiveMultiplier *
        weaknessAdjustment));
    return {
        symbol: context.opportunity.symbol,
        message: buildMessage(resolvedType, context),
        type: resolvedType,
        eventType: resolveOpportunityEventType(context.opportunity),
        level: context.opportunity.level,
        zoneKind: context.opportunity.zoneKind,
        confidence,
        tags: buildTags(resolvedType, context),
        timestamp: context.opportunity.timestamp,
    };
}
export function formatInterpretationForConsole(interpretation) {
    return [
        `SYMBOL: ${interpretation.symbol}`,
        `TYPE: ${interpretation.type}`,
        `EVENT: ${interpretation.eventType}`,
        `MESSAGE: ${interpretation.message}`,
        `CONFIDENCE: ${interpretation.confidence.toFixed(2)}`,
    ].join("\n");
}
export class OpportunityInterpretationLayer {
    progressByOpportunity = new Map();
    lastBySignature = new Map();
    lastBySymbolType = new Map();
    buildOpportunityKey(opportunity) {
        return `${opportunity.symbol}|${resolveOpportunityEventType(opportunity)}|${round(opportunity.level, 4)}`;
    }
    buildContext(opportunity, weakStreak) {
        return {
            opportunity,
            levels: {
                referenceLevel: opportunity.level,
                zoneLabel: resolveZoneLabel(opportunity),
            },
            structure: {
                type: opportunity.structureType,
                strength: opportunity.structureStrength,
            },
            adaptiveState: {
                adaptiveMultiplier: opportunity.adaptiveMultiplier,
                weakStreak,
            },
        };
    }
    shouldEmit(opportunity, interpretation) {
        const roundedLevel = round(opportunity.level, 4);
        const signatureKey = `${interpretation.symbol}|${interpretation.type}|${roundedLevel}`;
        const symbolTypeKey = `${interpretation.symbol}|${interpretation.type}`;
        const lastSignatureAt = this.lastBySignature.get(signatureKey);
        const lastSymbolTypeAt = this.lastBySymbolType.get(symbolTypeKey);
        if (typeof lastSignatureAt === "number" &&
            interpretation.timestamp - lastSignatureAt < SAME_LEVEL_COOLDOWN_MS) {
            return false;
        }
        if (typeof lastSymbolTypeAt === "number" &&
            interpretation.timestamp - lastSymbolTypeAt < SYMBOL_TYPE_COOLDOWN_MS) {
            return false;
        }
        this.lastBySignature.set(signatureKey, interpretation.timestamp);
        this.lastBySymbolType.set(symbolTypeKey, interpretation.timestamp);
        return true;
    }
    interpret(opportunity, weakStreak) {
        const opportunityKey = this.buildOpportunityKey(opportunity);
        const previous = this.progressByOpportunity.get(opportunityKey);
        const interpretation = interpretOpportunity(this.buildContext(opportunity, weakStreak), previous);
        this.progressByOpportunity.set(opportunityKey, {
            stageRank: Math.max(previous?.stageRank ?? 0, stageRank(interpretation.type)),
        });
        if (!this.shouldEmit(opportunity, interpretation)) {
            return null;
        }
        return interpretation;
    }
    formatForConsole(interpretation) {
        return formatInterpretationForConsole(interpretation);
    }
}
