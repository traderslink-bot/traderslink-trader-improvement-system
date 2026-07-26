import type { ExactResult } from "../exact";

export const CANONICAL_SERIALIZATION_VERSION = "ti_v3_canonical_json_v1" as const;

export const CANONICAL_SERIALIZATION_LIMITS = Object.freeze({
  maxDepth: 64,
  // GA1-C emits one bounded, deeply nested outcome for each of up to 10,000
  // accepted analytical rows. The prior 500,000-key envelope stopped a valid
  // result at outcome 5,349. These remain hard global graph budgets, sized for
  // the declared 10,000-row result rather than an unbounded payload.
  maxNodeCount: 4_000_000,
  maxKeyCount: 1_250_000,
  maxPropertyKeyCodeUnits: 4_096,
  maxStringCodeUnits: 262_144,
  maxAggregateCodeUnits: 67_108_864,
});

export type CanonicalValue =
  | null
  | boolean
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

export type CanonicalSerializationFailureCode =
  | "ti_v3_canonical_undefined_forbidden"
  | "ti_v3_canonical_number_forbidden"
  | "ti_v3_canonical_bigint_forbidden"
  | "ti_v3_canonical_value_type_invalid"
  | "ti_v3_canonical_object_type_invalid"
  | "ti_v3_canonical_property_descriptor_invalid"
  | "ti_v3_canonical_accessor_forbidden"
  | "ti_v3_canonical_symbol_key_forbidden"
  | "ti_v3_canonical_nonenumerable_property_forbidden"
  | "ti_v3_canonical_array_property_invalid"
  | "ti_v3_canonical_cycle_forbidden"
  | "ti_v3_canonical_depth_exceeded"
  | "ti_v3_canonical_node_count_exceeded"
  | "ti_v3_canonical_key_count_exceeded"
  | "ti_v3_canonical_string_size_exceeded"
  | "ti_v3_canonical_aggregate_size_exceeded"
  | "ti_v3_canonical_key_collision"
  | "ti_v3_canonical_unicode_invalid"
  | "ti_v3_canonical_raw_json_invalid"
  | "ti_v3_canonical_duplicate_json_key"
  | "ti_v3_canonical_trailing_json_content";

export interface CanonicalSerializationFailure {
  code: CanonicalSerializationFailureCode;
  path: string;
}

export interface CanonicalSerialization {
  readonly value: CanonicalValue;
  readonly json: string;
  readonly utf8: Uint8Array;
}

export interface CanonicalGraphMeasurement {
  readonly nodeCount: number;
  readonly keyCount: number;
  readonly stringAndKeyCodeUnits: number;
  readonly serializedCodeUnits: number;
}

export function normalizeCanonicalString(value: string): string {
  return value.replace(/\r\n?/g, "\n").normalize("NFC");
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return true;
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

export function compareUnicodeCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(left);
  const rightPoints = Array.from(right);
  const length = leftPoints.length < rightPoints.length ? leftPoints.length : rightPoints.length;
  for (let index = 0; index < length; index += 1) {
    const leftPoint = leftPoints[index].codePointAt(0) ?? 0;
    const rightPoint = rightPoints[index].codePointAt(0) ?? 0;
    if (leftPoint !== rightPoint) {
      return leftPoint - rightPoint;
    }
  }
  return leftPoints.length - rightPoints.length;
}

function failure(
  code: CanonicalSerializationFailureCode,
  path: string,
): ExactResult<never, CanonicalSerializationFailure> {
  return { ok: false, error: { code, path } };
}

interface CanonicalNormalizationContext {
  readonly activeObjects: WeakSet<object>;
  nodeCount: number;
  keyCount: number;
  aggregateCodeUnits: number;
}

function consumeNode(
  context: CanonicalNormalizationContext,
  path: string,
  depth: number,
): ExactResult<true, CanonicalSerializationFailure> {
  if (depth > CANONICAL_SERIALIZATION_LIMITS.maxDepth) {
    return failure("ti_v3_canonical_depth_exceeded", path);
  }
  context.nodeCount += 1;
  if (context.nodeCount > CANONICAL_SERIALIZATION_LIMITS.maxNodeCount) {
    return failure("ti_v3_canonical_node_count_exceeded", path);
  }
  return { ok: true, value: true };
}

