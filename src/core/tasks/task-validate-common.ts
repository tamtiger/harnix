import { normalizeRepositoryPath } from "src/utils/paths.js";

export class TaskValidationError extends Error {
  override name = "TaskValidationError";
}

export const taskIdPattern = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function validateTaskId(value: string): void {
  if (!taskIdPattern.test(value)) throw new TaskValidationError("Task ID is unsafe.");
}
export function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"
  );
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
export function isCancellationReason(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1_000 &&
    value === value.trim() &&
    [...value].every((character) => {
      const codePoint = character.codePointAt(0)!;
      return codePoint > 31 && codePoint !== 127;
    })
  );
}
export function validId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value);
}
export function isSafeRepositoryPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return normalizeRepositoryPath(value, { allowRoot: true }) === value;
  } catch {
    return false;
  }
}
export function ensureUnique(ids: readonly string[], label: string): void {
  if (new Set(ids).size !== ids.length) throw new TaskValidationError(`Duplicate ${label} ID.`);
}
export function assertExactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new TaskValidationError(`${label} contains an unknown schema field.`);
}
export function isSortedUnique(values: readonly string[]): boolean {
  return (
    new Set(values).size === values.length && values.every((value, index) => index === 0 || values[index - 1]! < value)
  );
}
export function isBoundedText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 2_000;
}
export function isInputDigest(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}
