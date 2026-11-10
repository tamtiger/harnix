import { readFile, stat } from "node:fs/promises";
import { isMissingPathError } from "src/utils/errno.js";

type Stat = (path: string) => Promise<unknown>;

/** Returns false only for a genuinely missing path; all other filesystem failures stay visible. */
export async function pathExists(path: string, inspect: Stat = stat): Promise<boolean> {
  try {
    await inspect(path);
    return true;
  } catch (error: unknown) {
    if (isMissingPathError(error)) return false;
    throw error;
  }
}

/** Reads a UTF-8 file; a missing file is `undefined`, every other failure stays visible. */
export async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error: unknown) {
    if (isMissingPathError(error)) return undefined;
    throw error;
  }
}

/** Reads a UTF-8 file no larger than `maximumBytes`; a missing, larger or unreadable file is `undefined`. */
export async function readBoundedText(path: string, maximumBytes: number): Promise<string | undefined> {
  try {
    if ((await stat(path)).size > maximumBytes) return undefined;
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}
