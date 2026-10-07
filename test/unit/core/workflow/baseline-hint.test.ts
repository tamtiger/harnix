import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { saveTask } from "src/core/tasks/task.js";
import { briefPreflight } from "src/core/workflow/brief.js";
import { baselineHint } from "src/core/workflow/baseline-hint.js";
import { preflightWorkflow } from "src/core/workflow/preflight.js";
import { at, buildCheck, buildCriterion, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3, taskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

interface Finished {
  id: string;
  result?: "pass" | "fail" | undefined;
  command?: string;
  scope?: "focused" | "full";
  baselineResult?: "fail";
  status?: "completed" | "cancelled";
}

/** A terminal task whose single check `suite` ran (or was baselined) with the given outcome. */
function finished({
  id,
  result,
  command = "pnpm test",
  scope = "full",
  baselineResult,
  status = "completed",
}: Finished) {
  const check = buildCheck({
    id: "suite",
    scope,
    command,
    inputs: ["**"],
    criterionIds: ["ac-one"],
    ...(baselineResult === undefined
      ? {}
      : { baseline: { result: baselineResult, classification: "pre-existing", authorizedBy: "user", scope: "repo" } }),
  });
  const evidence =
    result === undefined
      ? []
      : [buildEvidence({ id: `ev-${id}`, checkId: "suite", result, exitCode: result === "pass" ? 0 : 1 })];
  return buildTaskV3({
    id,
    status,
    checkpoint: status === "completed" ? "finishing" : "cancelling",
    acceptanceCriteria: [buildCriterion({ status: "waived", waiverReason: "fixture" })],
    validationPlan: [check],
    evidence,
    createdAt: at(0),
    updatedAt: at(20),
    ...(status === "completed"
      ? { completedAt: at(20) }
      : { cancellation: { reason: "No longer needed here.", authorizedBy: "user" as const }, cancelledAt: at(20) }),
  });
}

async function seed(root: string, ...tasks: Finished[]): Promise<void> {
  for (const task of tasks) await saveTask(join(root, ".harnix"), finished(task));
}

const RED_TWICE: Finished[] = [
  { id: "20260801-100000-prev-a", result: "fail" },
  { id: "20260802-100000-prev-b", result: "fail" },
];

describe("baselineHint", () => {
  it("names the check and the user-authorized baseline command when the suite was red in the last two tasks", async () => {
    const root = await temporaryRepository();
    const running = await implementingTaskV3(root);
    await seed(root, ...RED_TWICE);

    const hint = await baselineHint(root, running);

    expect(hint).toContain("Suite 'check' was red in the last 2 finished tasks");
    expect(hint).toContain(
      "harnix workflow --set-baseline check --result fail --classification pre-existing --authorized-by user",
    );
    expect(hint).toContain("never set it yourself");
    expect(hint).not.toContain("\n");
    expect(hint?.length).toBeLessThanOrEqual(330);
  });

  it("counts an authorized red baseline and a cancelled task as red runs", async () => {
    const root = await temporaryRepository();
    const running = await implementingTaskV3(root);
    await seed(
      root,
      { id: "20260801-100000-prev-a", baselineResult: "fail" },
      { id: "20260802-100000-prev-b", result: "fail", status: "cancelled" },
    );

    await expect(baselineHint(root, running)).resolves.toContain("red in the last 2 finished tasks");
  });

  it.each([
    ["only one earlier task", [{ id: "20260801-100000-prev-a", result: "fail" }]],
    [
      "the newest earlier task passed",
      [
        { id: "20260801-100000-prev-a", result: "fail" },
        { id: "20260802-100000-prev-b", result: "pass" },
      ],
    ],
    ["another command", RED_TWICE.map((task) => ({ ...task, command: "pnpm lint" }))],
    ["a focused check", RED_TWICE.map((task) => ({ ...task, scope: "focused" as const }))],
  ] satisfies [string, Finished[]][])("gives no hint when %s", async (_name, tasks) => {
    const root = await temporaryRepository();
    const running = await implementingTaskV3(root);
    await seed(root, ...tasks);

    await expect(baselineHint(root, running)).resolves.toBeUndefined();
  });

  it("gives no hint once the check has an authorized baseline, or before implementation starts", async () => {
    const root = await temporaryRepository();
    const running = await implementingTaskV3(root);
    await seed(root, ...RED_TWICE);
    const baselined = {
      ...running,
      validationPlan: running.validationPlan.map((check) => ({
        ...check,
        baseline: {
          result: "fail" as const,
          classification: "pre-existing" as const,
          authorizedBy: "user",
          scope: "repo",
        },
      })),
    };

    await expect(baselineHint(root, baselined)).resolves.toBeUndefined();
    await expect(baselineHint(root, taskV3("planning", "planning"))).resolves.toBeUndefined();
  });

  it("skips an unreadable task directory instead of failing", async () => {
    const root = await temporaryRepository();
    const running = await implementingTaskV3(root);
    await seed(root, ...RED_TWICE);
    await mkdir(join(root, ".harnix", "tasks", "20260805-100000-broken"), { recursive: true });
    await writeFile(join(root, ".harnix", "tasks", "20260805-100000-broken", "task.json"), "{ not json");

    await expect(baselineHint(root, running)).resolves.toContain("red in the last 2 finished tasks");
  });
});

describe("preflight baselineHint", () => {
  it("adds the hint while implementing, keeps it with --brief and leaves it out of planning", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await seed(root, ...RED_TWICE);

    const result = await preflightWorkflow(root);

    expect(result.baselineHint).toContain("Suite 'check' was red");
    expect(briefPreflight(result).baselineHint).toBe(result.baselineHint);
  });

  it("has no baselineHint when the suite was not red before", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    expect((await preflightWorkflow(root)).baselineHint).toBeUndefined();
  });
});
