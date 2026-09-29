import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { appendEvidenceWorkflow, cancelWorkflow, finishWorkflow, inspectWorkflow, preflightWorkflow, recordLearningWorkflow, saveWorkflow, snapshotWorkflow, transitionWorkflow, workflowEnvelopeSchema } from "../../src/commands/internal-workflow.js";
import { appendJournal } from "../../src/core/journal/journal.js";
import { acceptanceCriterionKeys, blockerKeys, cancelTask, evidenceV2Keys, saveTask, setActiveTask, taskRecordFieldManifest, transitionTask, validationCheckV2Keys, type TaskRecord, type TaskRecordV1, type TaskRecordV3 } from "../../src/core/tasks/task.js";
import { assertInputDigestsFresh, computeInputDigest } from "../../src/core/verification/input-digest.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";
import { initializeProject } from "../../src/commands/init.js";
import { readConfig, writeConfig } from "../../src/core/config/config.js";
import { sha256 } from "../../src/utils/hashing.js";

const temporaryRepository = useTemporaryRepositories();
const timestamp = "2026-08-13T00:00:00.000Z";

describe("hidden workflow persistence operations", () => {
  it("should_transition_the_active_task_without_a_task_body_and_preserve_evidence", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });
    const working = {
      ...ready,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      updatedAt: "2026-08-13T00:02:00.000Z",
      evidence: [{ id: "red-check", checkId: "check", recordedAt: "2026-08-13T00:02:00.000Z", result: "fail" as const, exitCode: 1, summary: "RED", artifactPaths: [] }],
    };
    await saveWorkflow(root, { task: working });

    const transitioned = await transitionWorkflow(root, "verifying", "verifying");

    expect(transitioned.status).toBe("verifying");
    expect(transitioned.checkpoint).toBe("verifying");
    expect(transitioned.evidence).toHaveLength(1);
    expect(transitioned.evidence[0]?.id).toBe("red-check");
    expect(transitioned.acceptanceCriteria).toEqual(working.acceptanceCriteria);
    expect(transitioned.validationPlan).toEqual(working.validationPlan);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: { status: "verifying", checkpoint: "verifying" } });
  });

  it("should_reject_an_illegal_transition_and_a_missing_active_task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(transitionWorkflow(root, "verifying", "verifying")).rejects.toThrow(/active task/u);

    await saveWorkflow(root, { task: taskV3("planning", "planning") });

    await expect(transitionWorkflow(root, "completed", "finishing")).rejects.toThrow();
    await expect(transitionWorkflow(root, "cancelled", "cancelling")).rejects.toThrow(/--cancel/u);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: { status: "planning", checkpoint: "planning" } });
  });

  it("should_append_exactly_one_evidence_item_without_removing_history", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });
    await saveWorkflow(root, { task: { ...ready, status: "in_progress" as const, checkpoint: "implementing" as const, updatedAt: "2026-08-13T00:02:00.000Z" } });

    const first = await appendEvidenceWorkflow(root, { evidence: { id: "red-1", checkId: "check", recordedAt: "2026-08-13T00:03:00.000Z", result: "fail", exitCode: 1, summary: "RED", artifactPaths: [] } });
    const second = await appendEvidenceWorkflow(root, { evidence: { id: "red-2", checkId: "check", recordedAt: "2026-08-13T00:04:00.000Z", result: "fail", exitCode: 1, summary: "still RED", artifactPaths: [] } });

    expect(first.evidence.map((item) => item.id)).toEqual(["red-1"]);
    expect(second.evidence.map((item) => item.id)).toEqual(["red-1", "red-2"]);
    await expect(appendEvidenceWorkflow(root, { evidence: { id: "red-1", checkId: "check", recordedAt: "2026-08-13T00:05:00.000Z", result: "pass", exitCode: 0, summary: "dup", artifactPaths: [] } })).rejects.toThrow();
    await expect(appendEvidenceWorkflow(root, { task: {}, evidence: {} })).rejects.toThrow();
  });

  it("should_describe_the_save_envelope_schema_without_writing", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    const schema = workflowEnvelopeSchema();

    expect(schema.generator).toBe("harnix");
    expect(schema.schemaVersion).toBe(1);
    expect(Object.keys(schema.envelope).sort()).toEqual(["artifacts", "contractRevision", "epic", "epicMembers", "task"]);
    expect(schema.taskRecord.required).toContain("acceptanceCriteria");
    expect(schema.taskRecord.required).toContain("validationPlan");
    expect(JSON.stringify(schema)).not.toContain(root);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: null });
  });

  it("should_derive_the_schema_taskRecord_field_lists_from_the_same_manifest_validateTask_enforces", () => {
    // This is a structural guarantee, not a coincidence: workflowEnvelopeSchema
    // must call the exported task.ts manifest directly rather than keep a
    // second hardcoded list, so a field added to TaskRecordV3 shows up here
    // automatically instead of silently going stale.
    const schema = workflowEnvelopeSchema();

    expect(schema.taskRecord).toEqual(taskRecordFieldManifest(3));
    expect(schema.nested.acceptanceCriteria.sort()).toEqual([...acceptanceCriterionKeys].sort());
    expect(schema.nested.validationPlan.sort()).toEqual([...validationCheckV2Keys].sort());
    expect(schema.nested.evidence.sort()).toEqual([...evidenceV2Keys].sort());
    expect(schema.nested.blocker.sort()).toEqual([...blockerKeys].sort());
  });

  it("returns bounded read-only preflight metadata without task prose", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = { ...taskV3("planning", "planning"), title: "PRIVATE_TITLE_CANARY", goal: "PRIVATE_GOAL_CANARY" };
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
      clock: { timezone: "UTC", now: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T[\d:.]+\+00:00$/u), idPrefix: expect.stringMatching(/^\d{8}-\d{6}$/u) },
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
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await saveWorkflow(root, { task: { ...planning, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" } });

    await expect(preflightWorkflow(root)).resolves.toMatchObject({ nextStage: "await" });
  });
  it("recovers a missing active pointer when the task commit marker already exists", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await rm(join(root, ".harnix", "tasks", ".active"));

    await expect(saveWorkflow(root, { task: planning })).resolves.toMatchObject({ id: planning.id });
    await expect(readFile(join(root, ".harnix", "tasks", ".active"), "utf8")).resolves.toBe(`${planning.id}\n`);
  });
  it("treats JSON object-key and validation-check order as non-semantic while preserving evidence order", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = {
      ...taskV3("planning", "planning"),
      acceptanceCriteria: [
        { id: "a", text: "done", status: "pending" as const, evidenceIds: [] },
        { id: "b", text: "also done", status: "pending" as const, evidenceIds: [] },
      ],
      validationPlan: [
        { ...taskV3("planning", "planning").validationPlan[0]!, criterionIds: ["a"] },
        { id: "check-2", description: "Run second check", command: "pnpm test:unit", scope: "focused" as const, required: true, criterionIds: ["b"], inputs: ["src/**/*.ts"] },
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
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
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
    await initializeUtcProject(root);
    const first = { id: "failure-1", checkId: "check", recordedAt: timestamp, result: "fail" as const, exitCode: 1, summary: "first", artifactPaths: [] };
    const second = { ...first, id: "failure-2", recordedAt: "2026-08-13T00:01:00.000Z", summary: "second" };
    const persisted = { ...taskV3("planning", "planning"), evidence: [first, second] };
    await saveTask(join(root, ".harnix"), persisted);
    await setActiveTask(join(root, ".harnix"), persisted.id);

    await expect(saveWorkflow(root, { task: { ...persisted, evidence: [second, first], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow(/reorder/iu);
  });
  it("accepts semantically identical evidence objects with reordered properties", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const evidence = { id: "failure-1", checkId: "check", recordedAt: timestamp, result: "fail" as const, exitCode: 1, summary: "first", artifactPaths: [] };
    const persisted = { ...taskV3("planning", "planning"), evidence: [evidence] };
    await saveTask(join(root, ".harnix"), persisted);
    await setActiveTask(join(root, ".harnix"), persisted.id);

    const reordered = { summary: "first", artifactPaths: [], exitCode: 1, result: "fail" as const, recordedAt: timestamp, checkId: "check", id: "failure-1" };
    await expect(saveWorkflow(root, {
      task: { ...persisted, evidence: [reordered], updatedAt: "2026-08-13T00:01:00.000Z" },
    })).resolves.toMatchObject({ evidence: [{ id: "failure-1" }] });
  });
  it("serializes concurrent workflow saves so one stale evidence append cannot overwrite another", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const candidate = (id: string, summary: string): TaskRecordV3 => ({
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
    await initializeUtcProject(root);
    await writeFile(join(root, "tracked.md"), "new content");
    const active = taskV3("in_progress", "implementing");
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
    await initializeUtcProject(root);
    await writeFile(join(root, "tracked.md"), "new content");
    const active: TaskRecordV3 = {
      ...taskV3("verifying", "verifying"),
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
    await initializeUtcProject(root);
    const digest = "a".repeat(64);
    const active: TaskRecordV3 = {
      ...taskV3("verifying", "verifying"),
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
    await initializeUtcProject(root);
    const digest = "a".repeat(64);
    const active: TaskRecordV3 = {
      ...taskV3("verifying", "verifying"),
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
    await initializeUtcProject(root);
    const now = Date.parse("2026-08-13T00:03:00.000Z");
    await writeProjectSource(root);
    const base = taskV3("verifying", "finishing");
    const pass = { id: "pass-1", checkId: "check", recordedAt: "2026-08-13T00:02:00.000Z", result: "pass" as const, exitCode: 0, summary: "green", artifactPaths: [], inputDigest: (await computeInputDigest(root, base, "check")).inputDigest };
    const pendingCriterion = { ...base, evidence: [pass] };
    await saveTask(join(root, ".harnix"), pendingCriterion);
    await setActiveTask(join(root, ".harnix"), pendingCriterion.id);

    await expect(preflightWorkflow(root, now)).resolves.toMatchObject({
      requiredChecks: { passed: ["check"] },
      nextStage: "check",
    });
    await expect(finishWorkflow(root, new Date(now).toISOString())).rejects.toThrow(/fresh complete verification|completion|fresh required evidence/iu);

    const noRequired = { ...pendingCriterion, acceptanceCriteria: [], validationPlan: [], evidence: [], updatedAt: "2026-08-13T00:02:30.000Z" };
    await saveTask(join(root, ".harnix"), noRequired);
    await expect(preflightWorkflow(root, now)).resolves.toMatchObject({ requiredChecks: { passed: [] }, nextStage: "check" });
  });
  it("projects stale context drift from the persisted manifest without mutating it", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
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
    await initializeUtcProject(root);
    const planning = { ...taskV3("planning", "planning"), relevantPaths: ["tracked.md"] };
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
    await initializeUtcProject(root);
    const planning = { ...taskV3("planning", "planning"), relevantPaths: ["tracked.md"] };
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
    await initializeUtcProject(root);
    expect(await inspectWorkflow(root)).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] } });

    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
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
    await initializeUtcProject(root);
    const planning = { ...taskV3("planning", "planning"), mode: "full" as const, relevantPaths: ["src/a.ts"] };
    const prd = "# PRD\nDone.\n";
    const plan = "# Plan\n- [ ] `CAP-A` — implement\n";
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
    await writeFile(join(root, ".harnix", "tasks", planning.id, "plan.md"), "# Plan\nNo checklist here.\n");
    const reready = { ...implementationReplan, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:05:00.000Z" };
    await expect(saveWorkflow(root, { task: reready })).rejects.toThrow("checklist item");
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
    await initializeUtcProject(root);
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
    const verifying = taskV3("verifying", "verifying");
    const digest = (await computeInputDigest(root, verifying, "check")).inputDigest;
    verifying.evidence = [{ id: "e", checkId: "check", recordedAt: new Date().toISOString(), result: "pass", exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: digest }];
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
    await initializeUtcProject(root);
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
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
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
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
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
    await initializeUtcProject(root);
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
    await initializeUtcProject(root);
    const now = "2026-08-20T23:59:00.000Z";
    const harnixRoot = join(root, ".harnix");
    await writeProjectSource(root);
    const previousEvidence = { id: "e-previous", checkId: "check", recordedAt: now, result: "pass" as const, exitCode: 0, summary: "previous", artifactPaths: [], inputDigest: "c".repeat(64) };
    const previous = {
      ...taskV3("completed", "finishing"),
      id: "20260812-120000-previous-learning-source",
      acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [previousEvidence.id] }],
      evidence: [previousEvidence],
      completedAt: now,
      updatedAt: now,
    };
    const currentBase = taskV3("verifying", "finishing");
    const currentEvidence = { id: "e-current", checkId: "check", recordedAt: now, result: "pass" as const, exitCode: 0, summary: "current", artifactPaths: [], inputDigest: (await computeInputDigest(root, currentBase, "check")).inputDigest };
    const current = {
      ...currentBase,
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
    await initializeUtcProject(root);
    const now = new Date().toISOString();
    await writeProjectSource(root);
    const currentBase = taskV3("verifying", "finishing");
    const currentEvidence = { id: "e-current", checkId: "check", recordedAt: now, result: "pass" as const, exitCode: 0, summary: "current", artifactPaths: [], inputDigest: (await computeInputDigest(root, currentBase, "check")).inputDigest };
    const current = { ...currentBase, acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [currentEvidence.id] }], evidence: [currentEvidence], updatedAt: now };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, current);
    await setActiveTask(harnixRoot, current.id);

    await expect(recordLearningWorkflow(root, { candidate: { id: "single", statement: "Single observation.", sourceTaskIds: [current.id], evidenceIds: [currentEvidence.id] } }, now)).rejects.toThrow(/eligible/iu);
    await expect(recordLearningWorkflow(root, { candidate: { id: "unknown", statement: "Unknown source.", sourceTaskIds: [current.id, "20260812-120000-missing"], evidenceIds: [currentEvidence.id, "e-missing"] } }, now)).rejects.toThrow(/source task/iu);
  });

  it("rejects a new Full task unless its required artifacts are persisted with it", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const full = { ...taskV3("planning", "planning"), mode: "full" as const };

    await expect(saveWorkflow(root, { task: full })).rejects.toThrow("prd.md and plan.md");
    await expect(saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } })).resolves.toMatchObject({ id: full.id });
  });

  it("rejects unknown hidden-save envelope, artifact, and revision fields", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");

    await expect(saveWorkflow(root, { task: planning, ignored: true })).rejects.toThrow(/unknown schema field/iu);
    await expect(saveWorkflow(root, { task: planning, artifacts: { ignored: "value" } })).rejects.toThrow(/unknown schema field/iu);
    await expect(saveWorkflow(root, { task: planning, contractRevision: { reason: "Lý do đủ dài.", ignored: true } })).rejects.toThrow(/unknown schema field/iu);
    await expect(saveWorkflow(root, { task: planning, artifacts: { contextSelection: {} } })).rejects.toThrow(/unknown schema field/iu);
  });

  it("rejects a new TaskRecord v1 while preserving direct legacy-state loading", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const legacy = task("planning", "planning");

    await expect(saveWorkflow(root, { task: legacy })).rejects.toThrow(/new task.*schema v3|schema v3.*new task/iu);

    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, legacy);
    await setActiveTask(harnixRoot, legacy.id);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: { id: legacy.id, schemaVersion: 1 } });
  });

  it("prevents a Full task from downgrading to Lite before readiness", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const full = { ...taskV3("planning", "planning"), mode: "full" as const };
    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } });

    await expect(saveWorkflow(root, {
      task: { ...full, mode: "lite", status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" },
    })).rejects.toThrow(/Full.*Lite|downgrade.*mode/iu);
  });

  it("rejects readiness when acceptance or required validation gates are empty", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const empty = { ...taskV3("planning", "planning"), acceptanceCriteria: [], validationPlan: [] };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, empty);
    await setActiveTask(harnixRoot, empty.id);

    await expect(saveWorkflow(root, { task: { ...empty, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" } })).rejects.toThrow("acceptance");

    const secondRoot = await temporaryRepository();
    await initializeProject({ root: secondRoot, developer: "tam", yes: true });
    const noRequiredChecks = {
      ...taskV3("planning", "planning"),
      acceptanceCriteria: [{ id: "a", text: "done", status: "waived" as const, evidenceIds: [], waiverReason: "Không áp dụng cho fixture cổng ready." }],
      validationPlan: [],
    };
    await saveWorkflow(secondRoot, { task: noRequiredChecks });
    await expect(saveWorkflow(secondRoot, { task: { ...noRequiredChecks, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" } })).rejects.toThrow("required validation");
  });

  it("preserves persisted acceptance criteria and required validation obligations", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });

    await expect(saveWorkflow(root, { task: { ...ready, acceptanceCriteria: [], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow(/criterion/iu);
    await expect(saveWorkflow(root, { task: { ...ready, acceptanceCriteria: [{ ...ready.acceptanceCriteria[0]!, id: "renamed" }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow(/criterion/iu);
    await expect(saveWorkflow(root, { task: { ...ready, acceptanceCriteria: [{ ...ready.acceptanceCriteria[0]!, text: "weaker outcome" }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("acceptance criterion text");
    await expect(saveWorkflow(root, { task: { ...ready, validationPlan: [], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow(/coverage|required validation/iu);
    await expect(saveWorkflow(root, { task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, required: false }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow(/coverage|required validation/iu);
    await expect(saveWorkflow(root, { task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, command: "echo weaker" }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("cannot mutate required validation check");
    await expect(saveWorkflow(root, { task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, scope: "focused" }], updatedAt: "2026-08-13T00:02:00.000Z" } })).rejects.toThrow("cannot mutate required validation check");
    await expect(finishWorkflow(root)).rejects.toThrow("verifying/finishing");
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: { acceptanceCriteria: [{ id: "a", text: "done" }], validationPlan: [{ id: "check", command: "pnpm test", scope: "full", required: true }] } });
  });

  it("allows TaskRecord v2 obligations to converge during planning before freezing at ready", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });

    const revised = {
      ...planning,
      acceptanceCriteria: [...planning.acceptanceCriteria, { id: "b", text: "new", status: "pending" as const, evidenceIds: [] }],
      validationPlan: [{ ...planning.validationPlan[0]!, command: "pnpm test:unit", criterionIds: ["a", "b"], inputs: ["test/**/*.ts"] }],
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await expect(saveWorkflow(root, { task: revised })).resolves.toMatchObject({ validationPlan: [{ command: "pnpm test:unit", criterionIds: ["a", "b"] }] });
    const ready = { ...revised, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:02:00.000Z" };
    await saveWorkflow(root, { task: ready });
    await expect(saveWorkflow(root, {
      task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, command: "pnpm test" }], updatedAt: "2026-08-13T00:03:00.000Z" },
    })).rejects.toThrow(/freeze at first ready/iu);
  });
  it("supersedes an unproven frozen check in one save at replan with audit evidence", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: ready });
    await expect(saveWorkflow(root, {
      task: { ...ready, validationPlan: [{ ...ready.validationPlan[0]!, command: "pnpm test:unit" }], updatedAt: "2026-08-13T00:02:00.000Z" },
      contractRevision: { reason: "Lệnh cũ không còn đại diện cho focused gate." },
    })).rejects.toThrow(/persist replan/iu);

    const revisionEnvelope = {
      task: { ...ready, checkpoint: "replan" as const, validationPlan: [{ ...ready.validationPlan[0]!, command: "pnpm test:unit" }], updatedAt: "2026-08-13T00:03:00.000Z" },
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
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
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

  it("rejects a save-time verification race", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
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
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
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

  it("leaves candidate artifacts and the task untouched when evidence validation fails before the task commit", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = { ...taskV3("planning", "planning", ["input.ts"]), mode: "full" as const };
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
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning", [".harnix/tasks/*/task.json"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    const withEvidence: TaskRecordV3 = {
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
    if (persisted?.schemaVersion !== 3) throw new Error("Expected an active TaskRecord v3 fixture.");
    await expect(assertInputDigestsFresh(root, persisted)).resolves.toBeUndefined();
    const current = await snapshotWorkflow(root, "check");
    expect(current.inputDigest).toBe(snapshot.inputDigest);
    expect(current.entries.map((entry) => entry.path)).not.toContain(`.harnix/tasks/${planning.id}/task.json`);
  });

  it("fails finish with safe relative diagnostics when persisted verification inputs drift", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    const withEvidence = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met" as const, evidenceIds: ["e"] }],
      evidence: [{ id: "e", checkId: "check", recordedAt: "2026-08-14T00:01:00.000Z", result: "pass" as const, exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: snapshot.inputDigest }],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: withEvidence });
    await saveWorkflow(root, { task: { ...withEvidence, status: "ready", checkpoint: "ready", updatedAt: "2026-08-14T00:02:00.000Z" } });
    await saveWorkflow(root, { task: { ...withEvidence, status: "in_progress", checkpoint: "implementing", updatedAt: "2026-08-14T00:03:00.000Z" } });
    await saveWorkflow(root, { task: { ...withEvidence, status: "verifying", checkpoint: "verifying", updatedAt: "2026-08-14T00:04:00.000Z" } });
    await saveWorkflow(root, { task: { ...withEvidence, status: "verifying", checkpoint: "finishing", updatedAt: "2026-08-14T00:05:00.000Z" } });
    await writeFile(join(root, "input.ts"), "export const value = 2;\n");

    const failure = await finishWorkflow(root, "2026-08-14T00:06:00.000Z").then(() => undefined, (error: unknown) => error as Error);
    expect(failure?.message).toMatch(/stale for check check/iu);
    expect(failure?.message).not.toContain(root);
  });

  it("rechecks non-empty Full artifacts immediately before readiness", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const full = { ...taskV3("planning", "planning"), mode: "full" as const };
    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } });
    const ready = { ...full, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };

    await rm(join(root, ".harnix", "tasks", full.id, "prd.md"));
    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow("Full tasks require non-empty prd.md and plan.md at ready");
    await writeFile(join(root, ".harnix", "tasks", full.id, "prd.md"), "# PRD\n");
    await writeFile(join(root, ".harnix", "tasks", full.id, "plan.md"), "");
    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow("Full tasks require non-empty prd.md and plan.md at ready");
  });
});

/** These tests assert calendar-day behavior, so they pin the zone instead of inheriting the machine's. */
async function initializeUtcProject(root: string): Promise<void> {
  await initializeProject({ root, developer: "tam", yes: true });
  const configPath = join(root, ".harnix", "config.yaml");
  await writeConfig(configPath, { ...(await readConfig(configPath)), timezone: "UTC" });
}

function task(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"]): TaskRecordV1 {
  return { generator: "harnix", schemaVersion: 1, id: "20260813-120000-workflow", title: "workflow", mode: "lite", status, checkpoint, goal: "test", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "done", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [], validationPlan: [{ id: "check", description: "verify", command: "pnpm test", scope: "full", required: true }], evidence: [], createdAt: timestamp, updatedAt: timestamp };
}

async function writeProjectSource(root: string): Promise<void> {
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
}

function taskV3(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"], inputs = ["src/**/*.ts"]): TaskRecordV3 {
  return {
    ...task(status, checkpoint),
    schemaVersion: 3 as const,
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
