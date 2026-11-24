import type { TaskRecord } from "src/core/tasks/task.js";

/** Words and phrases (accent-folded, lower case) that mark a criterion as behavior a user or caller can observe. */
const OBSERVABLE =
  /\b(route|endpoint|http|https|api|ui|cli|browser|page|giao dien|man hinh|trinh duyet|trang web|dong lenh|lenh cli)\b/u;

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gu, "d").replace(/Đ/gu, "D").toLowerCase();
}

function isExerciseCheck(check: TaskRecord["validationPlan"][number]): boolean {
  if (!check.required) return false;
  const id = fold(check.id).trim();
  const description = fold(check.description ?? "").trim();
  return id.startsWith("exercise") || description.startsWith("exercise");
}

/**
 * A ready dry-run advisory (never a blocker): a criterion that describes behavior a caller can observe but is covered
 * by no required check whose id or description starts with `exercise` is probably only proven by unit tests.
 * The match is a heuristic on the criterion text; it adds no field to the task record.
 */
export function exerciseAdvisories(task: TaskRecord): string[] {
  const covered = new Set(task.validationPlan.filter(isExerciseCheck).flatMap((check) => check.criterionIds));
  const uncovered = task.acceptanceCriteria
    .filter((criterion) => criterion.status !== "waived")
    .filter((criterion) => OBSERVABLE.test(fold(criterion.text)) && !covered.has(criterion.id))
    .map((criterion) => criterion.id);
  if (uncovered.length === 0) return [];
  return [
    `Criterion ${uncovered.join(", ")} describe observable behavior but no required check whose id or description starts with 'exercise' runs it for real; see 'harnix skill harnix-exercise'.`,
  ];
}
