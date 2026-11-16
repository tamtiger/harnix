interface OrderedCheck {
  id: string;
  scope: "focused" | "full";
}

interface RecordedRun {
  checkId?: string | undefined;
  result?: string | undefined;
  durationMs?: number | undefined;
}

/** The latest recorded duration of every check, taken from passing runs only: a failed run stops early and says nothing about cost. */
function latestDurations(evidence: readonly RecordedRun[]): Map<string, number> {
  const durations = new Map<string, number>();
  for (const { checkId, durationMs, result } of evidence)
    if (checkId !== undefined && durationMs !== undefined && result === "pass") durations.set(checkId, durationMs);
  return durations;
}

/**
 * The order `--run-checks` runs checks in: focused before full, and inside one scope the check that ran shortest last
 * time first, so a cheap failure stops the run before an expensive suite starts. A scope where any check has no
 * recorded duration keeps its declaration order, so the order never rests on a guess. This only reorders; it never
 * changes which checks run.
 */
export function orderChecks<T extends OrderedCheck>(checks: readonly T[], evidence: readonly RecordedRun[]): T[] {
  const durations = latestDurations(evidence);
  const ordered: T[] = [];
  for (const scope of ["focused", "full"] as const) {
    const inScope = checks.filter((check) => check.scope === scope);
    const known = inScope.every((check) => durations.has(check.id));
    ordered.push(
      ...(known
        ? [...inScope].sort((left, right) => (durations.get(left.id) ?? 0) - (durations.get(right.id) ?? 0))
        : inScope),
    );
  }
  return ordered;
}
