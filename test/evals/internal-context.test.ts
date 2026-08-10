import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createConfig, writeConfig } from "../../src/core/config/config.js";
import { renderInternalContext } from "../../src/commands/internal-context.js";
import { saveTask, setActiveTask, type TaskRecord } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("internal context", () => {
  it("returns empty output for an uninitialized project and JSON for Codex", async () => {
    const root = await temporaryRepository(); expect(await renderInternalContext(root, "kiro")).toBe("");
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" })); await mkdir(join(root, "docs"), { recursive: true }); await writeFile(join(root, "docs", "a.md"), "context");
    const task: TaskRecord = { generator: "harnix", schemaVersion: 1, id: "20260807-120000-task", title: "t", mode: "lite", status: "in_progress", checkpoint: "implementing", goal: "t", nonGoals: [], acceptanceCriteria: [], relevantPaths: ["docs/a.md"], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: "x", updatedAt: "x" };
    await saveTask(join(root, ".harnix"), task); await setActiveTask(join(root, ".harnix"), task.id);
    expect(JSON.parse(await renderInternalContext(root, "codex"))).toMatchObject({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: expect.stringContaining("context") } });
  });
  it("bounds Codex hook context and fails closed for corrupt Harnix state", async () => {
    const root = await temporaryRepository(); await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" })); await mkdir(join(root, "docs"), { recursive: true }); await writeFile(join(root, "docs", "large.md"), "x".repeat(10_000));
    const task: TaskRecord = { generator: "harnix", schemaVersion: 1, id: "20260807-120000-large", title: "t", mode: "lite", status: "in_progress", checkpoint: "implementing", goal: "t", nonGoals: [], acceptanceCriteria: [], relevantPaths: ["docs/large.md"], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: "x", updatedAt: "x" };
    await saveTask(join(root, ".harnix"), task); await setActiveTask(join(root, ".harnix"), task.id);
    const output = JSON.parse(await renderInternalContext(root, "codex")) as { hookSpecificOutput: { additionalContext: string } }; expect(output.hookSpecificOutput.additionalContext.length).toBeLessThanOrEqual(2500);
    await writeFile(join(root, ".harnix", "config.yaml"), "not: [valid"); await expect(renderInternalContext(root, "codex")).rejects.toThrow();
  });
});
