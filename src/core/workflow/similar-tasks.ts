import { jaccard, observationTokens } from "src/core/journal/learning-similarity.js";
import { listTaskIds, taskFilePath } from "src/core/tasks/task-location.js";
import { loadTask } from "src/core/tasks/task-store.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { mapWithLimit } from "src/utils/concurrency.js";
import { compareCodeUnits } from "src/utils/order.js";

/** Token Jaccard (accents and case ignored) from which two tasks read as the same work. */
export const TASK_SIMILARITY_THRESHOLD = 0.6;
const MAX_SIMILAR_TASKS = 3;
const MAX_SCANNED_TASKS = 200;
const READ_CONCURRENCY = 16;

export interface SimilarTaskText {
  title: string;
  goal: string;
}

export interface ComparableTask extends SimilarTaskText {
  id: string;
  status: string;
}

export interface SimilarTask {
  id: string;
  status: string;
  score: number;
}

function textScore(left: string, right: string): number {
  return jaccard(observationTokens(left), observationTokens(right));
}

/** Non-cancelled tasks whose title or goal matches the candidate at the threshold or above, best match first. */
export function findSimilarTasks(candidate: SimilarTaskText, tasks: readonly ComparableTask[]): SimilarTask[] {
  return tasks
    .filter((task) => task.status !== "cancelled")
    .map((task) => ({
      id: task.id,
      status: task.status,
      score: Math.max(textScore(candidate.title, task.title), textScore(candidate.goal, task.goal)),
    }))
    .filter((task) => task.score >= TASK_SIMILARITY_THRESHOLD)
    .sort((left, right) => right.score - left.score || compareCodeUnits(right.id, left.id))
    .slice(0, MAX_SIMILAR_TASKS);
}

/** The newest live tasks compared with the candidate; a record that cannot be read is skipped. */
export async function loadSimilarTasks(root: string, candidate: SimilarTaskText): Promise<SimilarTask[]> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const ids = (await listTaskIds(harnixRoot, { scope: "live" }))
    .sort((left, right) => compareCodeUnits(right, left))
    .slice(0, MAX_SCANNED_TASKS);
  const loaded = await mapWithLimit<string, ComparableTask | undefined>(ids, READ_CONCURRENCY, async (id) => {
    try {
      const task = await loadTask(await taskFilePath(harnixRoot, id, "task.json"));
      return { id, status: task.status, title: task.title, goal: task.goal };
    } catch {
      return undefined;
    }
  });
  return findSimilarTasks(
    candidate,
    loaded.filter((task): task is ComparableTask => task !== undefined),
  );
}

/** One stderr notice naming each similar task and the command that reuses it, or undefined when there is none. */
export function similarTaskNotice(similar: readonly SimilarTask[]): string | undefined {
  if (similar.length === 0) return undefined;
  const lines = similar.map((task) =>
    task.status === "completed"
      ? `  ${task.id} (completed): continue it with workflow --init ... --follow-up ${task.id}`
      : `  ${task.id} (${task.status}): reuse it with workflow --set-goal --task ${task.id}, or harnix resume ${task.id}`,
  );
  return `notice: similar task already exists; the new task was still created.\n${lines.join("\n")}\n`;
}
