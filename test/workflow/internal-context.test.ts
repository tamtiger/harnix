import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createConfig, writeConfig } from "../../src/core/config/config.js";
import { renderInternalContext, renderInternalContextForHook } from "../../src/commands/internal-context.js";
import { saveTask, setActiveTask, type TaskRecord } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();
const timestamp = "2026-08-13T00:00:00.000Z";

describe("internal context", () => {
  it("returns empty output for an uninitialized project and JSON for Codex", async () => {
    const root = await temporaryRepository(); expect(await renderInternalContext(root, "kiro")).toBe("");
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" })); await mkdir(join(root, "docs"), { recursive: true }); await writeFile(join(root, "docs", "a.md"), "context");
    const task: TaskRecord = { generator: "harnix", schemaVersion: 1, id: "20260807-120000-task", title: "t", mode: "lite", status: "in_progress", checkpoint: "implementing", goal: "t", nonGoals: [], acceptanceCriteria: [], relevantPaths: ["docs/a.md"], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: timestamp, updatedAt: timestamp };
    await saveTask(join(root, ".harnix"), task); await setActiveTask(join(root, ".harnix"), task.id);
    expect(JSON.parse(await renderInternalContext(root, "codex"))).toMatchObject({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: expect.stringContaining("context") } });
  });
  it("bounds Codex hook context and fails closed for corrupt Harnix state", async () => {
    const root = await temporaryRepository(); await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" })); await mkdir(join(root, "docs"), { recursive: true }); await writeFile(join(root, "docs", "large.md"), "x".repeat(10_000));
    const task: TaskRecord = { generator: "harnix", schemaVersion: 1, id: "20260807-120000-large", title: "t", mode: "lite", status: "in_progress", checkpoint: "implementing", goal: "t", nonGoals: [], acceptanceCriteria: [], relevantPaths: ["docs/large.md"], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: timestamp, updatedAt: timestamp };
    await saveTask(join(root, ".harnix"), task); await setActiveTask(join(root, ".harnix"), task.id);
    const output = JSON.parse(await renderInternalContext(root, "codex")) as { hookSpecificOutput: { additionalContext: string } }; expect(output.hookSpecificOutput.additionalContext.length).toBeLessThanOrEqual(2500);
    await writeFile(join(root, ".harnix", "config.yaml"), "not: [valid"); await expect(renderInternalContext(root, "codex")).rejects.toThrow();
  });

  it("should_force_a_bounded_hook_read_when_project_full_context_is_enabled", async () => {
    const root = await temporaryRepository();
    const config = createConfig({ developer: "tam" });
    config.runtime.fullContext = true;
    await writeConfig(join(root, ".harnix", "config.yaml"), config);
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "large.md"), "x".repeat(1_000_000));
    await writeFile(join(root, "docs", "small.md"), "small hook context\n");
    const task: TaskRecord = { generator: "harnix", schemaVersion: 1, id: "20260811-120000-bounded", title: "t", mode: "lite", status: "in_progress", checkpoint: "implementing", goal: "t", nonGoals: [], acceptanceCriteria: [], relevantPaths: ["docs/large.md", "docs/small.md"], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: timestamp, updatedAt: timestamp };
    await saveTask(join(root, ".harnix"), task); await setActiveTask(join(root, ".harnix"), task.id);

    const output = JSON.parse(await renderInternalContextForHook({ fallbackCwd: root, platform: "codex", event: { cwd: root } })) as { hookSpecificOutput: { additionalContext: string } };

    expect(output.hookSpecificOutput.additionalContext).toContain("small hook context");
    expect(output.hookSpecificOutput.additionalContext).not.toContain("x".repeat(100));
    expect(output.hookSpecificOutput.additionalContext.length).toBeLessThanOrEqual(2500);
  });

  it("should_noop_without_output_for_non_harnix_or_malformed_global_hook_events", async () => {
    const root = await temporaryRepository();

    await expect(renderInternalContextForHook({ fallbackCwd: root, platform: "kiro", event: "{not-json" })).resolves.toBe("");
    await expect(renderInternalContextForHook({ fallbackCwd: root, platform: "codex", event: { cwd: "\0unsafe" } })).resolves.toBe("");
    await expect(renderInternalContextForHook({ fallbackCwd: root, platform: "antigravity", event: { invocationNum: 0, workspacePaths: [root] } })).resolves.toBe("");
    await expect(renderInternalContextForHook({ fallbackCwd: root, platform: "antigravity", event: { cwd: root, invocationNum: "0" } })).resolves.toBe("");
  });

  it("should_emit_a_redacted_platform_warning_when_initialized_project_state_is_corrupt", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, ".harnix"), { recursive: true });
    await writeFile(join(root, ".harnix", "config.yaml"), "not: [valid");

    const kiro = await renderInternalContextForHook({ fallbackCwd: root, platform: "kiro", event: { cwd: root } });
    const codex = JSON.parse(await renderInternalContextForHook({ fallbackCwd: root, platform: "codex", event: { cwd: root } })) as { hookSpecificOutput: { additionalContext: string } };
    const antigravityFirst = JSON.parse(await renderInternalContextForHook({ fallbackCwd: root, platform: "antigravity", event: { cwd: root, invocationNum: 0 } })) as { injectSteps: Array<{ ephemeralMessage: string }> };
    const antigravityLater = await renderInternalContextForHook({ fallbackCwd: root, platform: "antigravity", event: { cwd: root, invocationNum: 1 } });

    expect(kiro).toContain("Harnix context unavailable");
    expect(kiro.length).toBeLessThanOrEqual(2500);
    expect(kiro).not.toContain(root);
    expect(codex.hookSpecificOutput.additionalContext).toContain("Harnix context unavailable");
    expect(codex.hookSpecificOutput.additionalContext).not.toContain(root);
    expect(antigravityFirst.injectSteps).toEqual([expect.objectContaining({ ephemeralMessage: expect.stringContaining("Harnix context unavailable") })]);
    expect(JSON.stringify(antigravityFirst)).not.toContain(root);
    expect(antigravityLater).toBe(JSON.stringify({ injectSteps: [] }));
  });

  it("should_only_inject_antigravity_context_for_the_first_invocation", async () => {
    const root = await temporaryRepository();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" }));
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "context.md"), "first invocation context");
    const task: TaskRecord = { generator: "harnix", schemaVersion: 1, id: "20260811-120000-invocation", title: "t", mode: "lite", status: "in_progress", checkpoint: "implementing", goal: "t", nonGoals: [], acceptanceCriteria: [], relevantPaths: ["docs/context.md"], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: timestamp, updatedAt: timestamp };
    await saveTask(join(root, ".harnix"), task); await setActiveTask(join(root, ".harnix"), task.id);

    const first = JSON.parse(await renderInternalContextForHook({ fallbackCwd: root, platform: "antigravity", event: { cwd: root, invocationNum: 0 } })) as { injectSteps: Array<{ ephemeralMessage: string }> };
    const later = await renderInternalContextForHook({ fallbackCwd: root, platform: "antigravity", event: { cwd: root, invocationNum: 1 } });
    const missingInvocation = await renderInternalContextForHook({ fallbackCwd: root, platform: "antigravity", event: { cwd: root } });
    const malformedInvocation = await renderInternalContextForHook({ fallbackCwd: root, platform: "antigravity", event: { cwd: root, invocationNum: "0" } });

    expect(first.injectSteps).toEqual([expect.objectContaining({ ephemeralMessage: expect.stringContaining("first invocation context") })]);
    expect(later).toBe(JSON.stringify({ injectSteps: [] }));
    expect(missingInvocation).toBe("");
    expect(malformedInvocation).toBe("");
  });

  it("should_not_read_either_project_when_antigravity_workspace_roots_are_ambiguous", async () => {
    const first = await temporaryRepository(); const second = await temporaryRepository(); const launcher = await temporaryRepository();
    await Promise.all([first, second].map(async (root, index) => {
      await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: `tam-${index}` }));
      await mkdir(join(root, "docs"), { recursive: true }); await writeFile(join(root, "docs", "private.md"), `private-${index}`);
      const task: TaskRecord = { generator: "harnix", schemaVersion: 1, id: `20260811-12000${index}-root`, title: "t", mode: "lite", status: "in_progress", checkpoint: "implementing", goal: "t", nonGoals: [], acceptanceCriteria: [], relevantPaths: ["docs/private.md"], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: timestamp, updatedAt: timestamp };
      await saveTask(join(root, ".harnix"), task); await setActiveTask(join(root, ".harnix"), task.id);
    }));

    const output = JSON.parse(await renderInternalContextForHook({ fallbackCwd: launcher, platform: "antigravity", event: { invocationNum: 0, workspacePaths: [first, second] } })) as { injectSteps: Array<{ ephemeralMessage: string }> };
    const laterInvocation = await renderInternalContextForHook({ fallbackCwd: launcher, platform: "antigravity", event: { invocationNum: 1, workspacePaths: [first, second] } });

    expect(output.injectSteps).toHaveLength(1);
    expect(output.injectSteps[0]?.ephemeralMessage).toContain("multiple initialized workspace roots");
    expect(JSON.stringify(output)).not.toContain("private-");
    expect(laterInvocation).toBe("");
  });
});
