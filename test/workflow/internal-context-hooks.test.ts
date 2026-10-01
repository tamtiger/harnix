import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createConfig, writeConfig } from "src/core/config/config.js";
import { renderInternalContext, renderInternalContextForHook } from "src/commands/internal-context.js";
import { buildContext, type ContextEntry } from "src/core/context/context.js";
import { sha256 } from "src/utils/hashing.js";
import { saveTask, setActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { buildTaskV1 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();
const timestamp = "2026-08-13T00:00:00.000Z";
const pointers = { prefixes: [".harnix/spec/guides/"], minCharacters: 1500 };
const entry = (path: string): ContextEntry => ({ path, reason: "", priority: 0, pinned: false, states: [] });

async function write(root: string, path: string, content: string): Promise<void> {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}

describe("internal context hooks", () => {
  it("returns empty output for an uninitialized project and JSON for Codex", async () => {
    const root = await temporaryRepository();
    expect(await renderInternalContext(root, "kiro")).toBe("");
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" }));
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "a.md"), "context");
    const task: TaskRecord = buildTaskV1({
      id: "20260807-120000-task",
      title: "t",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "t",
      acceptanceCriteria: [],
      relevantPaths: ["docs/a.md"],
      validationPlan: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);
    expect(JSON.parse(await renderInternalContext(root, "codex"))).toMatchObject({
      hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: expect.stringContaining("context") },
    });
  });
  it("bounds Codex hook context and fails closed for corrupt Harnix state", async () => {
    const root = await temporaryRepository();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" }));
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "large.md"), "x".repeat(10_000));
    const task: TaskRecord = buildTaskV1({
      id: "20260807-120000-large",
      title: "t",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "t",
      acceptanceCriteria: [],
      relevantPaths: ["docs/large.md"],
      validationPlan: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);
    const output = JSON.parse(await renderInternalContext(root, "codex")) as {
      hookSpecificOutput: { additionalContext: string };
    };
    expect(output.hookSpecificOutput.additionalContext.length).toBeLessThanOrEqual(2500);
    await writeFile(join(root, ".harnix", "config.yaml"), "not: [valid");
    await expect(renderInternalContext(root, "codex")).rejects.toThrow();
  });

  it("should_force_a_bounded_hook_read_when_project_full_context_is_enabled", async () => {
    const root = await temporaryRepository();
    const config = createConfig({ developer: "tam" });
    config.runtime.fullContext = true;
    await writeConfig(join(root, ".harnix", "config.yaml"), config);
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "large.md"), "x".repeat(1_000_000));
    await writeFile(join(root, "docs", "small.md"), "small hook context\n");
    const task: TaskRecord = buildTaskV1({
      id: "20260811-120000-bounded",
      title: "t",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "t",
      acceptanceCriteria: [],
      relevantPaths: ["docs/large.md", "docs/small.md"],
      validationPlan: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);

    const output = JSON.parse(
      await renderInternalContextForHook({ fallbackCwd: root, platform: "codex", event: { cwd: root } }),
    ) as { hookSpecificOutput: { additionalContext: string } };

    expect(output.hookSpecificOutput.additionalContext).toContain("small hook context");
    expect(output.hookSpecificOutput.additionalContext).not.toContain("x".repeat(100));
    expect(output.hookSpecificOutput.additionalContext.length).toBeLessThanOrEqual(2500);
  });

  it("should_noop_without_output_for_non_harnix_or_malformed_global_hook_events", async () => {
    const root = await temporaryRepository();

    await expect(
      renderInternalContextForHook({ fallbackCwd: root, platform: "kiro", event: "{not-json" }),
    ).resolves.toBe("");
    await expect(
      renderInternalContextForHook({ fallbackCwd: root, platform: "codex", event: { cwd: "\0unsafe" } }),
    ).resolves.toBe("");
    await expect(
      renderInternalContextForHook({
        fallbackCwd: root,
        platform: "antigravity",
        event: { invocationNum: 0, workspacePaths: [root] },
      }),
    ).resolves.toBe("");
    await expect(
      renderInternalContextForHook({
        fallbackCwd: root,
        platform: "antigravity",
        event: { cwd: root, invocationNum: "0" },
      }),
    ).resolves.toBe("");
  });

  it("should_emit_plain_text_for_claude_and_stay_a_no_op_outside_an_initialized_project", async () => {
    const root = await temporaryRepository();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" }));
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "a.md"), "context");
    const task: TaskRecord = buildTaskV1({
      id: "20260916-120000-claude",
      title: "t",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "t",
      acceptanceCriteria: [],
      relevantPaths: ["docs/a.md"],
      validationPlan: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);
    const uninitialized = await temporaryRepository();

    const initialized = await renderInternalContextForHook({
      fallbackCwd: root,
      platform: "claude",
      event: { cwd: root },
    });

    expect(initialized.startsWith("{")).toBe(false);
    expect(initialized).toContain("context");
    await expect(
      renderInternalContextForHook({ fallbackCwd: uninitialized, platform: "claude", event: { cwd: uninitialized } }),
    ).resolves.toBe("");
    await expect(
      renderInternalContextForHook({ fallbackCwd: uninitialized, platform: "claude", event: "{not-json" }),
    ).resolves.toBe("");
  });

  it("should_emit_a_redacted_platform_warning_when_initialized_project_state_is_corrupt", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, ".harnix"), { recursive: true });
    await writeFile(join(root, ".harnix", "config.yaml"), "not: [valid");

    const kiro = await renderInternalContextForHook({ fallbackCwd: root, platform: "kiro", event: { cwd: root } });
    const codex = JSON.parse(
      await renderInternalContextForHook({ fallbackCwd: root, platform: "codex", event: { cwd: root } }),
    ) as { hookSpecificOutput: { additionalContext: string } };
    const antigravityFirst = JSON.parse(
      await renderInternalContextForHook({
        fallbackCwd: root,
        platform: "antigravity",
        event: { cwd: root, invocationNum: 0 },
      }),
    ) as { injectSteps: Array<{ ephemeralMessage: string }> };
    const antigravityLater = await renderInternalContextForHook({
      fallbackCwd: root,
      platform: "antigravity",
      event: { cwd: root, invocationNum: 1 },
    });

    expect(kiro).toContain("Harnix context unavailable");
    expect(kiro.length).toBeLessThanOrEqual(2500);
    expect(kiro).not.toContain(root);
    expect(codex.hookSpecificOutput.additionalContext).toContain("Harnix context unavailable");
    expect(codex.hookSpecificOutput.additionalContext).not.toContain(root);
    expect(antigravityFirst.injectSteps).toEqual([
      expect.objectContaining({ ephemeralMessage: expect.stringContaining("Harnix context unavailable") }),
    ]);
    expect(JSON.stringify(antigravityFirst)).not.toContain(root);
    expect(antigravityLater).toBe(JSON.stringify({ injectSteps: [] }));
  });

  it("should_only_inject_antigravity_context_for_the_first_invocation", async () => {
    const root = await temporaryRepository();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" }));
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "context.md"), "first invocation context");
    const task: TaskRecord = buildTaskV1({
      id: "20260811-120000-invocation",
      title: "t",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "t",
      acceptanceCriteria: [],
      relevantPaths: ["docs/context.md"],
      validationPlan: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);

    const first = JSON.parse(
      await renderInternalContextForHook({
        fallbackCwd: root,
        platform: "antigravity",
        event: { cwd: root, invocationNum: 0 },
      }),
    ) as { injectSteps: Array<{ ephemeralMessage: string }> };
    const later = await renderInternalContextForHook({
      fallbackCwd: root,
      platform: "antigravity",
      event: { cwd: root, invocationNum: 1 },
    });
    const missingInvocation = await renderInternalContextForHook({
      fallbackCwd: root,
      platform: "antigravity",
      event: { cwd: root },
    });
    const malformedInvocation = await renderInternalContextForHook({
      fallbackCwd: root,
      platform: "antigravity",
      event: { cwd: root, invocationNum: "0" },
    });

    expect(first.injectSteps).toEqual([
      expect.objectContaining({ ephemeralMessage: expect.stringContaining("first invocation context") }),
    ]);
    expect(later).toBe(JSON.stringify({ injectSteps: [] }));
    expect(missingInvocation).toBe("");
    expect(malformedInvocation).toBe("");
  });

  it("embeds short task files and points to long ones instead of pasting them", async () => {
    const root = await temporaryRepository();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" }));
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "short.md"), "SHORT BODY MARKER");
    await writeFile(join(root, "docs", "long.md"), "LONG BODY MARKER ".repeat(200));
    const task = buildTaskV1({
      id: "20260813-120000-hook-pointers",
      title: "t",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "t",
      acceptanceCriteria: [],
      relevantPaths: ["docs/short.md", "docs/long.md"],
      validationPlan: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);

    const payload = await renderInternalContext(root, "kiro", { forceBounded: true });

    expect(payload).toContain("SHORT BODY MARKER");
    expect(payload).toContain("--- docs/long.md ---");
    expect(payload).toContain("(pointer, 3400 characters; read it when it matches the files you change)");
    expect(payload).not.toContain("LONG BODY MARKER");
  });
});

