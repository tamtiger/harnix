import { readFile, realpath, stat } from "node:fs/promises";
import { isContainedPath } from "src/utils/paths.js";

const MAX_BYTES = 256 * 1024;

/** True when `path` resolves (through symlinks) to `root` or something below it. */
export async function resolvesInside(root: string, path: string): Promise<boolean> {
  try {
    const [realRoot, realPath] = await Promise.all([realpath(root), realpath(path)]);
    return isContainedPath(realRoot, realPath);
  } catch {
    return false;
  }
}

/** Reads a small text file, or returns undefined when it is missing, large or resolves outside `boundary`. */
export async function readTextInside(boundary: string, filePath: string): Promise<string | undefined> {
  try {
    if (!(await resolvesInside(boundary, filePath))) return undefined;
    const metadata = await stat(filePath);
    if (metadata.size > MAX_BYTES) return undefined;
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}
