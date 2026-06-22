export type LiveWatchlistCardKind =
  | "companyInfo"
  | "levelMap"
  | "fullLadder"
  | "nearestSupportResistance"
  | "liveTraderRead"
  | "marketStructure"
  | "recentNewsFilings";

export type LiveWatchlistStatus = "live" | "stale" | "deactivated";
export type LiveWatchlistMarketDataStatus = "live" | "stale" | "offline" | "starting";

export type LiveWatchlistCardContent = {
  title: string;
  body: string;
  updatedAt: number;
  priceWhenPosted: number | null;
  source: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type LiveWatchlistCardPatch = {
  symbol: string;
  status?: LiveWatchlistStatus;
  updatedAt: number;
  firstPostedAt?: number | null;
  levelMap?: LiveWatchlistLevelMap | null;
  cards: Partial<Record<LiveWatchlistCardKind, LiveWatchlistCardContent | null>>;
};

export type LiveWatchlistHealthPatch = {
  type: "health";
  marketDataStatus: LiveWatchlistMarketDataStatus;
  marketDataUpdatedAt: number;
};

export type LiveWatchlistTickerDataPatch = {
  type: "tickerData";
  symbol: string;
  status?: LiveWatchlistStatus;
  updatedAt: number;
  latestPrice: number;
  nearestSupport: number | null;
  nearestResistance: number | null;
  nearestSupportLabel?: string | null;
  nearestResistanceLabel?: string | null;
  levelMap?: LiveWatchlistLevelMap | null;
};

export type LiveWatchlistLevelMapRangeState = "tight" | "normal" | "wide";

export type LiveWatchlistLevelMapLevel = {
  side: "support" | "resistance";
  price: number;
  distancePct: number;
  strengthLabel?: "weak" | "moderate" | "strong" | "major";
  sourceLabel?: string | null;
  roleFlipFromSide?: "support" | "resistance" | null;
  label: string;
};

export type LiveWatchlistLevelMap = {
  currentPrice: number;
  rangeState: LiveWatchlistLevelMapRangeState;
  nearestSupport: LiveWatchlistLevelMapLevel | null;
  nearestResistance: LiveWatchlistLevelMapLevel | null;
  nearestOverhead?: LiveWatchlistLevelMapLevel | null;
  nextStrongSupport: LiveWatchlistLevelMapLevel | null;
  nextStrongResistance: LiveWatchlistLevelMapLevel | null;
  supportLevels: LiveWatchlistLevelMapLevel[];
  resistanceLevels: LiveWatchlistLevelMapLevel[];
  overheadLevels?: LiveWatchlistLevelMapLevel[];
};

export type LiveWatchlistSymbolState = {
  symbol: string;
  status: LiveWatchlistStatus;
  updatedAt: number;
  firstPostedAt: number | null;
  companyName: string | null;
  latestPrice: number | null;
  nearestSupport: number | null;
  nearestResistance: number | null;
  nearestSupportLabel?: string | null;
  nearestResistanceLabel?: string | null;
  levelMap?: LiveWatchlistLevelMap | null;
  latestTraderReadHeadline: string | null;
  cards: Partial<Record<LiveWatchlistCardKind, LiveWatchlistCardContent>>;
};

export type LiveWatchlistArchiveSnapshot = {
  archiveId: string;
  symbol: string;
  archivedAt: number;
  firstPostedAt: number | null;
  lastActiveUpdatedAt: number;
  state: LiveWatchlistSymbolState;
};

export type LiveWatchlistStatePayload = {
  generatedAt: number;
  marketDataStatus: LiveWatchlistMarketDataStatus;
  marketDataUpdatedAt: number | null;
  symbols: LiveWatchlistSymbolState[];
};
