import type { LevelEngineConfig } from "./level-config.js";
import type { FinalLevelZone, RawLevelCandidate } from "./level-types.js";
export declare function clusterRawLevelCandidates(symbol: string, kind: "support" | "resistance", candidates: RawLevelCandidate[], tolerancePct: number, config: LevelEngineConfig, referenceTimestamp?: number): FinalLevelZone[];
//# sourceMappingURL=level-clusterer.d.ts.map