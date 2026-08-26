import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli-program.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveContextManifest } from "../../src/core/context/context.js";
import { saveTask, setActiveTask, type TaskRecordV2 } from "../../src/core/tasks/task.js";
import { sha256 } from "../../src/utils/hashing.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-context-report-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("context-report command", () => {
  it("reports effective bounded selection metadata without exposing selected content or raw reasons", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "visible.md"), "VISIBLE_CONTEXT_BODY_CANARY\n");
    const active = task("20260826-161000-context-report", ["docs/visible.md"]);
    await saveTask(harnixRoot, active);
    await saveContextManifest(join(harnixRoot, "tasks", active.id), {
      generator: "harnix",
      schemaVersion: 1,
      taskId: active.id,
      maxCharacters: 24_000,
      entries: [{ path: "docs/visible.md", reason: "PRIVATE_RAW_REASON_CANARY", priority: 7, pinned: true, states: ["PRIVATE_STATE_CANARY"] }],
      omitted: [],
    });
    await setActiveTask(harnixRoot, active.id);
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "context-report", "--platform", "codex", "--limit", "20"])).resolves.toBe(0);

    const raw = output(stdout.mock.calls);
    const result = JSON.parse(raw) as {
      platform: string;
      filter: { limit: number };
      activeTask: {
        id: string;
        budget: { maxCharacters: number; maxEntries: number };
        drift: { state: string; changes: unknown[]; selectionChanges: unknown[] };
        summary: { candidates: number; selected: number; omitted: number; detailsTruncated: boolean };
        selected: Array<{ path: string; reasonCodes: string[]; priority: number; pinned: boolean }>;
      };
    };
    expect(result).toMatchObject({ generator: "harnix", schemaVersion: 1, scope: "project", platform: "codex", filter: { limit: 20 } });
    expect(result.activeTask).toMatchObject({
      id: active.id,
      budget: { maxCharacters: 2_500, maxEntries: 64 },
      drift: { state: "not-recorded", changes: [], selectionChanges: [] },
      summary: { detailsTruncated: false },
    });
    expect(result.activeTask.summary.candidates).toBeGreaterThanOrEqual(2);
    expect(result.activeTask.summary.selected + result.activeTask.summary.omitted).toBeGreaterThanOrEqual(2);
    expect(result.activeTask.selected).toContainEqual({
      path: "docs/visible.md",
      reasonCodes: ["persisted-selection", "pinned", "task-reference"],
      priority: 1_507,
      pinned: true,
    });
    for (const canary of ["VISIBLE_CONTEXT_BODY_CANARY", "PRIVATE_RAW_REASON_CANARY", "PRIVATE_STATE_CANARY", "PRIVATE_TITLE_CANARY", "PRIVATE_GOAL_CANARY", root]) expect(raw).not.toContain(canary);
    expect(Buffer.byteLength(raw, "utf8")).toBeLessThanOrEqual(262_144);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("returns bounded no-active metadata and validates public filters", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "context-report", "--platform", "kiro"])).resolves.toBe(0);
    expect(JSON.parse(output(stdout.mock.calls))).toEqual({ generator: "harnix", schemaVersion: 1, scope: "project", platform: "kiro", filter: { limit: 20 }, activeTask: null });
    await expect(snapshotTree(root)).resolves.toEqual(before);

    for (const argv of [
      ["node", "harnix", "context-report"],
      ["node", "harnix", "context-report", "--platform", "gemini"],
      ["node", "harnix", "context-report", "--platform", "codex", "--limit", "0"],
      ["node", "harnix", "context-report", "--platform", "codex", "--limit", "51"],
    ]) {
      stdout.mockClear();
      await expect(runCli(argv)).resolves.toBe(2);
      expect(JSON.parse(output(stdout.mock.calls))).toMatchObject({ generator: "harnix", schemaVersion: 1, ok: false, error: { exitCode: 2 } });
    }
  });

  it("bounds selected and drift details while retaining full counts", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "a.md"), "after-a\n");
    await writeFile(join(root, "docs", "b.md"), "after-b\n");
    const active = task("20260826-161002-context-limit", ["docs/a.md", "docs/b.md"]);
    await saveTask(harnixRoot, active);
    await saveContextManifest(join(harnixRoot, "tasks", active.id), {
      generator: "harnix",
      schemaVersion: 1,
      taskId: active.id,
      maxCharacters: 24_000,
      entries: [
        { path: "docs/a.md", reason: "private-a", priority: 0, pinned: false, states: [], contentHash: sha256("before-a\n") },
        { path: "docs/b.md", reason: "private-b", priority: 0, pinned: false, states: [], contentHash: sha256("before-b\n") },
      ],
      omitted: [],
    });
    await setActiveTask(harnixRoot, active.id);
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "context-report", "--platform", "kiro", "--limit", "1"])).resolves.toBe(0);

    const result = JSON.parse(output(stdout.mock.calls)) as { activeTask: { drift: { state: string; changeCount: number; returnedChanges: number; changesTruncated: boolean }; summary: { selected: number; returnedSelected: number; selectedTruncated: boolean; detailsTruncated: boolean }; selected: unknown[] } };
    expect(result.activeTask.drift).toMatchObject({ state: "stale", changeCount: 2, returnedChanges: 1, changesTruncated: true });
    expect(result.activeTask.summary).toMatchObject({ returnedSelected: 1, selectedTruncated: true, detailsTruncated: true });
    expect(result.activeTask.summary.selected).toBeGreaterThan(1);
    expect(result.activeTask.selected).toHaveLength(1);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("redacts malformed persisted context instead of echoing parser input", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const active = task("20260826-161003-context-malformed", []);
    await saveTask(harnixRoot, active);
    await setActiveTask(harnixRoot, active.id);
    await writeFile(join(harnixRoot, "tasks", active.id, "context.json"), "PRIVATE_CONTEXT_PARSE_CANARY");
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "context-report", "--platform", "codex"])).resolves.toBe(2);

    const raw = output(stdout.mock.calls);
    expect(JSON.parse(raw)).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      ok: false,
      error: { exitCode: 2, message: "Context report state is unavailable; run harnix doctor." },
    });
    expect(raw).not.toContain("PRIVATE_CONTEXT_PARSE_CANARY");
    expect(raw).not.toContain(root);
  });
});

function task(id: string, relevantPaths: string[]): TaskRecordV2 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id,
    title: "PRIVATE_TITLE_CANARY",
    mode: "lite",
    status: "in_progress",
    checkpoint: "implementing",
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "PRIVATE_CRITERION_CANARY", status: "pending", evidenceIds: [] }],
    relevantPaths,
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "PRIVATE_COMMAND_CANARY", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function output(calls: readonly (readonly unknown[])[]): string {
  return calls.map((call) => String(call[0])).join("");
}

async function snapshotTree(root: string): Promise<Array<{ path: string; sha256: string }>> {
  const files = await walk(root);
  return Promise.all(files.map(async (path) => ({ path: relative(root, path).replaceAll("\\", "/"), sha256: createHash("sha256").update(await readFile(path)).digest("hex") })));
}

async function walk(root: string): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}
