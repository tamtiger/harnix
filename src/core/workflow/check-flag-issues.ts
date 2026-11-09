import type { ValidationCheckV3 } from "src/core/tasks/task.js";
import type { CheckEdit } from "./plan-edit.js";

/**
 * Every problem of a `--set-check` call at once (a new check needs scope, description and, when required, criteria
 * and an input; the scope must be focused or full), so the caller fixes them in one round instead of one per error.
 */
function scopeIssue(existing: ValidationCheckV3 | undefined, edit: CheckEdit): string | undefined {
  const scope = edit.scope ?? existing?.scope;
  if (scope === undefined) return "--scope is required for a new check (focused or full).";
  return scope === "focused" || scope === "full" ? undefined : `--scope must be focused or full (got "${scope}").`;
}

function coverageIssues(existing: ValidationCheckV3 | undefined, edit: CheckEdit): string[] {
  const issues: string[] = [];
  if ((edit.criteria ?? existing?.criterionIds ?? []).length === 0)
    issues.push(`--criteria is required: required check ${edit.id} must cover at least one criterion.`);
  if ((edit.inputs ?? existing?.inputs ?? []).length === 0)
    issues.push(`--input is required: required check ${edit.id} needs at least one glob.`);
  return issues;
}

/**
 * Every problem of a `--set-check` call at once (a new check needs scope, description and, when required, criteria
 * and an input; the scope must be focused or full), so the caller fixes them in one round instead of one per error.
 */
export function checkFlagIssues(existing: ValidationCheckV3 | undefined, edit: CheckEdit): string[] {
  const description = edit.description ?? existing?.description;
  const issues = [
    scopeIssue(existing, edit),
    description === undefined || description.trim() === "" ? "--description is required for a new check." : undefined,
  ].filter((issue): issue is string => issue !== undefined);
  return (edit.required ?? existing?.required ?? true) ? [...issues, ...coverageIssues(existing, edit)] : issues;
}

/** A complete `--set-check` command to copy, naming the check being edited. */
export function setCheckExample(id: string): string {
  return `harnix workflow --set-check ${id} --description "<mô tả>" --scope focused --command "<cmd>" --criteria ac-1 --input "src/**" --reason "<why>"`;
}
