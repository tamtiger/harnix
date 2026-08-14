import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { finishWorkflow, inspectWorkflow, saveWorkflow, snapshotWorkflow } from "../../src/commands/internal-workflow.js";
import { appendJournal } from "../../src/core/journal/journal.js";
import { createTaskV2MigrationEvidence, saveTask, setActiveTask, transitionTask, type TaskRecord, type TaskRecordV1 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";
import { initializeProject } from "../../src/commands/init.js";
import { sha256 } from "../../src/utils/hashing.js";

const temporaryRepository = useTemporaryRepositories();
const timestamp = "2026-08-13T00:00:00.000Z";

describe("hidden workflow persistence operations", () => {
  it("projects stale context drift from the persisted manifest without mutating it", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = task("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await writeFile(join(root, "tracked.md"), "new content");
    const contextPath = join(root, ".harnix", "tasks", planning.id, "context.json");
    const context = {
      generator: "harnix",
      schemaVersion: 1,
      taskId: planning.id,
      maxCharacters: 1000,
      entries: [{ path: "tracked.md", reason: "test", priority: 0, pinned: false, states: [], contentHash: sha256("old content") }],
      omitted: [],
    };
    await writeFile(contextPath, `${JSON.stringify(context, null, 2)}\n`);

    await expect(inspectWorkflow(root)).resolves.toMatchObject({ contextDrift: { state: "stale", changes: [{ path: "tracked.md", kind: "changed" }] } });
    await expect(readFile(contextPath, "utf8")).resolves.toBe(`${JSON.stringify(context, null, 2)}\n`);
  });

  it("inspects, creates a planning task, and rejects evidence mutation or an illegal jump", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [] } });

    const planning = task("planning", "planning");
    await expect(saveWorkflow(root, { task: planning })).resolves.toMatchObject({ id: planning.id, status: "planning" });
    expect(await inspectWorkflow(root)).toMatchObject({ activeTask: { id: planning.id }, contextDrift: { state: "not-recorded", changes: [] } });

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
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [] } });
    await expect(readFile(join(root, ".harnix", "tasks", verifying.id, "task.json"), "utf8")).resolves.toContain("completed");
  });

  it("recovers a completed task from its original journal date across a UTC day boundary", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const completedAt = "2026-08-13T23:59:59.000Z";
    const retryAt = "2026-08-14T00:00:01.000Z";
    const completionEvidence = { id: "e", checkId: "check", recordedAt: completedAt, result: "pass" as const, exitCode: 0, summary: "verified", artifactPaths: [] };
    const verifying = {
      ...task("verifying", "finishing"),
      acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [completionEvidence.id] }],
      evidence: [completionEvidence],
    };
    const completed = transitionTask(verifying, "completed", "finishing", completedAt);
    const harnixRoot = join(root, ".harnix");
    const originalJournal = join(harnixRoot, "workspace", "tam", "journal", "2026-08-13.jsonl");
    const retryJournal = join(harnixRoot, "workspace", "tam", "journal", "2026-08-14.jsonl");
    await saveTask(harnixRoot, completed);
    await setActiveTask(harnixRoot, completed.id);
    await appendJournal(originalJournal, {
      generator: "harnix",
      schemaVersion: 1,
      id: `${completed.id}-completion`,
      recordedAt: completedAt,
      developer: "tam",
      taskId: completed.id,
      kind: "completion",
      summary: `Completed: ${completed.title}`,
      evidenceIds: [],
    });

    await expect(finishWorkflow(root, retryAt)).resolves.toMatchObject({ status: "completed" });
    await expect(readFile(retryJournal, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    const journal = await readFile(originalJournal, "utf8");
    expect(journal.match(new RegExp(`${completed.id}-completion`, "gu"))).toHaveLength(1);
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [] } });
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

  it("freezes TaskRecord v2 required criterion and input definitions", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });

    await expect(saveWorkflow(root, {
      task: {
        ...planning,
        acceptanceCriteria: [...planning.acceptanceCriteria, { id: "b", text: "new", status: "pending" as const, evidenceIds: [] }],
        validationPlan: [{ ...planning.validationPlan[0]!, criterionIds: ["a", "b"] }],
        updatedAt: "2026-08-13T00:01:00.000Z",
      },
    })).rejects.toThrow("cannot mutate required validation check");
    await expect(saveWorkflow(root, {
      task: { ...planning, validationPlan: [{ ...planning.validationPlan[0]!, inputs: ["@task-contract", "test/**/*.ts"] }], updatedAt: "2026-08-13T00:01:00.000Z" },
    })).rejects.toThrow("cannot mutate required validation check");
  });

  it("migrates unfinished TaskRecord v1 only from replan with exact migration evidence", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = task("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const migrationTime = "2026-08-13T00:02:00.000Z";
    const candidate = {
      ...planning,
      schemaVersion: 2 as const,
      checkpoint: "replan" as const,
      validationPlan: [{ ...planning.validationPlan[0]!, criterionIds: ["a"], inputs: ["@task-contract", "src/**/*.ts"] }],
      evidence: [createTaskV2MigrationEvidence(planning.id, migrationTime)],
      updatedAt: migrationTime,
    };

    await expect(saveWorkflow(root, { task: candidate })).rejects.toThrow(/replan/iu);
    const replanning = { ...planning, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: replanning });
    await expect(saveWorkflow(root, { task: { ...candidate, evidence: [] } })).rejects.toThrow(/migration evidence/iu);
    await expect(saveWorkflow(root, { task: candidate })).resolves.toMatchObject({ schemaVersion: 2, checkpoint: "replan" });
    await expect(saveWorkflow(root, { task: { ...planning, checkpoint: "replan", updatedAt: "2026-08-13T00:03:00.000Z" } })).rejects.toThrow(/downgrade/iu);
  });

  it("preserves pre-migration passing evidence without treating it as a new v2 snapshot", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const legacyPass = { id: "legacy", checkId: "check", recordedAt: timestamp, result: "pass" as const, exitCode: 0, summary: "legacy", artifactPaths: [] };
    const replanning: TaskRecordV1 = {
      ...task("planning", "replan"),
      acceptanceCriteria: [{ id: "a", text: "done", status: "met", evidenceIds: ["legacy"] }],
      evidence: [legacyPass],
    };
    await saveWorkflow(root, { task: replanning });
    const migrationTime = "2026-08-13T00:01:00.000Z";
    const candidate = {
      ...replanning,
      schemaVersion: 2 as const,
      validationPlan: [{ ...replanning.validationPlan[0]!, criterionIds: ["a"], inputs: ["@task-contract", "src/**/*.ts"] }],
      evidence: [...replanning.evidence, createTaskV2MigrationEvidence(replanning.id, migrationTime)],
      updatedAt: migrationTime,
    };

    await expect(saveWorkflow(root, { task: candidate })).resolves.toMatchObject({ schemaVersion: 2, evidence: [{ id: "legacy" }, { id: "task-schema-v1-to-v2" }] });
  });

  it("stores immutable input snapshots and rejects a save-time verification race", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV2("planning", "planning", ["@task-contract", "input.ts"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    await writeFile(join(root, "input.ts"), "export const value = 2;\n");
    const candidate = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met" as const, evidenceIds: ["e"] }],
      evidence: [{ id: "e", checkId: "check", recordedAt: "2026-08-14T00:01:00.000Z", result: "pass" as const, exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: snapshot.inputDigest }],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: candidate })).rejects.toThrow(/input digest|snapshot/iu);
    await expect(readFile(join(root, ".harnix", "tasks", planning.id, "verification-inputs.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("fails finish with safe relative diagnostics when persisted verification inputs drift", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV2("planning", "planning", ["@task-contract", "input.ts"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    const withEvidence = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met" as const, evidenceIds: ["e"] }],
      evidence: [{ id: "e", checkId: "check", recordedAt: "2026-08-14T00:01:00.000Z", result: "pass" as const, exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: snapshot.inputDigest }],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: withEvidence });
    const sidecarPath = join(root, ".harnix", "tasks", planning.id, "verification-inputs.json");
    const sidecar = await readFile(sidecarPath, "utf8");
    expect(sidecar).toContain('"evidenceId": "e"');
    expect(sidecar).not.toContain(root);
    await saveWorkflow(root, { task: { ...withEvidence, status: "ready", checkpoint: "ready", updatedAt: "2026-08-14T00:02:00.000Z" } });
    await saveWorkflow(root, { task: { ...withEvidence, status: "in_progress", checkpoint: "implementing", updatedAt: "2026-08-14T00:03:00.000Z" } });
    await saveWorkflow(root, { task: { ...withEvidence, status: "verifying", checkpoint: "verifying", updatedAt: "2026-08-14T00:04:00.000Z" } });
    await saveWorkflow(root, { task: { ...withEvidence, status: "verifying", checkpoint: "finishing", updatedAt: "2026-08-14T00:05:00.000Z" } });
    await writeFile(join(root, "input.ts"), "export const value = 2;\n");

    await expect(finishWorkflow(root, "2026-08-14T00:06:00.000Z")).rejects.toThrow(/check.*input\.ts/iu);
    await expect(readFile(sidecarPath, "utf8")).resolves.toBe(sidecar);
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

function task(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"]): TaskRecordV1 {
  return { generator: "harnix", schemaVersion: 1, id: "20260813-120000-workflow", title: "workflow", mode: "lite", status, checkpoint, goal: "test", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "done", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [], validationPlan: [{ id: "check", description: "verify", command: "pnpm test", scope: "full", required: true }], evidence: [], createdAt: timestamp, updatedAt: timestamp };
}

function taskV2(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"], inputs = ["@task-contract", "src/**/*.ts"]) {
  return {
    ...task(status, checkpoint),
    schemaVersion: 2 as const,
    validationPlan: [{ id: "check", description: "Run tests", command: "pnpm test", scope: "full" as const, required: true, criterionIds: ["a"], inputs }],
    evidence: [],
  };
}
