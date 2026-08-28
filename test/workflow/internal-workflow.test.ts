import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { auditWorkflow, cancelWorkflow, finishWorkflow, inspectWorkflow, preflightWorkflow, recordLearningWorkflow, saveWorkflow, snapshotWorkflow } from "../../src/commands/internal-workflow.js";
import { appendJournal } from "../../src/core/journal/journal.js";
import { cancelTask, createTaskV2MigrationEvidence, saveTask, setActiveTask, transitionTask, type TaskRecord, type TaskRecordV1, type TaskRecordV2 } from "../../src/core/tasks/task.js";
import { assertVerificationInputsFresh, computeVerificationInputSnapshot } from "../../src/core/verification/input-freshness.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";
import { initializeProject } from "../../src/commands/init.js";
import { sha256 } from "../../src/utils/hashing.js";

const temporaryRepository = useTemporaryRepositories();
const timestamp = "2026-08-13T00:00:00.000Z";

describe("hidden workflow persistence operations", () => {
  it("returns bounded read-only preflight metadata without task prose", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = { ...taskV2("planning", "planning"), title: "PRIVATE_TITLE_CANARY", goal: "PRIVATE_GOAL_CANARY" };
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });
    const active = { ...ready, status: "in_progress" as const, checkpoint: "implementing" as const, updatedAt: "2026-08-13T00:02:00.000Z" };
    await saveWorkflow(root, { task: active });
    const taskPath = join(root, ".harnix", "tasks", active.id, "task.json");
    const pointerPath = join(root, ".harnix", "tasks", ".active");
    const before = await Promise.all([readFile(taskPath, "utf8"), readFile(pointerPath, "utf8")]);

    const result = await preflightWorkflow(root);

    expect(result).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      activeTask: { id: active.id, mode: "lite", status: "in_progress", checkpoint: "implementing" },
      contextDrift: "not-recorded",
      requiredChecks: { passed: [], failed: [], stale: [], pending: ["check"] },
      retryLimitReached: [],
      nextStage: "implement",
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
    await expect(Promise.all([readFile(taskPath, "utf8"), readFile(pointerPath, "utf8")])).resolves.toEqual(before);
  });
  it("does not infer implementation authority from a persisted ready task", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await saveWorkflow(root, { task: { ...planning, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" } });

    await expect(preflightWorkflow(root)).resolves.toMatchObject({ nextStage: "await" });
  });
  it("recovers a missing active pointer when the task commit marker already exists", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await rm(join(root, ".harnix", "tasks", ".active"));

    await expect(saveWorkflow(root, { task: planning })).resolves.toMatchObject({ id: planning.id });
    await expect(readFile(join(root, ".harnix", "tasks", ".active"), "utf8")).resolves.toBe(`${planning.id}\n`);
  });
  it("treats JSON object-key and validation-check order as non-semantic while preserving evidence order", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = {
      ...taskV2("planning", "planning"),
      acceptanceCriteria: [
        { id: "a", text: "done", status: "pending" as const, evidenceIds: [] },
        { id: "b", text: "also done", status: "pending" as const, evidenceIds: [] },
      ],
      validationPlan: [
        { ...taskV2("planning", "planning").validationPlan[0]!, criterionIds: ["a"] },
        { id: "check-2", description: "Run second check", command: "pnpm test:unit", scope: "focused" as const, required: true, criterionIds: ["b"], inputs: ["@task-contract", "src/**/*.ts"] },
      ],
    };
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });
    await expect(saveWorkflow(root, {
      task: { ...ready, validationPlan: [...ready.validationPlan].reverse(), updatedAt: "2026-08-13T00:02:00.000Z" },
    })).resolves.toMatchObject({ status: "ready" });

    await rm(join(root, ".harnix", "tasks", ".active"));
    await expect(saveWorkflow(root, { task: reverseObjectKeys(await loadPersistedTask(root, planning.id)) })).resolves.toMatchObject({ id: planning.id });
  });
  it("does not mutate or activate an inactive task through a non-exact save", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const taskPath = join(root, ".harnix", "tasks", planning.id, "task.json");
    const pointerPath = join(root, ".harnix", "tasks", ".active");
    const before = await readFile(taskPath, "utf8");
    await rm(pointerPath);

    await expect(saveWorkflow(root, {
      task: { ...planning, goal: "mutated inactive task", updatedAt: "2026-08-13T00:01:00.000Z" },
    })).rejects.toThrow(/exact task replay|harnix resume/iu);
    await expect(readFile(taskPath, "utf8")).resolves.toBe(before);
    await expect(readFile(pointerPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("rejects evidence reordering instead of changing retry chronology", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const first = { id: "failure-1", checkId: "check", recordedAt: timestamp, result: "fail" as const, exitCode: 1, summary: "first", artifactPaths: [] };
    const second = { ...first, id: "failure-2", recordedAt: "2026-08-13T00:01:00.000Z", summary: "second" };
    const persisted = { ...task("planning", "planning"), evidence: [first, second] };
    await saveTask(join(root, ".harnix"), persisted);
    await setActiveTask(join(root, ".harnix"), persisted.id);

    await expect(saveWorkflow(root, { task: { ...persisted, evidence: [second, first], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow(/reorder/iu);
  });
  it("accepts semantically identical evidence objects with reordered properties", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const evidence = { id: "failure-1", checkId: "check", recordedAt: timestamp, result: "fail" as const, exitCode: 1, summary: "first", artifactPaths: [] };
    const persisted = { ...task("planning", "planning"), evidence: [evidence] };
    await saveTask(join(root, ".harnix"), persisted);
    await setActiveTask(join(root, ".harnix"), persisted.id);

    const reordered = { summary: "first", artifactPaths: [], exitCode: 1, result: "fail" as const, recordedAt: timestamp, checkId: "check", id: "failure-1" };
    await expect(saveWorkflow(root, {
      task: { ...persisted, evidence: [reordered], updatedAt: "2026-08-13T00:01:00.000Z" },
    })).resolves.toMatchObject({ evidence: [{ id: "failure-1" }] });
  });
  it("serializes concurrent workflow saves so one stale evidence append cannot overwrite another", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const candidate = (id: string, summary: string): TaskRecordV2 => ({
      ...planning,
      evidence: [{ id, recordedAt: "2026-08-13T00:01:00.000Z", result: "skipped", summary, artifactPaths: [] }],
      updatedAt: "2026-08-13T00:01:00.000Z",
    });

    const outcomes = await Promise.allSettled([
      saveWorkflow(root, { task: candidate("attempt-a", "first concurrent append") }),
      saveWorkflow(root, { task: candidate("attempt-b", "second concurrent append") }),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: { evidence: [expect.objectContaining({ id: expect.stringMatching(/^attempt-[ab]$/u) })] } });
  });
  it("routes stale active context to continuation before implementation", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeFile(join(root, "tracked.md"), "new content");
    const active = taskV2("in_progress", "implementing");
    await saveTask(join(root, ".harnix"), active);
    await setActiveTask(join(root, ".harnix"), active.id);
    await writeFile(join(root, ".harnix", "tasks", active.id, "context.json"), `${JSON.stringify({
      generator: "harnix",
      schemaVersion: 1,
      taskId: active.id,
      maxCharacters: 1000,
      entries: [{ path: "tracked.md", reason: "test", priority: 0, pinned: false, states: [], contentHash: sha256("old content") }],
      omitted: [],
    }, null, 2)}\n`);

    await expect(preflightWorkflow(root)).resolves.toMatchObject({ contextDrift: "stale", nextStage: "continue" });
  });
  it("short-circuits stale-context routing before verification snapshot inspection", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeFile(join(root, "tracked.md"), "new content");
    const active: TaskRecordV2 = {
      ...taskV2("verifying", "verifying"),
      evidence: [{ id: "pass-without-sidecar", checkId: "check", recordedAt: "2026-08-13T00:02:00.000Z", result: "pass", exitCode: 0, summary: "green", artifactPaths: [], inputDigest: "a".repeat(64) }],
    };
    await saveTask(join(root, ".harnix"), active);
    await setActiveTask(join(root, ".harnix"), active.id);
    await writeFile(join(root, ".harnix", "tasks", active.id, "context.json"), `${JSON.stringify({
      generator: "harnix",
      schemaVersion: 1,
      taskId: active.id,
      maxCharacters: 1000,
      entries: [{ path: "tracked.md", reason: "test", priority: 0, pinned: false, states: [], contentHash: sha256("old content") }],
      omitted: [],
    }, null, 2)}\n`);

    await expect(preflightWorkflow(root, Date.parse("2026-08-13T00:03:00.000Z"))).resolves.toMatchObject({
      contextDrift: "stale",
      requiredChecks: { pending: ["check"], stale: [] },
      nextStage: "continue",
    });
  });
  it("stops instead of routing back to debug after a second identical failed check", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const digest = "a".repeat(64);
    const active: TaskRecordV2 = {
      ...taskV2("verifying", "verifying"),
      evidence: [
        { id: "failed-1", checkId: "check", recordedAt: "2026-08-13T00:01:00.000Z", result: "fail", exitCode: 1, summary: "same failure", artifactPaths: [], inputDigest: digest },
        { id: "failed-2", checkId: "check", recordedAt: "2026-08-13T00:02:00.000Z", result: "fail", exitCode: 1, summary: " Same   failure ", artifactPaths: [], inputDigest: digest },
      ],
    };
    await saveTask(join(root, ".harnix"), active);
    await setActiveTask(join(root, ".harnix"), active.id);

    await expect(preflightWorkflow(root)).resolves.toMatchObject({
      requiredChecks: { failed: ["check"] },
      retryLimitReached: ["check"],
      nextStage: "stop",
    });
  });
  it("does not let a future-dated pass reset the verification retry breaker", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const digest = "a".repeat(64);
    const active: TaskRecordV2 = {
      ...taskV2("verifying", "verifying"),
      evidence: [
        { id: "failed-1", checkId: "check", recordedAt: "2026-08-13T00:01:00.000Z", result: "fail", exitCode: 1, summary: "first", artifactPaths: [], inputDigest: digest },
        { id: "future-pass", checkId: "check", recordedAt: "2026-08-14T00:00:00.000Z", result: "pass", exitCode: 0, summary: "future", artifactPaths: [], inputDigest: digest },
        { id: "failed-2", checkId: "check", recordedAt: "2026-08-13T00:02:00.000Z", result: "fail", exitCode: 1, summary: "second", artifactPaths: [], inputDigest: digest },
      ],
    };
    await saveTask(join(root, ".harnix"), active);
    await setActiveTask(join(root, ".harnix"), active.id);

    await expect(preflightWorkflow(root, Date.parse("2026-08-13T00:03:00.000Z"))).resolves.toMatchObject({
      requiredChecks: { stale: ["check"] },
      retryLimitReached: ["check"],
      nextStage: "stop",
    });
  });
  it("does not route finishing to Finish until acceptance completion semantics are ready", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const now = Date.parse("2026-08-13T00:03:00.000Z");
    const pass = { id: "pass-1", checkId: "check", recordedAt: "2026-08-13T00:02:00.000Z", result: "pass" as const, exitCode: 0, summary: "green", artifactPaths: [] };
    const pendingCriterion = { ...task("verifying", "finishing"), evidence: [pass] };
    await saveTask(join(root, ".harnix"), pendingCriterion);
    await setActiveTask(join(root, ".harnix"), pendingCriterion.id);

    await expect(preflightWorkflow(root, now)).resolves.toMatchObject({
      requiredChecks: { passed: ["check"] },
      nextStage: "check",
    });
    await expect(finishWorkflow(root, new Date(now).toISOString())).rejects.toThrow(/fresh complete verification|completion|fresh required evidence/iu);

    const noRequired = { ...pendingCriterion, validationPlan: [], evidence: [], updatedAt: "2026-08-13T00:02:30.000Z" };
    await saveTask(join(root, ".harnix"), noRequired);
    await expect(preflightWorkflow(root, now)).resolves.toMatchObject({ requiredChecks: { passed: [] }, nextStage: "check" });
  });
  it("projects stale context drift from the persisted manifest without mutating it", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
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

  it("persists selection freshness and reports task or inventory drift without refreshing the repo map", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "tracked.md"), "tracked content");
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = { ...taskV2("planning", "planning"), relevantPaths: ["tracked.md"] };
    const context = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      taskId: planning.id,
      maxCharacters: 1000,
      entries: [{ path: "tracked.md", reason: "test", priority: 0, pinned: false, states: [], contentHash: sha256("tracked content") }],
      omitted: [],
    };

    await saveWorkflow(root, { task: planning, artifacts: { context } });
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      contextDrift: { state: "current", changes: [], selectionChanges: [] },
    });
    const selectionPath = join(root, ".harnix", "tasks", planning.id, "context-selection.json");
    await expect(readFile(selectionPath, "utf8")).resolves.not.toContain("tracked content");

    const changedSignals = { ...planning, relevantPaths: ["docs/**"], updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: changedSignals });
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      contextDrift: { state: "stale", changes: [], selectionChanges: ["selection-signals-changed"] },
    });

    await saveWorkflow(root, { task: { ...planning, updatedAt: "2026-08-13T00:02:00.000Z" } });
    await rm(join(root, ".harnix", "cache", "repo-map-v1.json"));
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      contextDrift: { state: "stale", changes: [], selectionChanges: ["inventory-unavailable"] },
    });

    await writeFile(selectionPath, "not-json");
    const corrupt = await inspectWorkflow(root).then(() => undefined, (error: unknown) => error as Error);
    expect(corrupt?.message).toBe("Context selection snapshot is unreadable or invalid.");
    expect(corrupt?.message).not.toContain(root);
  });
  it("refuses missing-pointer replay when a persisted context selection pair is incomplete", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "tracked.md"), "tracked content");
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = { ...taskV2("planning", "planning"), relevantPaths: ["tracked.md"] };
    const context = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      taskId: planning.id,
      maxCharacters: 1000,
      entries: [{ path: "tracked.md", reason: "test", priority: 0, pinned: false, states: [], contentHash: sha256("tracked content") }],
      omitted: [],
    };
    await saveWorkflow(root, { task: planning, artifacts: { context } });
    await rm(join(root, ".harnix", "tasks", planning.id, "context-selection.json"));
    await rm(join(root, ".harnix", "tasks", ".active"));

    await expect(saveWorkflow(root, { task: planning })).rejects.toThrow(/complete context\.json.*context-selection\.json pair/iu);
    await expect(readFile(join(root, ".harnix", "tasks", ".active"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("inspects, creates a planning task, and rejects evidence mutation or an illegal jump", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] } });

    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV2("planning", "planning", ["@task-contract", "input.ts"]);
    await expect(saveWorkflow(root, { task: planning })).resolves.toMatchObject({ id: planning.id, status: "planning" });
    expect(await inspectWorkflow(root)).toMatchObject({ activeTask: { id: planning.id }, contextDrift: { state: "not-recorded", changes: [] } });

    const snapshot = await snapshotWorkflow(root, "check");
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z", evidence: [{ id: "e", checkId: "check", recordedAt: timestamp, result: "pass" as const, exitCode: 0, summary: "kept", artifactPaths: [], inputDigest: snapshot.inputDigest }] };
    await saveWorkflow(root, { task: ready });
    await expect(saveWorkflow(root, { task: { ...ready, evidence: [{ ...ready.evidence[0]!, summary: "mutated" }] } })).rejects.toThrow("evidence");
    await expect(saveWorkflow(root, { task: { ...ready, status: "verifying", checkpoint: "verifying" } })).rejects.toThrow("Illegal task transition");
  });

  it("re-enters ready only from replan and reruns the Full ready gate", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = { ...taskV2("planning", "planning"), mode: "full" as const, relevantPaths: ["src/a.ts"] };
    const prd = "# PRD\n### AC `a`\nDone.\n";
    const plan = [
      "# Plan",
      "- [ ] `CAP-A` — implement",
      "### Slice `CAP-A`",
      "Criteria: `a`",
      "Checks: `check`",
      "Paths: `src/a.ts`",
      "",
    ].join("\n");
    await saveWorkflow(root, { task: planning, artifacts: { prd, plan } });

    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });
    const readyReplan = { ...ready, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:01:30.000Z" };
    await saveWorkflow(root, { task: readyReplan });
    const readyAgain = { ...readyReplan, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:45.000Z" };
    await expect(saveWorkflow(root, { task: readyAgain })).resolves.toMatchObject({ status: "ready", checkpoint: "ready" });

    const inProgress = { ...readyAgain, status: "in_progress" as const, checkpoint: "implementing" as const, updatedAt: "2026-08-13T00:02:00.000Z" };
    await saveWorkflow(root, { task: inProgress });
    await expect(saveWorkflow(root, { task: { ...inProgress, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:03:00.000Z" } })).rejects.toThrow("Illegal task transition");

    const implementationReplan = { ...inProgress, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:04:00.000Z" };
    await saveWorkflow(root, { task: implementationReplan });
    await expect(saveWorkflow(root, {
      task: { ...implementationReplan, acceptanceCriteria: [{ ...implementationReplan.acceptanceCriteria[0]!, text: "mutated" }] },
    })).rejects.toThrow("contractRevision");
    await writeFile(join(root, ".harnix", "tasks", planning.id, "plan.md"), "# Plan\nTODO\n");
    const reready = { ...implementationReplan, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:05:00.000Z" };
    await expect(saveWorkflow(root, { task: reready })).rejects.toThrow("ready trace audit failed");
    await expect(saveWorkflow(root, { task: reready, artifacts: { prd, plan } })).resolves.toMatchObject({ status: "ready", checkpoint: "ready" });

    const resumed = { ...reready, status: "in_progress" as const, checkpoint: "implementing" as const, updatedAt: "2026-08-13T00:06:00.000Z" };
    await saveWorkflow(root, { task: resumed });
    const verifying = { ...resumed, status: "verifying" as const, checkpoint: "verifying" as const, updatedAt: "2026-08-13T00:07:00.000Z" };
    await saveWorkflow(root, { task: verifying });
    const verificationReplan = { ...verifying, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:08:00.000Z" };
    await saveWorkflow(root, { task: verificationReplan });
    await expect(saveWorkflow(root, { task: { ...verificationReplan, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:09:00.000Z" } })).resolves.toMatchObject({ status: "ready", checkpoint: "ready" });
  });

  it("finishes only the active task after fresh verification and clears only its matching pointer", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const verifying = task("verifying", "verifying");
    verifying.validationPlan = [{ id: "check", description: "check", scope: "focused", required: true }];
    verifying.evidence = [{ id: "e", checkId: "check", recordedAt: new Date().toISOString(), result: "pass", summary: "ok", artifactPaths: [] }];
    verifying.acceptanceCriteria = [{ id: "a", text: "done", status: "met", evidenceIds: ["e"] }];
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, { ...verifying, status: "planning", checkpoint: "planning" });
    await setActiveTask(harnixRoot, verifying.id);
    await saveWorkflow(root, { task: { ...verifying, status: "ready", checkpoint: "ready" } });
    await saveWorkflow(root, { task: { ...verifying, status: "in_progress", checkpoint: "implementing" } });
    await saveWorkflow(root, { task: verifying });
    await saveWorkflow(root, { task: { ...verifying, checkpoint: "finishing", updatedAt: new Date().toISOString() } });

    await expect(finishWorkflow(root)).resolves.toMatchObject({ status: "completed", checkpoint: "finishing" });
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] } });
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
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] } });
  });

  it("cancels an active task through the hidden transport and writes its cancellation journal", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    planning.evidence = [{ id: "failed", recordedAt: timestamp, result: "fail", exitCode: 1, summary: "blocked", artifactPaths: [] }];
    await saveWorkflow(root, { task: planning });

    await expect(cancelWorkflow(root, { reason: "Người dùng dừng task.", authorizedBy: "user" }, timestamp)).resolves.toMatchObject({
      status: "cancelled",
      checkpoint: "cancelling",
      cancelledAt: timestamp,
    });
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] } });
    const journal = await readFile(join(root, ".harnix", "workspace", "tam", "journal", "2026-08-13.jsonl"), "utf8");
    expect(journal).toContain('"kind":"cancellation"');
    expect(journal).toContain('"failed"');
  });

  it("requires workflow --cancel instead of allowing save to forge a cancelled task", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await expect(saveWorkflow(root, { task: {
      ...planning,
      status: "cancelled",
      checkpoint: "cancelling",
      cancellation: { reason: "forged", authorizedBy: "user" },
      cancelledAt: "2026-08-13T00:01:00.000Z",
      updatedAt: "2026-08-13T00:01:00.000Z",
    } })).rejects.toThrow(/workflow --cancel/iu);
  });

  it("recovers a cancelled task into its original journal date across a UTC day boundary", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const cancelledAt = "2026-08-13T23:59:59.000Z";
    const retryAt = "2026-08-14T00:00:01.000Z";
    const cancelled = cancelTask(task("planning", "planning"), { reason: "Stop safely", authorizedBy: "user" }, cancelledAt);
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, cancelled);
    await setActiveTask(harnixRoot, cancelled.id);

    await expect(cancelWorkflow(root, undefined, retryAt)).resolves.toMatchObject({ status: "cancelled", cancelledAt });

    const originalJournal = join(harnixRoot, "workspace", "tam", "journal", "2026-08-13.jsonl");
    const retryJournal = join(harnixRoot, "workspace", "tam", "journal", "2026-08-14.jsonl");
    await expect(readFile(originalJournal, "utf8")).resolves.toContain(`${cancelled.id}-cancellation`);
    await expect(readFile(retryJournal, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] } });
  });

  it("records one eligible learning candidate from fresh finishing provenance and retries idempotently", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const now = "2026-08-20T23:59:00.000Z";
    const harnixRoot = join(root, ".harnix");
    const previousEvidence = { id: "e-previous", checkId: "check", recordedAt: now, result: "pass" as const, exitCode: 0, summary: "previous", artifactPaths: [] };
    const previous = {
      ...task("completed", "finishing"),
      id: "20260812-120000-previous-learning-source",
      acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [previousEvidence.id] }],
      evidence: [previousEvidence],
      completedAt: now,
      updatedAt: now,
    };
    const currentEvidence = { id: "e-current", checkId: "check", recordedAt: now, result: "pass" as const, exitCode: 0, summary: "current", artifactPaths: [] };
    const current = {
      ...task("verifying", "finishing"),
      acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [currentEvidence.id] }],
      evidence: [currentEvidence],
      updatedAt: now,
    };
    await saveTask(harnixRoot, previous);
    await saveTask(harnixRoot, current);
    await setActiveTask(harnixRoot, current.id);
    const envelope = { candidate: { id: "workflow-parity", statement: "pnpm test\nhttps://example.invalid/review", sourceTaskIds: [current.id, previous.id], evidenceIds: [currentEvidence.id, previousEvidence.id] } };

    const created = await recordLearningWorkflow(root, envelope, "2026-08-20T23:59:59.000Z");
    const retried = await recordLearningWorkflow(root, envelope, "2026-08-21T00:00:01.000Z");

    expect(created).toMatchObject({ created: true, eligible: true, findings: ["command-like", "url-like"], entry: { kind: "learning", learning: { id: "workflow-parity", occurrences: 2, confidence: 1, status: "candidate" } } });
    expect(retried).toEqual({ ...created, created: false });
    await expect(recordLearningWorkflow(root, { candidate: { ...envelope.candidate, statement: "Changed statement." } }, "2026-08-21T00:00:02.000Z")).rejects.toThrow(/conflict/iu);
    await expect(recordLearningWorkflow(root, { candidate: { ...envelope.candidate, id: "unknown-evidence", evidenceIds: [...envelope.candidate.evidenceIds, "e-injected"] } }, "2026-08-21T00:00:02.000Z")).rejects.toThrow(/evidence/iu);
    await expect(recordLearningWorkflow(root, { candidate: { ...envelope.candidate, id: "oversized", statement: "x".repeat(65_537) } }, "2026-08-21T00:00:02.000Z")).rejects.toThrow(/64 KiB/iu);
    await expect(readFile(join(harnixRoot, "workspace", "tam", "journal", "2026-08-21.jsonl"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects learning capture below the threshold or with unknown provenance", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const now = new Date().toISOString();
    const currentEvidence = { id: "e-current", checkId: "check", recordedAt: now, result: "pass" as const, exitCode: 0, summary: "current", artifactPaths: [] };
    const current = { ...task("verifying", "finishing"), acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [currentEvidence.id] }], evidence: [currentEvidence], updatedAt: now };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, current);
    await setActiveTask(harnixRoot, current.id);

    await expect(recordLearningWorkflow(root, { candidate: { id: "single", statement: "Single observation.", sourceTaskIds: [current.id], evidenceIds: [currentEvidence.id] } }, now)).rejects.toThrow(/eligible/iu);
    await expect(recordLearningWorkflow(root, { candidate: { id: "unknown", statement: "Unknown source.", sourceTaskIds: [current.id, "20260812-120000-missing"], evidenceIds: [currentEvidence.id, "e-missing"] } }, now)).rejects.toThrow(/source task/iu);
  });

  it("rejects a new Full task unless its required artifacts are persisted with it", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const full = { ...taskV2("planning", "planning"), mode: "full" as const };

    await expect(saveWorkflow(root, { task: full })).rejects.toThrow("prd.md and plan.md");
    await expect(saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } })).resolves.toMatchObject({ id: full.id });
  });

  it("rejects unknown hidden-save envelope, artifact, and revision fields", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");

    await expect(saveWorkflow(root, { task: planning, ignored: true })).rejects.toThrow(/unknown schema field/iu);
    await expect(saveWorkflow(root, { task: planning, artifacts: { ignored: "value" } })).rejects.toThrow(/unknown schema field/iu);
    await expect(saveWorkflow(root, { task: planning, contractRevision: { reason: "Lý do đủ dài.", ignored: true } })).rejects.toThrow(/unknown schema field/iu);
    await expect(saveWorkflow(root, { task: planning, artifacts: { contextSelection: {} } })).rejects.toThrow(/unknown schema field/iu);
  });

  it("rejects a new TaskRecord v1 while preserving direct legacy-state loading", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const legacy = task("planning", "planning");

    await expect(saveWorkflow(root, { task: legacy })).rejects.toThrow(/new task.*schema v2|schema v2.*new task/iu);

    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, legacy);
    await setActiveTask(harnixRoot, legacy.id);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: { id: legacy.id, schemaVersion: 1 } });
  });

  it("prevents a Full task from downgrading to Lite before readiness", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const full = { ...taskV2("planning", "planning"), mode: "full" as const };
    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } });

    await expect(saveWorkflow(root, {
      task: { ...full, mode: "lite", status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" },
    })).rejects.toThrow(/Full.*Lite|downgrade.*mode/iu);
  });

  it("audits deterministic trace coverage and enforces it on Full readiness", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const full = { ...taskV2("planning", "planning"), mode: "full" as const, relevantPaths: ["src/a.ts"] };
    const prd = "# PRD\n### AC `a`\nDone.\n";
    const plan = [
      "# Plan",
      "- [ ] `CAP-A` — implement",
      "### Slice `CAP-A`",
      "Criteria: `a`",
      "Checks: `check`",
      "Paths: `src/a.ts`",
      "",
    ].join("\n");
    await saveWorkflow(root, { task: full, artifacts: { prd, plan } });
    await expect(auditWorkflow(root)).resolves.toMatchObject({ status: "pass", diagnostics: [] });

    await writeFile(join(root, ".harnix", "tasks", full.id, "plan.md"), "# Plan\nTODO\n");
    const ready = { ...full, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await expect(auditWorkflow(root)).resolves.toMatchObject({ status: "fail" });
    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow("ready trace audit failed");
    await expect(saveWorkflow(root, { task: ready, artifacts: { prd, plan } })).resolves.toMatchObject({ status: "ready" });
  });

  it("rejects readiness when acceptance or required validation gates are empty", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const empty = { ...task("planning", "planning"), acceptanceCriteria: [], validationPlan: [] };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, empty);
    await setActiveTask(harnixRoot, empty.id);

    await expect(saveWorkflow(root, { task: { ...empty, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" } })).rejects.toThrow("acceptance");

    const secondRoot = await temporaryRepository();
    await initializeProject({ root: secondRoot, developer: "tam", yes: true });
    const noRequiredChecks = {
      ...taskV2("planning", "planning"),
      acceptanceCriteria: [{ id: "a", text: "done", status: "waived" as const, evidenceIds: [], waiverReason: "Không áp dụng cho fixture cổng ready." }],
      validationPlan: [],
    };
    await saveWorkflow(secondRoot, { task: noRequiredChecks });
    await expect(saveWorkflow(secondRoot, { task: { ...noRequiredChecks, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" } })).rejects.toThrow("required validation");
  });

  it("preserves persisted acceptance criteria and required validation obligations", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = task("planning", "planning");
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, planning);
    await setActiveTask(harnixRoot, planning.id);
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

  it("allows TaskRecord v2 obligations to converge during planning before freezing at ready", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });

    const revised = {
      ...planning,
      acceptanceCriteria: [...planning.acceptanceCriteria, { id: "b", text: "new", status: "pending" as const, evidenceIds: [] }],
      validationPlan: [{ ...planning.validationPlan[0]!, command: "pnpm test:unit", criterionIds: ["a", "b"], inputs: ["@task-contract", "test/**/*.ts"] }],
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await expect(saveWorkflow(root, { task: revised })).resolves.toMatchObject({ validationPlan: [{ command: "pnpm test:unit", criterionIds: ["a", "b"] }] });
    const ready = { ...revised, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:02:00.000Z" };
    await saveWorkflow(root, { task: ready });
    await expect(saveWorkflow(root, {
      task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, command: "pnpm test" }], updatedAt: "2026-08-13T00:03:00.000Z" },
    })).rejects.toThrow(/freeze at first ready/iu);
  });
  it("preserves legacy TaskRecord v1 obligation freezing from first persistence", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const legacy = task("planning", "planning");
    await saveTask(join(root, ".harnix"), legacy);
    await setActiveTask(join(root, ".harnix"), legacy.id);

    await expect(saveWorkflow(root, {
      task: { ...legacy, acceptanceCriteria: [{ ...legacy.acceptanceCriteria[0]!, text: "changed legacy obligation" }], updatedAt: "2026-08-13T00:01:00.000Z" },
    })).rejects.toThrow(/freeze|acceptance criterion/iu);
  });

  it("supersedes an unproven frozen check only through persisted replan with audit evidence", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });
    await expect(saveWorkflow(root, {
      task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, command: "pnpm test:unit" }], updatedAt: "2026-08-13T00:02:00.000Z" },
      contractRevision: { reason: "Lệnh cũ không còn đại diện cho focused gate." },
    })).rejects.toThrow(/persist replan/iu);

    const replanning = { ...ready, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:02:00.000Z" };
    await saveWorkflow(root, { task: replanning });
    const revisionEnvelope = {
      task: { ...replanning, validationPlan: [{ ...replanning.validationPlan[0]!, command: "pnpm test:unit" }], updatedAt: "2026-08-13T00:03:00.000Z" },
      contractRevision: { reason: "Lệnh cũ không còn đại diện cho focused gate." },
    };
    const revised = await saveWorkflow(root, revisionEnvelope);
    expect(revised).toMatchObject({
      checkpoint: "replan",
      validationPlan: [{ command: "pnpm test:unit" }],
      evidence: [expect.objectContaining({ id: "task-contract-revision-01", result: "skipped" })],
    });
    await expect(saveWorkflow(root, revisionEnvelope)).resolves.toEqual(revised);
  });

  it("locks criteria mapped by failed evidence and requires a new check ID when retiring the failed definition", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV2("planning", "planning", ["@task-contract", "input.ts"]);
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });
    const snapshot = await snapshotWorkflow(root, "check");
    const failed = {
      ...ready,
      evidence: [{ id: "failed-check", checkId: "check", recordedAt: "2026-08-13T00:02:00.000Z", result: "fail" as const, exitCode: 1, summary: "wrong command", artifactPaths: [], inputDigest: snapshot.inputDigest }],
      updatedAt: "2026-08-13T00:02:00.000Z",
    };
    await saveWorkflow(root, { task: failed });
    const replanning = { ...failed, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:03:00.000Z" };
    await saveWorkflow(root, { task: replanning });

    await expect(saveWorkflow(root, {
      task: {
        ...replanning,
        acceptanceCriteria: [{ ...replanning.acceptanceCriteria[0]!, text: "changed meaning" }],
        validationPlan: [{ ...replanning.validationPlan[0]!, command: "pnpm test:unit" }],
        updatedAt: "2026-08-13T00:04:00.000Z",
      },
      contractRevision: { reason: "Thay thế check không còn đúng sau khi đã có failure." },
    })).rejects.toThrow(/proven acceptance criterion/iu);

    await expect(saveWorkflow(root, {
      task: {
        ...replanning,
        validationPlan: [
          { ...replanning.validationPlan[0]!, required: false },
          { ...replanning.validationPlan[0]!, id: "check-replacement", command: "pnpm test:unit" },
        ],
        updatedAt: "2026-08-13T00:04:00.000Z",
      },
      contractRevision: { reason: "Retire check lỗi và thay bằng một check ID mới có coverage tương đương." },
    })).resolves.toMatchObject({
      validationPlan: [{ id: "check", required: false }, { id: "check-replacement", required: true }],
    });
  });

  it("migrates unfinished TaskRecord v1 only from replan with exact migration evidence", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = task("planning", "planning");
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, planning);
    await setActiveTask(harnixRoot, planning.id);
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
    await expect(saveWorkflow(root, {
      task: { ...candidate, validationPlan: [{ ...candidate.validationPlan[0]!, id: "renamed-check" }] },
    })).rejects.toThrow(/preserve required validation check/iu);
    await expect(saveWorkflow(root, {
      task: { ...candidate, validationPlan: [{ ...candidate.validationPlan[0]!, command: "pnpm test:unit" }] },
    })).rejects.toThrow(/preserve required validation check/iu);
    await expect(saveWorkflow(root, { task: candidate })).resolves.toMatchObject({ schemaVersion: 2, checkpoint: "replan" });
    const inheritedRevision = {
      ...candidate,
      validationPlan: [{ ...candidate.validationPlan[0]!, command: "pnpm test:unit" }],
      updatedAt: "2026-08-13T00:03:00.000Z",
    };
    await expect(saveWorkflow(root, { task: inheritedRevision })).rejects.toThrow(/contractRevision/iu);
    await expect(saveWorkflow(root, {
      task: inheritedRevision,
      contractRevision: { reason: "Thay check kế thừa bằng contract v2 đã audit sau migration." },
    })).resolves.toMatchObject({ validationPlan: [{ id: "check", command: "pnpm test:unit" }] });
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
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, replanning);
    await setActiveTask(harnixRoot, replanning.id);
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

  it("validates a failed-run input digest before trusting it as a retry fingerprint", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV2("planning", "planning", ["@task-contract", "input.ts"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    const failed = {
      ...planning,
      evidence: [{ id: "stable-failure", checkId: "check", recordedAt: "2026-08-14T00:01:00.000Z", result: "fail" as const, exitCode: 1, summary: "same failure", artifactPaths: [], inputDigest: "f".repeat(64) }],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: failed })).rejects.toThrow(/input digest/iu);
    await expect(saveWorkflow(root, { task: { ...failed, evidence: [{ ...failed.evidence[0]!, inputDigest: snapshot.inputDigest }] } })).resolves.toMatchObject({ evidence: [{ id: "stable-failure", result: "fail" }] });
    await expect(readFile(join(root, ".harnix", "tasks", planning.id, "verification-inputs.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("computes pass snapshots from candidate Full artifacts and commits task state last", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = { ...taskV2("planning", "planning", ["@task-contract", "input.ts"]), mode: "full" as const };
    const initialArtifacts = { prd: "# PRD\nRequirement.\n", plan: "# Plan\nOriginal semantic plan.\n" };
    await saveWorkflow(root, { task: planning, artifacts: initialArtifacts });
    const nextArtifacts = { ...initialArtifacts, plan: "# Plan\nUpdated semantic plan.\n" };
    const snapshot = await computeVerificationInputSnapshot(root, planning, "check", { artifacts: nextArtifacts });
    const withEvidence = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met" as const, evidenceIds: ["candidate-artifact-pass"] }],
      evidence: [{ id: "candidate-artifact-pass", checkId: "check", recordedAt: "2026-08-14T00:01:00.000Z", result: "pass" as const, exitCode: 0, summary: "candidate artifacts", artifactPaths: [], inputDigest: snapshot.inputDigest }],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: withEvidence, artifacts: nextArtifacts })).resolves.toMatchObject({ evidence: [{ id: "candidate-artifact-pass" }] });
    await expect(readFile(join(root, ".harnix", "tasks", planning.id, "plan.md"), "utf8")).resolves.toBe(nextArtifacts.plan);
    await expect(assertVerificationInputsFresh(root, join(root, ".harnix"), withEvidence)).resolves.toBeUndefined();
  });

  it("rolls back candidate artifacts and sidecar when evidence validation fails before the task commit", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = { ...taskV2("planning", "planning", ["@task-contract", "input.ts"]), mode: "full" as const };
    const initialArtifacts = { prd: "# PRD\nRequirement.\n", plan: "# Plan\nOriginal semantic plan.\n" };
    await saveWorkflow(root, { task: planning, artifacts: initialArtifacts });
    const taskPath = join(root, ".harnix", "tasks", planning.id, "task.json");
    const sidecarPath = join(root, ".harnix", "tasks", planning.id, "verification-inputs.json");
    const taskBefore = await readFile(taskPath, "utf8");
    const mismatched = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met" as const, evidenceIds: ["bad-pass"] }],
      evidence: [{ id: "bad-pass", checkId: "check", recordedAt: "2026-08-14T00:01:00.000Z", result: "pass" as const, exitCode: 0, summary: "bad digest", artifactPaths: [], inputDigest: "f".repeat(64) }],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: mismatched, artifacts: { ...initialArtifacts, plan: "# Plan\nChanged semantic plan.\n" } })).rejects.toThrow(/input digest/iu);
    await expect(readFile(join(root, ".harnix", "tasks", planning.id, "plan.md"), "utf8")).resolves.toBe(initialArtifacts.plan);
    await expect(readFile(taskPath, "utf8")).resolves.toBe(taskBefore);
    await expect(readFile(sidecarPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps saved pass evidence fresh when its required glob matches the active task record", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning", [".harnix/tasks/*/task.json", "@task-contract"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    const withEvidence: TaskRecordV2 = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met", evidenceIds: ["e-self-match"] }],
      evidence: [{
        id: "e-self-match",
        checkId: "check",
        recordedAt: "2026-08-14T00:01:00.000Z",
        result: "pass",
        exitCode: 0,
        summary: "self-match pass",
        artifactPaths: [],
        inputDigest: snapshot.inputDigest,
      }],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: withEvidence })).resolves.toMatchObject({ evidence: [{ id: "e-self-match" }] });
    const persisted = (await inspectWorkflow(root)).activeTask;
    if (persisted?.schemaVersion !== 2) throw new Error("Expected an active TaskRecord v2 fixture.");
    await expect(assertVerificationInputsFresh(root, join(root, ".harnix"), persisted)).resolves.toBeUndefined();
    await expect(snapshotWorkflow(root, "check")).resolves.toMatchObject({ inputDigest: snapshot.inputDigest });

    const activePath = `.harnix/tasks/${planning.id}/task.json`;
    const sidecar = JSON.parse(await readFile(join(root, ".harnix", "tasks", planning.id, "verification-inputs.json"), "utf8")) as {
      schemaVersion: number;
      snapshots: Array<{ entries: Array<{ path: string }> }>;
    };
    expect(sidecar.schemaVersion).toBe(1);
    expect(sidecar.snapshots[0]?.entries.map((entry) => entry.path)).not.toContain(activePath);
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

  it("allows only monotonic TaskRecord v1 additions after first persistence", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = task("planning", "planning");
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, planning);
    await setActiveTask(harnixRoot, planning.id);
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
    const full = { ...taskV2("planning", "planning"), mode: "full" as const };
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

function taskV2(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"], inputs = ["@task-contract", "src/**/*.ts"]): TaskRecordV2 {
  return {
    ...task(status, checkpoint),
    schemaVersion: 2 as const,
    validationPlan: [{ id: "check", description: "Run tests", command: "pnpm test", scope: "full" as const, required: true, criterionIds: ["a"], inputs }],
    evidence: [],
  };
}

async function loadPersistedTask(root: string, id: string): Promise<unknown> {
  return JSON.parse(await readFile(join(root, ".harnix", "tasks", id, "task.json"), "utf8")) as unknown;
}

function reverseObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseObjectKeys);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(Object.entries(value).reverse().map(([key, nested]) => [key, reverseObjectKeys(nested)]));
}
