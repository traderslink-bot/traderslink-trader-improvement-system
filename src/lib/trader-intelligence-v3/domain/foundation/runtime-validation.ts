import type { CanonicalUtcTimestamp } from "../canonical";
import { isProxy } from "node:util/types";
import { compareUnicodeCodePoints, parseCanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import { parseCanonicalContentDigest, type CanonicalContentDigest } from "../identity";

export const FOUNDATION_PAYLOAD_LIMITS = Object.freeze({
  maxArrayItems: 25_000,
  maxObjectKeys: 128,
  maxStringLength: 4_096,
  maxPropertyKeyLength: 4_096,
  maxReasonCodes: 128,
  maxDepth: 64,
  // GA1-C replay issuance revalidates a complete bounded 10,000-outcome
  // simulation result. Keep these aligned with canonical serialization's hard
  // graph budgets so a valid digestible result is also runtime-validatable.
  maxNodes: 4_000_000,
  maxAggregateStringLength: 67_108_864,
  maxTotalKeys: 1_250_000,
});

export type FoundationValidationFailureCode =
  | "ti_v3_validation_input_invalid"
  | "ti_v3_validation_extra_field"
  | "ti_v3_validation_required_field_missing"
  | "ti_v3_validation_string_invalid"
  | "ti_v3_validation_enum_invalid"
  | "ti_v3_validation_boolean_invalid"
  | "ti_v3_validation_array_invalid"
  | "ti_v3_validation_payload_oversized"
  | "ti_v3_validation_timestamp_invalid"
  | "ti_v3_validation_digest_invalid"
  | "ti_v3_validation_temporal_order_invalid";

export interface FoundationValidationFailure {
  readonly code: FoundationValidationFailureCode | string;
  readonly path: string;
}

export function validationFailure(
  code: FoundationValidationFailure["code"],
  path: string,
): ExactResult<never, FoundationValidationFailure> {
  return { ok: false, error: { code, path } };
}

interface InspectionContext {
  readonly active: WeakSet<object>;
  nodes: number;
  keys: number;
  aggregateStringLength: number;
}

export type AuthorityFieldVerifier = (value: unknown) => boolean;

function inspectUnknown(value: unknown, path: string, context: InspectionContext, depth: number, rootAuthorities?: ReadonlyMap<string, AuthorityFieldVerifier>): ExactResult<unknown, FoundationValidationFailure> {
  if (depth > FOUNDATION_PAYLOAD_LIMITS.maxDepth) return validationFailure("ti_v3_validation_payload_oversized", path);
  context.nodes += 1;
  if (context.nodes > FOUNDATION_PAYLOAD_LIMITS.maxNodes) return validationFailure("ti_v3_validation_payload_oversized", path);
  if (typeof value === "string") {
    context.aggregateStringLength += value.length;
    return context.aggregateStringLength > FOUNDATION_PAYLOAD_LIMITS.maxAggregateStringLength ? validationFailure("ti_v3_validation_payload_oversized", path) : { ok: true, value };
  }
  if (value === null || typeof value === "boolean" || typeof value === "number") return { ok: true, value };
  if (typeof value !== "object") return validationFailure("ti_v3_validation_input_invalid", path);
  if (isProxy(value)) return validationFailure("ti_v3_validation_input_invalid", path);
  if (context.active.has(value)) return validationFailure("ti_v3_validation_input_invalid", path);
  context.active.add(value);
  let array: boolean;
  let prototype: object | null;
  let descriptors: PropertyDescriptorMap;
  try {
    array = Array.isArray(value);
    prototype = Object.getPrototypeOf(value) as object | null;
    Reflect.ownKeys(value);
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch {
    context.active.delete(value);
    return validationFailure("ti_v3_validation_input_invalid", path);
  }
  if ((array && prototype !== Array.prototype) || (!array && prototype !== Object.prototype && prototype !== null)) {
    context.active.delete(value);
    return validationFailure("ti_v3_validation_input_invalid", path);
  }
  const keys = Reflect.ownKeys(descriptors);
  if (keys.some((key) => typeof key === "symbol")) {
    context.active.delete(value);
    return validationFailure("ti_v3_validation_input_invalid", path);
  }
  const stringKeys = keys as string[];
  for (const key of stringKeys) {
    const descriptor = descriptors[key];
    if (descriptor.get !== undefined || descriptor.set !== undefined || (descriptor.enumerable !== true && !(array && key === "length"))) {
      context.active.delete(value);
      return validationFailure("ti_v3_validation_input_invalid", `${path}.${key}`);
    }
  }
  const dataKeys = stringKeys.filter((key) => !(array && key === "length"));
  for (const key of dataKeys) {
    if (key.length > FOUNDATION_PAYLOAD_LIMITS.maxPropertyKeyLength) {
      context.active.delete(value);
      return validationFailure("ti_v3_validation_payload_oversized", path);
    }
    context.aggregateStringLength += key.length;
    if (
      context.aggregateStringLength >
      FOUNDATION_PAYLOAD_LIMITS.maxAggregateStringLength
    ) {
      context.active.delete(value);
      return validationFailure("ti_v3_validation_payload_oversized", path);
    }
  }
  context.keys += dataKeys.length;
  if ((!array && dataKeys.length > FOUNDATION_PAYLOAD_LIMITS.maxObjectKeys) || context.keys > FOUNDATION_PAYLOAD_LIMITS.maxTotalKeys) {
    context.active.delete(value);
    return validationFailure("ti_v3_validation_payload_oversized", path);
  }
  const normalizedKeys = dataKeys.map((key) => key.normalize("NFC"));
  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    context.active.delete(value);
    return validationFailure("ti_v3_validation_input_invalid", path);
  }
  if (array) {
    const length = descriptors.length?.value;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || length > FOUNDATION_PAYLOAD_LIMITS.maxArrayItems || dataKeys.some((key) => !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)) {
      context.active.delete(value);
      return validationFailure("ti_v3_validation_array_invalid", path);
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (descriptor === undefined) {
        context.active.delete(value);
        return validationFailure("ti_v3_validation_array_invalid", `${path}[${index}]`);
      }
      const child = inspectUnknown(descriptor.value, `${path}[${index}]`, context, depth + 1);
      if (!child.ok) { context.active.delete(value); return child; }
      output.push(child.value);
    }
    context.active.delete(value);
    return { ok: true, value: Object.freeze(output) };
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (let index = 0; index < dataKeys.length; index += 1) {
    const key = dataKeys[index];
    const normalizedKey = normalizedKeys[index];
    const child = inspectUnknown(descriptors[key].value, `${path}.${normalizedKey}`, context, depth + 1);
    if (!child.ok) { context.active.delete(value); return child; }
    let outputValue = child.value;
    const authorityVerifier = depth === 0 ? rootAuthorities?.get(normalizedKey) : undefined;
    if (authorityVerifier !== undefined) {
      try {
        if (!authorityVerifier(descriptors[key].value)) {
          context.active.delete(value);
          return validationFailure("ti_v3_validation_input_invalid", `${path}.${normalizedKey}`);
        }
      } catch {
        context.active.delete(value);
        return validationFailure("ti_v3_validation_input_invalid", `${path}.${normalizedKey}`);
      }
      outputValue = descriptors[key].value;
    }
    Object.defineProperty(output, normalizedKey, { configurable: false, enumerable: true, writable: false, value: outputValue });
  }
  context.active.delete(value);
  return { ok: true, value: Object.freeze(output) };
}

function inspectRoot(value: unknown, path: string, rootAuthorities?: ReadonlyMap<string, AuthorityFieldVerifier>): ExactResult<unknown, FoundationValidationFailure> {
  return inspectUnknown(value, path, { active: new WeakSet(), nodes: 0, keys: 0, aggregateStringLength: 0 }, 0, rootAuthorities);
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  const inspected = inspectRoot(value, "$");
  return inspected.ok && typeof inspected.value === "object" && inspected.value !== null && !Array.isArray(inspected.value);
}

export function validateExactRecord(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  path = "$",
): ExactResult<Record<string, unknown>, FoundationValidationFailure> {
  const inspected = inspectRoot(value, path);
  if (!inspected.ok || typeof inspected.value !== "object" || inspected.value === null || Array.isArray(inspected.value)) {
    return validationFailure("ti_v3_validation_input_invalid", path);
  }
  const safeValue = inspected.value as Record<string, unknown>;
  const keys = Object.keys(safeValue);
  if (keys.length > FOUNDATION_PAYLOAD_LIMITS.maxObjectKeys) {
    return validationFailure("ti_v3_validation_payload_oversized", path);
  }
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const extra = keys.find((key) => !allowed.has(key));
  if (extra !== undefined) {
    return validationFailure("ti_v3_validation_extra_field", `${path}.${extra}`);
  }
  const missing = requiredKeys.find((key) => !Object.prototype.hasOwnProperty.call(safeValue, key));
  if (missing !== undefined) {
    return validationFailure("ti_v3_validation_required_field_missing", `${path}.${missing}`);
  }
  return { ok: true, value: safeValue };
}

export function validateExactRecordWithAuthorities(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  authorityFields: Readonly<Record<string, AuthorityFieldVerifier>>,
  path = "$",
): ExactResult<Record<string, unknown>, FoundationValidationFailure> {
  const authorityMap = new Map(Object.entries(authorityFields));
  const inspected = inspectRoot(value, path, authorityMap);
  if (!inspected.ok || typeof inspected.value !== "object" || inspected.value === null || Array.isArray(inspected.value)) {
    return validationFailure("ti_v3_validation_input_invalid", path);
  }
  const safeValue = inspected.value as Record<string, unknown>;
  const keys = Object.keys(safeValue);
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const extra = keys.find((key) => !allowed.has(key));
  if (extra !== undefined) return validationFailure("ti_v3_validation_extra_field", `${path}.${extra}`);
  const missing = requiredKeys.find((key) => !Object.prototype.hasOwnProperty.call(safeValue, key));
  if (missing !== undefined) return validationFailure("ti_v3_validation_required_field_missing", `${path}.${missing}`);
  const undeclaredAuthority = Object.keys(authorityFields).find((key) => !allowed.has(key));
  if (undeclaredAuthority !== undefined) return validationFailure("ti_v3_validation_input_invalid", `${path}.${undeclaredAuthority}`);
  return { ok: true, value: safeValue };
}

export function validateBoundedString(
  value: unknown,
  path: string,
  pattern?: RegExp,
  maxLength: number = FOUNDATION_PAYLOAD_LIMITS.maxStringLength,
): ExactResult<string, FoundationValidationFailure> {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maxLength ||
    /[\u0000-\u001f]/.test(value) ||
    (pattern !== undefined && !pattern.test(value))
  ) {
    return validationFailure("ti_v3_validation_string_invalid", path);
  }
  return { ok: true, value };
}

