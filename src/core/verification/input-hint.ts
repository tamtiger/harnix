import { stat } from "node:fs/promises";

import { resolveSafeProjectPath } from "src/utils/paths.js";

/** The leading path segments of a glob that hold no glob character. */
function staticSegments(input: string): string[] {
  const segments: string[] = [];
  for (const segment of input.split(/[\\/]/u)) {
    if (segment === "" || /[*?[\]{}()!]/u.test(segment)) break;
    segments.push(segment);
  }
  return segments;
}

async function isDirectory(root: string, relative: string): Promise<boolean> {
  try {
    return relative === "" || (await stat(await resolveSafeProjectPath(root, relative))).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Tells how to replace an input glob that matches no file (for example a file that was deleted, so a check can still
 * assert its absence): the nearest parent directory that still exists, as a `<dir>/**` glob.
 */
export async function missingInputHint(projectRoot: string, input: string): Promise<string> {
  const segments = staticSegments(input);
  while (segments.length > 0 && !(await isDirectory(projectRoot, segments.join("/")))) segments.pop();
  const directory = segments.join("/");
  const replacement = directory === "" ? "**" : `${directory}/**`;
  return (
    ` Nearest existing directory: ${directory === "" ? "the repository root" : `"${directory}"`}; ` +
    `use the input "${replacement}" (for example --input "${replacement}") so the digest covers files that still exist.`
  );
}
