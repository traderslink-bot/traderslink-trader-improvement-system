import { compareUnicodeCodePoints } from "../../domain/canonical";
import {
  createExactRatio,
  parseCurrencyCode,
  validateExactDecimal,
  type CurrencyCode,
  type ExactResult,
} from "../../domain/exact";
import {
  validateArray,
  validateBoundedString,
  validateCanonicalDigest,
  validateCanonicalTimestamp,
  validateExactRecord,
  type FoundationValidationFailure,
} from "../../domain/foundation";
import {
  createCanonicalContentIdentity,
  type CanonicalContentDigest,
  type ContentIdentityDomain,
} from "../../domain/identity";

export const GA0_B1_CONTRACT_LIMITS = Object.freeze({
  maximumRows: 64,
  maximumColumns: 128,
  maximumClaims: 1_000,
  maximumSeriesPoints: 1_000,
  maximumEvidenceItems: 1_000,
  maximumDiagnostics: 1_000,
  maximumRegistryEntries: 128,
  maximumReasons: 128,
  maximumReferences: 1_000,
  maximumKeyLength: 256,
  maximumTextCodeLength: 512,
  maximumCountDigits: 38,
});

export type AnalyticalContractFailure = FoundationValidationFailure | {
  readonly code:
    | "ti_v3_analytics_contract_invalid"
    | "ti_v3_analytics_contract_duplicate_identity"
    | "ti_v3_analytics_contract_digest_mismatch"
    | "ti_v3_analytics_contract_count_invalid"
    | "ti_v3_analytics_contract_count_mismatch"
    | "ti_v3_analytics_contract_currency_mismatch"
    | "ti_v3_analytics_contract_unit_mismatch"
    | "ti_v3_analytics_contract_reference_mismatch"
    | "ti_v3_analytics_contract_oversized";
  readonly path: string;
};

export function contractFailure(
  code: AnalyticalContractFailure["code"],
  path: string,
): ExactResult<never, AnalyticalContractFailure> {
  return { ok: false, error: { code, path } };
}

export function preflightTopLevelArrayLimit(
  input: unknown,
  key: string,
  maximumItems: number,
): ExactResult<true, AnalyticalContractFailure> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$");
  }
  try {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (descriptor === undefined) return { ok: true, value: true };
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) {
      return contractFailure("ti_v3_analytics_contract_invalid", `$.${key}`);
    }
    if (!Array.isArray(descriptor.value)) {
      return contractFailure("ti_v3_analytics_contract_invalid", `$.${key}`);
    }
    if (descriptor.value.length > maximumItems) {
      return contractFailure("ti_v3_analytics_contract_oversized", `$.${key}`);
    }
  } catch {
    return contractFailure("ti_v3_analytics_contract_invalid", `$.${key}`);
  }
  return { ok: true, value: true };
}

export function validateContractRecord(
  input: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[] = [],
  path = "$",
): ExactResult<Record<string, unknown>, AnalyticalContractFailure> {
  return validateExactRecord(input, requiredKeys, optionalKeys, path);
}

export function validateContractKey(
  input: unknown,
  path: string,
  maximumLength: number = GA0_B1_CONTRACT_LIMITS.maximumKeyLength,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateBoundedString(
    input,
    path,
    /^[a-z0-9][a-z0-9:._/-]*$/,
    maximumLength,
  );
  return value.ok ? value : contractFailure(value.error.code, value.error.path);
}

export function validateContractVersion(
  input: unknown,
  path: string,
): ExactResult<`v${number}`, AnalyticalContractFailure> {
  const value = validateBoundedString(input, path, /^v[1-9][0-9]*$/, 16);
  return value.ok
    ? { ok: true, value: value.value as `v${number}` }
    : contractFailure(value.error.code, value.error.path);
}

export function validateReasonCode(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateBoundedString(input, path, /^ti_v3_[a-z0-9_]{1,160}$/, 168);
  return value.ok ? value : contractFailure(value.error.code, value.error.path);
}

