import type { TaskRecord } from "src/core/tasks/task.js";

/** Words and phrases (accent-folded, lower case) that mark a criterion as behavior a user or caller can observe. */
const OBSERVABLE =
  /\b(route|endpoint|http|https|api|ui|cli|browser|page|giao dien|man hinh|trinh duyet|trang web|dong lenh|lenh cli)\b/u;

/** Repository paths that make up the CLI or skill surface: a change there is only proven by running the real thing. */
const SURFACE_PATHS = [/^src\/commands\//u, /^src\/cli[^/]*$/u, /^src\/skills\//u, /^bin\//u];

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gu, "d").replace(/Đ/gu, "D").toLowerCase();
}

/** True when the criterion text describes behavior a user or caller can observe (route, screen, command). */
export function isObservableCriterion(text: string): boolean {
  return OBSERVABLE.test(fold(text));
}

/** A required check whose id has an `exercise` segment (`chk-exercise-api`) or whose description starts with the word. */
function isExerciseCheck(check: TaskRecord["validationPlan"][number]): boolean {
  if (!check.required) return false;
  const idSegments = fold(check.id).trim().split("-");
  return idSegments.includes("exercise") || /^exercise\b/u.test(fold(check.description ?? "").trim());
}

/**
 * Ready dry-run advisories (never a blocker). A criterion that describes behavior a caller can observe but is covered
 * by no required exercise check is probably only proven by unit tests; a task whose `relevantPaths` touch the CLI or
 * skill surface with no required exercise check at all has never run the changed command or skill for real.
 * Both are heuristics on text and paths; they add no field to the task record.
 */
export function exerciseAdvisories(task: TaskRecord): string[] {
  const exerciseChecks = task.validationPlan.filter(isExerciseCheck);
  const covered = new Set(exerciseChecks.flatMap((check) => check.criterionIds));
  const advisories: string[] = [];
  const uncovered = task.acceptanceCriteria
    .filter((criterion) => criterion.status !== "waived")
    .filter((criterion) => isObservableCriterion(criterion.text) && !covered.has(criterion.id))
    .map((criterion) => criterion.id);
  if (uncovered.length > 0) {
    advisories.push(
      `Criterion ${uncovered.join(", ")} describe observable behavior but no required check with an 'exercise' id segment or an 'exercise' description runs it for real; see 'harnix skill harnix-exercise'.`,
    );
  }
  const surface = task.relevantPaths.filter((path) => SURFACE_PATHS.some((pattern) => pattern.test(path)));
  if (surface.length > 0 && exerciseChecks.length === 0) {
    advisories.push(
      `relevantPaths touch the CLI or skill surface (${surface.slice(0, 3).join(", ")}) but no required exercise check runs the built command or skill for real; see 'harnix skill harnix-exercise'.`,
    );
  }
  return advisories;
}
