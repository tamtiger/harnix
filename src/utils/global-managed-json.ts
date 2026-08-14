import { GlobalManagedManifestError } from "./global-managed-error.js";
import type { JsonArrayMemberSelector, JsonValue } from "./global-managed-files.js";

export function defaultJsonMemberMatcher(candidate: JsonValue, selector: JsonArrayMemberSelector): boolean {
  return isJsonObject(candidate) && candidate.id === selector.memberId;
}

export function parseJsonDocument(content: string): JsonValue {
  return normalizeJsonValue(JSON.parse(content) as unknown);
}

export function createJsonDocument(selector: JsonArrayMemberSelector): JsonValue {
  const tokens = parseCanonicalJsonPointer(selector.pointer);
  const root: JsonValue = tokens.length === 0 ? [] : jsonObject();
  if (findOrCreateJsonArray(root, selector) === undefined) {
    throw new GlobalManagedManifestError("The JSON pointer cannot create an array document safely.");
  }
  return root;
}

export function findOrCreateJsonArray(document: JsonValue, selector: JsonArrayMemberSelector): JsonValue[] | undefined {
  const tokens = parseCanonicalJsonPointer(selector.pointer);
  if (tokens.length === 0) return Array.isArray(document) ? document : undefined;
  let current: JsonValue = document;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    const last = index === tokens.length - 1;
    if (isJsonObject(current)) {
      if (!Object.hasOwn(current, token)) current[token] = last ? [] : jsonObject();
      current = current[token]!;
      if (last) return Array.isArray(current) ? current : undefined;
      continue;
    }
    if (Array.isArray(current)) {
      const position = parseArrayIndex(token);
      if (position === undefined || position >= current.length) return undefined;
      current = current[position]!;
      if (last) return Array.isArray(current) ? current : undefined;
      continue;
    }
    return undefined;
  }
  return undefined;
}

export function findExistingJsonArray(document: JsonValue, selector: JsonArrayMemberSelector): JsonValue[] | undefined {
  const tokens = parseCanonicalJsonPointer(selector.pointer);
  let current: JsonValue = document;
  for (const token of tokens) {
    if (isJsonObject(current)) {
      if (!Object.hasOwn(current, token)) return undefined;
      current = current[token]!;
      continue;
    }
    if (Array.isArray(current)) {
      const position = parseArrayIndex(token);
      if (position === undefined || position >= current.length) return undefined;
      current = current[position]!;
      continue;
    }
    return undefined;
  }
  return Array.isArray(current) ? current : undefined;
}

export function serializeJsonDocument(value: JsonValue): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function canonicalJson(value: JsonValue): string {
  return JSON.stringify(normalizeJsonValue(value));
}

export function normalizeJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new GlobalManagedManifestError("A JSON member must not contain a non-finite number.");
    return value;
  }
  if (Array.isArray(value)) return value.map(normalizeJsonValue);
  if (isRecord(value)) {
    const normalized = jsonObject();
    for (const key of Object.keys(value).sort(compareCodeUnits)) normalized[key] = normalizeJsonValue(value[key]);
    return normalized;
  }
  throw new GlobalManagedManifestError("A JSON member must contain only JSON-compatible values.");
}

export function parseCanonicalJsonPointer(pointer: string): string[] {
  if (pointer === "") return [];
  if (!pointer.startsWith("/")) throw new GlobalManagedManifestError("A JSON pointer must start with '/'.");
  const tokens = pointer.slice(1).split("/").map(unescapeJsonPointerToken);
  const canonical = `/${tokens.map(escapeJsonPointerToken).join("/")}`;
  if (canonical !== pointer) throw new GlobalManagedManifestError("A JSON pointer must use canonical RFC 6901 escaping.");
  return tokens;
}

function parseArrayIndex(value: string): number | undefined {
  if (!/^(?:0|[1-9][0-9]*)$/u.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function unescapeJsonPointerToken(token: string): string {
  let output = "";
  for (let index = 0; index < token.length; index += 1) {
    const character = token[index]!;
    if (character !== "~") {
      output += character;
      continue;
    }
    const escaped = token[index + 1];
    if (escaped === "0") output += "~";
    else if (escaped === "1") output += "/";
    else throw new GlobalManagedManifestError("A JSON pointer contains an invalid escape.");
    index += 1;
  }
  return output;
}

function escapeJsonPointerToken(token: string): string {
  return token.replaceAll("~", "~0").replaceAll("/", "~1");
}

function jsonObject(): { [key: string]: JsonValue } {
  return Object.create(null) as { [key: string]: JsonValue };
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
