import { describe, expect, it } from "vitest";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderInternalContextForHook } from "src/commands/internal-context.js";
import { createConfig, writeConfig } from "src/core/config/config.js";
import { saveTask, setActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { buildTaskV1 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("internal context hook caching", () => {
  it("elides duplicate context injection for repeated calls with same session_id", async () => {
    const root = await temporaryRepository();
    const config = createConfig({ developer: "tam" });
    config.context.mode = "full";
    await writeConfig(join(root, ".harnix", "config.yaml"), config);
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "a.md"), "sample context content");
    const task: TaskRecord = buildTaskV1({
      id: "20260807-120000-session-task",
      title: "t",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "t",
      acceptanceCriteria: [],
      relevantPaths: ["docs/a.md"],
      validationPlan: [],
      createdAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z",
    });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);

    const first = await renderInternalContextForHook({
      platform: "codex",
      fallbackCwd: root,
      event: { session_id: "sess-123", cwd: root },
    });
    expect(first).toContain("sample context content");

    const second = await renderInternalContextForHook({
      platform: "codex",
      fallbackCwd: root,
      event: { session_id: "sess-123", cwd: root },
    });
    expect(second).toBe("");
  });
});

async function prepare(): Promise<string> {
  const root = await temporaryRepository();
  const config = createConfig({ developer: "tam" });
  config.context.mode = "full";
  await writeConfig(join(root, ".harnix", "config.yaml"), config);
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, "docs", "a.md"), "sample context content");
  const task = buildTaskV1({
    id: "20260807-120000-session-task",
    title: "t",
    status: "in_progress",
    checkpoint: "implementing",
    goal: "t",
    acceptanceCriteria: [],
    relevantPaths: ["docs/a.md"],
    validationPlan: [],
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  });
  await saveTask(join(root, ".harnix"), task);
  await setActiveTask(join(root, ".harnix"), task.id);
  return root;
}

const call = (root: string, sessionId?: string): Promise<string> =>
  renderInternalContextForHook({
    platform: "codex",
    fallbackCwd: root,
    event: { cwd: root, ...(sessionId === undefined ? {} : { session_id: sessionId }) },
  });

describe("internal context per-session dedup", () => {
  it("dedups two interleaved sessions independently (A, B, A, B)", async () => {
    const root = await prepare();
    expect(await call(root, "A")).toContain("sample context content");
    expect(await call(root, "B")).toContain("sample context content");
    expect(await call(root, "A")).toBe("");
    expect(await call(root, "B")).toBe("");
  });

  it("always injects and never writes a cache when the event has no session id", async () => {
    const root = await prepare();
    expect(await call(root)).toContain("sample context content");
    expect(await call(root)).toContain("sample context content");
    const tmp = join(root, ".harnix", "tmp");
    const names = await readdir(tmp).catch(() => [] as string[]);
    expect(names).not.toContain("context-cache");
  });

  it("injects again for a session when the payload changes", async () => {
    const root = await prepare();
    expect(await call(root, "A")).toContain("sample context content");
    expect(await call(root, "A")).toBe("");
    await writeFile(join(root, "docs", "a.md"), "changed context content");
    expect(await call(root, "A")).toContain("changed context content");
  });
});