describe("buildContext pointers", () => {
  it("emits a pointer for guides and long files, embeds short files and still hashes every entry", async () => {
    const root = await temporaryRepository();
    const guide = "G".repeat(300);
    const long = "L".repeat(2000);
    await write(root, ".harnix/spec/guides/common.md", guide);
    await write(root, "docs/long.md", long);
    await write(root, "docs/short.md", "short body");

    const result = await buildContext(
      root,
      [".harnix/spec/guides/common.md", "docs/long.md", "docs/short.md"].map(entry),
      10_000,
      {},
      false,
      undefined,
      pointers,
    );

    expect(result.text).toContain("--- .harnix/spec/guides/common.md ---");
    expect(result.text).toContain("(pointer, 300 characters; read it when it matches the files you change)");
    expect(result.text).toContain("(pointer, 2000 characters; read it when it matches the files you change)");
    expect(result.text).not.toContain("GGGG");
    expect(result.text).not.toContain("LLLL");
    expect(result.text).toContain("short body");
    expect(Object.fromEntries(result.manifest.entries.map((item) => [item.path, item.contentHash]))).toEqual({
      ".harnix/spec/guides/common.md": sha256(guide),
      "docs/long.md": sha256(long),
      "docs/short.md": sha256("short body"),
    });
    expect(result.manifest.omitted).toEqual([]);
  });

  it("counts only the pointer line against the budget so a large guide no longer crowds out other files", async () => {
    const root = await temporaryRepository();
    await write(root, ".harnix/spec/guides/common.md", "G".repeat(5000));
    await write(root, "docs/short.md", "short body");

    const result = await buildContext(
      root,
      [".harnix/spec/guides/common.md", "docs/short.md"].map(entry),
      600,
      {},
      false,
      undefined,
      pointers,
    );

    expect(result.manifest.omitted).toEqual([]);
    expect(result.text).toContain("short body");
  });

  it("keeps embedding everything when no pointer options are given", async () => {
    const root = await temporaryRepository();
    await write(root, ".harnix/spec/guides/common.md", "G".repeat(300));

    const result = await buildContext(root, [entry(".harnix/spec/guides/common.md")], 10_000);

    expect(result.text).toContain("G".repeat(300));
    expect(result.text).not.toContain("pointer");
  });
});
