import { stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { compareCodeUnits } from "src/utils/order.js";

const MAX_SUGGESTIONS = 3;

const segmentsOf = (path: string): string[] =>
  path
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".")
    .map((segment) => segment.toLowerCase());

/** How many trailing path segments the two paths share. */
function sharedSuffix(left: readonly string[], right: readonly string[]): number {
  let count = 0;
  while (
    count < left.length &&
    count < right.length &&
    left[left.length - 1 - count] === right[right.length - 1 - count]
  )
    count += 1;
  return count;
}

/**
 * Up to three paths of the map that end like `target`, best first: the most shared trailing segments, then the shortest
 * path. A path that shares no file name gives nothing, so a wrong guess never points at an unrelated file.
 */
export function nearestPaths(paths: readonly string[], target: string): string[] {
  const wanted = segmentsOf(target);
  return paths
    .map((path) => ({ path, score: sharedSuffix(segmentsOf(path), wanted), depth: segmentsOf(path).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.depth - b.depth || compareCodeUnits(a.path, b.path))
    .slice(0, MAX_SUGGESTIONS)
    .map(({ path }) => path);
}

/** `result` with `suggestions` added, or unchanged when there is none (the field is absent, never empty). */
export function withSuggestions<T extends object>(result: T, suggestions: readonly string[]): T {
  return suggestions.length === 0 ? result : { ...result, suggestions };
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** True when `target` names a regular file inside the project (never one outside it, never an absolute path). */
export async function projectFileExists(root: string, target: string): Promise<boolean> {
  if (target === "" || isAbsolute(target)) return false;
  const projectRoot = resolve(root);
  const inside = relative(projectRoot, resolve(projectRoot, target));
  if (inside === "" || inside === ".." || inside.startsWith(`..${sep}`) || isAbsolute(inside)) return false;
  return isFile(join(projectRoot, inside));
}

/**
 * The project-relative form of a path typed from a sub-directory. A path that already names a file from the project root
 * wins; otherwise a path that names a file from `cwd` is rewritten against the root. Anything else (unknown, absolute,
 * or leaving the project) is returned unchanged for the caller's own checks to refuse.
 */
export async function resolveTargetPath(root: string, cwd: string, target: string): Promise<string> {
  if (target === "" || isAbsolute(target)) return target;
  const projectRoot = resolve(root);
  if (await isFile(join(projectRoot, target))) return target;
  const fromCwd = relative(projectRoot, resolve(cwd, target));
  if (fromCwd === "" || fromCwd === ".." || fromCwd.startsWith(`..${sep}`) || isAbsolute(fromCwd)) return target;
  return (await isFile(join(projectRoot, fromCwd))) ? fromCwd.split(sep).join("/") : target;
}
