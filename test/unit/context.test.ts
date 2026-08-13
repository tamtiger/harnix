import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildContext, loadContextManifest, rankContext, saveContextManifest } from "../../src/core/context/context.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("context", () => {
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
    const ranked = rankContext(entries, { references: ["reference.md"], activePaths: ["active.md"], languages: ["language.md"], technologies: ["language.md"], guides: ["guide.md"] });
    expect(ranked.map((item) => item.path)).toEqual(["pinned.md", "reference.md", "active.md", "language.md", "guide.md"]);
    expect(ranked.find(({ path }) => path === "language.md")?.priority).toBe(100);
  });

  it("applies one bounded stack bonus when either or both profile facets match", () => {
    const entries = [{ path: "stack.md", reason: "", priority: 0, pinned: false, states: [] }];
    expect(rankContext(entries, { languages: ["stack.md"] })[0]?.priority).toBe(100);
    expect(rankContext(entries, { technologies: ["stack.md"] })[0]?.priority).toBe(100);
    expect(rankContext(entries, { languages: ["stack.md"], technologies: ["stack.md"] })[0]?.priority).toBe(100);
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
});
