import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
export function isMarketStructureLifecycleEvent(event) {
    return event.event.startsWith("market_structure_");
}
export function createConsoleManualWatchlistLifecycleListener() {
    return (event) => {
        console.log(JSON.stringify(event));
    };
}
export function createManualWatchlistLifecycleFileListener(filePath, options = {}) {
    return (event) => {
        if (options.include && !options.include(event)) {
            return;
        }
        try {
            mkdirSync(dirname(filePath), { recursive: true });
            appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf8");
        }
        catch (error) {
            if (options.onError) {
                options.onError(error, event);
                return;
            }
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[ManualWatchlistRuntime] Failed to write lifecycle event file: ${message}`);
        }
    };
}
export function createCompositeManualWatchlistLifecycleListener(listeners) {
    return (event) => {
        for (const listener of listeners) {
            listener(event);
        }
    };
}
