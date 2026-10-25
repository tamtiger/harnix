import { readFile } from "node:fs/promises";
import { PROJECT_FACTS_PATH } from "src/core/spec/project-facts.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

export const FACTS_HINT =
  "Run 'harnix update' to regenerate .harnix/spec/project-facts.md (it does not alter task state).";

/** True when project-facts.md was extracted at another commit than HEAD; undefined when that cannot be told. */
export async function checkFactsStale(root: string, currentCommit?: string): Promise<boolean | undefined> {
  if (currentCommit === undefined) return undefined;
  try {
    const factsPath = await resolveSafeProjectPath(root, PROJECT_FACTS_PATH);
    const text = await readFile(factsPath, "utf8");
    const match = /<!--\s*git-commit:\s*([a-f0-9]+)\s*-->/u.exec(text);
    return match === null ? undefined : match[1] !== currentCommit;
  } catch {
    return undefined;
  }
}
