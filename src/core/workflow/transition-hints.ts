import { legalCheckpoints, transitions, type TaskStatus } from "src/core/tasks/task-schema.js";

const EXAMPLES = "ready/ready, in_progress/implementing, verifying/verifying hoặc verifying/finishing";

/** The checkpoint owner of a word typed where a status belongs, so `finishing` can be answered with `verifying/finishing`. */
function owningStatus(word: string): Exclude<TaskStatus, "blocked"> | undefined {
  for (const [status, checkpoints] of Object.entries(legalCheckpoints) as [
    Exclude<TaskStatus, "blocked">,
    readonly string[],
  ][])
    if (checkpoints.includes(word)) return status;
  return undefined;
}

/** The error for `workflow --transition <status>/<checkpoint>` when `<status>` is not a task status. */
export function invalidStatusError(status: string): Error {
  const owner = owningStatus(status);
  const hint =
    owner === undefined
      ? `status hợp lệ đứng trước dấu /; ví dụ ${EXAMPLES}.`
      : `${status} là checkpoint, không phải status; status đứng trước dấu /: dùng ${owner}/${status}.`;
  return new Error(
    `Task status '${status}' is invalid (expected ${Object.keys(transitions).join(", ")}).\nGợi ý: ${hint}`,
  );
}