export function validateEnum<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  path: string,
): ExactResult<T, FoundationValidationFailure> {
  if (typeof value !== "string" || !allowed.has(value as T)) {
    return validationFailure("ti_v3_validation_enum_invalid", path);
  }
  return { ok: true, value: value as T };
}

export function validateBoolean(
  value: unknown,
  path: string,
): ExactResult<boolean, FoundationValidationFailure> {
  if (typeof value !== "boolean") {
    return validationFailure("ti_v3_validation_boolean_invalid", path);
  }
  return { ok: true, value };
}

export function validateArray(
  value: unknown,
  path: string,
  maxItems: number = FOUNDATION_PAYLOAD_LIMITS.maxArrayItems,
): ExactResult<readonly unknown[], FoundationValidationFailure> {
  const inspected = inspectRoot(value, path);
  if (!inspected.ok || !Array.isArray(inspected.value)) {
    return validationFailure("ti_v3_validation_array_invalid", path);
  }
  if (inspected.value.length > maxItems) {
    return validationFailure("ti_v3_validation_payload_oversized", path);
  }
  return { ok: true, value: inspected.value };
}

export function validateCanonicalTimestamp(
  value: unknown,
  path: string,
): ExactResult<CanonicalUtcTimestamp, FoundationValidationFailure> {
  const parsed = parseCanonicalUtcTimestamp(value, "nanosecond");
  return parsed.ok
    ? parsed
    : validationFailure("ti_v3_validation_timestamp_invalid", path);
}

