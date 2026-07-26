import {
  addExactDecimals,
  parseCurrencyCode,
  parseExactMoneyAmount,
  parseExactQuantity,
  type CurrencyCode,
  type ExactResult,
} from "../../domain/exact";
import type {
  CanonicalContentDigest,
  CanonicalExecutionDigest,
} from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateCanonicalDate,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateDigestArray,
  validateKeyArray,
  validateReasonCode,
  validateReasonCodes,
  validateTimestampValue,
  validateTimezone,
  type AnalyticalContractFailure,
} from "../contracts/contract-validation";
import type {
  CanonicalSession,
  CanonicalWeekday,
} from "../adapters/session-policy";

export const ANALYTICAL_ROW_VERSION = "ti_v3_analytical_row_v2" as const;

export type ExactMoneyFact = Readonly<
  | {
      readonly state: "available";
      readonly amount: string;
      readonly currency: CurrencyCode;
    }
  | {
      readonly state: "unavailable";
      readonly reasonCode: string;
    }
>;

export type ExactQuantityFact = Readonly<
  | { readonly state: "available"; readonly quantity: string }
  | { readonly state: "unavailable"; readonly reasonCode: string }
>;

/** Fee evidence intentionally travels with the analytical row.  A numeric
 * signedCharges value alone is not evidence that a hypothetical resize can
 * recompute charges (in particular, zero is not silently treated as free). */
export type SimulationFeeComponentKind =
  | "fixed"
  | "quantity_variable"
  | "notional_variable"
  | "sell_side_regulatory"
  | "non_scaling"
  | "unknown_undecomposed";

export type SimulationFeeAuthority = Readonly<
  | {
      readonly state:
        | "broker_reported_complete"
        | "account_policy_calculated";
      readonly components: readonly Readonly<{
        readonly kind: SimulationFeeComponentKind;
        readonly signedAmount: string;
      }>[];
    }
  | {
      readonly state: "broker_reported_partial" | "estimated";
      readonly components: readonly Readonly<{
        readonly kind: SimulationFeeComponentKind;
        readonly signedAmount: string;
      }>[];
      readonly reasonCode: string;
    }
  | { readonly state: "explicitly_zero" }
  | {
      readonly state: "not_included" | "unavailable";
      readonly reasonCode: string;
    }
>;

export interface AnalyticalRow {
  readonly schemaVersion: typeof ANALYTICAL_ROW_VERSION;
  readonly semanticRoundTripKey: string;
  readonly supportingExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly supportingOccurrenceKeys: readonly string[];
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly stableInstrumentKey: string;
  readonly displayedSymbol: string;
  readonly displayedSymbolStatus:
    | "non_authoritative_stable_symbol"
    | "non_authoritative_symbol_changed_first_entry_selected";
  readonly direction: "long" | "short";
  readonly currency: CurrencyCode;
  readonly firstEntryAt: string;
  readonly finalExitAt: string;
  readonly timezone: string;
  readonly dateBasis: "trade_close_date";
  readonly sessionDate: string;
  readonly weekday: CanonicalWeekday;
  readonly session: CanonicalSession;
  readonly sequenceInPartition: string;
  readonly grossPnl: string;
  readonly signedCharges: string;
  readonly netPnl: string;
  readonly entryNotional: ExactMoneyFact;
  readonly shareQuantity: ExactQuantityFact;
  readonly feeAuthority: SimulationFeeAuthority;
  readonly lifecycleState: "closed_flat_to_flat";
  readonly coverageState: "exact" | "limited";
  readonly evidenceQuality:
    | "verified_exact"
    | "verified_exact_with_limitations";
  readonly limitationCodes: readonly string[];
  readonly rowDigest: CanonicalContentDigest;
}

