import type { TaskRecord } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { verificationRetryDisposition } from "./completion.js";

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
 * (a check the circuit breaker stopped is the exception, see assertBreakerNotBypassed).
 */
export function withoutUnprovenConfig<T extends { id: string }>(check: T, proven: ReadonlySet<string>): T {
  if (proven.has(check.id)) return check;
  const { cwd, description, ...rest } = check as T & { cwd?: unknown; description?: unknown };
  void cwd;
  void description;
  return rest as unknown as T;
}

export const CONFIG_ONLY_HINT =
  "A change of only --cwd or --description to a check without a passing run is applied directly by --set-check, with no reason and no replan, unless the circuit breaker already stopped that check (failed twice in a row).";

/**
 * The cwd and description are part of a check's digest, so editing them would give a stopped check a new digest and
 * quietly release the circuit breaker. A check the breaker stopped (failed twice in a row on inputs that have not
 * changed since) therefore keeps its configuration until the user authorizes a way on; when the source inputs did
 * change, a run is allowed anyway and the edit is too.
 */
export async function assertBreakerNotBypassed(root: string, previous: TaskRecord, next: TaskRecord): Promise<void> {
  const before = new Map(previous.validationPlan.map((check) => [check.id, check]));
  for (const check of next.validationPlan) {
    const old = before.get(check.id);
    if (old === undefined || (old.cwd === check.cwd && old.description === check.description)) continue;
    const digest =
      previous.schemaVersion === 3
        ? await computeInputDigest(root, previous, check.id).then(
            (snapshot) => snapshot.inputDigest,
            () => undefined,
          )
        : undefined;
    if (verificationRetryDisposition(previous, check.id, Date.now(), digest) === "stop")
      throw new Error(
        `Check ${check.id} failed twice in a row, so its cwd and description are locked; stop and report to the user. Continue only with a user-authorized reset: harnix workflow --reset-breaker ${check.id} --reason "<why>", or replace the check: harnix workflow --replace-check ${check.id} <new-id> --reason "<why>".`,
      );
  }
}