export function validateCanonicalDigest(
  value: unknown,
  path: string,
  expectedDomain?: string,
): ExactResult<CanonicalContentDigest, FoundationValidationFailure> {
  const parsed = parseCanonicalContentDigest(value);
  if (!parsed.ok) return validationFailure("ti_v3_validation_digest_invalid", path);
  if (expectedDomain !== undefined && !parsed.value.startsWith(`ti_v3:${expectedDomain}:`)) {
    return validationFailure("ti_v3_validation_digest_invalid", path);
  }
  return parsed;
}

export function canonicalStringSet(
  values: readonly string[],
): readonly string[] {
  return Object.freeze([...new Set(values)].sort(compareUnicodeCodePoints));
}

export function validateStringSet(
  value: unknown,
  path: string,
  options: { readonly pattern?: RegExp; readonly maxItems?: number } = {},
): ExactResult<readonly string[], FoundationValidationFailure> {
  const array = validateArray(value, path, options.maxItems);
  if (!array.ok) return array;
  const validated: string[] = [];
  for (let index = 0; index < array.value.length; index += 1) {
    const item = validateBoundedString(
      array.value[index],
      `${path}[${index}]`,
      options.pattern,
    );
    if (!item.ok) return item;
    validated.push(item.value);
  }
  return { ok: true, value: canonicalStringSet(validated) };
}

export function canonicalReasonCodes(values: readonly string[]): readonly string[] {
  return canonicalStringSet(values);
}

export function compareCanonicalTimestamps(
  left: CanonicalUtcTimestamp,
  right: CanonicalUtcTimestamp,
): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
