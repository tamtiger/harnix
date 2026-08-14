import { access, readFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createLearningCandidate, isPromotionEligible } from "../../src/core/journal/learning.js";
import { promotionProposal } from "../../src/core/journal/promotion.js";
import { archiveTask, clearActiveTask, createTaskV2MigrationEvidence, resolveActiveTask, saveTask, saveTaskWithArtifacts, setActiveTask, transitionTask, validateTask, type TaskRecord } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("task state", () => {
  it("applies task transitions and learning threshold", async () => {
    const task = validateTask({ generator: "harnix", schemaVersion: 1, id: "20260807-120000-x", title: "x", mode: "lite", status: "planning", checkpoint: "planning", goal: "x", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "x", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: timestamp, updatedAt: timestamp } as TaskRecord);
    expect(transitionTask(task, "ready", "ready").status).toBe("ready");
    const root = await temporaryRepository(); await saveTask(root, task); await setActiveTask(root, task.id);
    expect((await resolveActiveTask(root))?.id).toBe(task.id); await clearActiveTask(root, task.id); expect(await resolveActiveTask(root)).toBeUndefined();
    const candidate = createLearningCandidate({ id: "l", statement: "x", sourceTaskIds: ["b", "a", "a"], evidenceIds: ["e2", "e1"], status: "candidate" });
    expect(candidate.occurrences).toBe(2); expect(isPromotionEligible(candidate)).toBe(true);
    expect(promotionProposal(candidate, "spec/guide.md").content).toContain("Evidence: e1, e2");
  });

  it("creates Full artifacts and rejects ceremony files for Lite", async () => {
    const root = await temporaryRepository();
    await saveTaskWithArtifacts(root, { ...taskFixture(), mode: "full" }, { prd: "# PRD\n", plan: "# Plan\n" });
    expect(await readFile(join(root, "tasks", "20260807-120000-x", "prd.md"), "utf8")).toContain("PRD");
    await expect(saveTaskWithArtifacts(root, taskFixture(), { prd: "# no\n" })).rejects.toThrow("Lite");
  });

  it("should_reject_external_symlink_when_writing_task_artifacts", async () => {
    const root = await temporaryRepository(); const external = await temporaryRepository();
    await symlink(external, join(root, "tasks"), process.platform === "win32" ? "junction" : "dir");

    await expect(saveTaskWithArtifacts(root, { ...taskFixture(), mode: "full" }, { prd: "# PRD\n", plan: "# Plan\n" })).rejects.toThrow("symbolic link");

    await expect(access(join(external, "20260807-120000-x", "task.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_reject_external_symlink_when_resolving_active_task", async () => {
    const root = await temporaryRepository(); const external = await temporaryRepository(); const task = taskFixture();
    await saveTask(external, task); await setActiveTask(external, task.id);
    await symlink(external, join(root, "tasks"), process.platform === "win32" ? "junction" : "dir");

    await expect(resolveActiveTask(root)).rejects.toThrow("symbolic link");
    await expect(clearActiveTask(root, task.id)).rejects.toThrow("symbolic link");

    await expect(readFile(join(external, "tasks", ".active"), "utf8")).resolves.toBe(`${task.id}\n`);
  });

  it("archives only completed tasks and preserves task data", async () => {
    const root = await temporaryRepository(); const task = taskFixture();
    const evidence = { id: "e", recordedAt: timestamp, result: "pass" as const, summary: "ok", artifactPaths: [] };
    const completed = transitionTask({ ...task, evidence: [evidence], acceptanceCriteria: [{ ...task.acceptanceCriteria[0]!, status: "met", evidenceIds: ["e"] }] }, "ready", "ready");
    const inProgress = transitionTask(completed, "in_progress", "implementing"); const verifying = transitionTask(inProgress, "verifying", "verifying"); const done = transitionTask(verifying, "completed", "finishing");
    await saveTask(root, done); await setActiveTask(root, done.id); await archiveTask(root, done); expect(await resolveActiveTask(root)).toBeUndefined(); expect((await readFile(join(root, "tasks", done.id, "task.json"), "utf8"))).toContain(done.id);
  });

  it("requires blocked tasks to resume to the recorded status", () => {
    const task = taskFixture(); const blocked = { ...task, status: "blocked" as const, blocker: { kind: "repository" as const, summary: "x", nextAction: "x", resumeStatus: "in_progress" as const } };
    expect(() => transitionTask(blocked, "ready", "ready")).toThrow("recorded status");
    expect(transitionTask(blocked, "in_progress", "implementing").status).toBe("in_progress");
  });

  it("should_record_blocker_when_transitioning_from_an_active_state", () => {
    const task = taskFixture();
    const blocker = { kind: "external" as const, summary: "Waiting for upstream", nextAction: "Retry after the upstream incident", resumeStatus: "planning" as const };

    const blocked = transitionTask(task, "blocked", "planning", undefined, blocker);

    expect(blocked).toMatchObject({ status: "blocked", checkpoint: "planning", blocker });
    expect(transitionTask(blocked, "planning", "planning").blocker).toBeUndefined();
  });

  it("rejects future schema and malformed task records", () => {
    expect(() => validateTask({ ...taskFixture(), schemaVersion: 3 })).toThrow("unsupported");
    expect(() => validateTask({ ...taskFixture(), checkpoint: "unknown" })).toThrow("invalid");
  });

  it("accepts TaskRecord v2 with explicit criterion coverage and verification inputs", () => {
    expect(validateTask(taskV2Fixture())).toMatchObject({
      schemaVersion: 2,
      validationPlan: [{ criterionIds: ["a"], inputs: ["@task-contract", "src/**/*.ts"] }],
    });
  });

  it("rejects incomplete or unsafe TaskRecord v2 validation contracts", () => {
    const fixture = taskV2Fixture();
    const check = fixture.validationPlan[0]!;
    for (const validationPlan of [
      [{ ...check, criterionIds: [] }],
      [{ ...check, criterionIds: ["missing"] }],
      [{ ...check, criterionIds: ["a", "a"] }],
      [{ ...check, inputs: [] }],
      [{ ...check, inputs: ["src/**/*.ts"] }],
      [{ ...check, inputs: ["@task-contract", "../escape"] }],
      [{ ...check, inputs: ["src/**/*.ts", "@task-contract"] }],
    ]) expect(() => validateTask({ ...fixture, validationPlan })).toThrow();

    expect(() => validateTask({
      ...fixture,
      acceptanceCriteria: [...fixture.acceptanceCriteria, { id: "b", text: "b", status: "pending", evidenceIds: [] }],
      validationPlan: [{ ...check, criterionIds: ["b", "a"] }],
    })).toThrow(/criterion/iu);
    expect(() => validateTask({ ...fixture, validationPlan: [{ ...check, inputs: ["@task-contract", "!src/**/*.ts"] }] })).toThrow(/input/iu);

    expect(() => validateTask({
      ...fixture,
      acceptanceCriteria: [...fixture.acceptanceCriteria, { id: "orphan", text: "orphan", status: "pending", evidenceIds: [] }],
    })).toThrow(/criterion|coverage/iu);
    expect(() => validateTask({
      ...fixture,
      acceptanceCriteria: [...fixture.acceptanceCriteria, { id: "bad id", text: "waived", status: "waived", evidenceIds: [], waiverReason: "not applicable" }],
    })).toThrow(/criterion/iu);
  });

  it("requires repository inputs for behavioral TaskRecord v2 checks and digests for passing evidence", () => {
    const fixture = taskV2Fixture();
    expect(() => validateTask({
      ...fixture,
      validationPlan: [{ ...fixture.validationPlan[0]!, inputs: ["@task-contract"] }],
    })).toThrow(/input/iu);
    expect(() => validateTask({
      ...fixture,
      evidence: [{ id: "e", checkId: "check", recordedAt: timestamp, result: "pass", exitCode: 0, summary: "ok", artifactPaths: [] }],
    })).toThrow(/digest/iu);
    expect(() => validateTask({
      ...fixture,
      evidence: [{ id: "e", checkId: "check", recordedAt: timestamp, result: "pass", exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: "A".repeat(64) }],
    })).toThrow(/digest/iu);
  });

  it("preserves pre-migration v1 evidence without allowing new undigested v2 passes", () => {
    const fixture = taskV2Fixture();
    const legacyPass = { id: "legacy", checkId: "check", recordedAt: timestamp, result: "pass" as const, exitCode: 0, summary: "legacy", artifactPaths: [] };
    expect(() => validateTask({
      ...fixture,
      acceptanceCriteria: [{ ...fixture.acceptanceCriteria[0]!, status: "met", evidenceIds: ["legacy"] }],
      evidence: [legacyPass, createTaskV2MigrationEvidence(fixture.id, "2026-08-13T00:01:00.000Z")],
    })).not.toThrow();
    expect(() => validateTask({
      ...fixture,
      evidence: [createTaskV2MigrationEvidence(fixture.id, timestamp), { ...legacyPass, id: "new" }],
    })).toThrow(/digest/iu);
  });

  it("accepts readable kebab-case task slugs and rejects unsafe task IDs", async () => {
    const readable = { ...taskFixture(), id: "20260813-221700-workflow-audit-fix" };
    expect(() => validateTask(readable)).not.toThrow();

    const root = await temporaryRepository();
    await saveTask(root, readable);
    await setActiveTask(root, readable.id);
    await expect(resolveActiveTask(root)).resolves.toMatchObject({ id: readable.id });

    for (const id of [
      "20260813-221700-Workflow-audit-fix",
      "20260813-221700-workflow--audit-fix",
      "20260813-221700--workflow-audit-fix",
      "20260813-221700-workflow-audit-fix-",
      "20260813-221700-../workflow-audit-fix",
    ]) {
      expect(() => validateTask({ ...taskFixture(), id }), id).toThrow("invalid");
      await expect(setActiveTask(root, id), id).rejects.toThrow("unsafe");
    }
  });

  it("rejects malformed evidence and acceptance criteria", () => {
    expect(() => validateTask({ ...taskFixture(), evidence: [{ id: "e" }] })).toThrow("Evidence");
    expect(() => validateTask({ ...taskFixture(), acceptanceCriteria: [{ id: "a", text: "x", status: "bad", evidenceIds: [] }] })).toThrow("Acceptance");
  });

  it("rejects unsafe references, invalid timestamps, duplicate IDs, and illegal status/checkpoint combinations", () => {
    expect(() => validateTask({ ...taskFixture(), createdAt: "not-a-time" })).toThrow("timestamp");
    expect(() => validateTask({ ...taskFixture(), relevantPaths: ["../escape"] })).toThrow("path");
    expect(() => validateTask({ ...taskFixture(), validationPlan: [{ id: "check", description: "x", scope: "focused", required: true }], evidence: [{ id: "e", checkId: "missing", recordedAt: timestamp, result: "pass", summary: "x", artifactPaths: [] }] })).toThrow("check");
    expect(() => validateTask({ ...taskFixture(), acceptanceCriteria: [{ id: "a", text: "x", status: "pending", evidenceIds: [] }, { id: "a", text: "y", status: "pending", evidenceIds: [] }] })).toThrow(/duplicate/iu);
    expect(() => validateTask({ ...taskFixture(), status: "ready", checkpoint: "implementing" })).toThrow("checkpoint");
  });
});

const timestamp = "2026-08-13T00:00:00.000Z";

function taskFixture(): TaskRecord {
  return { generator: "harnix", schemaVersion: 1, id: "20260807-120000-x", title: "x", mode: "lite", status: "planning", checkpoint: "planning", goal: "x", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "x", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: timestamp, updatedAt: timestamp };
}

function taskV2Fixture() {
  return {
    ...taskFixture(),
    schemaVersion: 2 as const,
    acceptanceCriteria: [{ id: "a", text: "x", status: "pending" as const, evidenceIds: [] }],
    validationPlan: [{
      id: "check",
      description: "Run unit tests",
      command: "pnpm test",
      scope: "focused" as const,
      required: true,
      criterionIds: ["a"],
      inputs: ["@task-contract", "src/**/*.ts"],
    }],
  };
}