function consumeString(
  context: CanonicalNormalizationContext,
  value: string,
  path: string,
): ExactResult<true, CanonicalSerializationFailure> {
  if (value.length > CANONICAL_SERIALIZATION_LIMITS.maxStringCodeUnits) {
    return failure("ti_v3_canonical_string_size_exceeded", path);
  }
  context.aggregateCodeUnits += value.length;
  if (context.aggregateCodeUnits > CANONICAL_SERIALIZATION_LIMITS.maxAggregateCodeUnits) {
    return failure("ti_v3_canonical_aggregate_size_exceeded", path);
  }
  return { ok: true, value: true };
}

function readOwnDescriptors(
  input: object,
  path: string,
): ExactResult<PropertyDescriptorMap, CanonicalSerializationFailure> {
  try {
    return { ok: true, value: Object.getOwnPropertyDescriptors(input) };
  } catch {
    return failure("ti_v3_canonical_property_descriptor_invalid", path);
  }
}

function readPrototype(
  input: object,
  path: string,
): ExactResult<object | null, CanonicalSerializationFailure> {
  try {
    return { ok: true, value: Object.getPrototypeOf(input) as object | null };
  } catch {
    return failure("ti_v3_canonical_object_type_invalid", path);
  }
}

function validateDescriptorPolicy(
  descriptors: PropertyDescriptorMap,
  path: string,
  allowedNonEnumerableKeys: ReadonlySet<string>,
): ExactResult<true, CanonicalSerializationFailure> {
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key === "symbol") {
      return failure("ti_v3_canonical_symbol_key_forbidden", path);
    }
    const descriptor = descriptors[key];
    if (descriptor.get !== undefined || descriptor.set !== undefined) {
      return failure("ti_v3_canonical_accessor_forbidden", `${path}.${key}`);
    }
    if (descriptor.enumerable !== true && !allowedNonEnumerableKeys.has(key)) {
      return failure("ti_v3_canonical_nonenumerable_property_forbidden", `${path}.${key}`);
    }
  }
  return { ok: true, value: true };
}