function parseFeeAuthority(
  input: unknown,
  signedCharges: string,
): ExactResult<SimulationFeeAuthority, AnalyticalContractFailure> {
  // Older analytical rows did not establish a fee-resizing authority. Preserve
  // their factual charges, but fail closed for a counterfactual resize.
  if (input === undefined) {
    return {
      ok: true,
      value: Object.freeze({
        state: "not_included",
        reasonCode: "ti_v3_fee_authority_not_included",
      }),
    };
  }
  const record = validateContractRecord(
    input,
    ["state"],
    ["components", "reasonCode"],
    "$.feeAuthority",
  );
  if (!record.ok) return record;
  if (record.value.state === "explicitly_zero") {
    if (
      Object.keys(record.value).length !== 1 ||
      signedCharges !== "0"
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.feeAuthority",
      );
    }
    return {
      ok: true,
      value: Object.freeze({ state: "explicitly_zero" }),
    };
  }
  if (record.value.state === "not_included" || record.value.state === "unavailable") {
    if (Object.keys(record.value).length !== 2) return contractFailure("ti_v3_analytics_contract_invalid", "$.feeAuthority");
    const reason = validateReasonCode(record.value.reasonCode, "$.feeAuthority.reasonCode");
    return reason.ok ? { ok: true, value: Object.freeze({ state: record.value.state, reasonCode: reason.value }) } : reason;
  }
  if (
    ![
      "broker_reported_complete",
      "account_policy_calculated",
      "broker_reported_partial",
      "estimated",
    ].includes(String(record.value.state)) ||
    !Array.isArray(record.value.components)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.feeAuthority",
    );
  }
  const components: Array<Readonly<{ readonly kind: SimulationFeeComponentKind; readonly signedAmount: string }>> = [];
  let total = "0";
  for (let index = 0; index < record.value.components.length; index += 1) {
    const component = validateContractRecord(record.value.components[index], ["kind", "signedAmount"], [], `$.feeAuthority.components[${index}]`);
    if (!component.ok || !["fixed", "quantity_variable", "notional_variable", "sell_side_regulatory", "non_scaling", "unknown_undecomposed"].includes(String(component.value.kind))) return contractFailure("ti_v3_analytics_contract_invalid", `$.feeAuthority.components[${index}]`);
    const amount = parseExactMoneyAmount(component.value.signedAmount);
    if (!amount.ok) return contractFailure("ti_v3_analytics_contract_invalid", `$.feeAuthority.components[${index}].signedAmount`);
    const current = parseExactMoneyAmount(total);
    if (!current.ok) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.feeAuthority.components",
      );
    }
    const next = addExactDecimals(current.value, amount.value);
    if (!next.ok) return contractFailure("ti_v3_analytics_contract_invalid", `$.feeAuthority.components[${index}].signedAmount`);
    total = next.value;
    components.push(Object.freeze({ kind: component.value.kind as SimulationFeeComponentKind, signedAmount: amount.value }));
  }
  const state = record.value.state as
    | "broker_reported_complete"
    | "account_policy_calculated"
    | "broker_reported_partial"
    | "estimated";
  if (
    (state === "broker_reported_complete" ||
      state === "account_policy_calculated") &&
    total !== signedCharges
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.feeAuthority.components",
    );
  }
  if (state === "broker_reported_partial" || state === "estimated") {
    const reason = validateReasonCode(
      record.value.reasonCode,
      "$.feeAuthority.reasonCode",
    );
    if (!reason.ok || Object.keys(record.value).length !== 3) {
      return reason.ok
        ? contractFailure(
            "ti_v3_analytics_contract_invalid",
            "$.feeAuthority",
          )
        : reason;
    }
    return {
      ok: true,
      value: Object.freeze({
        state,
        components: Object.freeze(components),
        reasonCode: reason.value,
      }),
    };
  }
  if (Object.keys(record.value).length !== 2) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.feeAuthority",
    );
  }
  return {
    ok: true,
    value: Object.freeze({
      state,
      components: Object.freeze(components),
    }),
  };
}

const WEEKDAYS = new Set<CanonicalWeekday>([
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]);
const SESSIONS = new Set<CanonicalSession>([
  "premarket", "regular", "after_hours", "overnight", "not_applicable",
]);

function parseMoneyFact(
  input: unknown,
  expectedCurrency: CurrencyCode,
  path: string,
): ExactResult<ExactMoneyFact, AnalyticalContractFailure> {
  const record = validateContractRecord(
    input,
    ["state"],
    ["amount", "currency", "reasonCode"],
    path,
  );
  if (!record.ok) return record;
  if (record.value.state === "available") {
    if (Object.keys(record.value).length !== 3) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const amount = parseExactMoneyAmount(record.value.amount);
    const currency = parseCurrencyCode(record.value.currency);
    if (!amount.ok) return contractFailure("ti_v3_analytics_contract_invalid", `${path}.amount`);
    if (!currency.ok || currency.value !== expectedCurrency) {
      return contractFailure("ti_v3_analytics_contract_currency_mismatch", `${path}.currency`);
    }
    return {
      ok: true,
      value: Object.freeze({ state: "available", amount: amount.value, currency: currency.value }),
    };
  }
  if (record.value.state === "unavailable") {
    if (Object.keys(record.value).length !== 2) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const reason = validateReasonCode(record.value.reasonCode, `${path}.reasonCode`);
    return reason.ok
      ? { ok: true, value: Object.freeze({ state: "unavailable", reasonCode: reason.value }) }
      : reason;
  }
  return contractFailure("ti_v3_analytics_contract_invalid", `${path}.state`);
}

