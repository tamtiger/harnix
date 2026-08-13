import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { finishWorkflow, inspectWorkflow, saveWorkflow } from "../../src/commands/internal-workflow.js";
import type { TaskRecord } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";
import { initializeProject } from "../../src/commands/init.js";

const temporaryRepository = useTemporaryRepositories();
const timestamp = "2026-08-13T00:00:00.000Z";

describe("hidden workflow persistence operations", () => {
  it("inspects, creates a planning task, and rejects evidence mutation or an illegal jump", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null });

    const planning = task("planning", "planning");
    await expect(saveWorkflow(root, { task: planning })).resolves.toMatchObject({ id: planning.id, status: "planning" });
    expect((await inspectWorkflow(root)).activeTask).toMatchObject({ id: planning.id });

    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z", evidence: [{ id: "e", recordedAt: timestamp, result: "pass" as const, summary: "kept", artifactPaths: [] }] };
    await saveWorkflow(root, { task: ready });
    await expect(saveWorkflow(root, { task: { ...ready, evidence: [{ ...ready.evidence[0]!, summary: "mutated" }] } })).rejects.toThrow("evidence");
    await expect(saveWorkflow(root, { task: { ...ready, status: "verifying", checkpoint: "verifying" } })).rejects.toThrow("Illegal task transition");
  });

  it("finishes only the active task after fresh verification and clears only its matching pointer", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const verifying = task("verifying", "verifying");
    verifying.validationPlan = [{ id: "check", description: "check", scope: "focused", required: true }];
    verifying.evidence = [{ id: "e", checkId: "check", recordedAt: new Date().toISOString(), result: "pass", summary: "ok", artifactPaths: [] }];
    verifying.acceptanceCriteria = [{ id: "a", text: "done", status: "met", evidenceIds: ["e"] }];
    await saveWorkflow(root, { task: { ...verifying, status: "planning", checkpoint: "planning" } });
    await saveWorkflow(root, { task: { ...verifying, status: "ready", checkpoint: "ready" } });
    await saveWorkflow(root, { task: { ...verifying, status: "in_progress", checkpoint: "implementing" } });
    await saveWorkflow(root, { task: verifying });
    await saveWorkflow(root, { task: { ...verifying, checkpoint: "finishing", updatedAt: new Date().toISOString() } });

    await expect(finishWorkflow(root)).resolves.toMatchObject({ status: "completed", checkpoint: "finishing" });
    expect((await inspectWorkflow(root)).activeTask).toBeNull();
    await expect(readFile(join(root, ".harnix", "tasks", verifying.id, "task.json"), "utf8")).resolves.toContain("completed");
  });

  it("rejects a new Full task unless its required artifacts are persisted with it", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const full = { ...task("planning", "planning"), mode: "full" as const };

    await expect(saveWorkflow(root, { task: full })).rejects.toThrow("prd.md and plan.md");
    await expect(saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } })).resolves.toMatchObject({ id: full.id });
  });
});

function task(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"]): TaskRecord {
  return { generator: "harnix", schemaVersion: 1, id: "20260813-120000-workflow", title: "workflow", mode: "lite", status, checkpoint, goal: "test", nonGoals: [], acceptanceCriteria: [], relevantPaths: [], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: timestamp, updatedAt: timestamp };
}