function normalizeCanonicalValue(
  input: unknown,
  path: string,
  context: CanonicalNormalizationContext,
  depth: number,
): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
  const consumedNode = consumeNode(context, path, depth);
  if (!consumedNode.ok) {
    return consumedNode;
  }
  if (input === null || typeof input === "boolean") {
    return { ok: true, value: input };
  }
  if (typeof input === "string") {
    if (hasUnpairedSurrogate(input)) {
      return failure("ti_v3_canonical_unicode_invalid", path);
    }
    const normalized = normalizeCanonicalString(input);
    const consumedString = consumeString(context, normalized, path);
    if (!consumedString.ok) {
      return consumedString;
    }
    return { ok: true, value: normalized };
  }
  if (typeof input === "undefined") {
    return failure("ti_v3_canonical_undefined_forbidden", path);
  }
  if (typeof input === "number") {
    return failure("ti_v3_canonical_number_forbidden", path);
  }
  if (typeof input === "bigint") {
    return failure("ti_v3_canonical_bigint_forbidden", path);
  }
  if (typeof input !== "object") {
    return failure("ti_v3_canonical_value_type_invalid", path);
  }
  if (context.activeObjects.has(input)) {
    return failure("ti_v3_canonical_cycle_forbidden", path);
  }
  context.activeObjects.add(input);
  if (Array.isArray(input)) {
    const prototype = readPrototype(input, path);
    if (!prototype.ok) {
      context.activeObjects.delete(input);
      return prototype;
    }
    if (prototype.value !== Array.prototype) {
      context.activeObjects.delete(input);
      return failure("ti_v3_canonical_object_type_invalid", path);
    }
    const descriptors = readOwnDescriptors(input, path);
    if (!descriptors.ok) {
      context.activeObjects.delete(input);
      return descriptors;
    }
    const descriptorPolicy = validateDescriptorPolicy(descriptors.value, path, new Set(["length"]));
    if (!descriptorPolicy.ok) {
      context.activeObjects.delete(input);
      return descriptorPolicy;
    }
    const lengthDescriptor = descriptors.value.length;
    const length = lengthDescriptor?.value;
    if (
      typeof length !== "number" ||
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length + context.nodeCount > CANONICAL_SERIALIZATION_LIMITS.maxNodeCount
    ) {
      context.activeObjects.delete(input);
      return failure("ti_v3_canonical_node_count_exceeded", path);
    }
    for (const key of Object.keys(descriptors.value)) {
      if (key === "length") continue;
      if (!/^(0|[1-9][0-9]*)$/.test(key) || BigInt(key) >= BigInt(length)) {
        context.activeObjects.delete(input);
        return failure("ti_v3_canonical_array_property_invalid", `${path}.${key}`);
      }
    }
    const values: CanonicalValue[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors.value[String(index)];
      if (descriptor === undefined) {
        context.activeObjects.delete(input);
        return failure("ti_v3_canonical_undefined_forbidden", `${path}[${index}]`);
      }
      const normalized = normalizeCanonicalValue(
        descriptor.value,
        `${path}[${index}]`,
        context,
        depth + 1,
      );
      if (!normalized.ok) {
        context.activeObjects.delete(input);
        return normalized;
      }
      values.push(normalized.value);
    }
    context.activeObjects.delete(input);
    return { ok: true, value: Object.freeze(values) };
  }
  const prototype = readPrototype(input, path);
  if (!prototype.ok) {
    context.activeObjects.delete(input);
    return prototype;
  }
  if (prototype.value !== Object.prototype && prototype.value !== null) {
    context.activeObjects.delete(input);
    return failure("ti_v3_canonical_object_type_invalid", path);
  }
  const descriptors = readOwnDescriptors(input, path);
  if (!descriptors.ok) {
    context.activeObjects.delete(input);
    return descriptors;
  }
  const descriptorPolicy = validateDescriptorPolicy(descriptors.value, path, new Set());
  if (!descriptorPolicy.ok) {
    context.activeObjects.delete(input);
    return descriptorPolicy;
  }
  const normalizedEntries = new Map<string, CanonicalValue>();
  for (const key of Object.keys(descriptors.value)) {
    context.keyCount += 1;
    if (context.keyCount > CANONICAL_SERIALIZATION_LIMITS.maxKeyCount) {
      context.activeObjects.delete(input);
      return failure("ti_v3_canonical_key_count_exceeded", path);
    }
    if (hasUnpairedSurrogate(key)) {
      context.activeObjects.delete(input);
      return failure("ti_v3_canonical_unicode_invalid", path);
    }
    if (key.length > CANONICAL_SERIALIZATION_LIMITS.maxPropertyKeyCodeUnits) {
      context.activeObjects.delete(input);
      return failure("ti_v3_canonical_string_size_exceeded", path);
    }
    const consumedKey = consumeString(context, key, path);
    if (!consumedKey.ok) {
      context.activeObjects.delete(input);
      return consumedKey;
    }
    const normalizedKey = normalizeCanonicalString(key);
    if (normalizedEntries.has(normalizedKey)) {
      context.activeObjects.delete(input);
      return failure("ti_v3_canonical_key_collision", path);
    }
    const normalizedValue = normalizeCanonicalValue(
      descriptors.value[key].value,
      `${path}.${normalizedKey}`,
      context,
      depth + 1,
    );
    if (!normalizedValue.ok) {
      context.activeObjects.delete(input);
      return normalizedValue;
    }
    normalizedEntries.set(normalizedKey, normalizedValue.value);
  }
  const result = Object.create(null) as Record<string, CanonicalValue>;
  for (const key of [...normalizedEntries.keys()].sort(compareUnicodeCodePoints)) {
    Object.defineProperty(result, key, {
      configurable: false,
      enumerable: true,
      value: normalizedEntries.get(key) as CanonicalValue,
      writable: false,
    });
  }
  context.activeObjects.delete(input);
  return { ok: true, value: Object.freeze(result) };
}