function parseQuantityFact(
  input: unknown,
  path: string,
): ExactResult<ExactQuantityFact, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["state"], ["quantity", "reasonCode"], path);
  if (!record.ok) return record;
  if (record.value.state === "available") {
    if (Object.keys(record.value).length !== 2) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const quantity = parseExactQuantity(record.value.quantity);
    return quantity.ok
      ? { ok: true, value: Object.freeze({ state: "available", quantity: quantity.value }) }
      : contractFailure("ti_v3_analytics_contract_invalid", `${path}.quantity`);
  }
  if (record.value.state === "unavailable") {
    if (Object.keys(record.value).length !== 2) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const reason = validateReasonCode(record.value.reasonCode, `${path}.reasonCode`);
    return reason.ok
      ? { ok: true, value: Object.freeze({ state: "unavailable", reasonCode: reason.value }) }
      : reason;
  }
  return contractFailure("ti_v3_analytics_contract_invalid", `${path}.state`);
}

export function buildAnalyticalRow(
  input: unknown,
): ExactResult<AnalyticalRow, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "semanticRoundTripKey", "supportingExecutionDigests",
    "supportingOccurrenceKeys", "canonicalOwnerKey", "canonicalAccountKey",
    "stableInstrumentKey", "displayedSymbol", "displayedSymbolStatus", "direction",
    "currency", "firstEntryAt", "finalExitAt", "timezone", "dateBasis",
    "sessionDate", "weekday", "session", "sequenceInPartition", "grossPnl",
    "signedCharges", "netPnl", "entryNotional", "shareQuantity", "lifecycleState",
    "coverageState", "evidenceQuality", "limitationCodes",
  ], ["feeAuthority"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYTICAL_ROW_VERSION) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  }
  const roundTripKey = validateContractKey(record.value.semanticRoundTripKey, "$.semanticRoundTripKey", 512);
  if (!roundTripKey.ok) return roundTripKey;
  const executions = validateDigestArray(
    record.value.supportingExecutionDigests,
    "$.supportingExecutionDigests",
    "canonical_execution",
    1_000,
    true,
  );
  if (!executions.ok || executions.value.length === 0) {
    return executions.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", "$.supportingExecutionDigests")
      : executions;
  }
  const occurrences = validateKeyArray(
    record.value.supportingOccurrenceKeys,
    "$.supportingOccurrenceKeys",
    { maximumItems: 1_000, preserveOrder: true },
  );
  if (!occurrences.ok) return occurrences;
  if (occurrences.value.length !== executions.value.length) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.supportingOccurrenceKeys");
  }
  const owner = validateContractKey(record.value.canonicalOwnerKey, "$.canonicalOwnerKey");
  if (!owner.ok || !owner.value.startsWith("owner_")) return owner.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.canonicalOwnerKey") : owner;
  const account = validateContractKey(record.value.canonicalAccountKey, "$.canonicalAccountKey");
  if (!account.ok || !account.value.startsWith("account_")) return account.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.canonicalAccountKey") : account;
  const instrument = validateContractKey(record.value.stableInstrumentKey, "$.stableInstrumentKey");
  if (!instrument.ok || !instrument.value.startsWith("instrument_")) return instrument.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.stableInstrumentKey") : instrument;
  if (typeof record.value.displayedSymbol !== "string" || !/^[A-Z0-9._-]{1,32}$/.test(record.value.displayedSymbol)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.displayedSymbol");
  }
  const displayedSymbolStatus = record.value.displayedSymbolStatus;
  if (displayedSymbolStatus !== "non_authoritative_stable_symbol" && displayedSymbolStatus !== "non_authoritative_symbol_changed_first_entry_selected") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.displayedSymbolStatus");
  }
  if (record.value.direction !== "long" && record.value.direction !== "short") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.direction");
  }
  const currency = parseCurrencyCode(record.value.currency);
  if (!currency.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.currency");
  const firstEntryAt = validateTimestampValue(record.value.firstEntryAt, "$.firstEntryAt");
  if (!firstEntryAt.ok) return firstEntryAt;
  const finalExitAt = validateTimestampValue(record.value.finalExitAt, "$.finalExitAt");
  if (!finalExitAt.ok) return finalExitAt;
  if (firstEntryAt.value > finalExitAt.value) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.finalExitAt");
  }
  const timezone = validateTimezone(record.value.timezone, "$.timezone");
  if (!timezone.ok) return timezone;
  if (record.value.dateBasis !== "trade_close_date") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.dateBasis");
  }
  const sessionDate = validateCanonicalDate(record.value.sessionDate, "$.sessionDate");
  if (!sessionDate.ok) return sessionDate;
  if (typeof record.value.weekday !== "string" || !WEEKDAYS.has(record.value.weekday as CanonicalWeekday)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.weekday");
  }
  if (typeof record.value.session !== "string" || !SESSIONS.has(record.value.session as CanonicalSession)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.session");
  }
  const sequence = validateCanonicalCount(record.value.sequenceInPartition, "$.sequenceInPartition");
  if (!sequence.ok || sequence.value === "0") return sequence.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.sequenceInPartition") : sequence;
  const gross = parseExactMoneyAmount(record.value.grossPnl);
  const charges = parseExactMoneyAmount(record.value.signedCharges);
  const net = parseExactMoneyAmount(record.value.netPnl);
  if (!gross.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.grossPnl");
  if (!charges.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.signedCharges");
  if (!net.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.netPnl");
  const entryNotional = parseMoneyFact(record.value.entryNotional, currency.value, "$.entryNotional");
  if (!entryNotional.ok) return entryNotional;
  const shareQuantity = parseQuantityFact(record.value.shareQuantity, "$.shareQuantity");
  if (!shareQuantity.ok) return shareQuantity;
  const feeAuthority = parseFeeAuthority(record.value.feeAuthority, charges.value);
  if (!feeAuthority.ok) return feeAuthority;
  if (record.value.lifecycleState !== "closed_flat_to_flat") return contractFailure("ti_v3_analytics_contract_invalid", "$.lifecycleState");
  if (record.value.coverageState !== "exact" && record.value.coverageState !== "limited") return contractFailure("ti_v3_analytics_contract_invalid", "$.coverageState");
  if (record.value.evidenceQuality !== "verified_exact" && record.value.evidenceQuality !== "verified_exact_with_limitations") return contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceQuality");
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes");
  if (!limitations.ok) return limitations;
  if ((limitations.value.length === 0) !== (record.value.coverageState === "exact" && record.value.evidenceQuality === "verified_exact")) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.limitationCodes");
  }
  const content = {
    schemaVersion: ANALYTICAL_ROW_VERSION,
    semanticRoundTripKey: roundTripKey.value,
    supportingExecutionDigests: executions.value as readonly CanonicalExecutionDigest[],
    supportingOccurrenceKeys: occurrences.value,
    canonicalOwnerKey: owner.value,
    canonicalAccountKey: account.value,
    stableInstrumentKey: instrument.value,
    displayedSymbol: record.value.displayedSymbol,
    displayedSymbolStatus,
    direction: record.value.direction,
    currency: currency.value,
    firstEntryAt: firstEntryAt.value,
    finalExitAt: finalExitAt.value,
    timezone: timezone.value,
    dateBasis: "trade_close_date" as const,
    sessionDate: sessionDate.value,
    weekday: record.value.weekday as CanonicalWeekday,
    session: record.value.session as CanonicalSession,
    sequenceInPartition: sequence.value,
    grossPnl: gross.value,
    signedCharges: charges.value,
    netPnl: net.value,
    entryNotional: entryNotional.value,
    shareQuantity: shareQuantity.value,
    feeAuthority: feeAuthority.value,
    lifecycleState: "closed_flat_to_flat" as const,
    coverageState: record.value.coverageState,
    evidenceQuality: record.value.evidenceQuality,
    limitationCodes: limitations.value,
  };
  return finalizeContentAddressedAuthority("analytical_row", content, "rowDigest") as ExactResult<AnalyticalRow, AnalyticalContractFailure>;
}

export function verifyAnalyticalRow(
  input: unknown,
): ExactResult<AnalyticalRow, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "semanticRoundTripKey", "supportingExecutionDigests",
    "supportingOccurrenceKeys", "canonicalOwnerKey", "canonicalAccountKey",
    "stableInstrumentKey", "displayedSymbol", "displayedSymbolStatus", "direction",
    "currency", "firstEntryAt", "finalExitAt", "timezone", "dateBasis",
    "sessionDate", "weekday", "session", "sequenceInPartition", "grossPnl",
    "signedCharges", "netPnl", "entryNotional", "shareQuantity", "feeAuthority", "lifecycleState",
    "coverageState", "evidenceQuality", "limitationCodes", "rowDigest",
  ]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.rowDigest, "$.rowDigest", "analytical_row");
  if (!digest.ok) return digest;
  const { rowDigest: _rowDigest, ...content } = record.value;
  void _rowDigest;
  const rebuilt = buildAnalyticalRow(content);
  if (!rebuilt.ok || rebuilt.value.rowDigest !== digest.value) {
    return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.rowDigest");
  }
  return rebuilt;
}
