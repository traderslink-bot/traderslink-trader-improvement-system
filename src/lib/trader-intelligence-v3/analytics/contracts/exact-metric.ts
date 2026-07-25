import type { CurrencyCode, ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateCanonicalDate,
  validateCanonicalDecimalValue,
  validateCanonicalRatioValue,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateDateBasis,
  validateOptionalCurrency,
  validateReasonCode,
  validateTimestampValue,
  validateTimezone,
  validateUnit,
  type AnalyticalContractFailure,
} from "./contract-validation";
import { validateBoundedString } from "../../domain/foundation";

export const EXACT_METRIC_VALUE_VERSION = "ti_v3_exact_metric_value_v1" as const;
const MONETARY_UNITS = new Set(["money", "money_per_trade", "pnl", "charges", "notional"]);

export function exactMetricUnitRequiresCurrency(unit: string): boolean {
  return MONETARY_UNITS.has(unit);
}

interface ExactMetricBase {
  readonly schemaVersion: typeof EXACT_METRIC_VALUE_VERSION;
  readonly metricKey: string;
  readonly unit: string;
  readonly currency: CurrencyCode | null;
}

export type ExactMetricValue = Readonly<
  ExactMetricBase &
    (
      | { readonly kind: "exact_decimal"; readonly value: string }
      | {
          readonly kind: "exact_ratio";
          readonly numerator: string;
          readonly denominator: string;
        }
      | { readonly kind: "integer"; readonly value: string }
      | { readonly kind: "duration"; readonly nanoseconds: string }
      | {
          readonly kind: "timestamp";
          readonly value: string;
          readonly timezone: string;
          readonly dateBasis: string;
        }
      | {
          readonly kind: "date";
          readonly value: string;
          readonly timezone: string;
          readonly dateBasis: string;
        }
      | { readonly kind: "enum"; readonly value: string }
      | { readonly kind: "identity"; readonly value: string }
      | { readonly kind: "unavailable"; readonly reasonCode: string }
    ) & {
      readonly metricDigest: CanonicalContentDigest;
    }
>;

function parseBase(record: Record<string, unknown>): ExactResult<{
  readonly metricKey: string;
  readonly unit: string;
  readonly currency: CurrencyCode | null;
}, AnalyticalContractFailure> {
  if (record.schemaVersion !== EXACT_METRIC_VALUE_VERSION) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  }
  const metricKey = validateContractKey(record.metricKey, "$.metricKey");
  if (!metricKey.ok) return metricKey;
  const unit = validateUnit(record.unit, "$.unit");
  if (!unit.ok) return unit;
  const currency = validateOptionalCurrency(record.currency, "$.currency");
  if (!currency.ok) return currency;
  if (exactMetricUnitRequiresCurrency(unit.value) !== (currency.value !== null)) {
    return contractFailure("ti_v3_analytics_contract_unit_mismatch", "$.currency");
  }
  return {
    ok: true,
    value: Object.freeze({
      metricKey: metricKey.value,
      unit: unit.value,
      currency: currency.value,
    }),
  };
}

