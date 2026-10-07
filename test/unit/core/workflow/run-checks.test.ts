import { describe, expect, it } from "vitest";

import { runChecksWorkflow } from "src/core/workflow/run-checks.js";
import type { CheckRunner } from "src/core/workflow/run-check.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildCheck, buildCriterion } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:10:00.000Z";

/** An implementing v3 task declaring the full `suite` check before the focused `focus` check. */
async function implementing(root: string, suite: { command?: string } = { command: "pnpm test" }) {
  await initializeUtcProject(root);
  await writeProjectSource(root);
  const base = taskV3("planning", "planning");
  const check = (id: string, scope: "focused" | "full", command: string | undefined) => {
    const { command: _omitted, ...rest } = buildCheck({
      id,
      description: id,
      scope,
      criterionIds: ["a"],
      inputs: ["src/**/*.ts"],
    });
    void _omitted;
    return command === undefined ? rest : { ...rest, command };
  };
  const planning = {
    ...base,
    acceptanceCriteria: [buildCriterion({ id: "a", text: "done" })],
    validationPlan: [
      check("suite", "full", suite.command),
      check("focus", "focused", "pnpm exec vitest run one.test.ts"),
    ],
  };
  await saveWorkflow(root, { task: planning });
  const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const };
  await saveWorkflow(root, { task: { ...ready, updatedAt: "2026-08-13T00:01:00.000Z" } });
  const running = { ...ready, status: "in_progress" as const, checkpoint: "implementing" as const };
  await saveWorkflow(root, { task: { ...running, updatedAt: "2026-08-13T00:02:00.000Z" } });
}

function fakeRunner(exitCodes: Record<string, number> = {}) {
  const calls: string[] = [];
  const runner: CheckRunner = async (executable, args) => {
    const line = [executable, ...args].join(" ");
    calls.push(line);
    const exitCode = exitCodes[line] ?? 0;
    return { exitCode, output: exitCode === 0 ? "quiet pass output" : "boom" };
  };
  return { runner, calls };
}

describe("workflow --run-checks", () => {
  it("runs the focused check before the suite, records both and prints no output for a pass", async () => {
    const root = await temporaryRepository();
    await implementing(root);
    const { runner, calls } = fakeRunner();

    const result = await runChecksWorkflow(root, { runner, now: NOW });

    expect(calls).toEqual(["pnpm exec vitest run one.test.ts", "pnpm test"]);
    expect(result).toEqual({
      ran: [
        { id: "focus", result: "pass", exitCode: 0 },
        { id: "suite", result: "pass", exitCode: 0 },
      ],
      remaining: [],
    });
    expect(JSON.stringify(result)).not.toContain("quiet pass output");
  });

  it("skips a required check whose pass is still fresh and runs again only what is needed", async () => {
    const root = await temporaryRepository();
    await implementing(root);
    await runChecksWorkflow(root, { runner: fakeRunner().runner, now: NOW });
    const { runner, calls } = fakeRunner();

    await expect(runChecksWorkflow(root, { runner, now: NOW })).resolves.toEqual({ ran: [], remaining: [] });
    expect(calls).toEqual([]);
  });

  it("stops at the first failing check, returns its output tail and lists the checks left", async () => {
    const root = await temporaryRepository();
    await implementing(root);
    const { runner, calls } = fakeRunner({ "pnpm exec vitest run one.test.ts": 1 });

    const result = await runChecksWorkflow(root, { runner, now: NOW });

    expect(calls).toEqual(["pnpm exec vitest run one.test.ts"]);
    expect(result).toEqual({
      ran: [{ id: "focus", result: "fail", exitCode: 1, outputTail: "boom" }],
      remaining: ["suite"],
    });
  });

  it("refuses to run anything when a check to run is at the circuit breaker", async () => {
    const root = await temporaryRepository();
    await implementing(root);
    const failing = fakeRunner({ "pnpm test": 1 });
    await runChecksWorkflow(root, { runner: failing.runner, now: NOW });
    await runChecksWorkflow(root, { runner: failing.runner, now: "2026-08-13T00:11:00.000Z" });
    const { runner, calls } = fakeRunner();

    await expect(runChecksWorkflow(root, { runner, now: "2026-08-13T00:12:00.000Z" })).rejects.toThrow(
      /suite failed twice in a row/u,
    );
    expect(calls).toEqual([]);
  });

  it("refuses to run anything when a check to run declares no command", async () => {
    const root = await temporaryRepository();
    await implementing(root, {});
    const { runner, calls } = fakeRunner();

    await expect(runChecksWorkflow(root, { runner, now: NOW })).rejects.toThrow(/suite declares no command/u);
    expect(calls).toEqual([]);
  });
});
