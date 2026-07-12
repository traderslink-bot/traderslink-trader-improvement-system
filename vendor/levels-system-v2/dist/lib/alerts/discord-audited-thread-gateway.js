import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { formatLevelExtensionMessage, formatLevelLadderMessage, formatLevelSnapshotMessage, } from "./alert-router.js";
import { classifyLiveThreadMessage } from "../monitoring/live-thread-post-policy.js";
const DEFAULT_AUDIT_FILE_PATH = resolve(process.cwd(), "artifacts", "discord-delivery-audit.jsonl");
const DEFAULT_ALERT_MAX_RETRIES = 1;
const DEFAULT_ALERT_RETRY_DELAY_MS = 750;
const RUNTIME_STARTED_AT = new Date().toISOString();
function runtimeVersion() {
    return process.env.LEVEL_RUNTIME_VERSION?.trim() || process.env.npm_package_version || "dev";
}
function delay(ms) {
    if (ms <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}
function previewBody(body) {
    const singleLine = body.replace(/\s+/g, " ").trim();
    return singleLine.length <= 240 ? singleLine : `${singleLine.slice(0, 237)}...`;
}
function buildSnapshotAuditPreview(audit) {
    if (!audit) {
        return undefined;
    }
    return {
        referencePrice: audit.referencePrice,
        displayTolerance: audit.displayTolerance,
        forwardResistanceLimit: audit.forwardResistanceLimit,
        displayedSupportIds: audit.displayedSupportIds,
        displayedResistanceIds: audit.displayedResistanceIds,
        omittedSupportCount: audit.omittedSupportCount,
        omittedResistanceCount: audit.omittedResistanceCount,
        omittedSupportLevels: audit.supportCandidates.filter((candidate) => !candidate.displayed),
        omittedResistanceLevels: audit.resistanceCandidates.filter((candidate) => !candidate.displayed),
    };
}
export class DiscordAuditedThreadGateway {
    inner;
    options;
    auditFilePath;
    constructor(inner, options) {
        this.inner = inner;
        this.options = options;
        this.auditFilePath = options.auditFilePath ?? DEFAULT_AUDIT_FILE_PATH;
    }
    writeAudit(entry) {
        mkdirSync(dirname(this.auditFilePath), { recursive: true });
        appendFileSync(this.auditFilePath, `${JSON.stringify(entry)}\n`, "utf8");
        this.options.auditListener?.(entry);
    }
    recordPosted(operation, payload, timing) {
        const timestamp = Date.now();
        const sourceTimestamp = payload.sourceTimestamp;
        this.writeAudit({
            type: "discord_delivery_audit",
            operation,
            status: "posted",
            gatewayMode: this.options.gatewayMode,
            timestamp,
            deliveryLagMs: typeof sourceTimestamp === "number" && Number.isFinite(sourceTimestamp)
                ? timestamp - sourceTimestamp
                : undefined,
            ...timing,
            ...payload,
            runtimeVersion: runtimeVersion(),
            runtimeStartedAt: RUNTIME_STARTED_AT,
            runtimePid: process.pid,
        });
    }
    recordFailed(operation, error, payload, timing) {
        this.recordFailedAttempt(operation, error, payload, timing);
        throw error;
    }
    recordFailedAttempt(operation, error, payload, timing) {
        const message = error instanceof Error ? error.message : String(error);
        const timestamp = Date.now();
        const sourceTimestamp = payload.sourceTimestamp;
        this.writeAudit({
            type: "discord_delivery_audit",
            operation,
            status: "failed",
            gatewayMode: this.options.gatewayMode,
            timestamp,
            deliveryLagMs: typeof sourceTimestamp === "number" && Number.isFinite(sourceTimestamp)
                ? timestamp - sourceTimestamp
                : undefined,
            ...timing,
            error: message,
            ...payload,
            runtimeVersion: runtimeVersion(),
            runtimeStartedAt: RUNTIME_STARTED_AT,
            runtimePid: process.pid,
        });
        return timestamp;
    }
    buildAlertAuditPayload(threadId, payload) {
        return {
            threadId,
            symbol: payload.symbol ?? payload.event?.symbol,
            title: payload.title,
            sourceTimestamp: payload.event?.timestamp ?? payload.timestamp,
            body: payload.body,
            bodyPreview: previewBody(payload.body),
            messageKind: payload.metadata?.messageKind,
            eventType: payload.metadata?.eventType,
            severity: payload.metadata?.severity,
            confidence: payload.metadata?.confidence,
            score: payload.metadata?.score,
            signalCategory: payload.metadata?.signalCategory,
            signalCategoryLiveEnabled: payload.metadata?.signalCategoryLiveEnabled,
            supportingSignalCategories: payload.metadata?.supportingSignalCategories,
            postingFamily: payload.metadata?.postingFamily,
            postingDecisionReason: payload.metadata?.postingDecisionReason,
            clearanceLabel: payload.metadata?.clearanceLabel,
            barrierClutterLabel: payload.metadata?.barrierClutterLabel,
            nearbyBarrierCount: payload.metadata?.nearbyBarrierCount,
            nextBarrierSide: payload.metadata?.nextBarrierSide,
            nextBarrierDistancePct: payload.metadata?.nextBarrierDistancePct,
            tacticalRead: payload.metadata?.tacticalRead,
            movementLabel: payload.metadata?.movementLabel,
            movementPct: payload.metadata?.movementPct,
            pressureLabel: payload.metadata?.pressureLabel,
            pressureScore: payload.metadata?.pressureScore,
            triggerQualityLabel: payload.metadata?.triggerQualityLabel,
            pathQualityLabel: payload.metadata?.pathQualityLabel,
            pathConstraintScore: payload.metadata?.pathConstraintScore,
            pathWindowDistancePct: payload.metadata?.pathWindowDistancePct,
            dipBuyQualityLabel: payload.metadata?.dipBuyQualityLabel,
            exhaustionLabel: payload.metadata?.exhaustionLabel,
            setupStateLabel: payload.metadata?.setupStateLabel,
            practicalStructureState: payload.metadata?.practicalStructureState,
            practicalStructureKey: payload.metadata?.practicalStructureKey,
            practicalZoneKey: payload.metadata?.practicalZoneKey,
            practicalStructureMaterialChange: payload.metadata?.practicalStructureMaterialChange,
            stableMarketStructureState: payload.metadata?.stableMarketStructureState,
            stableMarketStructurePreviousState: payload.metadata?.stableMarketStructurePreviousState,
            stableMarketStructureKey: payload.metadata?.stableMarketStructureKey,
            stableMarketStructureMaterialChange: payload.metadata?.stableMarketStructureMaterialChange,
            stableMarketStructureConfidence: payload.metadata?.stableMarketStructureConfidence,
            stableMarketStructureMaterialityScore: payload.metadata?.stableMarketStructureMaterialityScore,
            marketStructureStoryVisible: payload.metadata?.marketStructureStoryVisible,
            marketStructureStoryReason: payload.metadata?.marketStructureStoryReason,
            marketStructureStoryKeys: payload.metadata?.marketStructureStoryKeys,
            marketStructureStorySource: payload.metadata?.marketStructureStorySource,
            formalStructureTimeframe: payload.metadata?.formalStructureTimeframe,
            formalStructureBias: payload.metadata?.formalStructureBias,
            formalStructurePreviousBias: payload.metadata?.formalStructurePreviousBias,
            formalStructureEventType: payload.metadata?.formalStructureEventType,
            formalStructureEventFreshness: payload.metadata?.formalStructureEventFreshness,
            formalStructureTriggerTimestamp: payload.metadata?.formalStructureTriggerTimestamp,
            formalStructureConfirmation: payload.metadata?.formalStructureConfirmation,
            formalStructureConfidence: payload.metadata?.formalStructureConfidence,
            formalStructureConfidenceScore: payload.metadata?.formalStructureConfidenceScore,
            formalStructureMaterialChange: payload.metadata?.formalStructureMaterialChange,
            formalStructureBrokenSwingPrice: payload.metadata?.formalStructureBrokenSwingPrice,
            formalStructureSweptSwingPrice: payload.metadata?.formalStructureSweptSwingPrice,
            formalStructureProtectedHigh: payload.metadata?.formalStructureProtectedHigh,
            formalStructureProtectedLow: payload.metadata?.formalStructureProtectedLow,
            formalStructureLatestHigh: payload.metadata?.formalStructureLatestHigh,
            formalStructureLatestLow: payload.metadata?.formalStructureLatestLow,
            formalStructureSwingSequence: payload.metadata?.formalStructureSwingSequence,
            formalStructureKey: payload.metadata?.formalStructureKey,
            formalStructureTraderLine: payload.metadata?.formalStructureTraderLine,
            formalStructureDebugReasons: payload.metadata?.formalStructureDebugReasons,
            selectedFormalStructureTimeframe: payload.metadata?.selectedFormalStructureTimeframe,
            selectedFormalStructureBias: payload.metadata?.selectedFormalStructureBias,
            selectedFormalStructurePreviousBias: payload.metadata?.selectedFormalStructurePreviousBias,
            selectedFormalStructureEventType: payload.metadata?.selectedFormalStructureEventType,
            selectedFormalStructureEventFreshness: payload.metadata?.selectedFormalStructureEventFreshness,
            selectedFormalStructureTriggerTimestamp: payload.metadata?.selectedFormalStructureTriggerTimestamp,
            selectedFormalStructureConfirmation: payload.metadata?.selectedFormalStructureConfirmation,
            selectedFormalStructureConfidence: payload.metadata?.selectedFormalStructureConfidence,
            selectedFormalStructureConfidenceScore: payload.metadata?.selectedFormalStructureConfidenceScore,
            selectedFormalStructureMaterialChange: payload.metadata?.selectedFormalStructureMaterialChange,
            selectedFormalStructureBrokenSwingPrice: payload.metadata?.selectedFormalStructureBrokenSwingPrice,
            selectedFormalStructureSweptSwingPrice: payload.metadata?.selectedFormalStructureSweptSwingPrice,
            selectedFormalStructureProtectedHigh: payload.metadata?.selectedFormalStructureProtectedHigh,
            selectedFormalStructureProtectedLow: payload.metadata?.selectedFormalStructureProtectedLow,
            selectedFormalStructureLatestHigh: payload.metadata?.selectedFormalStructureLatestHigh,
            selectedFormalStructureLatestLow: payload.metadata?.selectedFormalStructureLatestLow,
            selectedFormalStructureSwingSequence: payload.metadata?.selectedFormalStructureSwingSequence,
            selectedFormalStructureKey: payload.metadata?.selectedFormalStructureKey,
            selectedFormalStructureTraderLine: payload.metadata?.selectedFormalStructureTraderLine,
            selectedFormalStructureDebugReasons: payload.metadata?.selectedFormalStructureDebugReasons,
            marketStructure: payload.metadata?.runtimeMarketStructure,
            volumeActivityLabel: payload.metadata?.volumeActivityLabel,
            volumeActivityReliability: payload.metadata?.volumeActivityReliability,
            volumeActivityRatio: payload.metadata?.volumeActivityRatio,
            volumeActivityDirection: payload.metadata?.volumeActivityDirection,
            volumeActivityShown: payload.metadata?.volumeActivityShown,
            volumeActivitySuppressedReason: payload.metadata?.volumeActivitySuppressedReason,
            tradeStoryState: payload.metadata?.tradeStoryState,
            rangeBoxLabel: payload.metadata?.rangeBoxLabel,
            rangeBoxWidthPct: payload.metadata?.rangeBoxWidthPct,
            acceptanceLabel: payload.metadata?.acceptanceLabel,
            acceptanceBeyondZonePct: payload.metadata?.acceptanceBeyondZonePct,
            supportImportanceLabel: payload.metadata?.supportImportanceLabel,
            behaviorBudgetLabel: payload.metadata?.behaviorBudgetLabel,
            behaviorBudgetMaxUsefulPosts: payload.metadata?.behaviorBudgetMaxUsefulPosts,
            primaryTradeAreaLocked: payload.metadata?.primaryTradeAreaLocked,
            primaryTradeAreaEscapeSide: payload.metadata?.primaryTradeAreaEscapeSide,
            primaryTradeAreaEscapeConfidence: payload.metadata?.primaryTradeAreaEscapeConfidence,
            failedLevelOutcome: payload.metadata?.failedLevelOutcome,
            failedLevelFailureCount: payload.metadata?.failedLevelFailureCount,
            levelImportanceLabel: payload.metadata?.levelImportanceLabel,
            levelImportanceScore: payload.metadata?.levelImportanceScore,
            failureRiskLabel: payload.metadata?.failureRiskLabel,
            tradeMapLabel: payload.metadata?.tradeMapLabel,
            riskPct: payload.metadata?.riskPct,
            roomToRiskRatio: payload.metadata?.roomToRiskRatio,
            targetSide: payload.metadata?.targetSide,
            targetPrice: payload.metadata?.targetPrice,
            targetDistancePct: payload.metadata?.targetDistancePct,
            crossedLevels: payload.metadata?.crossedLevels,
            clusterLow: payload.metadata?.clusterLow,
            clusterHigh: payload.metadata?.clusterHigh,
            clusteredLevelClear: payload.metadata?.clusteredLevelClear,
            followThroughLabel: payload.metadata?.followThroughLabel,
            progressLabel: payload.metadata?.progressLabel,
            continuityType: payload.metadata?.continuityType,
            aiGenerated: payload.metadata?.aiGenerated,
            directionalReturnPct: payload.metadata?.directionalReturnPct,
            rawReturnPct: payload.metadata?.rawReturnPct,
            repeatedOutcomeUpdate: payload.metadata?.repeatedOutcomeUpdate,
            whyPosted: payload.metadata?.whyPosted,
            postBudgetSymbolType: payload.metadata?.postBudgetSymbolType,
            noLevelReason: payload.metadata?.noLevelReason,
        };
    }
    shouldRetryAlert(payload) {
        return classifyLiveThreadMessage(payload.metadata?.messageKind) === "trader_critical";
    }
    async getThreadById(threadId) {
        return this.inner.getThreadById(threadId);
    }
    async findThreadByName(name) {
        return this.inner.findThreadByName(name);
    }
    async createThread(name) {
        try {
            const thread = await this.inner.createThread(name);
            this.recordPosted("create_thread", {
                threadId: thread.id,
                symbol: name,
                title: "thread_created",
                bodyPreview: `Created thread ${thread.name}`,
            });
            return thread;
        }
        catch (error) {
            this.recordFailed("create_thread", error, {
                symbol: name,
                title: "thread_create_failed",
                bodyPreview: `Failed to create thread ${name}`,
            });
        }
    }
    async sendMessage(threadId, payload) {
        const auditPayload = this.buildAlertAuditPayload(threadId, payload);
        const sendStartedAt = Date.now();
        try {
            await this.inner.sendMessage(threadId, payload);
            this.recordPosted("post_alert", auditPayload, {
                sendStartedAt,
                sendDurationMs: Date.now() - sendStartedAt,
            });
        }
        catch (error) {
            const failedAt = this.recordFailedAttempt("post_alert", error, auditPayload, {
                sendStartedAt,
                sendDurationMs: Date.now() - sendStartedAt,
            });
            const maxRetries = this.options.alertMaxRetries ?? DEFAULT_ALERT_MAX_RETRIES;
            if (!this.shouldRetryAlert(payload) || maxRetries <= 0) {
                throw error;
            }
            let lastError = error;
            for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
                await delay(this.options.alertRetryDelayMs ?? DEFAULT_ALERT_RETRY_DELAY_MS);
                const retryStartedAt = Date.now();
                try {
                    await this.inner.sendMessage(threadId, payload);
                    this.recordPosted("post_alert", {
                        ...auditPayload,
                        retryAttempt: attempt,
                        retryOf: failedAt,
                        retryReason: error instanceof Error ? error.message : String(error),
                    }, {
                        sendStartedAt: retryStartedAt,
                        sendDurationMs: Date.now() - retryStartedAt,
                    });
                    return;
                }
                catch (retryError) {
                    lastError = retryError;
                    if (attempt >= maxRetries) {
                        this.recordFailed("post_alert", retryError, {
                            ...auditPayload,
                            retryAttempt: attempt,
                            retryOf: failedAt,
                            retryReason: error instanceof Error ? error.message : String(error),
                        }, {
                            sendStartedAt: retryStartedAt,
                            sendDurationMs: Date.now() - retryStartedAt,
                        });
                    }
                }
            }
            throw lastError;
        }
    }
    async sendLevelSnapshot(threadId, payload) {
        const body = formatLevelSnapshotMessage(payload);
        const bodyPreview = `price ${payload.currentPrice}; support ${payload.supportZones.length}; ` +
            `resistance ${payload.resistanceZones.length}`;
        const snapshotAudit = buildSnapshotAuditPreview(payload.audit);
        const sendStartedAt = Date.now();
        try {
            await this.inner.sendLevelSnapshot(threadId, payload);
            this.recordPosted("post_level_snapshot", {
                threadId,
                symbol: payload.symbol,
                title: `${payload.symbol} support and resistance`,
                sourceTimestamp: payload.timestamp,
                body,
                bodyPreview,
                supportCount: payload.supportZones.length,
                resistanceCount: payload.resistanceZones.length,
                snapshotAudit,
                marketStructure: payload.marketStructure,
            }, {
                sendStartedAt,
                sendDurationMs: Date.now() - sendStartedAt,
            });
        }
        catch (error) {
            this.recordFailed("post_level_snapshot", error, {
                threadId,
                symbol: payload.symbol,
                title: `${payload.symbol} support and resistance`,
                sourceTimestamp: payload.timestamp,
                body,
                bodyPreview,
                supportCount: payload.supportZones.length,
                resistanceCount: payload.resistanceZones.length,
                snapshotAudit,
                marketStructure: payload.marketStructure,
            }, {
                sendStartedAt,
                sendDurationMs: Date.now() - sendStartedAt,
            });
        }
    }
    async sendLevelLadder(threadId, payload) {
        const body = formatLevelLadderMessage(payload);
        if (!body) {
            return;
        }
        const ladderSupportCount = payload.ladderSupportZones?.length ?? payload.supportZones.length;
        const ladderResistanceCount = payload.ladderResistanceZones?.length ?? payload.resistanceZones.length;
        const bodyPreview = `price ${payload.currentPrice}; support ${ladderSupportCount}; ` +
            `resistance ${ladderResistanceCount}`;
        const snapshotAudit = buildSnapshotAuditPreview(payload.audit);
        const sendStartedAt = Date.now();
        try {
            if (!this.inner.sendLevelLadder) {
                return;
            }
            await this.inner.sendLevelLadder(threadId, payload);
            this.recordPosted("post_level_ladder", {
                threadId,
                symbol: payload.symbol,
                title: `${payload.symbol} full level ladder`,
                sourceTimestamp: payload.timestamp,
                body,
                bodyPreview,
                supportCount: ladderSupportCount,
                resistanceCount: ladderResistanceCount,
                snapshotAudit,
            }, {
                sendStartedAt,
                sendDurationMs: Date.now() - sendStartedAt,
            });
        }
        catch (error) {
            this.recordFailed("post_level_ladder", error, {
                threadId,
                symbol: payload.symbol,
                title: `${payload.symbol} full level ladder`,
                sourceTimestamp: payload.timestamp,
                body,
                bodyPreview,
                supportCount: ladderSupportCount,
                resistanceCount: ladderResistanceCount,
                snapshotAudit,
            }, {
                sendStartedAt,
                sendDurationMs: Date.now() - sendStartedAt,
            });
        }
    }
    async sendLevelExtension(threadId, payload) {
        const body = formatLevelExtensionMessage(payload);
        const bodyPreview = `${payload.side} ${payload.levels.join(", ")}`;
        const sendStartedAt = Date.now();
        try {
            await this.inner.sendLevelExtension(threadId, payload);
            this.recordPosted("post_level_extension", {
                threadId,
                symbol: payload.symbol,
                title: `${payload.symbol} next levels to watch`,
                sourceTimestamp: payload.timestamp,
                body,
                bodyPreview: previewBody(bodyPreview),
                side: payload.side,
                levelCount: payload.levels.length,
            }, {
                sendStartedAt,
                sendDurationMs: Date.now() - sendStartedAt,
            });
        }
        catch (error) {
            this.recordFailed("post_level_extension", error, {
                threadId,
                symbol: payload.symbol,
                title: `${payload.symbol} next levels to watch`,
                sourceTimestamp: payload.timestamp,
                body,
                bodyPreview: previewBody(bodyPreview),
                side: payload.side,
                levelCount: payload.levels.length,
            }, {
                sendStartedAt,
                sendDurationMs: Date.now() - sendStartedAt,
            });
        }
    }
}