export function buildExactMetricValue(
  input: unknown,
): ExactResult<ExactMetricValue, AnalyticalContractFailure> {
  const envelope = validateContractRecord(
    input,
    ["schemaVersion", "metricKey", "kind", "unit", "currency", "value"],
    ["numerator", "denominator", "nanoseconds", "timezone", "dateBasis", "reasonCode"],
  );
  if (!envelope.ok) return envelope;
  const record = envelope.value;
  const commonFields = ["schemaVersion", "metricKey", "kind", "unit", "currency"];
  const kindFields: Readonly<Record<string, readonly string[]>> = Object.freeze({
    exact_decimal: ["value"],
    exact_ratio: ["value", "numerator", "denominator"],
    integer: ["value"],
    duration: ["value", "nanoseconds"],
    timestamp: ["value", "timezone", "dateBasis"],
    date: ["value", "timezone", "dateBasis"],
    enum: ["value"],
    identity: ["value"],
    unavailable: ["value", "reasonCode"],
  });
  const expectedFields = typeof record.kind === "string" ? kindFields[record.kind] : undefined;
  if (expectedFields === undefined) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.kind");
  }
  const allowedFields = new Set([...commonFields, ...expectedFields]);
  const unexpectedField = Object.keys(record).find((key) => !allowedFields.has(key));
  const missingField = [...allowedFields].find((key) => !Object.prototype.hasOwnProperty.call(record, key));
  if (unexpectedField !== undefined) {
    return contractFailure("ti_v3_validation_extra_field", `$.${unexpectedField}`);
  }
  if (missingField !== undefined) {
    return contractFailure("ti_v3_validation_required_field_missing", `$.${missingField}`);
  }
  const base = parseBase(record);
  if (!base.ok) return base;
  let content: object;
  switch (record.kind) {
    case "exact_decimal": {
      const value = validateCanonicalDecimalValue(record.value, "$.value");
      if (!value.ok) return value;
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, value: value.value };
      break;
    }
    case "exact_ratio": {
      const ratio = validateCanonicalRatioValue(record.numerator, record.denominator, "$");
      if (!ratio.ok) return ratio;
      if (record.value !== null) {
        return contractFailure("ti_v3_analytics_contract_invalid", "$.value");
      }
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, ...ratio.value };
      break;
    }
    case "integer": {
      const value = validateCanonicalCount(record.value, "$.value");
      if (!value.ok) return value;
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, value: value.value };
      break;
    }
    case "duration": {
      const nanoseconds = validateCanonicalCount(record.nanoseconds, "$.nanoseconds");
      if (!nanoseconds.ok) return nanoseconds;
      if (record.value !== null || base.value.unit !== "nanoseconds" || base.value.currency !== null) {
        return contractFailure("ti_v3_analytics_contract_unit_mismatch", "$");
      }
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, nanoseconds: nanoseconds.value };
      break;
    }
    case "timestamp": {
      const value = validateTimestampValue(record.value, "$.value");
      if (!value.ok) return value;
      const timezone = validateTimezone(record.timezone, "$.timezone");
      if (!timezone.ok) return timezone;
      const dateBasis = validateDateBasis(record.dateBasis, "$.dateBasis");
      if (!dateBasis.ok) return dateBasis;
      if (base.value.currency !== null) {
        return contractFailure("ti_v3_analytics_contract_currency_mismatch", "$.currency");
      }
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, value: value.value, timezone: timezone.value, dateBasis: dateBasis.value };
      break;
    }
    case "date": {
      const value = validateCanonicalDate(record.value, "$.value");
      if (!value.ok) return value;
      const timezone = validateTimezone(record.timezone, "$.timezone");
      if (!timezone.ok) return timezone;
      const dateBasis = validateDateBasis(record.dateBasis, "$.dateBasis");
      if (!dateBasis.ok) return dateBasis;
      if (base.value.currency !== null) {
        return contractFailure("ti_v3_analytics_contract_currency_mismatch", "$.currency");
      }
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, value: value.value, timezone: timezone.value, dateBasis: dateBasis.value };
      break;
    }
    case "enum": {
      const value = validateContractKey(record.value, "$.value");
      if (!value.ok) return value;
      if (base.value.currency !== null) {
        return contractFailure("ti_v3_analytics_contract_currency_mismatch", "$.currency");
      }
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, value: value.value };
      break;
    }
    case "identity": {
      // Source identities are B1 semanticRoundTripKey/candidateKey values.
      // Keep the exact metric bound aligned with those accepted source keys.
      const value = validateBoundedString(record.value, "$.value", /^[^\u0000-\u001f\u007f]+$/, 512);
      if (!value.ok) return value;
      if (base.value.currency !== null) {
        return contractFailure("ti_v3_analytics_contract_currency_mismatch", "$.currency");
      }
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, value: value.value };
      break;
    }
    case "unavailable": {
      const reason = validateReasonCode(record.reasonCode, "$.reasonCode");
      if (!reason.ok) return reason;
      if (record.value !== null) {
        return contractFailure("ti_v3_analytics_contract_invalid", "$.value");
      }
      content = { ...base.value, schemaVersion: EXACT_METRIC_VALUE_VERSION, kind: record.kind, reasonCode: reason.value };
      break;
    }
    default:
      return contractFailure("ti_v3_analytics_contract_invalid", "$.kind");
  }
  return finalizeContentAddressedAuthority("exact_metric", content, "metricDigest") as ExactResult<ExactMetricValue, AnalyticalContractFailure>;
}

export function verifyExactMetricValue(
  input: unknown,
): ExactResult<ExactMetricValue, AnalyticalContractFailure> {
  const record = validateContractRecord(
    input,
    ["schemaVersion", "metricKey", "kind", "unit", "currency", "metricDigest"],
    ["value", "numerator", "denominator", "nanoseconds", "timezone", "dateBasis", "reasonCode"],
  );
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.metricDigest, "$.metricDigest", "exact_metric");
  if (!digest.ok) return digest;
  const { metricDigest: _metricDigest, ...content } = record.value;
  void _metricDigest;
  const rebuilt = buildExactMetricValue({
    ...content,
    value: Object.prototype.hasOwnProperty.call(content, "value") ? content.value : null,
  });
  if (!rebuilt.ok || rebuilt.value.metricDigest !== digest.value) {
    return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.metricDigest");
  }
  return rebuilt;
}
