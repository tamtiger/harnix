import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { readConfig, validateDeveloperId } from "../core/config/config.js";
import { searchJournal, type JournalEntry } from "../core/journal/journal.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";

export interface MemOptions { root: string; query?: string | undefined; user?: string | undefined; limit?: number | undefined; }
export interface MemResult { entries: JournalEntry[]; malformed: number; }

export async function searchMemory(options: MemOptions): Promise<MemResult> {
  const config = await readConfig(await resolveSafeHarnixPath(options.root, "config.yaml"));
  const developer = validateDeveloperId(options.user ?? config.developer);
  const journalRoot = await resolveSafeProjectPath(options.root, `.harnix/workspace/${developer}/journal`);
  let names: string[];
  try { names = (await readdir(journalRoot)).filter((name) => name.endsWith(".jsonl")).sort(); }
  catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return { entries: [], malformed: 0 }; throw error; }
  const limit = Math.max(1, options.limit ?? 20);
  let entries: JournalEntry[] = [], malformed = 0;
  for (const name of names) {
    const result = await searchJournal(join(journalRoot, name), { developer, limit, ...(options.query === undefined ? {} : { query: options.query }) });
    malformed += result.malformed;
    entries = [...entries, ...result.entries].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt) || right.id.localeCompare(left.id)).slice(0, limit);
  }
  return { entries, malformed };
}
