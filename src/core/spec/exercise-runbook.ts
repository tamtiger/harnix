import { stat, readFile } from "node:fs/promises";
import { join } from "node:path";

/** User-owned runbook (start command, port, tools) the agent reads before it runs the behavior for real. */
export const EXERCISE_RUNBOOK_PATH = ".harnix/spec/exercise.md";

/** The runbook path when the file exists and has content; `undefined` otherwise. Never creates or rewrites it. */
export async function findExerciseRunbook(projectRoot: string): Promise<string | undefined> {
  const file = join(projectRoot, ...EXERCISE_RUNBOOK_PATH.split("/"));
  try {
    if (!(await stat(file)).isFile()) return undefined;
    return (await readFile(file, "utf8")).trim() === "" ? undefined : EXERCISE_RUNBOOK_PATH;
  } catch {
    return undefined;
  }
}
