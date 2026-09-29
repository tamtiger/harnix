import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { MAX_LEARNING_ENTRIES_READ, readLearningStates } from "src/core/journal/learning-store.js";
import { at } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { buildLearningEntry, writeJournalFile } from "test/support/learning-fixtures.js";

const temporaryRepository = useTemporaryRepositories("harnix-learning-store-");

describe("learning store", () => {
  it("returns nothing for a missing journal directory", async () => {
    const root = await temporaryRepository();

    expect((await readLearningStates(join(root, "absent"))).size).toBe(0);
  });

  it("keeps the newest entry of each candidate and breaks a timestamp tie by entry ID", async () => {
    const root = await temporaryRepository();
    await writeJournalFile(root, "2026-09-29.jsonl", [
      buildLearningEntry({ id: "obs-a", status: "draft" }, { id: "a-1", recordedAt: at(0) }),
      buildLearningEntry({ id: "obs-a", status: "candidate" }, { id: "a-2", recordedAt: at(5) }),
      buildLearningEntry({ id: "obs-b", status: "draft" }, { id: "b-1", recordedAt: at(5) }),
      buildLearningEntry({ id: "obs-b", status: "candidate" }, { id: "b-2", recordedAt: at(5) }),
    ]);

    const states = await readLearningStates(root);

    expect(states.get("obs-a")?.candidate.status).toBe("candidate");
    expect(states.get("obs-b")?.entry.id).toBe("b-2");
    expect([...states.keys()].sort()).toEqual(["obs-a", "obs-b"]);
  });

  it("resolves the newest entry across day files regardless of file order", async () => {
    const root = await temporaryRepository();
    await writeJournalFile(root, "2026-09-30.jsonl", [
      buildLearningEntry({ id: "obs-a", status: "draft" }, { id: "late", recordedAt: at(90) }),
    ]);
    await writeJournalFile(root, "2026-09-29.jsonl", [
      buildLearningEntry({ id: "obs-a", status: "candidate" }, { id: "early", recordedAt: at(1) }),
    ]);

    expect((await readLearningStates(root)).get("obs-a")?.entry.id).toBe("late");
  });

  it("ignores non-learning entries, malformed lines and non-journal files", async () => {
    const root = await temporaryRepository();
    const note = {
      generator: "harnix",
      schemaVersion: 1,
      id: "n",
      recordedAt: at(0),
      developer: "tam",
      kind: "note",
      summary: "x",
      evidenceIds: [],
    };
    await writeJournalFile(root, "2026-09-29.jsonl", [note, "not json", buildLearningEntry({ id: "obs-a" })]);
    await mkdir(join(root, "sub"), { recursive: true });
    await writeFile(join(root, "notes.txt"), "ignore me");

    const states = await readLearningStates(root);

    expect([...states.keys()]).toEqual(["obs-a"]);
  });

  it("stops reading further day files once the entry bound is reached", async () => {
    const root = await temporaryRepository();
    const batch = (prefix: string): ReturnType<typeof buildLearningEntry>[] =>
      Array.from({ length: 300 }, (_, index) => buildLearningEntry({ id: `${prefix}-${index}` }));
    await writeJournalFile(root, "2026-09-27.jsonl", batch("old"));
    await writeJournalFile(root, "2026-09-28.jsonl", batch("mid"));
    await writeJournalFile(root, "2026-09-29.jsonl", batch("new"));

    const states = await readLearningStates(root);

    expect(MAX_LEARNING_ENTRIES_READ).toBe(500);
    expect(states.has("new-0")).toBe(true);
    expect(states.has("mid-0")).toBe(true);
    expect(states.has("old-0")).toBe(false);
    expect(states.size).toBe(600);
  });
});
