import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { MAX_LEARNED_BLOCKS, parseLearnedBlocks, renderLearnedBlock } from "src/core/journal/learned-blocks.js";
import { promoteLearning, retireLearning } from "src/core/journal/learned-promote.js";
import { readLearningStates } from "src/core/journal/learning-store.js";
import { at } from "test/support/builders.js";
import { buildLearningCandidate, buildLearningEntry, writeJournalFile } from "test/support/learning-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-learning-promote-");

async function setup(ids: string[] = ["obs-a"]) {
  const root = await temporaryRepository();
  const journalRoot = join(root, ".harnix", "workspace", "tam", "journal");
  await writeJournalFile(
    journalRoot,
    "2026-09-29.jsonl",
    ids.map((id, index) => buildLearningEntry({ id, status: "candidate" }, { id: `${id}-1`, recordedAt: at(index) })),
  );
  const base = (id: string, now = at(30)) => ({
    projectRoot: root,
    journalRoot,
    journalPath: join(journalRoot, "2026-09-30.jsonl"),
    developer: "tam",
    id,
    now,
  });
  return { root, journalRoot, base, specPath: join(root, ".harnix", "spec", "learned.md") };
}

describe("promoteLearning", () => {
  it("returns only the proposal without apply and writes nothing", async () => {
    const { base, specPath, journalRoot } = await setup();

    const result = await promoteLearning({ ...base("obs-a"), paths: ["src/core"], apply: false });

    expect(result.applied).toBe(false);
    expect(result.content).toContain("Candidate: obs-a");
    await expect(readFile(specPath, "utf8")).rejects.toThrow();
    expect((await readLearningStates(journalRoot)).get("obs-a")?.candidate.status).toBe("candidate");
  });

  it("creates the file with a header, adds the block and records promoted", async () => {
    const { base, specPath, journalRoot } = await setup();

    const result = await promoteLearning({ ...base("obs-a"), paths: ["src/core"], apply: true });

    const text = await readFile(specPath, "utf8");
    expect(result).toMatchObject({ applied: true, blocks: 1, alreadyPresent: false });
    expect(text.startsWith("# Learned rules")).toBe(true);
    expect(parseLearnedBlocks(text).map((block) => [block.id, block.paths])).toEqual([["obs-a", ["src/core"]]]);
    expect((await readLearningStates(journalRoot)).get("obs-a")?.candidate.status).toBe("promoted");
  });

  it("keeps existing user text and appends after it", async () => {
    const { base, specPath } = await setup();
    await mkdir(join(specPath, ".."), { recursive: true });
    await writeFile(specPath, "# Mine\n\nkeep this");

    await promoteLearning({ ...base("obs-a"), paths: [], apply: true });

    const text = await readFile(specPath, "utf8");
    expect(text.startsWith("# Mine\n\nkeep this\n\n<!-- harnix-learning:obs-a -->")).toBe(true);
  });

  it("only records the status when the block is already in the file (retry after a crash)", async () => {
    const { base, specPath, journalRoot } = await setup();
    await mkdir(join(specPath, ".."), { recursive: true });
    const crashed = `${renderLearnedBlock(buildLearningCandidate({ id: "obs-a" }), [])}`;
    await writeFile(specPath, crashed);

    const result = await promoteLearning({ ...base("obs-a", at(40)), paths: [], apply: true });

    expect(result.alreadyPresent).toBe(true);
    expect(await readFile(specPath, "utf8")).toBe(crashed);
    expect((await readLearningStates(journalRoot)).get("obs-a")?.candidate.status).toBe("promoted");
  });

  it("refuses a learning that cannot be promoted before touching the file", async () => {
    const { base, specPath } = await setup();
    await promoteLearning({ ...base("obs-a"), paths: [], apply: true });
    const before = await readFile(specPath, "utf8");

    await expect(promoteLearning({ ...base("obs-a", at(50)), paths: [], apply: true })).rejects.toThrow(/cannot/iu);
    expect(await readFile(specPath, "utf8")).toBe(before);
  });

  it("refuses the 41st block with a hint to retire one", async () => {
    const ids = Array.from({ length: MAX_LEARNED_BLOCKS + 1 }, (_, index) => `obs-${String(index).padStart(2, "0")}`);
    const { base } = await setup(ids);
    for (const id of ids.slice(0, MAX_LEARNED_BLOCKS)) await promoteLearning({ ...base(id), paths: [], apply: true });

    await expect(promoteLearning({ ...base(ids[MAX_LEARNED_BLOCKS]!), paths: [], apply: true })).rejects.toThrow(
      /--retire/u,
    );
  });
});

describe("retireLearning", () => {
  it("removes the block, keeps user text and records archived", async () => {
    const { base, specPath, journalRoot } = await setup(["obs-a", "obs-b"]);
    await mkdir(join(specPath, ".."), { recursive: true });
    await writeFile(specPath, "# Mine\n\nkeep this\n");
    await promoteLearning({ ...base("obs-a"), paths: [], apply: true });
    await promoteLearning({ ...base("obs-b", at(31)), paths: [], apply: true });

    const result = await retireLearning(base("obs-a", at(40)));

    const text = await readFile(specPath, "utf8");
    expect(result).toEqual({ removed: true, blocks: 1 });
    expect(text).toContain("keep this");
    expect(parseLearnedBlocks(text).map((block) => block.id)).toEqual(["obs-b"]);
    expect((await readLearningStates(journalRoot)).get("obs-a")?.candidate.status).toBe("archived");
  });

  it("refuses to retire a learning that was never promoted", async () => {
    const { base } = await setup();

    await expect(retireLearning(base("obs-a"))).rejects.toThrow(/cannot/iu);
  });
});
