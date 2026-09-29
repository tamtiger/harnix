import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { computeInputDigest } from "../../src/core/verification/input-digest.js";
import type { TaskRecordV3 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-digest-");
const timestamp = "2026-09-29T09:00:00.000+07:00";

function taskFixture(overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 {
  return {
    generator: "harnix",
    schemaVersion: 3,
    id: "20260929-090000-digest",
    title: "Digest",
    mode: "full",
    status: "in_progress",
    checkpoint: "implementing",
    goal: "Goal",
    nonGoals: [],
    acceptanceCriteria: [{ id: "ac-one", text: "One", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "check", description: "Unit tests", scope: "focused", required: true, command: "pnpm test", criterionIds: ["ac-one"], inputs: ["src/**"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

async function fixtureRepository(): Promise<string> {
  const root = await temporaryRepository();
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, ".harnix", "tasks", "20260929-090000-digest"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
  await writeFile(join(root, "src", "b.ts"), "export const b = 2;\n");
  await writeFile(join(root, ".harnix", "tasks", "20260929-090000-digest", "task.json"), "{}\n");
  return root;
}

describe("v3 input digest", () => {
  it("is deterministic, sorted, and free of absolute paths", async () => {
    const root = await fixtureRepository();
    const first = await computeInputDigest(root, taskFixture(), "check");
    const second = await computeInputDigest(root, taskFixture(), "check");

    expect(second).toEqual(first);
    expect(first.schemaVersion).toBe(3);
    expect(first.inputDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(first.entries.map((entry) => entry.path)).toEqual(["src/a.ts", "src/b.ts"]);
    expect(JSON.stringify(first)).not.toContain(root);
  });

  it("changes when an input file changes", async () => {
    const root = await fixtureRepository();
    const before = await computeInputDigest(root, taskFixture(), "check");
    await writeFile(join(root, "src", "a.ts"), "export const a = 99;\n");

    const after = await computeInputDigest(root, taskFixture(), "check");

    expect(after.inputDigest).not.toBe(before.inputDigest);
  });

  it("changes when the task contract changes but not when review-only fields change", async () => {
    const root = await fixtureRepository();
    const base = await computeInputDigest(root, taskFixture(), "check");
    const annotated = await computeInputDigest(root, taskFixture({ decisions: [{ id: "d", text: "t", rationale: "r" }], residualRisks: [{ id: "r", text: "t", severity: "low" }] }), "check");
    const revised = await computeInputDigest(root, taskFixture({ acceptanceCriteria: [{ id: "ac-one", text: "One, revised", status: "pending", evidenceIds: [] }] }), "check");

    expect(annotated.inputDigest).toBe(base.inputDigest);
    expect(revised.taskContractHash).not.toBe(base.taskContractHash);
    expect(revised.inputDigest).not.toBe(base.inputDigest);
  });

  it("ignores the workflow-owned files of the active task even when a glob matches them", async () => {
    const root = await fixtureRepository();
    const task = taskFixture({ validationPlan: [{ id: "check", description: "Unit tests", scope: "focused", required: true, command: "pnpm test", criterionIds: ["ac-one"], inputs: [".harnix/tasks/**", "src/**"] }] });
    const directory = join(root, ".harnix", "tasks", task.id);
    const before = await computeInputDigest(root, task, "check");
    await writeFile(join(directory, "task.json"), '{"changed":true}\n');
    await writeFile(join(directory, "review.md"), "# derived\n");
    await writeFile(join(directory, "verification-inputs.json"), "{}\n");

    const after = await computeInputDigest(root, task, "check");

    expect(after.inputDigest).toBe(before.inputDigest);
    expect(after.entries.map((entry) => entry.path)).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("does not hash prd.md or plan.md unless they are declared inputs", async () => {
    const root = await fixtureRepository();
    const directory = join(root, ".harnix", "tasks", "20260929-090000-digest");
    await writeFile(join(directory, "plan.md"), "- [ ] `A` — step\n");
    const before = await computeInputDigest(root, taskFixture(), "check");
    await writeFile(join(directory, "plan.md"), "- [x] `A` — step\n");

    const after = await computeInputDigest(root, taskFixture(), "check");

    expect(after.inputDigest).toBe(before.inputDigest);
  });

  it("rejects an unknown check and an input pattern that matches nothing", async () => {
    const root = await fixtureRepository();
    const empty = taskFixture({ validationPlan: [{ id: "check", description: "Unit tests", scope: "focused", required: true, command: "pnpm test", criterionIds: ["ac-one"], inputs: ["missing/**"] }] });

    await expect(computeInputDigest(root, taskFixture(), "nope")).rejects.toThrow("not declared");
    await expect(computeInputDigest(root, empty, "check")).rejects.toThrow("matched no files");
  });

  it("writes no sidecar or snapshot file", async () => {
    const root = await fixtureRepository();
    await computeInputDigest(root, taskFixture(), "check");

    await expect(access(join(root, ".harnix", "tasks", "20260929-090000-digest", "verification-inputs.json"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readdir(join(root, ".harnix", "tasks", "20260929-090000-digest"))).toEqual(["task.json"]);
  });
});