function stringifyCanonicalValue(value: CanonicalValue): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stringifyCanonicalValue).join(",")}]`;
  }
  return `{${Object.entries(value)
    .map(([key, child]) => `${JSON.stringify(key)}:${stringifyCanonicalValue(child)}`)
    .join(",")}}`;
}

export function serializeCanonicalValue(
  input: unknown,
): ExactResult<CanonicalSerialization, CanonicalSerializationFailure> {
  const normalized = normalizeCanonicalValue(
    input,
    "$",
    { activeObjects: new WeakSet(), aggregateCodeUnits: 0, keyCount: 0, nodeCount: 0 },
    0,
  );
  if (!normalized.ok) {
    return normalized;
  }
  const json = stringifyCanonicalValue(normalized.value);
  if (json.length > CANONICAL_SERIALIZATION_LIMITS.maxAggregateCodeUnits) {
    return failure("ti_v3_canonical_aggregate_size_exceeded", "$");
  }
  const authoritativeBytes = new TextEncoder().encode(json);
  const serialization: CanonicalSerialization = Object.freeze({
    value: normalized.value,
    json,
    get utf8(): Uint8Array {
      return authoritativeBytes.slice();
    },
  });
  return {
    ok: true,
    value: serialization,
  };
}

export function measureCanonicalGraph(
  input: unknown,
): ExactResult<CanonicalGraphMeasurement, CanonicalSerializationFailure> {
  const serialized = serializeCanonicalValue(input);
  if (!serialized.ok) return serialized;
  let nodeCount = 0;
  let keyCount = 0;
  let stringAndKeyCodeUnits = 0;
  const visit = (value: CanonicalValue): void => {
    nodeCount += 1;
    if (typeof value === "string") {
      stringAndKeyCodeUnits += value.length;
      return;
    }
    if (value === null || typeof value === "boolean") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      keyCount += 1;
      stringAndKeyCodeUnits += key.length;
      visit(child);
    }
  };
  visit(serialized.value.value);
  return {
    ok: true,
    value: Object.freeze({
      nodeCount,
      keyCount,
      stringAndKeyCodeUnits,
      serializedCodeUnits: serialized.value.json.length,
    }),
  };
}

class StrictJsonParser {
  private index = 0;
  private nodeCount = 0;
  private keyCount = 0;

  constructor(private readonly source: string) {}

  parse(): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
    if (this.source.length > CANONICAL_SERIALIZATION_LIMITS.maxAggregateCodeUnits) {
      return failure("ti_v3_canonical_aggregate_size_exceeded", "$");
    }
    const value = this.parseValue("$", 0);
    if (!value.ok) {
      return value;
    }
    this.skipWhitespace();
    if (this.index !== this.source.length) {
      return failure("ti_v3_canonical_trailing_json_content", "$");
    }
    return value;
  }

  private skipWhitespace(): void {
    while (/[\t\n\r ]/.test(this.source[this.index] ?? "")) {
      this.index += 1;
    }
  }

  private parseValue(
    path: string,
    depth: number,
  ): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
    if (depth > CANONICAL_SERIALIZATION_LIMITS.maxDepth) {
      return failure("ti_v3_canonical_depth_exceeded", path);
    }
    this.nodeCount += 1;
    if (this.nodeCount > CANONICAL_SERIALIZATION_LIMITS.maxNodeCount) {
      return failure("ti_v3_canonical_node_count_exceeded", path);
    }
    this.skipWhitespace();
    const token = this.source[this.index];
    if (token === '"') {
      return this.parseString(path);
    }
    if (token === "{") {
      return this.parseObject(path, depth);
    }
    if (token === "[") {
      return this.parseArray(path, depth);
    }
    if (this.source.startsWith("true", this.index)) {
      this.index += 4;
      return { ok: true, value: true };
    }
    if (this.source.startsWith("false", this.index)) {
      this.index += 5;
      return { ok: true, value: false };
    }
    if (this.source.startsWith("null", this.index)) {
      this.index += 4;
      return { ok: true, value: null };
    }
    if (token === "-" || /[0-9]/.test(token ?? "")) {
      return failure("ti_v3_canonical_number_forbidden", path);
    }
    return failure("ti_v3_canonical_raw_json_invalid", path);
  }

  private parseString(path: string): ExactResult<string, CanonicalSerializationFailure> {
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.source.length) {
      const token = this.source[this.index];
      if (!escaped && token === '"') {
        this.index += 1;
        try {
          const value = JSON.parse(this.source.slice(start, this.index)) as string;
          if (hasUnpairedSurrogate(value)) {
            return failure("ti_v3_canonical_unicode_invalid", path);
          }
          if (value.length > CANONICAL_SERIALIZATION_LIMITS.maxStringCodeUnits) {
            return failure("ti_v3_canonical_string_size_exceeded", path);
          }
          return { ok: true, value };
        } catch {
          return failure("ti_v3_canonical_raw_json_invalid", path);
        }
      }
      if (!escaped && token === "\\") {
        escaped = true;
      } else {
        if (!escaped && token !== undefined && token.charCodeAt(0) < 0x20) {
          return failure("ti_v3_canonical_raw_json_invalid", path);
        }
        escaped = false;
      }
      this.index += 1;
    }
    return failure("ti_v3_canonical_raw_json_invalid", path);
  }

  private parseArray(
    path: string,
    depth: number,
  ): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
    this.index += 1;
    const values: CanonicalValue[] = [];
    this.skipWhitespace();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return { ok: true, value: values };
    }
    while (this.index < this.source.length) {
      const value = this.parseValue(`${path}[${values.length}]`, depth + 1);
      if (!value.ok) {
        return value;
      }
      values.push(value.value);
      this.skipWhitespace();
      const token = this.source[this.index];
      if (token === "]") {
        this.index += 1;
        return { ok: true, value: values };
      }
      if (token !== ",") {
        return failure("ti_v3_canonical_raw_json_invalid", path);
      }
      this.index += 1;
    }
    return failure("ti_v3_canonical_raw_json_invalid", path);
  }

  private parseObject(
    path: string,
    depth: number,
  ): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
    this.index += 1;
    const value = Object.create(null) as Record<string, CanonicalValue>;
    const keys = new Set<string>();
    this.skipWhitespace();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return { ok: true, value };
    }
    while (this.index < this.source.length) {
      this.skipWhitespace();
      if (this.source[this.index] !== '"') {
        return failure("ti_v3_canonical_raw_json_invalid", path);
      }
      const parsedKey = this.parseString(path);
      if (!parsedKey.ok) {
        return parsedKey;
      }
      if (
        parsedKey.value.length >
        CANONICAL_SERIALIZATION_LIMITS.maxPropertyKeyCodeUnits
      ) {
        return failure("ti_v3_canonical_string_size_exceeded", path);
      }
      const normalizedKey = normalizeCanonicalString(parsedKey.value);
      this.keyCount += 1;
      if (this.keyCount > CANONICAL_SERIALIZATION_LIMITS.maxKeyCount) {
        return failure("ti_v3_canonical_key_count_exceeded", path);
      }
      if (keys.has(normalizedKey)) {
        return failure("ti_v3_canonical_duplicate_json_key", path);
      }
      keys.add(normalizedKey);
      this.skipWhitespace();
      if (this.source[this.index] !== ":") {
        return failure("ti_v3_canonical_raw_json_invalid", path);
      }
      this.index += 1;
      const child = this.parseValue(`${path}.${normalizedKey}`, depth + 1);
      if (!child.ok) {
        return child;
      }
      Object.defineProperty(value, normalizedKey, {
        configurable: true,
        enumerable: true,
        value: child.value,
        writable: true,
      });
      this.skipWhitespace();
      const token = this.source[this.index];
      if (token === "}") {
        this.index += 1;
        return { ok: true, value };
      }
      if (token !== ",") {
        return failure("ti_v3_canonical_raw_json_invalid", path);
      }
      this.index += 1;
    }
    return failure("ti_v3_canonical_raw_json_invalid", path);
  }
}

export function parseStrictCanonicalJson(
  source: unknown,
): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
  if (typeof source !== "string") {
    return failure("ti_v3_canonical_raw_json_invalid", "$");
  }
  const parsed = new StrictJsonParser(source).parse();
  if (!parsed.ok) {
    return parsed;
  }
  const normalized = normalizeCanonicalValue(
    parsed.value,
    "$",
    { activeObjects: new WeakSet(), aggregateCodeUnits: 0, keyCount: 0, nodeCount: 0 },
    0,
  );
  return normalized;
}
