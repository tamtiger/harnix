import { describe, expect, it } from "vitest";

import { selectActions } from "src/commands/workflow-flags.js";
import { resolveActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildCheck, buildCriterion } from "test/support/builders.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";
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

  describe("a criterion covered by two required checks", () => {
    async function twoChecks(root: string): Promise<void> {
      await initializeUtcProject(root);
      await writeProjectSource(root);
      await saveWorkflow(root, {
        task: {
          ...taskV3("planning", "planning"),
          acceptanceCriteria: [buildCriterion({ id: "a", text: "done" })],
          validationPlan: [
            buildCheck({ id: "check", criterionIds: ["a"], inputs: ["src/**"] }),
            buildCheck({ id: "second", scope: "full", criterionIds: ["a"], inputs: ["src/**"] }),
          ],
        },
      });
    }

    it("refuses to mark it met while the other check has no fresh pass, and writes nothing", async () => {
      const root = await temporaryRepository();
      await twoChecks(root);

      await expect(appendEvidenceFlagsWorkflow(root, { ...PASS, markMet: ["a"] }, NOW)).rejects.toThrow(/second/u);

      expect((await persisted(root)).evidence).toHaveLength(0);
    });

    it("marks it met from the fresh passes of both checks once the other one passed", async () => {
      const root = await temporaryRepository();
      await twoChecks(root);
      const other = await appendEvidenceFlagsWorkflow(root, { ...PASS, check: "second" }, NOW);

      const appended = await appendEvidenceFlagsWorkflow(root, { ...PASS, markMet: ["a"] }, "2026-08-13T00:11:00.000Z");

      const criterion = (await persisted(root)).acceptanceCriteria.find((item) => item.id === "a");
      expect(criterion?.status).toBe("met");
      expect([...(criterion?.evidenceIds ?? [])].sort()).toEqual([appended.evidenceId, other.evidenceId].sort());
    });
  });
});
