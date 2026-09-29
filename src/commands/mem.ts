import { readdir } from "src/utils/fs-access.js";
import { join } from "node:path";

import { readConfig, validateDeveloperId } from "src/core/config/config.js";
import { searchJournal, type JournalEntry } from "src/core/journal/journal.js";
import { effectiveLearningStatus } from "src/core/journal/learning.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { compareCodeUnits } from "src/utils/order.js";

export interface MemOptions {
  root: string;
  query?: string | undefined;
  user?: string | undefined;
  limit?: number | undefined;
  learningOnly?: boolean | undefined;
  /** Wall clock for learning expiry; defaults to the current time. */
  now?: number | undefined;
}
export interface MemResult {
  entries: JournalEntry[];
  malformed: number;
}

export async function searchMemory(options: MemOptions): Promise<MemResult> {
  const config = await readConfig(await resolveSafeHarnixPath(options.root, "config.yaml"));
  const developer = validateDeveloperId(options.user ?? config.developer);
  const journalRoot = await resolveSafeProjectPath(options.root, `.harnix/workspace/${developer}/journal`);
  let names: string[];
  try {
    names = (await readdir(journalRoot)).filter((name) => name.endsWith(".jsonl")).sort();
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")
      return { entries: [], malformed: 0 };
    throw error;
  }
  const limit = Math.max(1, options.limit ?? 20);
  let entries: JournalEntry[] = [],
    malformed = 0;
  for (const name of names) {
    const result = await searchJournal(join(journalRoot, name), {
      developer,
      limit,
      ...(options.learningOnly === true ? { kind: "learning" as const } : {}),
      ...(options.query === undefined ? {} : { query: options.query }),
    });
    malformed += result.malformed;
    entries = [...entries, ...result.entries]
      .sort((left, right) => compareCodeUnits(right.recordedAt, left.recordedAt) || compareCodeUnits(right.id, left.id))
      .slice(0, limit);
  }
  const now = options.now ?? Date.now();
  return { entries: entries.map((entry) => withEffectiveStatus(entry, now)), malformed };
}

/** Shows a lapsed draft or candidate as `archived` without rewriting the journal. */
function withEffectiveStatus(entry: JournalEntry, now: number): JournalEntry {
  if (entry.learning === undefined) return entry;
  return {
    ...entry,
    learning: { ...entry.learning, status: effectiveLearningStatus(entry.learning.status, entry.recordedAt, now) },
  };
}
