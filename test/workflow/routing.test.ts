import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canCompleteTask, continueWorkflowTask, evidenceSupportsScope, finishWorkflowTask, implementationStrategy, isWithinRequestedScope, nextWorkflowStatus, routeWorkflow, shouldReassessArchitecture, shouldResearch, validateFullReadyArtifact, verificationStages } from "../../src/core/workflow.js";
import { appendJournal } from "../../src/core/journal/journal.js";
import { loadTask, resolveActiveTask, saveTask, setActiveTask, transitionTask } from "../../src/core/tasks/task.js";
import { createResearchFinding } from "../../src/core/research.js";
import type { TaskRecord, TaskRecordV2 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

function task(evidenceAt: string, scope: "focused" | "full" = "full"): TaskRecord { return { generator: "harnix", schemaVersion: 1, id: "20260807-120000-task", title: "t", mode: "lite", status: "verifying", checkpoint: "finishing", goal: "t", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "done", status: "met", evidenceIds: ["e"] }], relevantPaths: [], relevantSpecs: [], validationPlan: [{ id: "check", description: "verify", scope, required: true }], evidence: [{ id: "e", checkId: "check", recordedAt: evidenceAt, result: "pass", summary: "ok", artifactPaths: [] }], createdAt: "2026-08-07T00:00:00.000Z", updatedAt: "2026-08-07T00:00:00.000Z" }; }
describe("workflow routing and completion evidence", () => {
  it("routes action, work kind, risk, and active state deterministically", () => {
    expect(routeWorkflow({ action: "review", workKind: "refactor", mutation: "none", riskSignals: [] })).toMatchObject({ entry: "bypass", owner: "harnix-check", reasonCodes: ["standalone-review"] });
    expect(routeWorkflow({ action: "change", workKind: "feature", mutation: "project", riskSignals: [] })).toMatchObject({ entry: "create", mode: "lite", owner: "harnix-brainstorm", reasonCodes: ["low-risk-lite"] });
    expect(routeWorkflow({ action: "change", workKind: "hotfix", mutation: "project", riskSignals: ["security-sensitive"] })).toMatchObject({ entry: "create", mode: "full", reasonCodes: ["risk-full"] });
    expect(routeWorkflow({ action: "change", workKind: "bugfix", mutation: "project", riskSignals: [], activeTask: { mode: "lite", status: "ready", checkpoint: "ready" } })).toMatchObject({ entry: "resume", owner: "harnix-implement", reasonCodes: ["active-ready-authorized"] });
    expect(routeWorkflow({ action: "plan", workKind: "refactor", mutation: "task-artifact", riskSignals: [], activeTask: { mode: "full", status: "ready", checkpoint: "ready" } })).toMatchObject({ entry: "resume", owner: "harnix-brainstorm", reasonCodes: ["active-replan"] });
    expect(routeWorkflow({ action: "change", workKind: "refactor", mutation: "project", riskSignals: [], activeTask: { mode: "full", status: "completed", checkpoint: "finishing" } })).toMatchObject({ entry: "resume", owner: "harnix-continue", reasonCodes: ["completed-active"] });
    expect(routeWorkflow({ action: "change", workKind: "feature", mutation: "project", riskSignals: [], activeTask: { mode: "lite", status: "blocked", checkpoint: "implementing", blocker: { kind: "decision", summary: "need decision", nextAction: "decide", resumeStatus: "ready" } } })).toMatchObject({ entry: "fail-closed", reasonCodes: ["invalid-active-state"] });
    expect(routeWorkflow({ action: "change", workKind: "feature", mutation: "project", riskSignals: [], activeTask: { mode: "full", status: "blocked", checkpoint: "replan", blocker: { kind: "decision", summary: "need decision", nextAction: "decide", resumeStatus: "verifying" } } })).toMatchObject({ entry: "resume", owner: "harnix-continue", reasonCodes: ["active-stage"] });
  });
  it("keeps explicit mode precedence while diagnosing forced Lite risk conflicts", () => {
    expect(routeWorkflow({ action: "change", workKind: "security", mutation: "project", explicitMode: "lite", riskSignals: ["security-sensitive"] })).toMatchObject({ mode: "lite", reasonCodes: ["explicit-lite", "explicit-lite-risk-conflict"] });
    expect(routeWorkflow({ action: "change", workKind: "feature", mutation: "project", explicitMode: "lite", riskSignals: ["contract-change"] })).toMatchObject({ mode: "lite", reasonCodes: ["explicit-lite", "explicit-lite-risk-conflict"] });
    expect(routeWorkflow({ action: "change", workKind: "feature", mutation: "project", explicitMode: "lite", riskSignals: [] })).toMatchObject({ mode: "lite", reasonCodes: ["explicit-lite"] });
    expect(routeWorkflow({ action: "change", workKind: "feature", mutation: "project", explicitMode: "full", riskSignals: [] })).toMatchObject({ mode: "full", reasonCodes: ["explicit-full"] });
  });
  it("requires fresh required evidence for completion", () => {
    const now = Date.parse("2026-08-07T10:00:00Z"); expect(canCompleteTask(task("2026-08-07T09:30:00Z"), now)).toBe(true); expect(canCompleteTask(task("2026-08-07T06:00:00Z"), now)).toBe(false);
  });
  it("requires TaskRecord v2 criterion evidence to intersect its declared check", () => {
    const now = Date.parse("2026-08-07T10:00:00Z");
    const digest = "a".repeat(64);
    const candidate: TaskRecordV2 = {
      ...task("2026-08-07T09:30:00Z"),
      schemaVersion: 2 as const,
      acceptanceCriteria: [
        { id: "a", text: "done", status: "met" as const, evidenceIds: ["e2"] },
        { id: "b", text: "waived", status: "waived" as const, evidenceIds: [], waiverReason: "not required" },
      ],
      validationPlan: [
        { id: "check-a", description: "Run unit tests", scope: "full" as const, required: true, criterionIds: ["a"], inputs: ["@task-contract", "src/**/*.ts"] },
        { id: "check-b", description: "Review documentation", scope: "full" as const, required: true, criterionIds: ["b"], inputs: ["@task-contract"] },
      ],
      evidence: [
        { id: "e1", checkId: "check-a", recordedAt: "2026-08-07T09:30:00Z", result: "pass" as const, summary: "ok", artifactPaths: [], inputDigest: digest },
        { id: "e2", checkId: "check-b", recordedAt: "2026-08-07T09:31:00Z", result: "pass" as const, summary: "ok", artifactPaths: [], inputDigest: digest },
      ],
    };
    expect(canCompleteTask(candidate, now)).toBe(false);
    expect(canCompleteTask({ ...candidate, acceptanceCriteria: [{ ...candidate.acceptanceCriteria[0]!, evidenceIds: ["e1"] }, candidate.acceptanceCriteria[1]!] }, now)).toBe(true);
    const undigestedEvidence = candidate.evidence.map((evidence) => {
      if (evidence.id !== "e1") return evidence;
      const withoutDigest = { ...evidence };
      delete withoutDigest.inputDigest;
      return withoutDigest;
    });
    expect(canCompleteTask({ ...candidate, acceptanceCriteria: [{ ...candidate.acceptanceCriteria[0]!, evidenceIds: ["e1"] }, candidate.acceptanceCriteria[1]!], evidence: undigestedEvidence }, now)).toBe(false);
  });
  it("does not treat empty completion obligations as complete", () => {
    expect(canCompleteTask({ ...task("2026-08-07T09:30:00Z"), acceptanceCriteria: [], validationPlan: [], evidence: [] }, Date.parse("2026-08-07T10:00:00Z"))).toBe(false);
  });
  it("researches only material unknowns and reassesses after three failed hypotheses", () => {
    expect(shouldResearch(false)).toBe(false); expect(shouldResearch(true)).toBe(true); expect(shouldReassessArchitecture(2)).toBe(false); expect(shouldReassessArchitecture(3)).toBe(true);
  });
  it("uses TDD for behavior and records exceptions for non-behavior work", () => {
    expect(implementationStrategy("behavior")).toBe("red-green-refactor"); expect(() => implementationStrategy("docs")).toThrow("exception"); expect(implementationStrategy("docs", "copy edit", "spellcheck")).toBe("documented-exception");
  });
  it("does not let focused evidence prove a full verification claim", () => {
    const evidence = task("2026-08-07T09:30:00Z").evidence[0]!; expect(evidenceSupportsScope(evidence, "focused", "focused")).toBe(true); expect(evidenceSupportsScope(evidence, "full", "focused")).toBe(false); expect(evidenceSupportsScope(evidence, "full", "full")).toBe(true);
  });
  it("holds plan-only work at ready and requires complete Full planning artifacts", () => {
    expect(nextWorkflowStatus("plan", true)).toBe("ready"); expect(nextWorkflowStatus("implement", true)).toBe("in_progress"); expect(nextWorkflowStatus("fix", false)).toBe("planning"); expect(validateFullReadyArtifact({ acceptanceCriteria: ["a"], materialUnknownDecision: "not needed", plan: "step" })).toBe(true); expect(validateFullReadyArtifact({ acceptanceCriteria: [], materialUnknownDecision: "x", plan: "x" })).toBe(false);
  });
  it("finishes only verified tasks and journals evidence without Git work", async () => {
    const root = await temporaryRepository(); const current = new Date().toISOString(); const ready = task(current);
    await saveTask(root, ready); await setActiveTask(root, ready.id); const finished = await finishWorkflowTask(root, join(root, "journal.jsonl"), "tam", ready, current, {
      searchJournal: async () => { throw new Error("normal completion must not scan the journal"); },
    });
    expect(finished.status).toBe("completed"); expect(await readFile(join(root, "journal.jsonl"), "utf8")).toContain("Completed: t");
    expect((await loadTask(join(root, "tasks", ready.id, "task.json"))).status).toBe("completed");
    expect(await resolveActiveTask(root)).toBeUndefined();
  });
  it("requires the explicit finishing checkpoint before completion persistence", async () => {
    const root = await temporaryRepository(); const current = new Date().toISOString(); const verifying = { ...task(current), checkpoint: "verifying" as const };
    await saveTask(root, verifying); await setActiveTask(root, verifying.id);
    await expect(finishWorkflowTask(root, join(root, "journal.jsonl"), "tam", verifying, current)).rejects.toThrow("finishing checkpoint");
  });
  it("should_persist_completion_and_retain_active_pointer_when_archiving_fails", async () => {
    const root = await temporaryRepository(); const current = new Date().toISOString(); const verifying = task(current); const calls: string[] = [];
    await saveTask(root, verifying); await setActiveTask(root, verifying.id);

    await expect(finishWorkflowTask(root, join(root, "journal.jsonl"), "tam", verifying, current, {
      saveTask: async (...args) => { calls.push("save"); await saveTask(...args); },
      appendJournal: async (...args) => { calls.push("journal"); await appendJournal(...args); },
      archiveTask: async () => { calls.push("archive"); throw new Error("active pointer write failed"); },
    })).rejects.toThrow("active pointer write failed");

    expect(calls).toEqual(["save", "journal", "archive"]);
    expect((await loadTask(join(root, "tasks", verifying.id, "task.json"))).status).toBe("completed");
    expect((await resolveActiveTask(root))?.id).toBe(verifying.id);

    const completed = await loadTask(join(root, "tasks", verifying.id, "task.json"));
    await finishWorkflowTask(root, join(root, "journal.jsonl"), "tam", completed, current);

    expect(await resolveActiveTask(root)).toBeUndefined();
    const journalEntries = (await readFile(join(root, "journal.jsonl"), "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { id: string });
    expect(journalEntries.filter((entry) => entry.id === `${verifying.id}-completion`)).toHaveLength(1);
  });
  it("should_retain_verifying_task_and_active_pointer_when_completion_persistence_fails", async () => {
    const root = await temporaryRepository(); const current = new Date().toISOString(); const verifying = task(current); const calls: string[] = [];
    await saveTask(root, verifying); await setActiveTask(root, verifying.id);

    await expect(finishWorkflowTask(root, join(root, "journal.jsonl"), "tam", verifying, current, {
      saveTask: async () => { calls.push("save"); throw new Error("task persistence failed"); },
      appendJournal: async () => { calls.push("journal"); },
      archiveTask: async () => { calls.push("archive"); },
    })).rejects.toThrow("task persistence failed");

    expect(calls).toEqual(["save"]);
    expect((await loadTask(join(root, "tasks", verifying.id, "task.json"))).status).toBe("verifying");
    expect((await resolveActiveTask(root))?.id).toBe(verifying.id);
  });
  it("should_retain_active_pointer_when_completion_journal_write_fails", async () => {
    const root = await temporaryRepository(); const current = new Date().toISOString(); const verifying = task(current); const calls: string[] = [];
    await saveTask(root, verifying); await setActiveTask(root, verifying.id);

    await expect(finishWorkflowTask(root, join(root, "journal.jsonl"), "tam", verifying, current, {
      saveTask: async (...args) => { calls.push("save"); await saveTask(...args); },
      appendJournal: async () => { calls.push("journal"); throw new Error("journal write failed"); },
      archiveTask: async () => { calls.push("archive"); },
    })).rejects.toThrow("journal write failed");

    expect(calls).toEqual(["save", "journal"]);
    expect((await loadTask(join(root, "tasks", verifying.id, "task.json"))).status).toBe("completed");
    expect((await resolveActiveTask(root))?.id).toBe(verifying.id);
  });
  it("should_reject_completion_when_latest_required_evidence_failed", () => {
    const current = task("2026-08-07T09:30:00Z");
    current.evidence.push({ id: "e-fail", checkId: "check", recordedAt: "2026-08-07T09:45:00Z", result: "fail", exitCode: 1, summary: "failed", artifactPaths: [] });
    expect(canCompleteTask(current, Date.parse("2026-08-07T10:00:00Z"))).toBe(false);
  });
  it("journals only criterion-supporting and latest required passing evidence", async () => {
    const root = await temporaryRepository(); const current = new Date().toISOString(); const ready = task(current);
    ready.evidence.push({ id: "old-failure", checkId: "check", recordedAt: new Date(Date.parse(current) - 60_000).toISOString(), result: "fail", exitCode: 1, summary: "old failure", artifactPaths: [] });
    await saveTask(root, ready); await setActiveTask(root, ready.id);
    await finishWorkflowTask(root, join(root, "journal.jsonl"), "tam", ready, current);

    const journal = await readFile(join(root, "journal.jsonl"), "utf8");
    expect(journal).toContain('"e"');
    expect(journal).not.toContain("old-failure");
  });
  it("should_clear_blocker_when_blocked_task_resumes", () => {
    const current = { ...task("2026-08-07T09:30:00Z"), status: "blocked" as const, blocker: { kind: "repository" as const, summary: "locked", nextAction: "retry", resumeStatus: "verifying" as const } };
    expect(transitionTask(current, "verifying", "verifying").blocker).toBeUndefined();
  });
  it("records research provenance only for material unknowns", () => {
    const finding = createResearchFinding({ taskId: "t", topic: "compatibility", source: "official docs", researchedAt: "2026-08-07", conclusion: "supported", remainingUncertainty: "Platform smoke is still required.", materialUnknown: true });
    expect(finding).toContain("Source: official docs");
    expect(finding).toContain("## Remaining uncertainty\n\nPlatform smoke is still required.");
    expect(() => createResearchFinding({ taskId: "t", topic: "known", source: "local", researchedAt: "2026-08-07", conclusion: "x", remainingUncertainty: "none", materialUnknown: false })).toThrow("material unknown");
    expect(() => createResearchFinding({ taskId: "t", topic: "compatibility", source: "official docs", researchedAt: "2026-08-07", conclusion: "supported", remainingUncertainty: "", materialUnknown: true })).toThrow("provenance");
  });
  it("continues from persisted active state with minimum deduplicated context", async () => {
    const root = await temporaryRepository(); const active = { ...task(new Date().toISOString()), relevantPaths: ["b", "a"], relevantSpecs: ["a", "spec"] };
    await saveTask(root, active); await setActiveTask(root, active.id);
    expect(await continueWorkflowTask(root)).toMatchObject({ contextPaths: ["a", "b", "spec"], contextDrift: { state: "not-recorded", changes: [] } });
  });
  it("runs compliance before quality/security and rejects scope creep", () => {
    expect(verificationStages()).toEqual(["compliance", "quality-security"]); expect(isWithinRequestedScope(["workflow"], ["workflow"])).toBe(true); expect(isWithinRequestedScope(["workflow"], ["workflow", "new-framework"])).toBe(false);
  });
});
