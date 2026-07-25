import type { CounterfactualRule } from "./simulation-plan";

export const RULE_STATE_DEPENDENCY_POLICY_VERSION =
  "ti_v3_rule_state_dependency_policy_v1" as const;

export interface RuleStateDependencies {
  readonly policyVersion: typeof RULE_STATE_DEPENDENCY_POLICY_VERSION;
  readonly executedEntryCount: boolean;
  readonly completedRealizedOutcome: boolean;
  readonly completedLossStreak: boolean;
  readonly realizedDailyPnl: boolean;
  readonly priorCompletionTimestamp: boolean;
  readonly tickerAttemptState: boolean;
  readonly entryTimeCutoff: boolean;
  readonly sizeAuthority: boolean;
  readonly sessionStopState: boolean;
}

type RuleKind = CounterfactualRule["kind"];
type DependencyFlags = Omit<RuleStateDependencies, "policyVersion">;
type MutableDependencyFlags = {
  -readonly [Key in keyof DependencyFlags]: DependencyFlags[Key];
};

const NONE: DependencyFlags = Object.freeze({
  executedEntryCount: false,
  completedRealizedOutcome: false,
  completedLossStreak: false,
  realizedDailyPnl: false,
  priorCompletionTimestamp: false,
  tickerAttemptState: false,
  entryTimeCutoff: false,
  sizeAuthority: false,
  sessionStopState: false,
});

const RULE_DEPENDENCIES: Readonly<Record<RuleKind, DependencyFlags>> =
  Object.freeze({
    direction_only: NONE,
    maximum_trades_per_day: Object.freeze({
      ...NONE,
      executedEntryCount: true,
    }),
    stop_after_consecutive_losses: Object.freeze({
      ...NONE,
      completedRealizedOutcome: true,
      completedLossStreak: true,
      priorCompletionTimestamp: true,
      sessionStopState: true,
    }),
  });

export function resolveCounterfactualRuleStateDependencies(
  rules: readonly CounterfactualRule[],
): RuleStateDependencies {
  const resolved: MutableDependencyFlags = { ...NONE };
  for (const rule of rules) {
    const declaration = RULE_DEPENDENCIES[rule.kind];
    for (const key of Object.keys(NONE) as Array<keyof DependencyFlags>) {
      resolved[key] = resolved[key] || declaration[key];
    }
  }
  return Object.freeze({
    policyVersion: RULE_STATE_DEPENDENCY_POLICY_VERSION,
    ...resolved,
  });
}
