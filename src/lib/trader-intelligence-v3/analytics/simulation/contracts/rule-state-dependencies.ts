import type { CounterfactualRule } from "./simulation-plan";

export const RULE_STATE_DEPENDENCY_POLICY_VERSION =
  "ti_v3_rule_state_dependency_policy_v3" as const;

export interface RuleStateDependencies {
  readonly policyVersion: typeof RULE_STATE_DEPENDENCY_POLICY_VERSION;
  readonly executedEntryCount: boolean;
  readonly completedRealizedOutcome: boolean;
  readonly completedLossStreak: boolean;
  readonly realizedDailyPnl: boolean;
  readonly peakRealizedDailyPnl: boolean;
  readonly priorCompletionTimestamp: boolean;
  readonly tickerAttemptState: boolean;
  readonly tickerLosingAttemptState: boolean;
  readonly tickerStopState: boolean;
  readonly entryTimeCutoff: boolean;
  readonly entryPriceAuthority: boolean;
  readonly cooldownUntilState: boolean;
  readonly priorCompletedOutcome: boolean;
  readonly afterOutcomeExclusionState: boolean;
  readonly sizeAuthority: boolean;
  readonly sessionStopState: boolean;
  readonly pendingResizeAfterLossState: boolean;
  readonly feeAuthority: boolean;
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
  peakRealizedDailyPnl: false,
  priorCompletionTimestamp: false,
  tickerAttemptState: false,
  tickerLosingAttemptState: false,
  tickerStopState: false,
  entryTimeCutoff: false,
  entryPriceAuthority: false,
  cooldownUntilState: false,
  priorCompletedOutcome: false,
  afterOutcomeExclusionState: false,
  sizeAuthority: false,
  sessionStopState: false,
  pendingResizeAfterLossState: false,
  feeAuthority: false,
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
    stop_after_daily_dollar_drawdown: Object.freeze({
      ...NONE,
      completedRealizedOutcome: true,
      realizedDailyPnl: true,
      priorCompletionTimestamp: true,
      sessionStopState: true,
    }),
    stop_after_profit_giveback: Object.freeze({
      ...NONE,
      completedRealizedOutcome: true,
      realizedDailyPnl: true,
      peakRealizedDailyPnl: true,
      priorCompletionTimestamp: true,
      sessionStopState: true,
    }),
    wait_after_loss: Object.freeze({
      ...NONE,
      completedRealizedOutcome: true,
      priorCompletionTimestamp: true,
      cooldownUntilState: true,
    }),
    maximum_attempts_per_ticker: Object.freeze({
      ...NONE,
      tickerAttemptState: true,
    }),
    stop_after_losing_ticker_attempts: Object.freeze({
      ...NONE,
      completedRealizedOutcome: true,
      priorCompletionTimestamp: true,
      tickerLosingAttemptState: true,
      tickerStopState: true,
    }),
    no_new_trades_after_time: Object.freeze({
      ...NONE,
      entryTimeCutoff: true,
    }),
    exclude_entry_price_range: Object.freeze({
      ...NONE,
      entryPriceAuthority: true,
    }),
    after_outcome_exclusion: Object.freeze({
      ...NONE,
      completedRealizedOutcome: true,
      priorCompletionTimestamp: true,
      priorCompletedOutcome: true,
      afterOutcomeExclusionState: true,
    }),
    reduce_size_after_loss: Object.freeze({
      ...NONE,
      completedRealizedOutcome: true,
      priorCompletionTimestamp: true,
      pendingResizeAfterLossState: true,
      sizeAuthority: true,
      feeAuthority: true,
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
