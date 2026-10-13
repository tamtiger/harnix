const MAX_AREA_DIRECTORIES = 2;

/** Coarse area of a path: up to two leading directories, cut at the first glob, a file name is not part of it. */
export function areaOf(path: string): string[] {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  const glob = segments.findIndex((segment) => /[*?{[]/u.test(segment));
  const literal = glob < 0 ? segments : segments.slice(0, glob);
  const last = literal.at(-1);
  const directories =
    glob < 0 && last !== undefined && last.includes(".") && literal.length > 1 ? literal.slice(0, -1) : literal;
  return directories.slice(0, MAX_AREA_DIRECTORIES);
}

/**
 * True when two paths sit in the same area (or one area contains the other): `src/core/a.ts` and
 * `src/core/workflow/b.ts` overlap, `src/core` and `src/corex` do not.
 */
export function pathsOverlap(left: string, right: string): boolean {
  const a = areaOf(left);
  const b = areaOf(right);
  if (a.length === 0 || b.length === 0) return false;
  const length = Math.min(a.length, b.length);
  return a.slice(0, length).every((segment, index) => segment === b[index]);
}

/** How many active paths overlap any source path; 0 means the lesson says nothing about this task's files. */
export function relevanceScore(activePaths: readonly string[], sourcePaths: readonly string[]): number {
  return activePaths.filter((active) => sourcePaths.some((source) => pathsOverlap(active, source))).length;
}
