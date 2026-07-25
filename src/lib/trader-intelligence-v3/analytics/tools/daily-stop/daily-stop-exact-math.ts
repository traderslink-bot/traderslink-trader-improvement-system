import {
  GENERAL_EXACT_DECIMAL_BOUNDS,
  addExactDecimals,
  compareExactDecimals,
  createExactRatio,
  decimalToExactRatio,
  negateExactDecimal,
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactRatio,
} from "../../../domain/exact";
import {
  EXACT_METRIC_VALUE_VERSION,
  buildExactMetricValue,
  type ExactMetricValue,
} from "../../contracts/exact-metric";

function zero(): CanonicalDecimal {
  const result = validateExactDecimal("0", GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

export function compareDailyStopDecimals(left: string, right: string): -1 | 0 | 1 {
  const leftValue = validateExactDecimal(left, GENERAL_EXACT_DECIMAL_BOUNDS);
  const rightValue = validateExactDecimal(right, GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!leftValue.ok || !rightValue.ok) throw new Error("ti_v3_daily_stop_invalid_exact_decimal");
  return compareExactDecimals(leftValue.value, rightValue.value);
}

export function addDailyStopDecimals(values: readonly string[]): string {
  let total = zero();
  for (const value of values) {
    const parsed = validateExactDecimal(value, GENERAL_EXACT_DECIMAL_BOUNDS);
    if (!parsed.ok) throw new Error(parsed.error.code);
    const next = addExactDecimals(total, parsed.value);
    if (!next.ok) throw new Error(next.error.code);
    total = next.value;
  }
  return total;
}

export function subtractDailyStopDecimals(left: string, right: string): string {
  const parsedRight = validateExactDecimal(right, GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!parsedRight.ok) throw new Error(parsedRight.error.code);
  const negativeRight = negateExactDecimal(parsedRight.value);
  if (!negativeRight.ok) throw new Error(negativeRight.error.code);
  const parsedLeft = validateExactDecimal(left, GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!parsedLeft.ok) throw new Error(parsedLeft.error.code);
  const result = addExactDecimals(parsedLeft.value, negativeRight.value);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

export function absoluteDailyStopDecimal(value: string): string {
  return compareDailyStopDecimals(value, "0") < 0
    ? subtractDailyStopDecimals("0", value)
    : value;
}

function metric(input: Record<string, unknown>): ExactMetricValue {
  const result = buildExactMetricValue({
    schemaVersion: EXACT_METRIC_VALUE_VERSION,
    ...input,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

export function dailyStopDecimalMetric(
  metricKey: string,
  unit: string,
  currency: string,
  value: string,
): ExactMetricValue {
  return metric({ metricKey, kind: "exact_decimal", unit, currency, value });
}

export function dailyStopIntegerMetric(
  metricKey: string,
  value: string,
): ExactMetricValue {
  return metric({ metricKey, kind: "integer", unit: "count", currency: null, value });
}

export function dailyStopEnumMetric(
  metricKey: string,
  value: string,
): ExactMetricValue {
  return metric({ metricKey, kind: "enum", unit: "category", currency: null, value });
}

export function dailyStopIdentityMetric(
  metricKey: string,
  value: string,
): ExactMetricValue {
  return metric({ metricKey, kind: "identity", unit: "category", currency: null, value });
}

export function dailyStopDateMetric(
  metricKey: string,
  value: string,
  timezone: string,
  dateBasis: string,
): ExactMetricValue {
  return metric({ metricKey, kind: "date", unit: "date", currency: null, value, timezone, dateBasis });
}

export function dailyStopTimestampMetric(
  metricKey: string,
  value: string,
  timezone: string,
  dateBasis: string,
): ExactMetricValue {
  return metric({ metricKey, kind: "timestamp", unit: "timestamp", currency: null, value, timezone, dateBasis });
}

export function dailyStopUnavailableMetric(
  metricKey: string,
  unit: string,
  currency: string | null,
  reasonCode: string,
): ExactMetricValue {
  return metric({
    metricKey,
    kind: "unavailable",
    unit,
    currency,
    value: null,
    reasonCode,
  });
}

export function dailyStopRatioMetric(
  metricKey: string,
  numerator: string,
  denominator: string,
): ExactMetricValue {
  const ratio = createExactRatio(numerator, denominator);
  if (!ratio.ok) throw new Error(ratio.error.code);
  return metric({
    metricKey,
    kind: "exact_ratio",
    unit: "ratio",
    currency: null,
    value: null,
    numerator: ratio.value.numerator,
    denominator: ratio.value.denominator,
  });
}

export function dailyStopDecimalToRatio(value: string): ExactRatio {
  const parsed = validateExactDecimal(value, GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!parsed.ok) throw new Error(parsed.error.code);
  const ratio = decimalToExactRatio(parsed.value);
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratio.value;
}

export function dailyStopSubtractRatios(left: ExactRatio, right: ExactRatio): ExactRatio {
  const result = createExactRatio(
    (BigInt(left.numerator) * BigInt(right.denominator) - BigInt(right.numerator) * BigInt(left.denominator)).toString(),
    (BigInt(left.denominator) * BigInt(right.denominator)).toString(),
  );
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

export function dailyStopDirection(value: string): "helped" | "harmed" | "unchanged" {
  const comparison = compareDailyStopDecimals(value, "0");
  return comparison > 0 ? "helped" : comparison < 0 ? "harmed" : "unchanged";
}
