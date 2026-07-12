import type { AlertPayload, IntelligentAlert } from "../alerts/alert-types.js";
import type { MonitoringEventType } from "../monitoring/monitoring-types.js";
import { type SignalCategoryKey } from "./signal-category-config.js";
export type SignalCategoryRoute = {
    primaryCategory: SignalCategoryKey;
    supportingCategories: SignalCategoryKey[];
};
export declare function routeMonitoringEventToSignalCategory(eventType: MonitoringEventType): SignalCategoryRoute;
export declare function routeMessageKindToSignalCategory(params: {
    messageKind?: NonNullable<NonNullable<AlertPayload["metadata"]>["messageKind"]>;
    eventType?: MonitoringEventType;
}): SignalCategoryRoute;
export declare function routeThreadMessageKindToSignalCategory(params: {
    messageKind?: string;
    eventType?: string;
}): SignalCategoryRoute;
export declare function resolvePrimarySignalCategoryForAlert(alert: IntelligentAlert): SignalCategoryKey;
export declare function resolveSupportingSignalCategoriesForAlert(alert: IntelligentAlert): SignalCategoryKey[];
export declare function isAlertPrimaryCategoryLiveEnabled(alert: IntelligentAlert): boolean;
export declare function isSignalCategoryLiveEnabled(category: SignalCategoryKey): boolean;
export declare function explainSignalCategoryLiveSuppression(alert: IntelligentAlert): string | null;
//# sourceMappingURL=signal-category-routing.d.ts.map