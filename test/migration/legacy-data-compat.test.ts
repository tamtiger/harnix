import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadTask } from "src/core/tasks/task.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

/**
 * The former `src/migration/**` code was removed in the overhaul. Its suite slot is
 * repurposed here to guard the durable contract that the overhaul must preserve:
 * historical `.harnix/` records written by older Harnix versions stay readable.
 */
const temporaryRepository = useTemporaryRepositories("harnix-legacy-compat-");

describe("legacy .harnix data compatibility", () => {
  it("reads a historical TaskRecord v1 record unchanged", async () => {
    const root = await temporaryRepository();
    const id = "20260801-120000-legacy-v1";
    const dir = join(root, ".harnix", "tasks", id);
    await mkdir(dir, { recursive: true });
    const v1 = {
      generator: "harnix",
      schemaVersion: 1,
      id,
      title: "Legacy v1 task",
      mode: "lite",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "Preserve legacy readability.",
      nonGoals: [],
      acceptanceCriteria: [{ id: "c1", text: "done", status: "pending", evidenceIds: [] }],
      relevantPaths: [],
      relevantSpecs: [],
      validationPlan: [{ id: "gate", description: "verify", scope: "focused", required: true }],
      evidence: [],
      createdAt: "2026-08-01T12:00:00.000Z",
      updatedAt: "2026-08-01T12:00:00.000Z",
    };
    await writeFile(join(dir, "task.json"), `${JSON.stringify(v1, null, 2)}\n`);

    const loaded = await loadTask(join(dir, "task.json"));
    expect(loaded.schemaVersion).toBe(1);
    expect(loaded.id).toBe(id);
    expect(loaded.status).toBe("in_progress");
  });

  it("still loads a v2 task whose directory carries a legacy context.json sidecar", async () => {
    const root = await temporaryRepository();
    const id = "20260901-120000-legacy-context";
    const dir = join(root, ".harnix", "tasks", id);
    await mkdir(dir, { recursive: true });
    const v2 = {
      generator: "harnix",
      schemaVersion: 2,
      id,
      title: "Legacy context task",
      mode: "lite",
      status: "planning",
      checkpoint: "planning",
      goal: "Preserve legacy context.json readability.",
      nonGoals: [],
      acceptanceCriteria: [{ id: "c1", text: "done", status: "pending", evidenceIds: [] }],
      relevantPaths: [],
      relevantSpecs: [],
      validationPlan: [
        {
          id: "gate",
          description: "verify",
          scope: "focused",
          required: true,
          criterionIds: ["c1"],
          inputs: ["@task-contract"],
        },
      ],
      evidence: [],
      createdAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-01T12:00:00.000Z",
    };
    await writeFile(join(dir, "task.json"), `${JSON.stringify(v2, null, 2)}\n`);
    // A legacy context selection sidecar from the removed feature must not break loading.
    await writeFile(
      join(dir, "context.json"),
      `${JSON.stringify({ generator: "harnix", schemaVersion: 1, selected: [] }, null, 2)}\n`,
    );

    const loaded = await loadTask(join(dir, "task.json"));
    expect(loaded.schemaVersion).toBe(2);
    expect(loaded.id).toBe(id);
  });
});
