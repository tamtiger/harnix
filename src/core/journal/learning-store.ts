import { readdir } from "src/utils/fs-access.js";
import { join } from "node:path";

import { searchJournal, type JournalEntry } from "src/core/journal/journal.js";
import type { LearningCandidate } from "src/core/journal/learning.js";
import { compareCodeUnits } from "src/utils/order.js";

/** Newest journal entry of one learning candidate; the journal is append-only, so the latest entry is its state. */
export interface LearningState {
  entry: JournalEntry;
  candidate: LearningCandidate;
}

/** Upper bound on learning entries inspected per read, newest files first, so hooks stay fast. */
export const MAX_LEARNING_ENTRIES_READ = 500;

export async function readLearningStates(journalRoot: string): Promise<Map<string, LearningState>> {
  let names: string[];
  try {
    names = (await readdir(journalRoot)).filter((name) => name.endsWith(".jsonl")).sort(compareCodeUnits);
  } catch {
    return new Map();
  }
  const states = new Map<string, LearningState>();
  let inspected = 0;
  for (const name of names.reverse()) {
    if (inspected >= MAX_LEARNING_ENTRIES_READ) break;
    const { entries } = await searchJournal(join(journalRoot, name), { kind: "learning" });
    for (const entry of entries) {
      inspected += 1;
      if (entry.learning === undefined) continue;
      const current = states.get(entry.learning.id);
      if (current === undefined || isNewer(entry, current.entry))
        states.set(entry.learning.id, { entry, candidate: entry.learning });
    }
  }
  return states;
}

function isNewer(left: JournalEntry, right: JournalEntry): boolean {
  const delta = Date.parse(left.recordedAt) - Date.parse(right.recordedAt);
  return delta > 0 || (delta === 0 && compareCodeUnits(left.id, right.id) > 0);
}
