import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { searchMemory } from "../../src/commands/mem.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-memory-");

async function initializedRepository(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

describe("searchMemory", () => {
  it("should_search_unicode_journal_entries_and_skip_malformed_data", async () => {
    const root = await initializedRepository();
    const journal = join(root, ".harnix", "workspace", "tam", "journal");
    await mkdir(journal, { recursive: true });
    await writeFile(
      join(journal, "2026-08-07.jsonl"),
      "not json\n" + JSON.stringify({
        generator: "harnix",
        schemaVersion: 1,
        id: "2",
        recordedAt: "2026-08-07T00:00:00Z",
        developer: "tam",
        kind: "learning",
        summary: "Unicode tiếng Việt",
        evidenceIds: [],
        learning: {
          id: "l",
          statement: "x",
          sourceTaskIds: [],
          evidenceIds: [],
          occurrences: 0,
          confidence: 0.4,
          status: "candidate",
        },
      }) + "\n",
    );

    await expect(searchMemory({ root, query: "TIẾNG" })).resolves.toMatchObject({
      malformed: 1,
      entries: [{ summary: "Unicode tiếng Việt" }],
    });
  });

  it("should_reject_unsafe_user_when_searching_memory", async () => {
    const root = await initializedRepository();

    await expect(searchMemory({ root, user: "../../outside" })).rejects.toThrow("journal ID");
  });

  it("should_skip_malformed_journal_shape_when_searching_memory", async () => {
    const root = await initializedRepository();
    const journal = join(root, ".harnix", "workspace", "tam", "journal");
    await mkdir(journal, { recursive: true });
    await writeFile(
      join(journal, "2026-08-10.jsonl"),
      "{\"generator\":\"harnix\",\"schemaVersion\":1,\"recordedAt\":7}\n",
    );

    await expect(searchMemory({ root })).resolves.toEqual({ entries: [], malformed: 1 });
  });

  it("filters learning entries before applying query and limit without changing the default result", async () => {
    const root = await initializedRepository();
    const journal = join(root, ".harnix", "workspace", "tam", "journal");
    await mkdir(journal, { recursive: true });
    const completion = { generator: "harnix", schemaVersion: 1, id: "completion", recordedAt: "2026-08-20T00:00:01.000Z", developer: "tam", kind: "completion", summary: "Completed: workflow", evidenceIds: [] };
    const learning = {
      generator: "harnix", schemaVersion: 1, id: "learning", recordedAt: "2026-08-20T00:00:00.000Z", developer: "tam", kind: "learning", summary: "Learning candidate: workflow-parity", evidenceIds: ["e1", "e2"],
      learning: { id: "workflow-parity", statement: "Keep workflow surfaces aligned.", sourceTaskIds: ["t1", "t2"], evidenceIds: ["e1", "e2"], occurrences: 2, confidence: 0.8, status: "candidate" },
    };
    await writeFile(join(journal, "2026-08-20.jsonl"), `${JSON.stringify(learning)}\n${JSON.stringify(completion)}\n`);

    await expect(searchMemory({ root })).resolves.toMatchObject({ entries: [{ id: "completion" }, { id: "learning" }] });
    await expect(searchMemory({ root, learningOnly: true, query: "WORKFLOW", limit: 1 })).resolves.toMatchObject({ entries: [{ id: "learning", kind: "learning" }], malformed: 0 });
  });
});
