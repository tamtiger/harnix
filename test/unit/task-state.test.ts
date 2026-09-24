import { access, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createLearningCandidate, isPromotionEligible } from "../../src/core/journal/learning.js";
import { promotionProposal } from "../../src/core/journal/promotion.js";
import { archiveTask, cancelTask, clearActiveTask, createTaskV2MigrationEvidence, loadTask, resolveActiveTask, saveTask, saveTaskWithArtifacts, setActiveTask, TaskValidationError, transitionTask, validateTask, type TaskRecord } from "../../src/core/tasks/task.js";
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

  it("wraps a corrupt task.json in a TaskValidationError naming the file instead of a raw JSON.parse SyntaxError", async () => {
    const root = await temporaryRepository(); const task = taskFixture();
    await saveTask(root, task); await setActiveTask(root, task.id);
    const taskJsonPath = join(root, "tasks", task.id, "task.json");
    await writeFile(taskJsonPath, '{"generator":"harnix","schemaVersion":2,"id":"20260807-1200', "utf8"); // truncated mid-string

    await expect(resolveActiveTask(root)).rejects.toThrow(TaskValidationError);
    await expect(resolveActiveTask(root)).rejects.toThrow(taskJsonPath);
    await expect(loadTask(taskJsonPath)).rejects.toThrow(TaskValidationError);
  });

  it("archives only terminal tasks and preserves task data", async () => {
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

  it("rejects unknown fields at every TaskRecord schema boundary", () => {
    const fixture = taskV2Fixture();
    const criterion = fixture.acceptanceCriteria[0]!;
    const check = fixture.validationPlan[0]!;
    const failedEvidence = { id: "failed", checkId: check.id, recordedAt: timestamp, result: "fail" as const, exitCode: 1, summary: "failed", artifactPaths: [] };

    expect(() => validateTask({ ...fixture, unexpected: true })).toThrow(/field|schema/iu);
    expect(() => validateTask({ ...fixture, acceptanceCriteria: [{ ...criterion, unexpected: true }] })).toThrow(/field|schema/iu);
    expect(() => validateTask({ ...fixture, validationPlan: [{ ...check, unexpected: true }] })).toThrow(/field|schema/iu);
    expect(() => validateTask({ ...fixture, evidence: [{ ...failedEvidence, unexpected: true }] })).toThrow(/field|schema/iu);
    expect(() => validateTask({
      ...fixture,
      status: "blocked",
      checkpoint: "planning",
      blocker: { kind: "repository", summary: "blocked", nextAction: "retry", resumeStatus: "planning", unexpected: true },
    })).toThrow(/field|schema/iu);
  });

  it("fails closed when the active pointer references a missing task record", async () => {
    const root = await temporaryRepository();
    const task = taskFixture();
    await saveTask(root, task);
    await setActiveTask(root, task.id);
    await rm(join(root, "tasks", task.id), { recursive: true });

    await expect(resolveActiveTask(root)).rejects.toThrow(/active task pointer|missing task/iu);
    await expect(readFile(join(root, "tasks", ".active"), "utf8")).resolves.toBe(`${task.id}\n`);
  });

  it("cancels any unfinished task with explicit user authority and preserves its evidence", async () => {
    const root = await temporaryRepository();
    const planning = taskFixture();
    planning.evidence.push({ id: "failed-check", recordedAt: timestamp, result: "fail", exitCode: 1, summary: "MongoDB permission denied", artifactPaths: [] });
    const blocked = transitionTask(planning, "blocked", "planning", timestamp, {
      kind: "credential",
      summary: "Missing test credential",
      nextAction: "Provide an isolated test connection",
      resumeStatus: "planning",
    });

    const cancelled = cancelTask(blocked, { reason: "Người dùng chọn dừng task để chuyển ưu tiên.", authorizedBy: "user" }, laterTimestamp);

    expect(cancelled).toMatchObject({
      status: "cancelled",
      checkpoint: "cancelling",
      cancelledAt: laterTimestamp,
      cancellation: { reason: "Người dùng chọn dừng task để chuyển ưu tiên.", authorizedBy: "user" },
      evidence: [{ id: "failed-check", result: "fail" }],
    });
    expect(cancelled.blocker).toBeUndefined();
    expect(() => transitionTask(planning, "cancelled", "cancelling", laterTimestamp)).toThrow(/illegal task transition/iu);
    expect(() => transitionTask(cancelled, "planning", "planning", laterTimestamp)).toThrow(/cancelled|transition/iu);

    await saveTask(root, cancelled);
    await setActiveTask(root, cancelled.id);
    await archiveTask(root, cancelled);
    expect(await resolveActiveTask(root)).toBeUndefined();
  });

  it("rejects cancellation without a concise reason and rejects cancellation of completed tasks", () => {
    const planning = taskFixture();
    expect(() => cancelTask(planning, { reason: "", authorizedBy: "user" }, laterTimestamp)).toThrow(/reason/iu);

    const ready = transitionTask(planning, "ready", "ready", timestamp);
    const inProgress = transitionTask(ready, "in_progress", "implementing", timestamp);
    const verifying = transitionTask(inProgress, "verifying", "verifying", timestamp);
    const completed = transitionTask({
      ...verifying,
      acceptanceCriteria: [{ ...verifying.acceptanceCriteria[0]!, status: "waived", waiverReason: "Explicitly not applicable." }],
    }, "completed", "finishing", timestamp);
    expect(() => cancelTask(completed, { reason: "Too late", authorizedBy: "user" }, laterTimestamp)).toThrow(/completed|terminal/iu);
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

  it("accepts optional findings on EvidenceRecordV2 but rejects them on EvidenceRecordV1", () => {
    const fixtureV2 = taskV2Fixture();
    const withFindings = {
      ...fixtureV2,
      evidence: [{
        id: "e", checkId: "check", recordedAt: timestamp, result: "pass" as const, exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: "a".repeat(64),
        findings: [{ id: "f1", text: "Duplicate key in map iteration", severity: "medium" as const }],
      }],
      acceptanceCriteria: [{ id: "a", text: "x", status: "met" as const, evidenceIds: ["e"] }],
    };
    expect(() => validateTask(withFindings)).not.toThrow();

    const withoutFindings = { ...fixtureV2, evidence: [{ id: "e", checkId: "check", recordedAt: timestamp, result: "pass" as const, exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: "a".repeat(64) }], acceptanceCriteria: [{ id: "a", text: "x", status: "met" as const, evidenceIds: ["e"] }] };
    expect(() => validateTask(withoutFindings)).not.toThrow();

    const v1WithFindings = {
      ...taskFixture(),
      evidence: [{ id: "e", checkId: undefined, recordedAt: timestamp, result: "pass" as const, summary: "ok", artifactPaths: [], findings: [{ id: "f1", text: "x", severity: "low" as const }] }],
    };
    expect(() => validateTask(v1WithFindings)).toThrow(/unknown schema field/iu);
  });

  it("rejects a finding with an invalid id, empty text, or an out-of-enum severity", () => {
    const fixtureV2 = taskV2Fixture();
    const baseEvidence = { id: "e", checkId: "check", recordedAt: timestamp, result: "pass" as const, exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: "a".repeat(64) };
    const withCriterion = { ...fixtureV2, acceptanceCriteria: [{ id: "a", text: "x", status: "met" as const, evidenceIds: ["e"] }] };

    expect(() => validateTask({ ...withCriterion, evidence: [{ ...baseEvidence, findings: [{ id: "bad id", text: "x", severity: "low" }] }] })).toThrow(/finding/iu);
    expect(() => validateTask({ ...withCriterion, evidence: [{ ...baseEvidence, findings: [{ id: "f1", text: "", severity: "low" }] }] })).toThrow(/finding/iu);
    expect(() => validateTask({ ...withCriterion, evidence: [{ ...baseEvidence, findings: [{ id: "f1", text: "x", severity: "catastrophic" }] }] })).toThrow(/finding/iu);
    expect(() => validateTask({ ...withCriterion, evidence: [{ ...baseEvidence, findings: [{ id: "f1", text: "x", severity: "critical" }] }] })).not.toThrow();
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
  it("should_accept_optional_rationale_fields_on_schema_v2_and_reject_them_on_v1", () => {
    const base = {
      generator: "harnix" as const,
      schemaVersion: 2 as const,
      id: "20260916-120000-rationale",
      title: "t",
      mode: "lite" as const,
      status: "planning" as const,
      checkpoint: "planning" as const,
      goal: "g",
      nonGoals: [],
      acceptanceCriteria: [],
      relevantPaths: [],
      relevantSpecs: [],
      validationPlan: [],
      evidence: [],
      createdAt: "2026-09-16T00:00:00.000Z",
      updatedAt: "2026-09-16T00:00:00.000Z",
    };
    const decisions = [{ id: "d1", text: "Skill phân phối bằng command", rationale: "Không tăng footprint và luôn khớp version." }];
    const residualRisks = [{ id: "r1", text: "internal-workflow.ts vẫn lớn", severity: "low" as const }];

    expect(validateTask({ ...base, decisions, residualRisks })).toMatchObject({ decisions, residualRisks });
    expect((validateTask(base) as { decisions?: unknown }).decisions).toBeUndefined();
    expect(() => validateTask({ ...base, schemaVersion: 1, decisions })).toThrow(/unknown schema field/u);
    expect(() => validateTask({ ...base, decisions: [{ id: "bad id", text: "x", rationale: "y" }] })).toThrow();
    expect(() => validateTask({ ...base, decisions: [{ id: "d1", text: "", rationale: "y" }] })).toThrow();
    expect(() => validateTask({ ...base, decisions: [{ id: "d1", text: "x", rationale: "y", extra: 1 }] })).toThrow(/unknown schema field/u);
    expect(() => validateTask({ ...base, residualRisks: [{ id: "r1", text: "x", severity: "catastrophic" }] })).toThrow();
    expect(() => validateTask({ ...base, decisions: [{ id: "d1", text: "x", rationale: "y" }, { id: "d1", text: "z", rationale: "w" }] })).toThrow(/Duplicate/u);
  });

  it("should_generate_a_plain_review_markdown_file_alongside_task_json_for_direct_review", async () => {
    const root = await temporaryRepository();
    const base = {
      generator: "harnix" as const,
      schemaVersion: 2 as const,
      id: "20260916-220000-review-md",
      title: "Chan brute-force o endpoint login",
      mode: "full" as const,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      goal: "Chan brute-force login bang rate limit.",
      nonGoals: ["Khong doi session/token hien tai."],
      acceptanceCriteria: [
        { id: "ac-a", text: "Lan thu thu 6 bi chan.", status: "met" as const, evidenceIds: ["e1"] },
        { id: "ac-b", text: "Reset counter khi thanh cong.", status: "pending" as const, evidenceIds: [] },
      ],
      relevantPaths: ["src/auth/rate-limit.ts"],
      relevantSpecs: [],
      decisions: [{ id: "d1", text: "Dung in-memory counter.", rationale: "Chua co multi-instance deployment." }],
      residualRisks: [{ id: "r1", text: "Khong chia se giua nhieu instance.", severity: "medium" as const }],
      validationPlan: [
        { id: "check", description: "Run tests", command: "pnpm test", scope: "full" as const, required: true, criterionIds: ["ac-a", "ac-b"], inputs: ["@task-contract", "src/**/*.ts"] },
        { id: "release-gate", description: "Run release gate", command: "pnpm test:acceptance", scope: "full" as const, required: true, criterionIds: ["ac-a"], inputs: ["@task-contract", "src/**/*.ts"] },
      ],
      evidence: [{ id: "e1", checkId: "check", recordedAt: timestamp, result: "pass" as const, exitCode: 0, summary: "GREEN", artifactPaths: [], inputDigest: "a".repeat(64) }],
      createdAt: timestamp,
      updatedAt: "2026-09-16T23:50:00.000Z",
    };

    await saveTask(root, base);
    const reviewPath = join(root, "tasks", base.id, "review.md");
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain(base.title);
    expect(review).toContain("in_progress");
    expect(review).toContain(base.goal);
    expect(review).toContain("Khong doi session/token hien tai.");
    expect(review).toContain("ac-a");
    expect(review).toContain("met");
    expect(review).toContain("ac-b");
    expect(review).toContain("pending");
    expect(review).toContain(timestamp);
    expect(review).toContain("2026-09-16T23:50:00.000Z");
    expect(review).toContain("Required checks");
    expect(review).toContain("`check`");
    expect(review).toContain("`release-gate`");
    expect(review).toContain("GREEN");
    expect(review).toMatch(/release-gate[^\n]*chưa chạy|release-gate[^\n]*not yet run/u);
    expect(review).toContain("Dung in-memory counter.");
    expect(review).toContain("Chua co multi-instance deployment.");
    expect(review).toContain("Khong chia se giua nhieu instance.");
    expect(review).toContain("medium");
    expect(review).toContain("GREEN");
    expect(review).not.toContain(root);
    expect(review.startsWith("{")).toBe(false);
  });

  it("should_list_only_the_planning_artifacts_that_actually_exist_on_disk", async () => {
    const root = await temporaryRepository();
    const fullTask = {
      generator: "harnix" as const,
      schemaVersion: 2 as const,
      id: "20260916-234500-review-artifacts-full",
      title: "Full task with prd and plan",
      mode: "full" as const,
      status: "planning" as const,
      checkpoint: "planning" as const,
      goal: "g",
      nonGoals: [],
      acceptanceCriteria: [],
      relevantPaths: [],
      relevantSpecs: [],
      validationPlan: [],
      evidence: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await saveTaskWithArtifacts(root, fullTask, { prd: "# prd", plan: "# plan" });
    const fullReview = await readFile(join(root, "tasks", fullTask.id, "review.md"), "utf8");

    expect(fullReview).toContain("prd.md");
    expect(fullReview).toContain("plan.md");
    expect(fullReview).not.toContain("design.md");

    const liteTask = { ...fullTask, id: "20260916-234500-review-artifacts-lite", mode: "lite" as const, title: "Lite task" };
    await saveTask(root, liteTask);
    const liteReview = await readFile(join(root, "tasks", liteTask.id, "review.md"), "utf8");

    expect(liteReview).not.toContain("prd.md");
    expect(liteReview).not.toContain("plan.md");
    expect(liteReview).not.toContain("## Artifacts");
  });

  it("should_omit_decisions_and_residual_risk_sections_when_absent_and_regenerate_on_every_save", async () => {
    const root = await temporaryRepository();
    const minimal = {
      generator: "harnix" as const,
      schemaVersion: 2 as const,
      id: "20260916-220100-review-md-minimal",
      title: "Minimal task",
      mode: "lite" as const,
      status: "planning" as const,
      checkpoint: "planning" as const,
      goal: "g",
      nonGoals: [],
      acceptanceCriteria: [],
      relevantPaths: [],
      relevantSpecs: [],
      validationPlan: [],
      evidence: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await saveTask(root, minimal);
    const reviewPath = join(root, "tasks", minimal.id, "review.md");
    const first = await readFile(reviewPath, "utf8");

    expect(first).not.toContain("Decisions");
    expect(first).not.toContain("Residual");

    const updated = { ...minimal, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-09-16T22:02:00.000Z" };
    await saveTask(root, updated);
    const second = await readFile(reviewPath, "utf8");

    expect(second).toContain("ready");
    expect(second).not.toBe(first);
  });

  it("should_show_a_verdict_line_right_after_the_header_summarizing_overall_task_state", async () => {
    const root = await temporaryRepository();
    const pending = {
      generator: "harnix" as const,
      schemaVersion: 2 as const,
      id: "20260924-150000-verdict-pending",
      title: "Verdict pending case",
      mode: "lite" as const,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      goal: "g",
      nonGoals: [],
      acceptanceCriteria: [
        { id: "a", text: "x", status: "met" as const, evidenceIds: ["e1"] },
        { id: "b", text: "y", status: "pending" as const, evidenceIds: [] },
      ],
      relevantPaths: [],
      relevantSpecs: [],
      validationPlan: [{ id: "check", description: "d", command: "pnpm test", scope: "full" as const, required: true, criterionIds: ["a", "b"], inputs: ["@task-contract", "src/**/*.ts"] }],
      evidence: [{ id: "e1", checkId: "check", recordedAt: timestamp, result: "pass" as const, exitCode: 0, summary: "s", artifactPaths: [], inputDigest: "a".repeat(64) }],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await saveTask(root, pending);
    const pendingReview = await readFile(join(root, "tasks", pending.id, "review.md"), "utf8");
    const headerEnd = pendingReview.indexOf("## Goal");
    const verdictLine = pendingReview.slice(0, headerEnd);
    expect(verdictLine).toMatch(/Verdict.*PENDING.*1\/2/iu);

    const completed = {
      ...pending,
      id: "20260924-150000-verdict-pass",
      status: "completed" as const,
      checkpoint: "finishing" as const,
      acceptanceCriteria: [
        { id: "a", text: "x", status: "met" as const, evidenceIds: ["e1"] },
        { id: "b", text: "y", status: "met" as const, evidenceIds: ["e1"] },
      ],
      completedAt: laterTimestamp,
      updatedAt: laterTimestamp,
    };
    await saveTask(root, completed);
    const completedReview = await readFile(join(root, "tasks", completed.id, "review.md"), "utf8");
    expect(completedReview.slice(0, completedReview.indexOf("## Goal"))).toMatch(/Verdict.*PASS/iu);

    const blocked = {
      ...pending,
      id: "20260924-150000-verdict-blocked",
      status: "blocked" as const,
      checkpoint: "implementing" as const,
      blocker: { kind: "external" as const, summary: "waiting on vendor", nextAction: "poll vendor", resumeStatus: "in_progress" as const },
    };
    await saveTask(root, blocked);
    const blockedReview = await readFile(join(root, "tasks", blocked.id, "review.md"), "utf8");
    expect(blockedReview.slice(0, blockedReview.indexOf("## Goal"))).toMatch(/Verdict.*BLOCKED.*external/iu);

    const cancelled = {
      ...pending,
      id: "20260924-150000-verdict-cancelled",
      status: "cancelled" as const,
      checkpoint: "cancelling" as const,
      cancellation: { reason: "no longer needed", authorizedBy: "user" as const },
      cancelledAt: laterTimestamp,
      updatedAt: laterTimestamp,
    };
    await saveTask(root, cancelled);
    const cancelledReview = await readFile(join(root, "tasks", cancelled.id, "review.md"), "utf8");
    expect(cancelledReview.slice(0, cancelledReview.indexOf("## Goal"))).toMatch(/Verdict.*CANCELLED/iu);
  });

  it("should_collapse_repeated_evidence_for_the_same_check_to_its_latest_entry_without_dropping_task_json_history", async () => {
    const root = await temporaryRepository();
    const task = {
      generator: "harnix" as const,
      schemaVersion: 2 as const,
      id: "20260924-150100-evidence-dedupe",
      title: "Evidence dedupe case",
      mode: "lite" as const,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      goal: "g",
      nonGoals: [],
      acceptanceCriteria: [{ id: "a", text: "x", status: "pending" as const, evidenceIds: [] }],
      relevantPaths: [],
      relevantSpecs: [],
      validationPlan: [{ id: "check", description: "d", command: "pnpm test", scope: "full" as const, required: true, criterionIds: ["a"], inputs: ["@task-contract", "src/**/*.ts"] }],
      evidence: [
        { id: "e1", checkId: "check", recordedAt: "2026-09-24T00:00:00.000Z", result: "fail" as const, exitCode: 1, summary: "RED-1", artifactPaths: [] },
        { id: "e2", checkId: "check", recordedAt: "2026-09-24T00:01:00.000Z", result: "fail" as const, exitCode: 1, summary: "RED-2", artifactPaths: [] },
        { id: "e3", checkId: "check", recordedAt: "2026-09-24T00:02:00.000Z", result: "pass" as const, exitCode: 0, summary: "GREEN", artifactPaths: [], inputDigest: "a".repeat(64) },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await saveTask(root, task);
    const reviewPath = join(root, "tasks", task.id, "review.md");
    const review = await readFile(reviewPath, "utf8");
    const evidenceSection = review.slice(review.indexOf("## Evidence"));

    expect(evidenceSection).toContain("GREEN");
    expect(evidenceSection).not.toContain("RED-1");
    expect(evidenceSection).not.toContain("RED-2");
    expect(evidenceSection).toMatch(/2 (earlier|previous).*(rerun|attempt)/iu);

    const persisted = JSON.parse(await readFile(join(root, "tasks", task.id, "task.json"), "utf8")) as { evidence: unknown[] };
    expect(persisted.evidence).toHaveLength(3);
  });

});

const timestamp = "2026-08-13T00:00:00.000Z";
const laterTimestamp = "2026-08-13T00:01:00.000Z";

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

it("accepts epicId on TaskRecordV2, rejects on V1, accepts V2 without epicId", () => {
  expect(() => validateTask({ schemaVersion: 2, epicId: "my-epic" })).toThrow(/required|task/iu);

  const v1WithEpicId = { ...taskFixture(), epicId: "my-epic" };
  expect(() => validateTask(v1WithEpicId)).toThrow(/unknown|field/iu);

  const v1NoEpicId = taskFixture();
  expect(() => validateTask(v1NoEpicId)).not.toThrow();
});
