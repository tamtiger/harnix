import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { finding, type DoctorFinding } from "src/core/doctor/findings.js";
import { EXERCISE_RUNBOOK_PATH, findExerciseRunbook } from "src/core/spec/exercise-runbook.js";

const RUNNABLE_SCRIPTS = ["start", "dev", "serve"] as const;

async function hasRunnableEntryPoint(root: string): Promise<boolean> {
  try {
    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as unknown;
    if (typeof manifest !== "object" || manifest === null) return false;
    const { scripts, bin } = manifest as { scripts?: unknown; bin?: unknown };
    if (bin !== undefined && bin !== null && bin !== "") return true;
    return (
      typeof scripts === "object" &&
      scripts !== null &&
      RUNNABLE_SCRIPTS.some((name) => typeof (scripts as Record<string, unknown>)[name] === "string")
    );
  } catch {
    return false;
  }
}

/**
 * A project that can be started (a `start`, `dev` or `serve` script, or a `bin`) but has no `.harnix/spec/exercise.md`
 * leaves the agent without the repo's way to run the behavior for real. Advice only: no command creates the file, and
 * the `info` severity keeps it out of `ok`, the warning count and the doctor exit code so it never turns CI red.
 */
export async function inspectExerciseRunbook(root: string, findings: DoctorFinding[]): Promise<void> {
  if ((await findExerciseRunbook(root)) !== undefined || !(await hasRunnableEntryPoint(root))) return;
  findings.push(
    finding(
      "exercise-runbook-missing",
      "info",
      EXERCISE_RUNBOOK_PATH,
      "The project has a runnable entry point but no exercise runbook; write how to start, probe and stop it (see `harnix skill harnix-exercise --reference runbook`) so the agent can prove behavior by running it.",
      false,
    ),
  );
}
