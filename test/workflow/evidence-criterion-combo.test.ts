import { describe, expect, it } from "vitest";

import { selectActions } from "src/commands/workflow-flags.js";
import { resolveActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const PASS = { check: "check", result: "pass", exitCode: "0", summary: "ok" };
const NOW = "2026-08-13T00:10:00.000Z";

const persisted = async (root: string) => (await resolveActiveTask(`${root}/.harnix`)) as TaskRecordV3;

describe("--evidence with --criterion --met in one command", () => {
  it("records the pass and marks the criterion from exactly that pass in one save", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    const appended = await appendEvidenceFlagsWorkflow(root, { ...PASS, markMet: ["a"] }, NOW);

    const task = await persisted(root);
    expect(task.acceptanceCriteria.find((criterion) => criterion.id === "a")).toMatchObject({
      status: "met",
      evidenceIds: [appended.evidenceId],
    });
    expect(task.evidence).toHaveLength(1);
  });

  it.each([
    ["a failing result", { ...PASS, result: "fail", exitCode: "1" }, ["a"], /--result pass/u],
    ["an unknown criterion", PASS, ["nope"], /nope/u],
  ])("writes nothing for %s", async (_name, flags, markMet, message) => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(appendEvidenceFlagsWorkflow(root, { ...flags, markMet }, NOW)).rejects.toThrow(message);

    const task = await persisted(root);
    expect(task.evidence).toHaveLength(0);
    expect(task.acceptanceCriteria.every((criterion) => criterion.status === "pending")).toBe(true);
  });

  it("is selected as one action, and --evidence combines with nothing else", () => {
    expect(selectActions({ evidence: true, criterion: "a", met: true })).toEqual(["evidence"]);
    expect(() => selectActions({ evidence: true, transition: "verifying/verifying" })).toThrow(/--criterion/u);
    expect(() => selectActions({ evidence: true, criterion: "a" })).toThrow(/--met/u);
  });
});
