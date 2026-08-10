import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ownershipState, obsoleteState, reconcileManagedFiles, validateManifest, writeManifest } from "../../src/utils/managed-files.js";
import type { AtomicFileSystem } from "../../src/utils/atomic-write.js";
import { sha256 } from "../../src/utils/hashing.js";
import { buildContext, loadContextManifest, rankContext, saveContextManifest } from "../../src/core/context/context.js";
import { createLearningCandidate, isPromotionEligible } from "../../src/core/journal/learning.js";
import { promotionProposal } from "../../src/core/journal/promotion.js";
import { appendJournal, searchJournal, type JournalEntry } from "../../src/core/journal/journal.js";
import { archiveTask, clearActiveTask, resolveActiveTask, saveTask, saveTaskWithArtifacts, setActiveTask, transitionTask, validateTask, type TaskRecord } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

const entry = { path: "README.md", sourceId: "readme", scope: "project" as const, generatedHash: sha256("hello\n"), generatorVersion: "0.1.0" };
describe("phase 2 core", () => {
  it("validates sorted manifest and tracks ownership", async () => {
    const root = await temporaryRepository(); await writeFile(join(root, "README.md"), "hello\r\n");
    expect(validateManifest({ generator: "harnix", schemaVersion: 1, entries: [entry] }).entries).toHaveLength(1);
    expect(await ownershipState(root, entry)).toBe("modified");
    expect(await ownershipState(root, entry, entry)).toBe("unchanged");
    expect(await obsoleteState(root, entry)).toBe("obsolete-unchanged");
  });
  it("rejects corrupt and future managed manifests", () => {
    expect(() => validateManifest({ generator: "harnix", schemaVersion: 2, entries: [] })).toThrow("unsupported");
    expect(() => validateManifest({ generator: "harnix", schemaVersion: 1, entries: [{ ...entry, generatedHash: "bad" }] })).toThrow("entry");
  });
  it("keeps the previous manifest when atomic replacement fails", async () => {
    const root = await temporaryRepository(); const path = join(root, "manifest.json"); await writeFile(path, "old");
    const filesystem: AtomicFileSystem = { mkdir: async () => undefined, writeFile: async () => undefined, rename: async () => { throw new Error("fail"); }, rm: async () => undefined };
    await expect(writeManifest(path, { generator: "harnix", schemaVersion: 1, entries: [] }, { filesystem, randomSuffix: () => "fixed" })).rejects.toThrow("fail");
    expect(await readFile(path, "utf8")).toBe("old");
  });
  it("reconciles managed files while preserving user modifications", async () => {
    const root = await temporaryRepository(); await writeFile(join(root, "README.md"), "user\n");
    const old = validateManifest({ generator: "harnix", schemaVersion: 1, entries: [entry] });
    const result = await reconcileManagedFiles(root, old, [{ entry, content: "hello\n" }], { generatorVersion: "0.1.0" });
    expect(result.result.preserved).toEqual(["README.md"]); expect(await readFile(join(root, "README.md"), "utf8")).toBe("user\n");
  });
  it("ranks pins and additive signals with deterministic ties", () => {
    const ranked = rankContext([{ path: "b", reason: "", priority: 0, pinned: false, states: [] }, { path: "a", reason: "", priority: 0, pinned: true, states: [] }], { references: ["b"] });
    expect(ranked.map((item) => item.path)).toEqual(["a", "b"]);
  });
  it("applies every context ranking signal additively", () => {
    const entries = [
      { path: "guide.md", reason: "", priority: 0, pinned: false, states: [] },
      { path: "language.md", reason: "", priority: 0, pinned: false, states: [] },
      { path: "active.md", reason: "", priority: 0, pinned: false, states: [] },
      { path: "reference.md", reason: "", priority: 0, pinned: false, states: [] },
      { path: "pinned.md", reason: "", priority: 0, pinned: true, states: [] },
    ];
    const ranked = rankContext(entries, { references: ["reference.md"], activePaths: ["active.md"], languages: ["language.md"], guides: ["guide.md"] });
    expect(ranked.map((item) => item.path)).toEqual(["pinned.md", "reference.md", "active.md", "language.md", "guide.md"]);
  });
  it("budgets context and discloses omitted sources", async () => {
    const root = await temporaryRepository(); await writeFile(join(root, "a.md"), "a".repeat(20)); await writeFile(join(root, "b.md"), "b".repeat(20));
    const result = await buildContext(root, ["a.md", "b.md"].map((path) => ({ path, reason: "", priority: 0, pinned: false, states: [] })), 40);
    expect(result.manifest.omitted).toHaveLength(1); expect(result.text.length).toBeLessThanOrEqual(40);
  });
  it("persists and reloads a validated context manifest", async () => {
    const root = await temporaryRepository(); const task = { generator: "harnix" as const, schemaVersion: 1 as const, taskId: "x", maxCharacters: 10, entries: [], omitted: [] };
    await saveContextManifest(root, task); expect(await loadContextManifest(join(root, "context.json"))).toEqual(task);
  });
  it("full context bypasses budget while retaining source disclosure", async () => {
    const root = await temporaryRepository(); await writeFile(join(root, "a.md"), "a".repeat(100));
    const result = await buildContext(root, [{ path: "a.md", reason: "pinned", priority: 1, pinned: true, states: ["planning"] }], 10, {}, true);
    expect(result.text.length).toBeGreaterThan(10); expect(result.manifest.entries.map((item) => item.path)).toEqual(["a.md"]);
  });
  it("should_deduplicate_normalized_paths_and_content_when_building_context", async () => {
    const root = await temporaryRepository(); await writeFile(join(root, "a.md"), "same"); await writeFile(join(root, "b.md"), "same");
    const result = await buildContext(root, [
      { path: "a.md", reason: "first", priority: 2, pinned: false, states: [] },
      { path: "./a.md", reason: "duplicate path", priority: 1, pinned: false, states: [] },
      { path: "b.md", reason: "duplicate content", priority: 0, pinned: false, states: [] },
    ], 1000, { taskId: "task" });
    expect(result.manifest.taskId).toBe("task");
    expect(result.manifest.entries.map((item) => item.path)).toEqual(["a.md"]);
    expect(result.manifest.omitted).toEqual([{ path: "a.md", reason: "duplicate" }, { path: "b.md", reason: "duplicate" }]);
    await saveContextManifest(root, result.manifest);
  });
  it("should_omit_unsafe_context_paths_without_aborting_valid_context", async () => {
    const root = await temporaryRepository(); await writeFile(join(root, "safe.md"), "safe");

    const result = await buildContext(root, [
      { path: "../secret.md", reason: "unsafe", priority: 10, pinned: false, states: [] },
      { path: "safe.md", reason: "valid", priority: 1, pinned: false, states: [] },
    ], 1000);

    expect(result.text).toContain("safe");
    expect(result.manifest.omitted).toContainEqual({ path: "../secret.md", reason: "unsafe" });
  });
  it("applies task transitions and learning threshold", async () => {
    const task = validateTask({ generator: "harnix", schemaVersion: 1, id: "20260807-120000-x", title: "x", mode: "lite", status: "planning", checkpoint: "planning", goal: "x", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "x", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: "x", updatedAt: "x" } as TaskRecord);
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
  it("archives only completed tasks and preserves task data", async () => {
    const root = await temporaryRepository(); const task = taskFixture();
    const evidence = { id: "e", recordedAt: "x", result: "pass" as const, summary: "ok", artifactPaths: [] };
    const completed = transitionTask({ ...task, evidence: [evidence], acceptanceCriteria: [{ ...task.acceptanceCriteria[0]!, status: "met", evidenceIds: ["e"] }] }, "ready", "ready");
    const inProgress = transitionTask(completed, "in_progress", "implementing"); const verifying = transitionTask(inProgress, "verifying", "verifying"); const done = transitionTask(verifying, "completed", "finishing");
    await saveTask(root, done); await setActiveTask(root, done.id); await archiveTask(root, done); expect(await resolveActiveTask(root)).toBeUndefined(); expect((await readFile(join(root, "tasks", done.id, "task.json"), "utf8"))).toContain(done.id);
  });
  it("requires blocked tasks to resume to the recorded status", () => {
    const task = taskFixture(); const blocked = { ...task, status: "blocked" as const, blocker: { kind: "repository" as const, summary: "x", nextAction: "x", resumeStatus: "in_progress" as const } };
    expect(() => transitionTask(blocked, "ready", "ready")).toThrow("recorded status");
    expect(transitionTask(blocked, "in_progress", "implementing").status).toBe("in_progress");
  });
  it("rejects future schema and malformed task records", () => {
    expect(() => validateTask({ ...taskFixture(), schemaVersion: 2 })).toThrow("unsupported");
    expect(() => validateTask({ ...taskFixture(), checkpoint: "unknown" })).toThrow("invalid");
  });
  it("rejects malformed evidence and acceptance criteria", () => {
    expect(() => validateTask({ ...taskFixture(), evidence: [{ id: "e" }] })).toThrow("Evidence");
    expect(() => validateTask({ ...taskFixture(), acceptanceCriteria: [{ id: "a", text: "x", status: "bad", evidenceIds: [] }] })).toThrow("Acceptance");
  });
  it("searches journal newest-first and skips malformed lines", async () => {
    const root = await temporaryRepository(); const path = join(root, "j.jsonl"); await writeFile(path, `${JSON.stringify({ generator: "harnix", schemaVersion: 1, id: "1", recordedAt: "1", developer: "d", kind: "note", summary: "old", evidenceIds: [] })}\nbad\n${JSON.stringify({ generator: "harnix", schemaVersion: 1, id: "2", recordedAt: "2", developer: "d", kind: "note", summary: "new", evidenceIds: [] })}\n`);
    const result = await searchJournal(path, { developer: "d" }); expect(result.entries[0]?.summary).toBe("new"); expect(result.malformed).toBe(1);
  });
  it("should_preserve_every_entry_when_appends_are_concurrent_and_limit_search_memory", async () => {
    const root = await temporaryRepository(); const path = join(root, "journal.jsonl");
    const entries: JournalEntry[] = Array.from({ length: 40 }, (_, index) => ({ generator: "harnix", schemaVersion: 1, id: String(index).padStart(2, "0"), recordedAt: new Date(Date.UTC(2026, 7, 10, 0, 0, index)).toISOString(), developer: "tam", kind: "note", summary: `entry ${index}`, evidenceIds: [] }));

    await Promise.all(entries.map((journalEntry) => appendJournal(path, journalEntry)));
    const all = await searchJournal(path, { developer: "tam" });
    const limited = await searchJournal(path, { developer: "tam", limit: 5 });

    expect(all.entries).toHaveLength(40);
    expect(new Set(all.entries.map((journalEntry) => journalEntry.id)).size).toBe(40);
    expect(limited.entries.map((journalEntry) => journalEntry.id)).toEqual(["39", "38", "37", "36", "35"]);
  });
});
function taskFixture(): TaskRecord { return { generator: "harnix", schemaVersion: 1, id: "20260807-120000-x", title: "x", mode: "lite", status: "planning", checkpoint: "planning", goal: "x", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "x", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [], validationPlan: [], evidence: [], createdAt: "x", updatedAt: "x" }; }
