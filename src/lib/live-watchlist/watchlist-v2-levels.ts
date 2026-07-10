import type {
  LiveWatchlistLevelMap,
  LiveWatchlistLevelMapLevel,
} from "./live-watchlist-types";

export type WatchlistV2LevelRow = LiveWatchlistLevelMapLevel & {
  isNearest: boolean;
};

export type WatchlistV2LevelRows = {
  support: WatchlistV2LevelRow[];
  resistance: WatchlistV2LevelRow[];
};

function isSameLevel(
  left: LiveWatchlistLevelMapLevel,
  right: LiveWatchlistLevelMapLevel | null,
): boolean {
  return Boolean(
    right &&
      left.side === right.side &&
      left.price === right.price &&
      left.distancePct === right.distancePct &&
      left.label === right.label,
  );
}

export function buildWatchlistV2LevelRows(
  levelMap: LiveWatchlistLevelMap | null | undefined,
): WatchlistV2LevelRows {
  if (!levelMap) {
    return { support: [], resistance: [] };
  }

  return {
    support: levelMap.supportLevels.map((level) => ({
      ...level,
      isNearest: isSameLevel(level, levelMap.nearestSupport),
    })),
    resistance: levelMap.resistanceLevels.map((level) => ({
      ...level,
      isNearest: isSameLevel(level, levelMap.nearestResistance),
    })),
  };
}
