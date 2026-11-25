import { globby } from "globby";

import type { TaskRecord } from "src/core/tasks/task.js";
import { buildGlobIgnores, targetedSegments } from "src/core/verification/transient-directories.js";

/** The globs of a task's `relevantPaths` that name files: the `@task-contract` token and negated patterns are not paths. */
export function relevantPatterns(task: TaskRecord): string[] {
  return task.relevantPaths.filter((pattern) => pattern !== "@task-contract" && !pattern.startsWith("!"));
}

const MAX_EXPANSIONS = 16;
const FIRST_GROUP = /\{([^{}]*)\}/u;
const ONLY_FLAT_GROUPS = /^[^{}]*(?:\{[^{}]*\}[^{}]*)*$/u;

/**
 * A glob without brace groups: Git's glob pathspec does not know `{ts,js}`, so `src/**\/*.{ts,js}` would match nothing
 * there. Flat groups are expanded into every combination (at most 16); a larger expansion becomes a wildcard for each
 * group (broader, never silent), and a nested or unbalanced brace is left as it is.
 */
export function expandBraces(pattern: string): string[] {
  if (!pattern.includes("{") || !ONLY_FLAT_GROUPS.test(pattern)) return [pattern];
  const total = [...pattern.matchAll(/\{([^{}]*)\}/gu)].reduce(
    (count, group) => count * (group[1] ?? "").split(",").length,
    1,
  );
  if (total > MAX_EXPANSIONS) return [pattern.replace(/\{[^{}]*\}/gu, "*")];
  const group = FIRST_GROUP.exec(pattern);
  if (group === null) return [pattern];
  return (group[1] ?? "")
    .split(",")
    .flatMap((alternative) =>
      expandBraces(`${pattern.slice(0, group.index)}${alternative}${pattern.slice(group.index + group[0].length)}`),
    );
}

/** The repository-relative files that currently exist under the patterns (dot files included, transient folders skipped). */
export async function coveredFiles(root: string, patterns: readonly string[]): Promise<Set<string>> {
  return new Set(
    await globby([...patterns], {
      cwd: root,
      onlyFiles: true,
      followSymbolicLinks: false,
      dot: true,
      ignore: buildGlobIgnores(new Set(patterns.flatMap((pattern) => [...targetedSegments(pattern)]))),
    }),
  );
}
