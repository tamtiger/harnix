import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createConfig } from "src/core/config/config.js";
import { buildEffectiveContext } from "src/core/context/effective-context.js";
import type { TaskRecordV2 } from "src/core/tasks/task.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { buildCriterion, buildTaskV2 } from "test/support/builders.js";
import { buildCommandlessCheck } from "test/support/tasks-fixtures.js";

const temporaryRepository = useTemporaryRepositories("harnix-effective-context-");

describe("effective context", () => {
  it("uses platform hook caps and derives trusted reason codes for fallback paths", async () => {
    const root = await temporaryRepository();
    const harnixRoot = join(root, ".harnix");
    await mkdir(join(harnixRoot, "spec", "guides"), { recursive: true });
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "a.md"), "task context\n");
    await writeFile(join(harnixRoot, "spec", "guides", "common.md"), "guide context\n");
    const config = createConfig({ developer: "tam" });
    config.runtime.fullContext = true;
    const task = activeTask(["docs/a.md"]);

    const result = await buildEffectiveContext({
      projectRoot: root,
      harnixRoot,
      config,
      task,
      platform: "codex",
      forceBounded: true,
    });

    expect(result.budget).toEqual({ maxCharacters: 2_500, maxEntries: 64 });
    expect(result.candidates).toBe(2);
    expect(result.manifest.entries.map((entry) => entry.path)).toEqual(["docs/a.md", ".harnix/spec/guides/common.md"]);
    expect(result.reasonCodesByPath.get("docs/a.md")).toEqual(["task-reference"]);
    expect(result.reasonCodesByPath.get(".harnix/spec/guides/common.md")).toEqual(["applicable-guide"]);
    expect(result.text).toContain("task context");
    expect(result.text).toContain("--- .harnix/spec/guides/common.md ---");
    expect(result.text).toContain("(pointer, 14 characters; read it when it matches the files you change)");
    expect(result.text).not.toContain("guide context");
  });

  it("limits unpersisted task references to at most 5 entries to prevent token bloat", async () => {
    const root = await temporaryRepository();
    const harnixRoot = join(root, ".harnix");
    await mkdir(join(harnixRoot, "spec", "guides"), { recursive: true });
    await mkdir(join(root, "docs"), { recursive: true });
    const paths = Array.from({ length: 10 }, (_, i) => `docs/file-${i}.md`);
    for (const p of paths) await writeFile(join(root, p), `content ${p}\n`);
    const config = createConfig({ developer: "tam" });
    const task = activeTask(paths);

    const result = await buildEffectiveContext({
      projectRoot: root,
      harnixRoot,
      config,
      task,
      platform: "codex",
      forceBounded: true,
    });

    const taskRefEntries = result.manifest.entries.filter((e) => e.path.startsWith("docs/file-"));
    expect(taskRefEntries.length).toBe(5);
  });
});

function activeTask(relevantPaths: string[]): TaskRecordV2 {
  return buildTaskV2({
    id: "20260826-161001-effective-context",
    title: "private",
    status: "in_progress",
    checkpoint: "implementing",
    goal: "private",
    acceptanceCriteria: [buildCriterion({ id: "criterion", text: "private" })],
    relevantPaths,
    validationPlan: [
      buildCommandlessCheck({
        id: "gate",
        description: "private",
        criterionIds: ["criterion"],
        inputs: ["@task-contract"],
      }),
    ],
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  });
}
