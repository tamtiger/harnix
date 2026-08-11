import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appendJournal, searchJournal, type JournalEntry } from "../../src/core/journal/journal.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("journal", () => {
  it("searches journal newest-first and skips malformed lines", async () => {
    const root = await temporaryRepository(); const path = join(root, "j.jsonl"); await writeFile(path, `${JSON.stringify({ generator: "harnix", schemaVersion: 1, id: "1", recordedAt: "1", developer: "d", kind: "note", summary: "old", evidenceIds: [] })}\nbad\n${JSON.stringify({ generator: "harnix", schemaVersion: 1, id: "2", recordedAt: "2", developer: "d", kind: "note", summary: "new", evidenceIds: [] })}\n`);
    const result = await searchJournal(path, { developer: "d" }); expect(result.entries[0]?.summary).toBe("new"); expect(result.malformed).toBe(1);
  });

  it("should_preserve_every_entry_when_appends_are_concurrent_and_limit_search_memory", async () => {
    const root = await temporaryRepository(); const path = join(root, "journal.jsonl");
    const entries: JournalEntry[] = Array.from({ length: 40 }, (_, index) => ({ generator: "harnix", schemaVersion: 1, id: String(index).padStart(2, "0"), recordedAt: new Date(Date.UTC(2026, 7, 10, 0, 0, index)).toISOString(), developer: "tam", kind: "note", summary: `entry ${index}`, evidenceIds: [] }));

    await Promise.all(entries.map((journalEntry) => appendJournal(path, journalEntry)));
    const all = await searchJournal(path, { developer: "tam" });
    const limited = await searchJournal(path, { developer: "tam", limit: 5 });

    expect(all.entries).toHaveLength(40);
    expect(new Set(all.entries.map((journalEntry) => journalEntry.id)).size).toBe(40);
    expect(limited.entries.map((journalEntry) => journalEntry.id)).toEqual(["39", "38", "37", "36", "35"]);
  });
});
