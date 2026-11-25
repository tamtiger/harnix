import type { TaskRecord } from "src/core/tasks/task.js";

/**
 * The one fixed line preflight prints beside `suggestedTechniques`. The suggestion alone is a list of names that no
 * instruction tells an agent to act on, so this says how to load one. It names no skill and no path.
 */
export const TECHNIQUE_HINT = "Load each suggested skill with `harnix skill <name> --raw` before it matters.";

/** A task with this many acceptance criteria, or this many relevant paths, is big enough to think through in steps. */
export const SEQUENTIAL_MIN_CRITERIA = 6;
export const SEQUENTIAL_MIN_PATHS = 8;

const COMPLEX_WORDING = /refactor|kiến trúc|complex|đánh đổi/u;

/** `mode === "full"` alone is not a reason: it made every Full task suggest the same skill and nobody acted on it. */
export function needsSequentialThinking(
  task: Pick<TaskRecord, "title" | "goal" | "acceptanceCriteria" | "relevantPaths">,
): boolean {
  return (
    COMPLEX_WORDING.test(`${task.title} ${task.goal}`.toLowerCase()) ||
    task.acceptanceCriteria.length >= SEQUENTIAL_MIN_CRITERIA ||
    task.relevantPaths.length >= SEQUENTIAL_MIN_PATHS
  );
}
