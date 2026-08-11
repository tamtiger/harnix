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

    await expect(searchMemory({ root, user: "../../outside" })).rejects.toThrow("workspace ID");
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
});
