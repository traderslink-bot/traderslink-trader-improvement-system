import { formatLevelExtensionMessage, formatLevelLadderMessage, formatLevelSnapshotMessage, } from "../alerts/alert-router.js";
import { refreshTechnicalContextForPrice } from "../technical-context/technical-context.js";
import { buildLiveWatchlistPullbackRead } from "./pullback-read.js";
import { ArchivedLiveWatchlistPublisher, DEFAULT_LIVE_WATCHLIST_AUDIT_ARCHIVE_FILE, LiveWatchlistAuditArchivePersistence, } from "./live-watchlist-audit-archive.js";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_ATTEMPTS = 1;
const DEFAULT_RETRY_DELAY_MS = 750;
const LEVEL_MAP_MAX_LEVELS_PER_SIDE = 6;
const LEVEL_MAP_TARGET_DISTANCE_PCT = 0.3;
const LEVEL_MAP_OUTER_ANCHOR_MAX_DISTANCE_PCT = 0.45;
const LEVEL_MAP_STACKED_LEVEL_DISTANCE_PCT = 0.02;
const LEVEL_MAP_ROLE_FLIP_CONFIRM_PCT = 0.0025;
const TIGHT_LEVEL_GAP_PCT = 0.03;
const WIDE_LEVEL_GAP_PCT = 0.12;
const COMPANY_INFO_UNAVAILABLE_BODY = "couldn't get company info";
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function normalizeSymbol(symbol) {
    return symbol?.trim().toUpperCase() || "UNKNOWN";
}
function formatPrice(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "n/a";
    }
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}
function formatLevelSourceLabel(value) {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) {
        return null;
    }
    if (normalized.includes("intraday") || normalized.includes("5m")) {
        return "intraday";
    }
    if (normalized.includes("4h")) {
        return normalized.includes("confluence") ? "4h confluence" : "4h structure";
    }
    if (normalized.includes("daily")) {
        return normalized.includes("confluence") ? "daily confluence" : "daily structure";
    }
    return value?.trim() ?? null;
}
function strengthRank(value) {
    if (value === "major")
        return 4;
    if (value === "strong")
        return 3;
    if (value === "moderate")
        return 2;
    if (value === "weak")
        return 1;
    return 0;
}
function formatWatchlistStrengthLabel(value) {
    return value ?? null;
}
function formatWatchlistFreshnessLabel(value) {
    if (value === "fresh") {
        return "fresh reaction";
    }
    if (value === "aging") {
        return "aging context";
    }
    if (value === "stale") {
        return "older context";
    }
    return null;
}
function sourceRank(value) {
    const sourceLabel = formatLevelSourceLabel(value);
    if (sourceLabel === "daily confluence")
        return 5;
    if (sourceLabel === "daily structure")
        return 4;
    if (sourceLabel === "4h confluence")
        return 3;
    if (sourceLabel === "4h structure")
        return 2;
    if (sourceLabel === "intraday")
        return 1;
    return 0;
}
function zoneQualityRank(zone) {
    return strengthRank(zone.strengthLabel) * 10 + sourceRank(zone.sourceLabel);
}
function signedDistancePct(price, currentPrice) {
    return (price - currentPrice) / Math.max(currentPrice, 0.0001);
}
function formatSignedDistance(value) {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${(value * 100).toFixed(1)}%`;
}
function formatPercent(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "n/a";
    }
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
}
function buildLevelMapLevel(zone, currentPrice, side, options = {}) {
    const sourceLabel = options.sourceLabelOverride ?? formatLevelSourceLabel(zone.sourceLabel);
    const distancePct = signedDistancePct(zone.representativePrice, currentPrice);
    const parts = [
        formatSignedDistance(distancePct),
        formatWatchlistStrengthLabel(zone.strengthLabel),
        formatWatchlistFreshnessLabel(zone.freshness),
        sourceLabel,
    ].filter((value) => Boolean(value));
    return {
        side,
        price: zone.representativePrice,
        distancePct,
        strengthLabel: zone.strengthLabel,
        freshness: zone.freshness,
        sourceLabel,
        roleFlipFromSide: options.roleFlipFromSide ?? null,
        label: `${formatPrice(zone.representativePrice)} (${parts.join(", ")})`,
    };
}
function isStructuralLevelMapLevel(level) {
    return /daily|4h/i.test(level.sourceLabel ?? "");
}
function isStructuralLevelMapZone(zone) {
    return sourceRank(zone.sourceLabel) >= sourceRank("4h structure");
}
function isStrongStructuralAnchor(level) {
    return isStructuralLevelMapLevel(level) && strengthRank(level.strengthLabel) >= strengthRank("strong");
}
function selectOuterAnchorIndex(levels, selectedIndexes) {
    const candidates = levels
        .map((level, index) => ({ level, index }))
        .filter(({ level, index }) => {
        const distance = Math.abs(level.distancePct);
        return (!selectedIndexes.has(index) &&
            distance > LEVEL_MAP_TARGET_DISTANCE_PCT &&
            distance <= LEVEL_MAP_OUTER_ANCHOR_MAX_DISTANCE_PCT &&
            isStrongStructuralAnchor(level));
    })
        .sort((left, right) => {
        const strengthDiff = strengthRank(right.level.strengthLabel) - strengthRank(left.level.strengthLabel);
        if (strengthDiff !== 0)
            return strengthDiff;
        return Math.abs(left.level.distancePct) - Math.abs(right.level.distancePct);
    });
    return candidates[0]?.index ?? null;
}
function replaceWeakestInteriorIndexWithAnchor(selectedIndexes, levels, targetIndex, anchorIndex) {
    if (selectedIndexes.size < LEVEL_MAP_MAX_LEVELS_PER_SIDE) {
        selectedIndexes.add(anchorIndex);
        return;
    }
    const removableIndexes = [...selectedIndexes].filter((index) => index !== 0 && index !== targetIndex);
    if (removableIndexes.length === 0) {
        return;
    }
    const removeIndex = removableIndexes.sort((left, right) => {
        const leftLevel = levels[left];
        const rightLevel = levels[right];
        const strengthDiff = strengthRank(leftLevel.strengthLabel) - strengthRank(rightLevel.strengthLabel);
        if (strengthDiff !== 0)
            return strengthDiff;
        const structuralDiff = Number(isStructuralLevelMapLevel(leftLevel)) - Number(isStructuralLevelMapLevel(rightLevel));
        if (structuralDiff !== 0)
            return structuralDiff;
        return Math.abs(rightLevel.distancePct) - Math.abs(leftLevel.distancePct);
    })[0];
    if (removeIndex === undefined) {
        return;
    }
    selectedIndexes.delete(removeIndex);
    selectedIndexes.add(anchorIndex);
}
function sortedLevelMapLevels(zones, currentPrice, side, options = {}) {
    const candidateZones = dedupeLevelMapZones(zones.filter((zone) => isLevelMapZoneOnDisplaySide(zone, currentPrice, side)), side);
    const levels = candidateZones
        .filter((zone) => isLevelMapZoneOnDisplaySide(zone, currentPrice, side))
        .sort((left, right) => side === "support"
        ? right.representativePrice - left.representativePrice
        : left.representativePrice - right.representativePrice)
        .map((zone) => buildLevelMapLevel(zone, currentPrice, side, {
        roleFlipFromSide: zone.originalSide === side ? null : zone.originalSide,
    }));
    return selectDisplayedLevelMapLevels(levels, options);
}
function isLevelMapZoneOnDisplaySide(zone, currentPrice, displaySide) {
    const levelPrice = zone.representativePrice;
    if (zone.originalSide === displaySide) {
        return displaySide === "support"
            ? currentPrice >= levelPrice * (1 - LEVEL_MAP_ROLE_FLIP_CONFIRM_PCT)
            : currentPrice <= levelPrice * (1 + LEVEL_MAP_ROLE_FLIP_CONFIRM_PCT);
    }
    return displaySide === "support"
        ? currentPrice > levelPrice * (1 + LEVEL_MAP_ROLE_FLIP_CONFIRM_PCT)
        : currentPrice < levelPrice * (1 - LEVEL_MAP_ROLE_FLIP_CONFIRM_PCT);
}
function dedupeLevelMapZones(zones, displaySide) {
    const selectedZones = [];
    for (const zone of zones) {
        const existingIndex = selectedZones.findIndex((existing) => shouldDedupeLevelMapZone(zone, existing, displaySide));
        if (existingIndex === -1) {
            selectedZones.push(zone);
            continue;
        }
        const existing = selectedZones[existingIndex];
        if (isPreferredLevelMapZone(zone, existing, displaySide)) {
            selectedZones[existingIndex] = zone;
        }
    }
    return selectedZones;
}
function shouldDedupeLevelMapZone(candidate, existing, displaySide) {
    if (candidate.representativePrice.toFixed(6) === existing.representativePrice.toFixed(6)) {
        return true;
    }
    const priceDistancePct = Math.abs(candidate.representativePrice - existing.representativePrice) /
        Math.max(Math.abs(candidate.representativePrice), Math.abs(existing.representativePrice), 0.0001);
    if (priceDistancePct > LEVEL_MAP_STACKED_LEVEL_DISTANCE_PCT) {
        return false;
    }
    const preferred = isPreferredLevelMapZone(candidate, existing, displaySide) ? candidate : existing;
    const weaker = preferred === candidate ? existing : candidate;
    return (isStructuralLevelMapZone(preferred) &&
        strengthRank(preferred.strengthLabel) >= strengthRank("strong") &&
        zoneQualityRank(preferred) > zoneQualityRank(weaker));
}
function isPreferredLevelMapZone(candidate, existing, displaySide) {
    const qualityDiff = zoneQualityRank(candidate) - zoneQualityRank(existing);
    if (qualityDiff !== 0) {
        return qualityDiff > 0;
    }
    const strengthDiff = strengthRank(candidate.strengthLabel) - strengthRank(existing.strengthLabel);
    if (strengthDiff !== 0) {
        return strengthDiff > 0;
    }
    const candidateMatchesDisplaySide = candidate.originalSide === displaySide;
    const existingMatchesDisplaySide = existing.originalSide === displaySide;
    if (candidateMatchesDisplaySide !== existingMatchesDisplaySide) {
        return candidateMatchesDisplaySide;
    }
    return Boolean(candidate.sourceLabel) && !existing.sourceLabel;
}
function selectDisplayedLevelMapLevels(levels, options = {}) {
    if (levels.length === 0) {
        return levels;
    }
    if (options.preferStructuralLevels) {
        const structuralLevels = levels.filter(isStructuralLevelMapLevel);
        if (structuralLevels.length > 0) {
            return selectDisplayedLevelMapLevels(structuralLevels);
        }
    }
    const targetIndex = levels.reduce((bestIndex, level, index) => {
        const bestDistance = Math.abs(Math.abs(levels[bestIndex]?.distancePct ?? 0) - LEVEL_MAP_TARGET_DISTANCE_PCT);
        const currentDistance = Math.abs(Math.abs(level.distancePct) - LEVEL_MAP_TARGET_DISTANCE_PCT);
        if (currentDistance < bestDistance)
            return index;
        if (currentDistance === bestDistance && Math.abs(level.distancePct) < Math.abs(levels[bestIndex]?.distancePct ?? 0)) {
            return index;
        }
        return bestIndex;
    }, 0);
    const selectedIndexes = targetIndex + 1 <= LEVEL_MAP_MAX_LEVELS_PER_SIDE
        ? new Set(Array.from({ length: targetIndex + 1 }, (_, index) => index))
        : new Set([0, targetIndex]);
    if (targetIndex + 1 > LEVEL_MAP_MAX_LEVELS_PER_SIDE) {
        const interiorSlots = LEVEL_MAP_MAX_LEVELS_PER_SIDE - selectedIndexes.size;
        for (let slot = 1; slot <= interiorSlots; slot += 1) {
            selectedIndexes.add(Math.round((slot * targetIndex) / (interiorSlots + 1)));
        }
        for (let index = 0; selectedIndexes.size < LEVEL_MAP_MAX_LEVELS_PER_SIDE && index <= targetIndex; index += 1) {
            selectedIndexes.add(index);
        }
    }
    const anchorIndex = selectOuterAnchorIndex(levels, selectedIndexes);
    if (anchorIndex !== null) {
        replaceWeakestInteriorIndexWithAnchor(selectedIndexes, levels, targetIndex, anchorIndex);
    }
    return [...selectedIndexes]
        .sort((left, right) => left - right)
        .map((index) => levels[index])
        .filter((level) => Boolean(level));
}
function selectNextStrongLevel(levels, nearest) {
    const candidates = levels.filter((level) => level.price !== nearest?.price);
    if (candidates.length === 0) {
        return null;
    }
    return candidates
        .slice()
        .sort((left, right) => {
        const strengthDiff = strengthRank(right.strengthLabel) - strengthRank(left.strengthLabel);
        if (strengthDiff !== 0)
            return strengthDiff;
        return Math.abs(left.distancePct) - Math.abs(right.distancePct);
    })[0] ?? null;
}
function isSameDisplayedLevelPrice(left, right) {
    return left.price.toFixed(6) === right.price.toFixed(6);
}
function removeCrossSideDuplicateLevelMapLevels(supportLevels, resistanceLevels, currentPrice) {
    const supportIndexesToRemove = new Set();
    const resistanceIndexesToRemove = new Set();
    supportLevels.forEach((support, supportIndex) => {
        resistanceLevels.forEach((resistance, resistanceIndex) => {
            if (!isSameDisplayedLevelPrice(support, resistance)) {
                return;
            }
            if (support.price > currentPrice) {
                supportIndexesToRemove.add(supportIndex);
            }
            else {
                resistanceIndexesToRemove.add(resistanceIndex);
            }
        });
    });
    return {
        supportLevels: supportLevels.filter((_, index) => !supportIndexesToRemove.has(index)),
        resistanceLevels: resistanceLevels.filter((_, index) => !resistanceIndexesToRemove.has(index)),
    };
}
function deriveRangeState(currentPrice, nearestSupport, nearestResistance) {
    if (!nearestSupport || !nearestResistance) {
        return "normal";
    }
    const gapPct = (nearestResistance.price - nearestSupport.price) / Math.max(currentPrice, 0.0001);
    if (gapPct <= TIGHT_LEVEL_GAP_PCT) {
        return "tight";
    }
    if (gapPct >= WIDE_LEVEL_GAP_PCT) {
        return "wide";
    }
    return "normal";
}
export function buildLiveWatchlistLevelMap(args) {
    if (!Number.isFinite(args.currentPrice) || args.currentPrice <= 0) {
        return null;
    }
    const zones = [
        ...args.supportZones.map((zone) => ({ ...zone, originalSide: "support" })),
        ...args.resistanceZones.map((zone) => ({ ...zone, originalSide: "resistance" })),
    ];
    const levelOptions = { preferStructuralLevels: args.preferStructuralLevels };
    const rawSupportLevels = sortedLevelMapLevels(zones, args.currentPrice, "support", levelOptions);
    const rawResistanceLevels = sortedLevelMapLevels(zones, args.currentPrice, "resistance", levelOptions);
    const { supportLevels, resistanceLevels } = removeCrossSideDuplicateLevelMapLevels(rawSupportLevels, rawResistanceLevels, args.currentPrice);
    const nearestSupport = supportLevels[0] ?? null;
    const nearestResistance = resistanceLevels[0] ?? null;
    return {
        currentPrice: args.currentPrice,
        rangeState: deriveRangeState(args.currentPrice, nearestSupport, nearestResistance),
        nearestSupport,
        nearestResistance,
        nextStrongSupport: selectNextStrongLevel(supportLevels, nearestSupport),
        nextStrongResistance: selectNextStrongLevel(resistanceLevels, nearestResistance),
        supportLevels,
        resistanceLevels,
    };
}
function formatPotentialPathLevelsCardBody(levelMap) {
    const lines = [];
    lines.push("Resistance:");
    lines.push(...(levelMap.resistanceLevels.length ? levelMap.resistanceLevels.map((level) => level.label) : ["none"]));
    lines.push("", "Support:");
    lines.push(...(levelMap.supportLevels.length ? levelMap.supportLevels.map((level) => level.label) : ["none"]));
    return lines.join("\n");
}
function parseStockContextLine(body, label) {
    const prefix = `${label}:`;
    const line = body.split("\n").find((item) => item.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() || null : null;
}
function isHighRiskCountry(country) {
    const normalized = country?.trim().toLowerCase();
    if (!normalized) {
        return false;
    }
    return (normalized === "china" ||
        normalized === "cn" ||
        normalized === "singapore" ||
        normalized === "sg" ||
        normalized === "israel" ||
        normalized === "il");
}
function formatStockContextBodyForWebsite(body, country) {
    const cleanedBody = body
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => !/^Current price:/i.test(line.trim()))
        .filter((line) => !/^Levels are loading\.?$/i.test(line.trim()))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    if (!country || !isHighRiskCountry(country)) {
        return cleanedBody;
    }
    return cleanedBody.replace(/^Country:\s*(.+)$/im, (_line, value) => `Country: ${value.trim()} (High Risk Country)`);
}
function hasUsableCompanyInfo(body, symbol, company) {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const normalizedCompany = company.trim().toUpperCase();
    if (normalizedCompany && normalizedCompany !== normalizedSymbol) {
        return true;
    }
    return [
        "Exchange",
        "Industry",
        "Country",
        "Website",
        "Market cap",
        "Shares outstanding",
    ].some((label) => Boolean(parseStockContextLine(body, label)));
}
function extractSection(body, startHeading, endHeadings) {
    const normalized = body.replace(/\r\n/g, "\n");
    const startPattern = new RegExp(`^${startHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*$`, "im");
    const startMatch = normalized.match(startPattern);
    if (!startMatch || startMatch.index === undefined) {
        return null;
    }
    const startIndex = startMatch.index + startMatch[0].length;
    const rest = normalized.slice(startIndex);
    const endIndexes = endHeadings
        .map((heading) => {
        const pattern = new RegExp(`\\n${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*`, "i");
        const match = rest.match(pattern);
        return match?.index ?? -1;
    })
        .filter((index) => index >= 0);
    const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : rest.length;
    const section = rest.slice(0, endIndex).trim();
    return section || null;
}
function removeLeadingTitleLine(body, title) {
    const normalizedTitle = title.trim().toLowerCase();
    const lines = body.replace(/\r\n/g, "\n").split("\n");
    if (lines[0]?.trim().toLowerCase() === normalizedTitle) {
        return lines.slice(1).join("\n").trim();
    }
    return body.trim();
}
function cleanFullLadderBody(body, title) {
    return removeLeadingTitleLine(body, title)
        .split("\n")
        .filter((line) => !/^Price:\s*/i.test(line.trim()))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
function deriveTraderReadHeadline(body) {
    const line = body
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((item) => item.trim())
        .find(Boolean);
    if (!line) {
        return null;
    }
    return line.length > 140 ? `${line.slice(0, 137).trimEnd()}...` : line;
}
function formatLiveTraderReadBody(args) {
    if (!args.pullbackRead) {
        return args.baseRead;
    }
    const baseRead = args.baseRead.trim();
    if (!baseRead) {
        return args.pullbackRead.body;
    }
    return `${args.pullbackRead.body}\n\nLevel read:\n${baseRead}`;
}
function buildCard(args) {
    return {
        title: args.title,
        body: args.body,
        updatedAt: args.updatedAt,
        priceWhenPosted: args.priceWhenPosted ?? null,
        source: args.source,
        ...(args.metadata ? { metadata: args.metadata } : {}),
    };
}
function formatTechnicalContextLevelsLine(context) {
    return [
        `VWAP ${formatPrice(context.vwap)} (${formatPercent(context.priceVsVwapPct)})`,
        `EMA9 ${formatPrice(context.ema9)} (${formatPercent(context.priceVsEma9Pct)})`,
        `EMA20 ${formatPrice(context.ema20)} (${formatPercent(context.priceVsEma20Pct)})`,
    ].join(" | ");
}
function formatEmaExplanation(context) {
    if (context.ema9 === null || context.ema20 === null || context.aboveEma9 === null || context.aboveEma20 === null) {
        return "EMA read: not enough intraday candles yet to calculate EMA9 and EMA20 cleanly.";
    }
    if (context.aboveEma9 && context.aboveEma20) {
        return "EMA read: bullish short-term posture. Price is above EMA9 and EMA20.";
    }
    if (!context.aboveEma9 && !context.aboveEma20) {
        return "EMA read: bearish short-term posture. Price is below EMA9 and EMA20.";
    }
    return context.aboveEma9
        ? "EMA read: mixed but improving. Price is above EMA9 but still below EMA20."
        : "EMA read: mixed and cooling. Price is below EMA9 but still above EMA20.";
}
function formatVwapExplanation(context) {
    if (context.vwap === null || context.aboveVwap === null) {
        return "VWAP read: not enough usable volume-bearing candles yet to calculate VWAP cleanly.";
    }
    const relation = context.aboveVwap ? "above" : "below";
    const posture = context.aboveVwap ? "bullish intraday posture" : "bearish intraday posture";
    return `VWAP read: ${posture}. Price is ${formatPercent(context.priceVsVwapPct)} ${relation} VWAP.`;
}
function formatTechnicalContextBody(context) {
    return [
        `Levels: ${formatTechnicalContextLevelsLine(context)}.`,
        formatEmaExplanation(context),
        formatVwapExplanation(context),
    ].join("\n");
}
function isTechnicalContextDisplayReady(context) {
    return (context.confidence !== "unavailable" &&
        context.vwap !== null &&
        context.ema9 !== null &&
        context.ema20 !== null &&
        context.aboveVwap !== null &&
        context.aboveEma9 !== null &&
        context.aboveEma20 !== null);
}
export function buildLiveWatchlistTechnicalContextPatch(args) {
    if (!args.technicalContext) {
        return null;
    }
    const context = refreshTechnicalContextForPrice(args.technicalContext, args.currentPrice);
    if (!isTechnicalContextDisplayReady(context)) {
        return {
            symbol: normalizeSymbol(args.symbol),
            status: "live",
            updatedAt: args.timestamp,
            cards: {
                technicalContext: null,
            },
        };
    }
    return {
        symbol: normalizeSymbol(args.symbol),
        status: "live",
        updatedAt: args.timestamp,
        cards: {
            technicalContext: buildCard({
                title: "Technical Context",
                body: formatTechnicalContextBody(context),
                updatedAt: args.timestamp,
                priceWhenPosted: context.currentPrice,
                source: "levels_system_intraday",
                metadata: {
                    confidence: context.confidence,
                    provider: context.provider,
                    sourceTimeframe: context.sourceTimeframe,
                    candleCount: context.candleCount,
                    vwap: context.vwap,
                    ema9: context.ema9,
                    ema20: context.ema20,
                    priceVsVwapPct: context.priceVsVwapPct,
                    priceVsEma9Pct: context.priceVsEma9Pct,
                    priceVsEma20Pct: context.priceVsEma20Pct,
                    aboveVwap: context.aboveVwap,
                    aboveEma9: context.aboveEma9,
                    aboveEma20: context.aboveEma20,
                    sessionDate: context.sessionDate,
                    latestCandleAt: context.updatedAt,
                },
            }),
        },
    };
}
export function buildLiveWatchlistSnapshotPatch(payload, options = {}) {
    const updatedAt = payload.timestamp;
    const closestSupportZones = payload.ladderSupportZones ?? payload.supportZones;
    const closestResistanceZones = payload.ladderResistanceZones ?? payload.resistanceZones;
    const levelMap = buildLiveWatchlistLevelMap({
        currentPrice: payload.currentPrice,
        supportZones: closestSupportZones,
        resistanceZones: closestResistanceZones,
        preferStructuralLevels: true,
    });
    const ladder = formatLevelLadderMessage(payload);
    const ladderTitle = `${payload.symbol} full level ladder`;
    const snapshotMessage = formatLevelSnapshotMessage(payload);
    const marketStructure = extractSection(snapshotMessage, "Market structure", [
        "Trade map",
        "Closest levels to watch",
        "More support and resistance",
    ]);
    const liveTraderRead = extractSection(snapshotMessage, "Trade map", [
        "Closest levels to watch",
        "More support and resistance",
    ]) ?? snapshotMessage;
    const technicalContext = payload.technicalContext
        ? refreshTechnicalContextForPrice(payload.technicalContext, payload.currentPrice)
        : null;
    const pullbackRead = options.pullbackReadEnabled !== false
        ? buildLiveWatchlistPullbackRead({
            symbol: payload.symbol,
            currentPrice: payload.currentPrice,
            levelMap,
            technicalContext,
        })
        : null;
    const liveTraderReadBody = formatLiveTraderReadBody({
        baseRead: liveTraderRead,
        pullbackRead,
    });
    return {
        symbol: normalizeSymbol(payload.symbol),
        status: "live",
        updatedAt,
        levelMap,
        cards: {
            levelMap: null,
            fullLadder: ladder
                ? buildCard({
                    title: ladderTitle,
                    body: cleanFullLadderBody(ladder, ladderTitle),
                    updatedAt,
                    priceWhenPosted: payload.currentPrice,
                    source: "level_snapshot",
                })
                : null,
            nearestSupportResistance: levelMap
                ? buildCard({
                    title: "Potential Path Levels",
                    body: formatPotentialPathLevelsCardBody(levelMap),
                    updatedAt,
                    priceWhenPosted: payload.currentPrice,
                    source: "level_snapshot",
                    metadata: {
                        nearestSupport: levelMap.nearestSupport?.price ?? null,
                        nearestSupportDistancePct: levelMap.nearestSupport?.distancePct ?? null,
                        nearestSupportLabel: levelMap.nearestSupport?.label ?? null,
                        nearestResistance: levelMap.nearestResistance?.price ?? null,
                        nearestResistanceDistancePct: levelMap.nearestResistance?.distancePct ?? null,
                        nearestResistanceLabel: levelMap.nearestResistance?.label ?? null,
                        supportCount: closestSupportZones.length,
                        resistanceCount: closestResistanceZones.length,
                    },
                })
                : null,
            liveTraderRead: buildCard({
                title: "Live Trader Read",
                body: liveTraderReadBody,
                updatedAt,
                priceWhenPosted: payload.currentPrice,
                source: "level_snapshot",
                metadata: {
                    headline: deriveTraderReadHeadline(liveTraderReadBody),
                    ...(pullbackRead?.metadata ?? {}),
                },
            }),
            marketStructure: marketStructure
                ? buildCard({
                    title: "Market Structure",
                    body: marketStructure,
                    updatedAt,
                    priceWhenPosted: payload.currentPrice,
                    source: "level_snapshot",
                })
                : null,
            technicalContext: buildLiveWatchlistTechnicalContextPatch({
                symbol: payload.symbol,
                timestamp: updatedAt,
                currentPrice: payload.currentPrice,
                technicalContext,
            })?.cards.technicalContext ?? null,
        },
    };
}
export function buildLiveWatchlistPullbackReadPatch(args) {
    const levelMap = buildLiveWatchlistLevelMap({
        currentPrice: args.currentPrice,
        supportZones: args.supportZones,
        resistanceZones: args.resistanceZones,
        preferStructuralLevels: true,
    });
    const technicalContext = args.technicalContext
        ? refreshTechnicalContextForPrice(args.technicalContext, args.currentPrice)
        : null;
    const pullbackRead = buildLiveWatchlistPullbackRead({
        symbol: args.symbol,
        currentPrice: args.currentPrice,
        levelMap,
        technicalContext,
        volumeRead: args.volumeRead,
    });
    if (!pullbackRead) {
        return null;
    }
    return {
        symbol: normalizeSymbol(args.symbol),
        status: "live",
        updatedAt: args.timestamp,
        levelMap,
        cards: {
            liveTraderRead: buildCard({
                title: "Live Trader Read",
                body: pullbackRead.body,
                updatedAt: args.timestamp,
                priceWhenPosted: args.currentPrice,
                source: "pullback_read",
                metadata: {
                    headline: deriveTraderReadHeadline(pullbackRead.body),
                    ...pullbackRead.metadata,
                },
            }),
        },
    };
}
export function buildLiveWatchlistExtensionPatch(payload) {
    return {
        symbol: normalizeSymbol(payload.symbol),
        status: "live",
        updatedAt: payload.timestamp,
        cards: {
            nearestSupportResistance: buildCard({
                title: `${payload.symbol} next ${payload.side} levels`,
                body: formatLevelExtensionMessage(payload),
                updatedAt: payload.timestamp,
                priceWhenPosted: null,
                source: "level_extension",
                metadata: {
                    side: payload.side,
                    levelCount: payload.levels.length,
                    firstLevel: payload.levels[0] ?? null,
                },
            }),
        },
    };
}
export function buildLiveWatchlistAlertPatch(payload) {
    const symbol = normalizeSymbol(payload.symbol ?? payload.event?.symbol);
    if (symbol === "UNKNOWN") {
        return null;
    }
    const updatedAt = payload.timestamp ?? payload.event?.timestamp ?? Date.now();
    const messageKind = payload.metadata?.messageKind;
    const title = payload.title.trim() || symbol;
    const body = payload.title.trim()
        ? `${payload.title.trim()}\n${payload.body}`
        : payload.body;
    if (messageKind === "stock_context") {
        const currentPrice = parseStockContextLine(payload.body, "Current price");
        const company = parseStockContextLine(payload.body, "Company") ?? symbol;
        const country = parseStockContextLine(payload.body, "Country");
        const usableCompanyInfo = hasUsableCompanyInfo(payload.body, symbol, company);
        const bodyWithRiskWarning = usableCompanyInfo
            ? formatStockContextBodyForWebsite(payload.body, country)
            : COMPANY_INFO_UNAVAILABLE_BODY;
        return {
            symbol,
            status: "live",
            updatedAt,
            firstPostedAt: updatedAt,
            cards: {
                companyInfo: buildCard({
                    title: usableCompanyInfo ? company : "Company Info",
                    body: bodyWithRiskWarning,
                    updatedAt,
                    priceWhenPosted: currentPrice ? Number.parseFloat(currentPrice) : null,
                    source: "stock_context",
                    metadata: {
                        company: usableCompanyInfo ? company : null,
                        exchange: usableCompanyInfo ? parseStockContextLine(payload.body, "Exchange") : null,
                        industry: usableCompanyInfo ? parseStockContextLine(payload.body, "Industry") : null,
                        country: usableCompanyInfo ? country : null,
                        marketCap: usableCompanyInfo ? parseStockContextLine(payload.body, "Market cap") : null,
                        highRiskCountry: usableCompanyInfo ? isHighRiskCountry(country) : false,
                    },
                }),
            },
        };
    }
    if (messageKind === "market_structure_update") {
        return {
            symbol,
            status: "live",
            updatedAt,
            cards: {
                marketStructure: buildCard({
                    title,
                    body,
                    updatedAt,
                    priceWhenPosted: typeof payload.event?.triggerPrice === "number"
                        ? payload.event.triggerPrice
                        : null,
                    source: "market_structure_update",
                }),
            },
        };
    }
    return {
        symbol,
        status: "live",
        updatedAt,
        cards: {
            liveTraderRead: buildCard({
                title,
                body,
                updatedAt,
                priceWhenPosted: typeof payload.event?.triggerPrice === "number"
                    ? payload.event.triggerPrice
                    : null,
                source: typeof messageKind === "string" ? messageKind : "live_alert",
                metadata: {
                    eventType: payload.metadata?.eventType ?? payload.event?.eventType ?? null,
                    severity: payload.metadata?.severity ?? null,
                    confidence: payload.metadata?.confidence ?? null,
                    score: payload.metadata?.score ?? null,
                    whyPosted: payload.metadata?.whyPosted ?? null,
                },
            }),
        },
    };
}
export function buildLiveWatchlistTickerDataPatch(args) {
    if (!Number.isFinite(args.lastPrice) || args.lastPrice <= 0) {
        return null;
    }
    const levelMap = buildLiveWatchlistLevelMap({
        currentPrice: args.lastPrice,
        supportZones: args.supportZones,
        resistanceZones: args.resistanceZones,
        preferStructuralLevels: true,
    });
    const nearestSupport = levelMap?.nearestSupport ?? null;
    const nearestResistance = levelMap?.nearestResistance ?? null;
    return {
        type: "tickerData",
        symbol: normalizeSymbol(args.symbol),
        status: "live",
        updatedAt: args.timestamp,
        latestPrice: args.lastPrice,
        nearestSupport: nearestSupport?.price ?? null,
        nearestResistance: nearestResistance?.price ?? null,
        nearestSupportLabel: nearestSupport?.label ?? null,
        nearestResistanceLabel: nearestResistance?.label ?? null,
        levelMap,
        ...(args.volume !== undefined
            ? { volume: Number.isFinite(args.volume) && args.volume !== null && args.volume >= 0 ? args.volume : null }
            : {}),
        ...(args.extendedQuote !== undefined ? { extendedQuote: args.extendedQuote } : {}),
    };
}
export function buildLiveWatchlistStatusPatch(args) {
    return {
        symbol: normalizeSymbol(args.symbol),
        status: args.status,
        updatedAt: args.updatedAt ?? Date.now(),
        ...(args.firstPostedAt !== undefined ? { firstPostedAt: args.firstPostedAt } : {}),
        cards: {},
    };
}
export class LiveWatchlistHttpPublisher {
    options;
    fetchImpl;
    timeoutMs;
    retryAttempts;
    retryDelayMs;
    constructor(options) {
        this.options = options;
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.retryAttempts = Math.max(0, Math.floor(options.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS));
        this.retryDelayMs = Math.max(0, Math.floor(options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS));
    }
    async publish(patch) {
        await this.publishPayload(patch);
    }
    async publishHealth(patch) {
        await this.publishPayload(patch);
    }
    async publishTickerData(patch) {
        await this.publishPayload(patch);
    }
    async publishPayload(patch) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.retryAttempts; attempt += 1) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
            try {
                const response = await this.fetchImpl(this.options.ingestUrl, {
                    method: "POST",
                    signal: controller.signal,
                    headers: {
                        Authorization: `Bearer ${this.options.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(patch),
                });
                if (!response.ok) {
                    throw new Error(`Live watchlist ingest failed with ${response.status}.`);
                }
                return;
            }
            catch (error) {
                lastError = error;
                if (attempt < this.retryAttempts) {
                    await delay(this.retryDelayMs);
                }
            }
            finally {
                clearTimeout(timeout);
            }
        }
        this.options.onError?.(lastError, patch);
        if (!this.options.onError) {
            throw lastError instanceof Error ? lastError : new Error(String(lastError));
        }
    }
}
export function createLiveWatchlistPublisherFromEnv(env = process.env) {
    const ingestUrl = env.TRADERSLINK_WATCHLIST_INGEST_URL?.trim();
    const token = env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim();
    if (!ingestUrl || !token) {
        return null;
    }
    const publisher = new LiveWatchlistHttpPublisher({
        ingestUrl,
        token,
        timeoutMs: Number(env.TRADERSLINK_WATCHLIST_PUBLISH_TIMEOUT_MS ?? "") || undefined,
        retryAttempts: Number(env.TRADERSLINK_WATCHLIST_PUBLISH_RETRY_ATTEMPTS ?? "") || undefined,
        retryDelayMs: Number(env.TRADERSLINK_WATCHLIST_PUBLISH_RETRY_DELAY_MS ?? "") || undefined,
        onError: (error, patch) => {
            const message = error instanceof Error ? error.message : String(error);
            const payloadLabel = "symbol" in patch ? `${patch.symbol} update` : "health update";
            console.warn(`[LiveWatchlistPublisher] Failed to publish ${payloadLabel}: ${message}`);
        },
    });
    if (env.LIVE_WATCHLIST_AUDIT_ARCHIVE_DISABLED === "1") {
        return publisher;
    }
    return new ArchivedLiveWatchlistPublisher(publisher, new LiveWatchlistAuditArchivePersistence(env.LIVE_WATCHLIST_AUDIT_ARCHIVE_PATH?.trim() || DEFAULT_LIVE_WATCHLIST_AUDIT_ARCHIVE_FILE));
}
