import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { MAX_PRUNE_BATCH, findLowValueLearning, pruneLearning } from "src/core/journal/learning-prune.js";
import { readLearningStates } from "src/core/journal/learning-store.js";
import { at } from "test/support/builders.js";
import { buildLearningEntry, writeJournalFile } from "test/support/learning-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-learning-prune-");
const now = at(60);
const GOOD = "Luôn chạy test:gates trước khi vào verifying để bắt lỗi hợp đồng sớm";

async function journal(): Promise<string> {
  const root = await temporaryRepository();
  await writeJournalFile(root, "2026-09-29.jsonl", [
    buildLearningEntry({ id: "obs-short", status: "draft", statement: "ngắn quá" }, { id: "e1", recordedAt: at(1) }),
    buildLearningEntry({ id: "obs-test", status: "candidate", statement: "test ".repeat(12).trim() }, { id: "e2" }),
    buildLearningEntry({ id: "obs-good", status: "draft", statement: GOOD }, { id: "e3" }),
    buildLearningEntry({ id: "obs-done", status: "rejected", statement: "ngắn" }, { id: "e4" }),
    buildLearningEntry(
      { id: "obs-old", status: "draft", statement: "cũ" },
      { id: "e5", recordedAt: at(-60 * 24 * 40) },
    ),
  ]);
  return root;
}

describe("learning prune", () => {
  it("finds only live drafts and candidates the quality filter rejects, sorted by id", async () => {
    const root = await journal();

    const matches = await findLowValueLearning(root, now);

    expect(matches.map((match) => [match.id, match.reason])).toEqual([
      ["obs-short", "too-short"],
      ["obs-test", "test-string"],
    ]);
  });

  it("also flags a local decision that names a file without a rule", async () => {
    const root = await temporaryRepository();
    await writeJournalFile(root, "2026-09-29.jsonl", [
      buildLearningEntry(
        { id: "obs-local", status: "draft", statement: "Da them ham moi vao src/core/workflow/preflight.ts de goi" },
        { id: "l1" },
      ),
    ]);

    const matches = await findLowValueLearning(root, now);

    expect(matches.map((match) => [match.id, match.reason])).toEqual([["obs-local", "local-decision"]]);
  });

  it("rejects every match with a new entry and leaves the earlier journal lines untouched", async () => {
    const root = await journal();
    const file = join(root, "2026-09-29.jsonl");
    const before = await readFile(file, "utf8");
    const matches = await findLowValueLearning(root, now);

    const rejected = await pruneLearning(
      { journalRoot: root, journalPath: join(root, "2026-10-13.jsonl"), developer: "tam", now },
      matches,
    );

    expect(rejected).toEqual(["obs-short", "obs-test"]);
    expect(await readFile(file, "utf8")).toBe(before);
    expect(await readdir(root)).toContain("2026-10-13.jsonl");
    const states = await readLearningStates(root);
    expect(states.get("obs-short")?.candidate.status).toBe("rejected");
    expect(states.get("obs-test")?.candidate.status).toBe("rejected");
    expect(states.get("obs-good")?.candidate.status).toBe("draft");
    expect(await findLowValueLearning(root, now)).toEqual([]);
  });

  it("caps one batch", async () => {
    const root = await temporaryRepository();
    await writeJournalFile(
      root,
      "2026-09-29.jsonl",
      Array.from({ length: MAX_PRUNE_BATCH + 5 }, (_, index) =>
        buildLearningEntry({ id: `obs-${index}`, status: "draft", statement: "ngắn" }, { id: `e${index}` }),
      ),
    );

    expect(await findLowValueLearning(root, now)).toHaveLength(MAX_PRUNE_BATCH);
  });
});
