import { normalizeCheckCwd } from "./check-cwd.js";
import { evidenceResults } from "./task-schema.js";
import { TaskValidationError, isOneOf, isRecord } from "./task-validate-common.js";

export const baselineKeys = ["authorizedBy", "classification", "result", "scope"] as const;
export const baselineClassifications = ["pre-existing", "introduced", "environment", "unknown"] as const;

function assertCwd(id: string, cwd: unknown): void {
  if (cwd === undefined) return;
  try {
    if (typeof cwd !== "string") throw new Error("not a string");
    normalizeCheckCwd(cwd);
  } catch {
    throw new TaskValidationError(`Validation plan check '${id}' has invalid cwd.`);
  }
}

function assertBaseline(id: string, baseline: unknown): void {
  if (baseline === undefined) return;
  const invalid = (reason: string) => new TaskValidationError(`Validation plan check '${id}' baseline ${reason}.`);
  if (!isRecord(baseline)) throw invalid("is invalid");
  if (Object.keys(baseline).some((key) => !isOneOf(baselineKeys, key))) throw invalid("has an unknown field");
  if (baseline.result !== undefined && !isOneOf(evidenceResults, baseline.result)) throw invalid("has invalid result");
  if (baseline.classification !== undefined && !isOneOf(baselineClassifications, baseline.classification)) {
    throw invalid("has invalid classification");
  }
  for (const key of ["authorizedBy", "scope"] as const) {
    if (baseline[key] !== undefined && typeof baseline[key] !== "string") throw invalid(`has invalid ${key}`);
  }
}

/** The optional `cwd` and `baseline` members of a validation check; every other member is checked by the caller. */
export function assertValidationCheckExtras(item: Record<string, unknown>): void {
  const id = String(item.id);
  assertCwd(id, item.cwd);
  assertBaseline(id, item.baseline);
}
