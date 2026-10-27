import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { saveTask } from "src/core/tasks/task.js";
import { at, buildTaskV3 } from "test/support/builders.js";
import { buildLearningEntry, writeJournalFile } from "test/support/learning-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-learning-command-");
const SOURCE_TASK = "20260929-090000-source";

beforeEach(() => {
  // The fixtures are dated 2026-09-29; a real clock would age their learning past the 28-day TTL.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-02T00:00:00+07:00"));
});

afterEach(() => {
  vi.useRealTimers();
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

async function project(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  await saveTask(join(root, ".harnix"), buildTaskV3({ id: SOURCE_TASK, relevantPaths: ["src/core/workflow/save.ts"] }));
  const journal = join(root, ".harnix", "workspace", "tam", "journal");
  await mkdir(journal, { recursive: true });
  await writeJournalFile(journal, "2099-01-01.jsonl", [
    buildLearningEntry(
      {
        id: "obs-a",
        status: "candidate",
        statement: "Inject the clock into every unit test for determinism",
        sourceTaskIds: [SOURCE_TASK],
      },
      { id: "a-1", recordedAt: at(0) },
    ),
    buildLearningEntry(
      {
        id: "obs-b",
        status: "draft",
        statement: "Prefer test builders over hand-built task records",
        sourceTaskIds: [SOURCE_TASK],
      },
      { id: "b-1", recordedAt: at(1) },
    ),
  ]);
  process.chdir(root);
  return root;
}

async function learning(...args: string[]): Promise<{ code: number; json: Record<string, unknown>; err: string }> {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const code = await runCli(["node", "harnix", "learning", ...args]);
  const out = stdout.mock.calls.map((call) => String(call[0])).join("");
  const err = stderr.mock.calls.map((call) => String(call[0])).join("");
  stdout.mockRestore();
  stderr.mockRestore();
  return { code, json: out.trim() ? (JSON.parse(out) as Record<string, unknown>) : {}, err };
}

type Item = { id: string; status: string };

describe.sequential("learning command", () => {
  it("lists learning with the effective status, the spec size and honours --status and --limit", async () => {
    await project();

    const all = await learning();
    const drafts = await learning("--status", "draft");
    const one = await learning("--limit", "1");

    expect(all.code).toBe(0);
    expect((all.json.items as Item[]).map((item) => [item.id, item.status]).sort()).toEqual([
      ["obs-a", "candidate"],
      ["obs-b", "draft"],
    ]);
    expect(all.json.spec).toEqual({ path: ".harnix/spec/learned.md", blocks: 0, characters: 0, maxBlocks: 40 });
    expect((drafts.json.items as Item[]).map((item) => item.id)).toEqual(["obs-b"]);
    expect(one.json.items as Item[]).toHaveLength(1);
  });

  it("previews a promotion without writing anything", async () => {
    const root = await project();

    const result = await learning("--promote", "obs-a");

    expect(result.code).toBe(0);
    expect(result.json).toMatchObject({ action: "promote", id: "obs-a", applied: false, blocks: 1 });
    expect(String(result.json.proposal)).toContain("Candidate: obs-a");
    await expect(readFile(join(root, ".harnix", "spec", "learned.md"), "utf8")).rejects.toThrow();
    expect(((await learning("--status", "candidate")).json.items as Item[]).map((item) => item.id)).toEqual(["obs-a"]);
  });

  it("promotes with --apply, scoping the block to the source task's paths, then retires it", async () => {
    const root = await project();

    const promoted = await learning("--promote", "obs-a", "--apply");
    const text = await readFile(join(root, ".harnix", "spec", "learned.md"), "utf8");
    const listed = await learning("--status", "promoted");

    expect(promoted.json).toMatchObject({ action: "promote", applied: true, status: "promoted" });
    expect(text).toContain("<!-- harnix-learning:obs-a paths=src/core/workflow -->");
    expect(listed.json.spec).toMatchObject({ blocks: 1 });
    expect((listed.json.items as Item[]).map((item) => item.id)).toEqual(["obs-a"]);

    const retired = await learning("--retire", "obs-a");

    expect(retired.json).toMatchObject({ action: "retire", removed: true, status: "archived", blocks: 0 });
    expect(await readFile(join(root, ".harnix", "spec", "learned.md"), "utf8")).not.toContain("obs-a");
  });

  it("rejects several learnings at once from a comma-separated list and reports unknown ids", async () => {
    await project();

    const bulk = await learning("--reject", "obs-a,obs-b,obs-missing", "--reason", "noise");
    const rejected = await learning("--status", "rejected");

    expect(bulk.code).toBe(0);
    expect(bulk.json).toMatchObject({ action: "reject", ids: ["obs-a", "obs-b"], status: "rejected" });
    expect((bulk.json.failed as { id: string }[]).map((item) => item.id)).toEqual(["obs-missing"]);
    expect((rejected.json.items as Item[]).map((item) => item.id).sort()).toEqual(["obs-a", "obs-b"]);
  });

  it("accepts an id with a trailing comma, spaces or a repeat as that one id", async () => {
    await project();

    expect((await learning("--promote", "obs-a,")).json).toMatchObject({ action: "promote", id: "obs-a" });
    expect((await learning("--reject", " obs-a ")).json).toMatchObject({ action: "reject", id: "obs-a" });
    expect((await learning("--reject", "obs-b,obs-b")).json).toMatchObject({ action: "reject", id: "obs-b" });
  });

  it("rejects a learning with a reason and then refuses to promote it", async () => {
    await project();

    const rejected = await learning("--reject", "obs-b", "--reason", "too specific");
    const again = await learning("--promote", "obs-b", "--apply");

    expect(rejected.json).toMatchObject({ action: "reject", id: "obs-b", status: "rejected" });
    expect(again.code).toBe(2);
    expect(again.err).toMatch(/cannot/iu);
  });

  it.each([
    [["--promote", "obs-a", "--reject", "obs-b"], /only one/iu],
    [["--apply"], /--apply.*--promote/iu],
    [["--reject", "obs-a", "--apply"], /--apply.*--promote/iu],
    [["--promote", "obs-a", "--reason", "x"], /--reason.*--reject/iu],
    [["--promote", "obs-a", "--status", "draft"], /listing/iu],
    [["--promote", "../evil"], /invalid/iu],
    [["--promote", "obs-missing"], /does not exist/iu],
    [["--status", "weird"], /--status/iu],
    [["--prune", "--promote", "obs-a"], /only one/iu],
    [["--prune", "--reason", "x"], /--reason.*--reject/iu],
    [["--prune", "--status", "draft"], /listing/iu],
    [["--limit", "0"], /--limit/iu],
  ])("rejects %j", async (args, message) => {
    await project();

    const result = await learning(...args);

    expect(result.code).toBe(2);
    expect(result.err).toMatch(message);
  });

  it("previews low-value drafts with --prune and rejects them only with --apply", async () => {
    const root = await project();
    const journal = join(root, ".harnix", "workspace", "tam", "journal");
    await writeJournalFile(journal, "2099-01-02.jsonl", [
      buildLearningEntry({ id: "obs-noise", status: "draft", statement: "ngắn quá" }, { id: "n-1", recordedAt: at(2) }),
    ]);

    const preview = await learning("--prune");
    const listedBefore = await learning("--status", "draft");

    expect(preview.code).toBe(0);
    expect(preview.json).toMatchObject({ action: "prune", applied: false, rejected: [] });
    expect((preview.json.matches as { id: string; reason: string }[]).map((m) => [m.id, m.reason])).toEqual([
      ["obs-noise", "too-short"],
    ]);
    expect((listedBefore.json.items as Item[]).map((item) => item.id)).toContain("obs-noise");

    const applied = await learning("--prune", "--apply");
    const rejected = await learning("--status", "rejected");

    expect(applied.json).toMatchObject({ action: "prune", applied: true, rejected: ["obs-noise"] });
    expect((rejected.json.items as Item[]).map((item) => item.id)).toEqual(["obs-noise"]);
    expect(await readFile(join(journal, "2099-01-02.jsonl"), "utf8")).toContain('"status":"draft"');
    expect(((await learning("--prune")).json as { matches: unknown[] }).matches).toEqual([]);
  });

  it("reports near-duplicate ids as similar in the listing and in a promotion preview", async () => {
    const root = await project();
    const journal = join(root, ".harnix", "workspace", "tam", "journal");
    await writeJournalFile(journal, "2099-01-03.jsonl", [
      buildLearningEntry(
        { id: "obs-twin", status: "draft", statement: "Tiêm đồng hồ vào mọi unit test để kết quả ổn định" },
        { id: "t-1", recordedAt: at(3) },
      ),
      buildLearningEntry(
        { id: "obs-twin2", status: "draft", statement: "Tiem dong ho vao moi unit test de ket qua on dinh hon" },
        { id: "t-2", recordedAt: at(4) },
      ),
    ]);

    const listed = await learning();
    const similar = (id: string) =>
      (listed.json.items as { id: string; similar: { id: string; score: number }[] }[]).find((item) => item.id === id)
        ?.similar;
    const preview = await learning("--promote", "obs-twin");

    expect(similar("obs-twin")?.map((match) => match.id)).toEqual(["obs-twin2"]);
    expect(similar("obs-twin2")?.map((match) => match.id)).toEqual(["obs-twin"]);
    expect(similar("obs-a")).toEqual([]);
    expect((preview.json.similar as { id: string }[]).map((match) => match.id)).toEqual(["obs-twin2"]);
  });

  it("fails closed outside an initialized project", async () => {
    process.chdir(await temporaryRepository());

    expect((await learning()).code).toBe(2);
  });
});
