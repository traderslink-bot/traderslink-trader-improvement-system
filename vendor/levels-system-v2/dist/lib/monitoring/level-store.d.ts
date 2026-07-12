import type { FinalLevelZone, LevelEngineOutput } from "../levels/level-types.js";
import type { MonitoringZoneContext } from "./monitoring-types.js";
export declare class LevelStore {
    private readonly levels;
    private readonly activeSupportZones;
    private readonly activeResistanceZones;
    private readonly versions;
    private readonly zoneIdSequence;
    private bumpVersion;
    private nextMonitoredZoneId;
    private buildContext;
    private reconcileCanonicalSide;
    private shouldCarryForwardPriorLevel;
    private withUpdatedLadderPositions;
    private promoteExtensionSide;
    setLevels(output: LevelEngineOutput): void;
    getLevels(symbol: string): LevelEngineOutput | undefined;
    getSupportZones(symbol: string): FinalLevelZone[];
    getResistanceZones(symbol: string): FinalLevelZone[];
    getExtensionSupportZones(symbol: string): FinalLevelZone[];
    getExtensionResistanceZones(symbol: string): FinalLevelZone[];
    activateExtensionLevels(symbol: string, side: "support" | "resistance"): FinalLevelZone[];
    getVersion(symbol: string): number;
    getZoneContext(symbol: string, monitoredZoneId: string): MonitoringZoneContext | undefined;
    getZoneContexts(symbol: string): Record<string, MonitoringZoneContext>;
}
//# sourceMappingURL=level-store.d.ts.map