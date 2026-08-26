import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../src/core/config/config.js";
import { buildEffectiveContext } from "../../src/core/context/effective-context.js";
import type { TaskRecordV2 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-effective-context-");

describe("effective context", () => {
  it("uses platform hook caps and derives trusted reason codes for fallback paths", async () => {
    const root = await temporaryRepository();
    const harnixRoot = join(root, ".harnix");
    await mkdir(join(harnixRoot, "spec", "guides", "common"), { recursive: true });
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "a.md"), "task context\n");
    await writeFile(join(harnixRoot, "spec", "guides", "common", "engineering.md"), "guide context\n");
    const config = createConfig({ developer: "tam" });
    config.runtime.fullContext = true;
    const task = activeTask(["docs/a.md"]);

    const result = await buildEffectiveContext({ projectRoot: root, harnixRoot, config, task, platform: "codex", forceBounded: true });

    expect(result.budget).toEqual({ maxCharacters: 2_500, maxEntries: 64 });
    expect(result.candidates).toBe(2);
    expect(result.manifest.entries.map((entry) => entry.path)).toEqual(["docs/a.md", ".harnix/spec/guides/common/engineering.md"]);
    expect(result.reasonCodesByPath.get("docs/a.md")).toEqual(["task-reference"]);
    expect(result.reasonCodesByPath.get(".harnix/spec/guides/common/engineering.md")).toEqual(["applicable-guide"]);
    expect(result.text).toContain("task context");
    expect(result.text).toContain("guide context");
  });
});

function activeTask(relevantPaths: string[]): TaskRecordV2 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id: "20260826-161001-effective-context",
    title: "private",
    mode: "lite",
    status: "in_progress",
    checkpoint: "implementing",
    goal: "private",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "private", status: "pending", evidenceIds: [] }],
    relevantPaths,
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "private", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
