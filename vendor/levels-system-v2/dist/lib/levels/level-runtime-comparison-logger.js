// 2026-04-18 08:40 AM America/Toronto
// Compact compare-mode logging for old versus new surfaced runtime outputs.
import { computeComparisonDifferences, } from "./level-ranking-comparison.js";
function formatLevel(level) {
    if (!level) {
        return null;
    }
    const priceText = level.price >= 1 ? level.price.toFixed(2) : level.price.toFixed(4);
    return `${priceText}${level.state ? ` (${level.state})` : ""}`;
}
export function buildLevelRuntimeComparisonLogEntry(params) {
    const alternatePath = params.activePath === "old" ? "new" : "old";
    const activeOutput = params.activePath === "old" ? params.oldPath : params.newPath;
    const alternateOutput = params.activePath === "old" ? params.newPath : params.oldPath;
    const differences = computeComparisonDifferences({
        oldPath: params.oldPath,
        newPath: params.newPath,
        limitations: [],
    });
    return {
        type: "level_runtime_compare",
        symbol: params.symbol.toUpperCase(),
        activePath: params.activePath,
        alternatePath,
        activeTopSupport: formatLevel(activeOutput.topSupport),
        alternateTopSupport: formatLevel(alternateOutput.topSupport),
        activeTopResistance: formatLevel(activeOutput.topResistance),
        alternateTopResistance: formatLevel(alternateOutput.topResistance),
        activeVisibleCounts: {
            support: activeOutput.visibleSupportCount,
            resistance: activeOutput.visibleResistanceCount,
        },
        alternateVisibleCounts: {
            support: alternateOutput.visibleSupportCount,
            resistance: alternateOutput.visibleResistanceCount,
        },
        notableDifferences: differences.noteworthyDisagreements.slice(0, 4),
        newPathContext: {
            topSupportState: params.newPath.topSupport?.state ?? null,
            topSupportConfidence: params.newPath.topSupport?.confidence ?? null,
            topSupportExplanation: params.newPath.topSupport?.explanation ?? null,
            topResistanceState: params.newPath.topResistance?.state ?? null,
            topResistanceConfidence: params.newPath.topResistance?.confidence ?? null,
            topResistanceExplanation: params.newPath.topResistance?.explanation ?? null,
        },
    };
}