export function validateUnit(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateBoundedString(input, path, /^[a-z][a-z0-9_]{0,79}$/, 80);
  return value.ok ? value : contractFailure(value.error.code, value.error.path);
}

export function validateTimezone(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateBoundedString(
    input,
    path,
    /^(?:UTC|[A-Za-z_+-]+\/[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)*)$/,
    80,
  );
  return value.ok ? value : contractFailure(value.error.code, value.error.path);
}

export function validateDateBasis(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateBoundedString(input, path, /^[a-z][a-z0-9_]{0,79}$/, 80);
  return value.ok ? value : contractFailure(value.error.code, value.error.path);
}

export function validateCanonicalDate(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  const year = BigInt(input.slice(0, 4));
  const month = BigInt(input.slice(5, 7));
  const day = BigInt(input.slice(8, 10));
  const leap =
    year % BigInt(4) === BigInt(0) &&
    (year % BigInt(100) !== BigInt(0) || year % BigInt(400) === BigInt(0));
  const daysByMonth: Readonly<Record<string, bigint>> = Object.freeze({
    "1": BigInt(31),
    "2": leap ? BigInt(29) : BigInt(28),
    "3": BigInt(31),
    "4": BigInt(30),
    "5": BigInt(31),
    "6": BigInt(30),
    "7": BigInt(31),
    "8": BigInt(31),
    "9": BigInt(30),
    "10": BigInt(31),
    "11": BigInt(30),
    "12": BigInt(31),
  });
  const maximumDay = daysByMonth[month.toString()];
  if (
    year < BigInt(1970) ||
    year > BigInt(2100) ||
    maximumDay === undefined ||
    day < BigInt(1) ||
    day > maximumDay
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  return { ok: true, value: input };
}

export function validateCanonicalCount(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  if (
    typeof input !== "string" ||
    !/^(?:0|[1-9][0-9]*)$/.test(input) ||
    input.length > GA0_B1_CONTRACT_LIMITS.maximumCountDigits
  ) {
    return contractFailure("ti_v3_analytics_contract_count_invalid", path);
  }
  return { ok: true, value: input };
}

export function countFromLength(
  length: number,
  path = "$",
): ExactResult<string, AnalyticalContractFailure> {
  if (!Number.isSafeInteger(length) || length < 0) {
    return contractFailure("ti_v3_analytics_contract_count_invalid", path);
  }
  return { ok: true, value: String(length) };
}

export function countsReconcile(
  candidateCount: string,
  includedCount: string,
  excludedCount: string,
): boolean {
  return BigInt(candidateCount) === BigInt(includedCount) + BigInt(excludedCount);
}

export function validateCanonicalDecimalValue(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateExactDecimal(input);
  if (!value.ok || value.value !== input) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  return { ok: true, value: value.value };
}

export function validateCanonicalRatioValue(
  numerator: unknown,
  denominator: unknown,
  path: string,
): ExactResult<Readonly<{ numerator: string; denominator: string }>, AnalyticalContractFailure> {
  if (typeof numerator !== "string" || typeof denominator !== "string") {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  const ratio = createExactRatio(numerator, denominator);
  if (
    !ratio.ok ||
    ratio.value.numerator !== numerator ||
    ratio.value.denominator !== denominator
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  return {
    ok: true,
    value: Object.freeze({ numerator, denominator }),
  };
}

export function validateOptionalCurrency(
  input: unknown,
  path: string,
): ExactResult<CurrencyCode | null, AnalyticalContractFailure> {
  if (input === null) return { ok: true, value: null };
  const currency = parseCurrencyCode(input);
  return currency.ok
    ? currency
    : contractFailure("ti_v3_analytics_contract_invalid", path);
}

export function validateReasonCodes(
  input: unknown,
  path: string,
  maximumItems: number = GA0_B1_CONTRACT_LIMITS.maximumReasons,
): ExactResult<readonly string[], AnalyticalContractFailure> {
  const array = validateArray(input, path, maximumItems);
  if (!array.ok) return contractFailure(array.error.code, array.error.path);
  const values: string[] = [];
  for (let index = 0; index < array.value.length; index += 1) {
    const value = validateReasonCode(array.value[index], `${path}[${index}]`);
    if (!value.ok) return value;
    values.push(value.value);
  }
  if (new Set(values).size !== values.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  }
  return { ok: true, value: Object.freeze([...values].sort(compareUnicodeCodePoints)) };
}

export interface ValidateKeyArrayOptions {
  readonly maximumItems?: number;
  readonly maximumKeyLength?: number;
  readonly preserveOrder?: boolean;
}

export function validateKeyArray(
  input: unknown,
  path: string,
  options: ValidateKeyArrayOptions = {},
): ExactResult<readonly string[], AnalyticalContractFailure> {
  const array = validateArray(input, path, options.maximumItems ?? GA0_B1_CONTRACT_LIMITS.maximumReferences);
  if (!array.ok) return contractFailure(array.error.code, array.error.path);
  const values: string[] = [];
  for (let index = 0; index < array.value.length; index += 1) {
    const value = validateContractKey(array.value[index], `${path}[${index}]`, options.maximumKeyLength ?? GA0_B1_CONTRACT_LIMITS.maximumKeyLength);
    if (!value.ok) return value;
    values.push(value.value);
  }
  if (new Set(values).size !== values.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  }
  return {
    ok: true,
    value: Object.freeze(options.preserveOrder ? values : [...values].sort(compareUnicodeCodePoints)),
  };
}

export function validateDigestArray(
  input: unknown,
  path: string,
  expectedDomain?: string,
  maximumItems: number = GA0_B1_CONTRACT_LIMITS.maximumReferences,
  preserveOrder = false,
): ExactResult<readonly CanonicalContentDigest[], AnalyticalContractFailure> {
  const array = validateArray(input, path, maximumItems);
  if (!array.ok) return contractFailure(array.error.code, array.error.path);
  const values: CanonicalContentDigest[] = [];
  for (let index = 0; index < array.value.length; index += 1) {
    const value = validateCanonicalDigest(
      array.value[index],
      `${path}[${index}]`,
      expectedDomain,
    );
    if (!value.ok) return contractFailure(value.error.code, value.error.path);
    values.push(value.value);
  }
  if (new Set(values).size !== values.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  }
  return {
    ok: true,
    value: Object.freeze(
      preserveOrder ? values : [...values].sort(compareUnicodeCodePoints),
    ),
  };
}

export function validateTimestampValue(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateCanonicalTimestamp(input, path);
  return value.ok ? value : contractFailure(value.error.code, value.error.path);
}

export function finalizeContentAddressedAuthority<
  TContent extends object,
  TDigestField extends string,
>(
  domain: ContentIdentityDomain,
  content: TContent,
  digestField: TDigestField,
): ExactResult<Readonly<TContent & Record<TDigestField, CanonicalContentDigest>>, AnalyticalContractFailure> {
  const identity = createCanonicalContentIdentity(domain, "v1", content);
  if (!identity.ok) {
    return contractFailure(identity.error.code, identity.error.path);
  }
  const canonical = identity.value.canonicalValue as unknown as TContent;
  return {
    ok: true,
    value: Object.freeze({
      ...canonical,
      [digestField]: identity.value.identifier,
    }) as Readonly<TContent & Record<TDigestField, CanonicalContentDigest>>,
  };
}

export function validateClaimedDigest(
  input: unknown,
  path: string,
  expectedDomain: string,
): ExactResult<CanonicalContentDigest, AnalyticalContractFailure> {
  const digest = validateCanonicalDigest(input, path, expectedDomain);
  return digest.ok
    ? digest
    : contractFailure(digest.error.code, digest.error.path);
}
