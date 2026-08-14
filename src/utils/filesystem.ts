import { stat } from "node:fs/promises";

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

function isMissingPathError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
