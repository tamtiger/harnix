import { createHash } from "node:crypto";

import type { TaskRecordV3 } from "src/core/tasks/task.js";

const sha = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const byId = (left: { id: string }, right: { id: string }) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);

/** The pre-isolation digest formula, rebuilt independently: the whole task contract inside every check's digest. */
export function legacyDigest(task: TaskRecordV3, checkId: string, entries: unknown): string {
  const contract = JSON.stringify({
    schemaVersion: 3,
    taskId: task.id,
    mode: task.mode,
    acceptanceCriteria: task.acceptanceCriteria.map(({ id, text }) => ({ id, text })).sort(byId),
    validationPlan: task.validationPlan
      .map((check) => ({
        id: check.id,
        description: check.description,
        command: check.command ?? null,
        scope: check.scope,
        required: check.required,
        criterionIds: [...check.criterionIds].sort(),
        inputs: [...check.inputs],
        ...(check.cwd === undefined ? {} : { cwd: check.cwd }),
      }))
      .sort(byId),
  });
  return sha(JSON.stringify({ digest: 3, taskId: task.id, checkId, taskContractHash: sha(contract), entries }));
}
