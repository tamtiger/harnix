import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canCompleteTask, continueWorkflowTask, evidenceSupportsScope, finishWorkflowTask, implementationStrategy, isWithinRequestedScope, nextWorkflowStatus, routeWorkflow, shouldReassessArchitecture, shouldResearch, validateFullReadyArtifact, verificationStages } from "../../src/core/workflow.js";
import { appendJournal } from "../../src/core/journal/journal.js";
import { loadTask, resolveActiveTask, saveTask, setActiveTask, transitionTask } from "../../src/core/tasks/task.js";
import { createResearchFinding } from "../../src/core/research.js";
import type { TaskRecord } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

function task(evidenceAt: string, scope: "focused" | "full" = "full"): TaskRecord { return { generator: "harnix", schemaVersion: 1, id: "20260807-120000-task", title: "t", mode: "lite", status: "verifying", checkpoint: "verifying", goal: "t", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "done", status: "met", evidenceIds: ["e"] }], relevantPaths: [], relevantSpecs: [], validationPlan: [{ id: "check", description: "verify", scope, required: true }], evidence: [{ id: "e", checkId: "check", recordedAt: evidenceAt, result: "pass", summary: "ok", artifactPaths: [] }], createdAt: "x", updatedAt: "x" }; }
describe("workflow routing and completion evidence", () => {
  it("routes bypass, forced, and material requests deterministically", () => {
    expect(routeWorkflow({ intent: "question" })).toBe("bypass"); expect(routeWorkflow({ intent: "docs" })).toBe("lite"); expect(routeWorkflow({ intent: "fix", forceMode: "full" })).toBe("full"); expect(routeWorkflow({ intent: "fix", materialUnknown: true })).toBe("full");
  });
  it("requires fresh required evidence for completion", () => {
    const now = Date.parse("2026-08-07T10:00:00Z"); expect(canCompleteTask(task("2026-08-07T09:30:00Z"), now)).toBe(true); expect(canCompleteTask(task("2026-08-07T06:00:00Z"), now)).toBe(false);
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
    await saveTask(root, ready); await setActiveTask(root, ready.id); const finished = await finishWorkflowTask(root, join(root, "journal.jsonl"), "tam", ready, current);
    expect(finished.status).toBe("completed"); expect(await readFile(join(root, "journal.jsonl"), "utf8")).toContain("Completed: t");
    expect((await loadTask(join(root, "tasks", ready.id, "task.json"))).status).toBe("completed");
    expect(await resolveActiveTask(root)).toBeUndefined();
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
  it("should_clear_blocker_when_blocked_task_resumes", () => {
    const current = { ...task("2026-08-07T09:30:00Z"), status: "blocked" as const, blocker: { kind: "repository" as const, summary: "locked", nextAction: "retry", resumeStatus: "verifying" as const } };
    expect(transitionTask(current, "verifying", "verifying").blocker).toBeUndefined();
  });
  it("records research provenance only for material unknowns", () => {
    expect(createResearchFinding({ taskId: "t", topic: "compatibility", source: "official docs", researchedAt: "2026-08-07", conclusion: "supported", materialUnknown: true })).toContain("Source: official docs"); expect(() => createResearchFinding({ taskId: "t", topic: "known", source: "local", researchedAt: "2026-08-07", conclusion: "x", materialUnknown: false })).toThrow("material unknown");
  });
  it("continues from persisted active state with minimum deduplicated context", async () => {
    const root = await temporaryRepository(); const active = { ...task(new Date().toISOString()), relevantPaths: ["b", "a"], relevantSpecs: ["a", "spec"] };
    await saveTask(root, active); await setActiveTask(root, active.id); expect((await continueWorkflowTask(root))?.contextPaths).toEqual(["a", "b", "spec"]);
  });
  it("runs compliance before quality/security and rejects scope creep", () => {
    expect(verificationStages()).toEqual(["compliance", "quality-security"]); expect(isWithinRequestedScope(["workflow"], ["workflow"])).toBe(true); expect(isWithinRequestedScope(["workflow"], ["workflow", "new-framework"])).toBe(false);
  });
});
