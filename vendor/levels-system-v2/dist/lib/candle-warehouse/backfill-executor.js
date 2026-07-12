import { groupBackfillTasksIntoProviderBatches, planWarehouseMissingCandleBackfill, } from "./bulk-backfill-planner.js";
function sleep(ms) {
    return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}
function clampPositiveInteger(value, fallback) {
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}
function lookbackBarsForTask(task) {
    return Math.max(task.lookbackBars, task.missingCandleCountEstimate);
}
function plannedResult(task) {
    return {
        symbol: task.symbol,
        timeframe: task.timeframe,
        sessionDate: task.sessionDate,
        status: "planned",
        readiness: "safe_to_fetch",
        requestedLookbackBars: lookbackBarsForTask(task),
        missingRangeCount: task.missingRanges.length,
        missingCandleCountEstimate: task.missingCandleCountEstimate,
        fetchedCandles: 0,
        storedCandles: 0,
        error: null,
    };
}
function normalizeTaskKey(key) {
    return `${key.provider ?? "*"}:${key.symbol.trim().toUpperCase()}:${key.sessionDate}:${key.timeframe}`;
}
function taskMatchesKey(task, keys) {
    return keys.has(normalizeTaskKey(task)) ||
        keys.has(normalizeTaskKey({
            symbol: task.symbol,
            sessionDate: task.sessionDate,
            timeframe: task.timeframe,
        }));
}
function filterPlanByKeys(plan, keys, request) {
    if (!keys || keys.length === 0) {
        return plan;
    }
    const keySet = new Set(keys.map(normalizeTaskKey));
    const tasks = plan.tasks.filter((task) => taskMatchesKey(task, keySet));
    return {
        ...plan,
        tasks,
        providerBatches: groupBackfillTasksIntoProviderBatches(tasks, request.batching),
        estimatedCandleCount: tasks.reduce((sum, task) => sum + (task.estimatedCandleCount ?? 0), 0),
        maxTaskEstimatedCandles: tasks.reduce((max, task) => Math.max(max, task.estimatedCandleCount ?? 0), 0),
        plannedTaskCount: tasks.length,
        missingTaskCount: tasks.length,
        fullyCoveredTaskCount: 0,
        missingCandleCountEstimate: tasks.reduce((sum, task) => sum + task.missingCandleCountEstimate, 0),
    };
}
async function runTask(params) {
    const lookbackBars = lookbackBarsForTask(params.task);
    try {
        const response = await params.request.fetchClient.fetchCandles({
            symbol: params.task.symbol,
            timeframe: params.task.timeframe,
            lookbackBars,
            endTimeMs: params.task.endTimestamp,
            preferredProvider: params.task.provider,
        });
        const coverage = await params.request.warehouse.upsertCandles({
            provider: response.provider,
            symbol: response.symbol,
            timeframe: response.timeframe,
            candles: response.candles,
            sourceFetchedAt: response.fetchEndTimestamp,
            sourceMetadata: {
                sourceFetchedAt: response.fetchEndTimestamp,
                provider: response.provider,
                requestedSymbol: String(response.providerMetadata?.ibkrRequestedSymbol ?? response.symbol),
                resolvedSymbol: String(response.providerMetadata?.ibkrResolvedSymbol ?? response.symbol),
                resolvedConId: typeof response.providerMetadata?.ibkrResolvedConId === "number"
                    ? response.providerMetadata.ibkrResolvedConId
                    : null,
                resolvedExchange: typeof response.providerMetadata?.ibkrResolvedExchange === "string"
                    ? response.providerMetadata.ibkrResolvedExchange
                    : null,
                resolvedPrimaryExchange: typeof response.providerMetadata?.ibkrResolvedPrimaryExchange === "string"
                    ? response.providerMetadata.ibkrResolvedPrimaryExchange
                    : null,
                whatToShow: typeof response.providerMetadata?.whatToShow === "string"
                    ? response.providerMetadata.whatToShow
                    : null,
                useRTH: typeof response.providerMetadata?.useRTH === "boolean"
                    ? response.providerMetadata.useRTH
                    : null,
                providerAdjustmentMode: response.providerMetadata?.providerAdjustmentMode === "raw" ||
                    response.providerMetadata?.providerAdjustmentMode === "split_adjusted" ||
                    response.providerMetadata?.providerAdjustmentMode === "unknown"
                    ? response.providerMetadata.providerAdjustmentMode
                    : "raw",
                warehouseAdjustmentMode: "raw",
                aliasUsed: response.providerMetadata?.ibkrContractAliasUsed === true,
                aliasReason: typeof response.providerMetadata?.ibkrHistoricalAliasReason === "string"
                    ? response.providerMetadata.ibkrHistoricalAliasReason
                    : null,
                basisValidationStatus: "basis_unchecked",
            },
        });
        return {
            ...plannedResult(params.task),
            status: "fetched",
            readiness: "refreshed",
            fetchedCandles: response.actualBarsReturned,
            storedCandles: coverage.candleCount,
        };
    }
    catch (error) {
        return {
            ...plannedResult(params.task),
            status: "failed",
            readiness: "provider_risk",
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
async function runWithConcurrency(items, concurrency, worker) {
    let nextIndex = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (nextIndex < items.length) {
            const item = items[nextIndex];
            nextIndex += 1;
            await worker(item);
        }
    }));
}
export async function executeCandleWarehouseBackfill(request) {
    const mode = request.mode ?? "dry_run";
    const provider = request.provider ?? request.fetchClient.getProviderName();
    const fullPlan = await planWarehouseMissingCandleBackfill({
        ...request,
        provider,
        warehouse: request.warehouse,
    });
    const plan = filterPlanByKeys(fullPlan, request.taskFilterKeys, request);
    const selectedTasks = typeof request.maxTasks === "number" && Number.isFinite(request.maxTasks)
        ? plan.tasks.slice(0, request.maxTasks)
        : plan.tasks;
    if (mode === "dry_run") {
        const taskResults = selectedTasks.map(plannedResult);
        return {
            generatedAt: new Date().toISOString(),
            mode,
            provider,
            plan,
            totals: {
                plannedTasks: selectedTasks.length,
                attemptedTasks: 0,
                fetchedTasks: 0,
                skippedTasks: selectedTasks.length,
                failedTasks: 0,
                fetchedCandles: 0,
                storedCandles: 0,
            },
            taskResults,
        };
    }
    const concurrency = clampPositiveInteger(request.concurrency, 1);
    const throttleMs = Math.max(0, request.throttleMs ?? 0);
    const taskResults = [];
    await runWithConcurrency(selectedTasks, concurrency, async (task) => {
        if (throttleMs > 0) {
            await sleep(throttleMs);
        }
        taskResults.push(await runTask({ task, request: { ...request, provider } }));
    });
    return {
        generatedAt: new Date().toISOString(),
        mode,
        provider,
        plan,
        totals: {
            plannedTasks: selectedTasks.length,
            attemptedTasks: selectedTasks.length,
            fetchedTasks: taskResults.filter((task) => task.status === "fetched").length,
            skippedTasks: 0,
            failedTasks: taskResults.filter((task) => task.status === "failed").length,
            fetchedCandles: taskResults.reduce((sum, task) => sum + task.fetchedCandles, 0),
            storedCandles: taskResults.reduce((sum, task) => sum + task.storedCandles, 0),
        },
        taskResults: taskResults.sort((left, right) => left.symbol.localeCompare(right.symbol) || left.timeframe.localeCompare(right.timeframe)),
    };
}
