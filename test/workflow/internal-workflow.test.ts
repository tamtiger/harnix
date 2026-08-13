import { readFile, rm, writeFile } from "node:fs/promises";
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

  it("rejects readiness when acceptance or required validation gates are empty", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const empty = { ...task("planning", "planning"), acceptanceCriteria: [], validationPlan: [] };
    await saveWorkflow(root, { task: empty });

    await expect(saveWorkflow(root, { task: { ...empty, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" } })).rejects.toThrow("acceptance");
    await expect(saveWorkflow(root, { task: { ...empty, acceptanceCriteria: [{ id: "a", text: "done", status: "pending" as const, evidenceIds: [] }], status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" } })).rejects.toThrow("required validation");
  });

  it("preserves persisted acceptance criteria and required validation obligations", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = task("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });

    await expect(saveWorkflow(root, { task: { ...ready, acceptanceCriteria: [], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("acceptance criterion");
    await expect(saveWorkflow(root, { task: { ...ready, acceptanceCriteria: [{ ...ready.acceptanceCriteria[0]!, id: "renamed" }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("acceptance criterion");
    await expect(saveWorkflow(root, { task: { ...ready, acceptanceCriteria: [{ ...ready.acceptanceCriteria[0]!, text: "weaker outcome" }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("acceptance criterion text");
    await expect(saveWorkflow(root, { task: { ...ready, validationPlan: [], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("required validation");
    await expect(saveWorkflow(root, { task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, required: false }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("required validation");
    await expect(saveWorkflow(root, { task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, command: "echo weaker" }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("cannot mutate required validation check");
    await expect(saveWorkflow(root, { task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, scope: "focused" }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("cannot mutate required validation check");
    await expect(finishWorkflow(root)).rejects.toThrow("verifying/finishing");
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: { acceptanceCriteria: [{ id: "a", text: "done" }], validationPlan: [{ id: "check", command: "pnpm test", scope: "full", required: true }] } });
  });

  it("allows monotonic additions, met criteria, explicit waivers, and unchanged obligations", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = task("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const expanded: TaskRecord = {
      ...planning,
      acceptanceCriteria: [
        { ...planning.acceptanceCriteria[0]!, status: "waived", waiverReason: "Explicitly superseded by criterion b." },
        { id: "b", text: "replacement outcome", status: "met", evidenceIds: ["e"] },
      ],
      validationPlan: [
        ...planning.validationPlan,
        { id: "check-2", description: "additional replan verification", scope: "full", required: true },
      ],
      evidence: [{ id: "e", checkId: "check", recordedAt: timestamp, result: "pass", exitCode: 0, summary: "observed", artifactPaths: [] }],
      updatedAt: "2026-08-13T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: expanded })).resolves.toMatchObject({ acceptanceCriteria: [{ status: "waived" }, { status: "met" }] });
    await expect(saveWorkflow(root, { task: { ...expanded, updatedAt: "2026-08-13T00:02:00.000Z" } })).resolves.toMatchObject({ validationPlan: expect.arrayContaining([expect.objectContaining({ id: "check-2", required: true })]) });
  });

  it("rechecks non-empty Full artifacts immediately before readiness", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const full = { ...task("planning", "planning"), mode: "full" as const };
    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } });
    const ready = { ...full, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };

    await rm(join(root, ".harnix", "tasks", full.id, "prd.md"));
    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow("Full tasks require non-empty prd.md and plan.md at ready");
    await writeFile(join(root, ".harnix", "tasks", full.id, "prd.md"), "# PRD\n");
    await writeFile(join(root, ".harnix", "tasks", full.id, "plan.md"), "");
    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow("Full tasks require non-empty prd.md and plan.md at ready");
  });
});

function task(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"]): TaskRecord {
  return { generator: "harnix", schemaVersion: 1, id: "20260813-120000-workflow", title: "workflow", mode: "lite", status, checkpoint, goal: "test", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "done", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [], validationPlan: [{ id: "check", description: "verify", command: "pnpm test", scope: "full", required: true }], evidence: [], createdAt: timestamp, updatedAt: timestamp };
}
