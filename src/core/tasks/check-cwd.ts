import { normalizeRepositoryPath } from "src/utils/paths.js";

/**
 * Canonical repository-relative POSIX form of a check's working directory (`.` is the project root). Rejects
 * traversal, absolute paths and drive-relative forms such as `D:foo`, which `path.resolve` would resolve outside
 * the project on Windows even though they are not absolute.
 */
export function normalizeCheckCwd(cwd: string): string {
  if (cwd.split(/[\\/]/u).some((segment) => segment.includes(":"))) {
    throw new Error("A check cwd must be a plain repository-relative path without drive or stream separators.");
  }
  return normalizeRepositoryPath(cwd, { allowRoot: true });
}
