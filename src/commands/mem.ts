import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { readConfig } from "../core/config/config.js";
import { searchJournal, type JournalEntry } from "../core/journal/journal.js";

export interface MemOptions { root: string; query?: string | undefined; user?: string | undefined; limit?: number | undefined; }
export interface MemResult { entries: JournalEntry[]; malformed: number; }

export async function searchMemory(options: MemOptions): Promise<MemResult> {
  const config = await readConfig(join(options.root, ".harnix", "config.yaml"));
  const developer = options.user ?? config.developer;
  const journalRoot = join(options.root, ".harnix", "workspace", developer, "journal");
  let names: string[];
  try { names = (await readdir(journalRoot)).filter((name) => name.endsWith(".jsonl")).sort(); }
  catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return { entries: [], malformed: 0 }; throw error; }
  const found = await Promise.all(names.map((name) => searchJournal(join(journalRoot, name), { developer, ...(options.query === undefined ? {} : { query: options.query }) })));
  const limit = Math.max(1, options.limit ?? 20);
  return { entries: found.flatMap((result) => result.entries).sort((left, right) => right.recordedAt.localeCompare(left.recordedAt) || right.id.localeCompare(left.id)).slice(0, limit), malformed: found.reduce((sum, result) => sum + result.malformed, 0) };
}
