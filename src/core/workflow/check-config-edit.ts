import type { TaskRecord } from "src/core/tasks/task.js";

/** Ids of the checks that have a passing run: their definition is immutable, cwd and description included. */
export function provenCheckIds(task: TaskRecord): Set<string> {
  return new Set(
    task.evidence
      .filter((evidence) => evidence.result === "pass" && evidence.checkId !== undefined)
      .map((evidence) => evidence.checkId as string),
  );
}

/**
 * How a check compares when only its run configuration differs: `cwd` and `description` say where and how it is
 * described, not what it proves, so a check that never passed may change them without superseding the contract
 * (the digest still changes, so the circuit breaker counts the next run as a new attempt).
 */
export function withoutUnprovenConfig<T extends { id: string }>(check: T, proven: ReadonlySet<string>): T {
  if (proven.has(check.id)) return check;
  const { cwd, description, ...rest } = check as T & { cwd?: unknown; description?: unknown };
  void cwd;
  void description;
  return rest as unknown as T;
}

export const CONFIG_ONLY_HINT =
  "A change of only --cwd or --description to a check without a passing run is applied directly by --set-check, with no reason and no replan.";
